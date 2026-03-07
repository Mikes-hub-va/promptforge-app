import { NextResponse } from "next/server";
import { z } from "zod";
import {
  makeContext,
  PromptGenerationInput,
  PromptGenerationResult,
  PromptGenerationContext,
  ProviderRuntimeConfig,
} from "@/lib/prompt-engine/types";
import { generatePromptWithEngine } from "@/lib/prompt-engine/provider";
import { runHeuristicEngine } from "@/lib/prompt-engine/heuristic";
import { PromptComparisonOutput } from "@/types";
import { PromptSettings } from "@/types";
import { estimateModelRunCost as estimateAnthropicModelRunCost, isAnthropicConfigured } from "@/lib/prompt-engine/providers/anthropic";
import { estimateModelRunCost as estimateGeminiModelRunCost, isGeminiConfigured } from "@/lib/prompt-engine/providers/gemini";
import { estimateModelRunCost as estimateOpenAIModelRunCost, isOpenAIConfigured } from "@/lib/prompt-engine/providers/openai";
import { getCurrentUser } from "@/lib/auth/server";
import { validateOpenAICompatibleBaseUrl } from "@/lib/security/provider-endpoints";
import { applyRateLimitHeaders, consumeRateLimit, createRateLimitError } from "@/lib/security/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/security/request-origin";
import { createId } from "@/lib/utils/id";
import { getPlatformStatus } from "@/lib/platform/status";

type Mode = "auto" | "heuristic" | "provider";

type ServerGenerationResponse = {
  output: PromptGenerationResult["output"];
  diff: PromptGenerationResult["diff"];
  mode: string;
  comparisons?: PromptComparisonOutput[];
};

function normalizeBaseUrl(input: unknown) {
  if (typeof input !== "string") {
    return input;
  }

  const cleaned = input.trim().replace(/\s+/g, "");
  if (!cleaned) {
    return undefined;
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned)) {
    return cleaned.replace(/\/+$/, "");
  }

  return `https://${cleaned}`.replace(/\/+$/, "");
}

const providerConfigSchema = z.object({
  provider: z.enum(["local", "openai", "anthropic", "gemini"]).default("openai"),
  model: z.string().trim().min(1).max(120),
  apiKey: z.string().trim().max(400).optional(),
  baseUrl: z.preprocess(
    normalizeBaseUrl,
    z
      .string()
      .trim()
      .max(300)
      .url({ message: "Invalid base URL" })
      .optional(),
  ),
}).superRefine((value, context) => {
  if (value.baseUrl && value.provider !== "openai") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Custom base URLs are only supported for OpenAI-compatible providers.",
      path: ["baseUrl"],
    });
    return;
  }

  if (!value.baseUrl) {
    return;
  }

  const validation = validateOpenAICompatibleBaseUrl(value.baseUrl);
  if (!validation.ok) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: validation.error,
      path: ["baseUrl"],
    });
  }
});

const defaults = {
  id: createId("settings"),
  rawPrompt: "",
  goal: "",
  targetModel: "chatgpt",
  useCase: "productivity" as const,
  tone: "professional" as const,
  outputFormat: "markdown" as const,
  detailLevel: "balanced" as const,
  includeContext: true,
  context: "",
  audience: "",
  includeConstraints: true,
  constraints: "Avoid unsafe or misleading instructions.",
  includeExamples: false,
  examples: "",
  desiredStructure: "objective -> context -> constraints -> steps -> output",
};

function textField(max: number, fallback: string) {
  return z.string().max(max, `Use ${max.toLocaleString()} characters or fewer.`).default(fallback);
}

const schema = z.object({
  rawPrompt: textField(10_000, defaults.rawPrompt),
  goal: textField(2_000, defaults.goal),
  targetModel: textField(120, defaults.targetModel),
  useCase: z
    .enum(["writing", "coding", "marketing", "research", "business", "design", "images", "video", "agents", "productivity"])
    .default(defaults.useCase),
  tone: z
    .enum(["neutral", "professional", "friendly", "authoritative", "creative", "minimal", "sales", "technical"])
    .default(defaults.tone),
  outputFormat: z
    .enum(["plain", "bullet", "markdown", "json", "table", "steps"])
    .default(defaults.outputFormat),
  detailLevel: z
    .enum(["concise", "balanced", "detailed"])
    .default(defaults.detailLevel),
  includeContext: z.boolean().default(defaults.includeContext),
  context: textField(12_000, defaults.context),
  audience: textField(1_200, defaults.audience),
  includeConstraints: z.boolean().default(defaults.includeConstraints),
  constraints: textField(4_000, defaults.constraints),
  includeExamples: z.boolean().default(defaults.includeExamples),
  examples: textField(6_000, defaults.examples),
  desiredStructure: textField(300, defaults.desiredStructure),
  id: z.string().max(120).default(defaults.id),
  templateId: z.string().max(120).optional(),
});

const bodySchema = z.object({
  settings: schema,
  mode: z.enum(["auto", "heuristic", "provider"]).optional().default("auto"),
  providerConfig: providerConfigSchema.optional(),
  compareModels: z.array(z.string().trim().min(1).max(120)).max(6).optional(),
});

function withError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeCompareModels(models: string[] | undefined) {
  if (!models?.length) {
    return [];
  }

  const unique = new Set<string>();
  const sanitized = models
    .map((item) => item.trim())
    .filter((item) => Boolean(item))
    .filter((item) => unique.has(item) ? false : (unique.add(item), true));

  return sanitized.slice(0, 5);
}

function normalizeProviderChoice(providerConfig?: ProviderRuntimeConfig): ProviderRuntimeConfig | undefined {
  if (!providerConfig) {
    return undefined;
  }

  const provider = providerConfig.provider;
  if (!provider || provider === "local") {
    return undefined;
  }

  const model = providerConfig.model?.trim();
  const apiKey = providerConfig.apiKey?.trim();
  const baseUrl = providerConfig.baseUrl?.trim();
  const validatedBaseUrl = provider === "openai" && baseUrl ? validateOpenAICompatibleBaseUrl(baseUrl) : null;
  const safeBaseUrl = validatedBaseUrl && validatedBaseUrl.ok ? validatedBaseUrl.value ?? baseUrl : undefined;

  if (!model) {
    return undefined;
  }

  return {
    provider,
    model,
    apiKey: apiKey || undefined,
    baseUrl: safeBaseUrl,
  };
}

function canUseProvider(choice: ProviderRuntimeConfig | undefined, canUseManagedProvider: boolean) {
  if (!choice) {
    return canUseManagedProvider && (isOpenAIConfigured() || isAnthropicConfigured() || isGeminiConfigured());
  }

  if (choice.provider === "openai") {
    return Boolean(choice.apiKey?.trim()) || (canUseManagedProvider && isOpenAIConfigured());
  }

  if (choice.provider === "anthropic") {
    return Boolean(choice.apiKey?.trim()) || (canUseManagedProvider && isAnthropicConfigured());
  }

  if (choice.provider === "gemini") {
    return Boolean(choice.apiKey?.trim()) || (canUseManagedProvider && isGeminiConfigured());
  }

  return false;
}

function resolveContext(mode: Mode, providerConfig: ProviderRuntimeConfig | undefined, canUseManagedProvider: boolean) {
  const hasProviderConfig = Boolean(
    providerConfig &&
      (providerConfig.provider !== "local") &&
      canUseProvider(providerConfig, canUseManagedProvider),
  );

  return {
    ...makeContext(),
    provider: mode === "provider" || mode === "auto" ? (providerConfig?.provider === "local" ? "heuristic" : "provider") : "heuristic",
    hasProviderConfig,
    providerConfig: hasProviderConfig
      ? {
          provider: providerConfig?.provider ?? "openai",
          model: providerConfig?.model,
          apiKey: providerConfig?.apiKey,
          baseUrl: providerConfig?.baseUrl,
        }
      : undefined,
  } as PromptGenerationContext;
}

function buildComparisonOutput(
  input: PromptGenerationInput,
  base: PromptGenerationContext,
  providerConfig: ProviderRuntimeConfig,
): Promise<PromptGenerationResult> {
  const candidate = { ...providerConfig };
  const context: PromptGenerationContext = {
    ...base,
    providerConfig: candidate,
    provider: candidate.provider === "local" ? "heuristic" : "provider",
  };

  return generatePromptWithEngine(input, context);
}

function estimateTokenCount(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return 0;
  }

  return Math.max(1, Math.ceil(normalized.length / 4));
}

function estimateRunCost(
  providerConfig: ProviderRuntimeConfig,
  settings: PromptSettings,
  output: PromptGenerationResult["output"],
) {
  const inputPayload = JSON.stringify({
    provider: providerConfig.provider,
    model: providerConfig.model,
    settings,
  });
  const outputPayload = JSON.stringify({
    basePrompt: output.basePrompt,
    structuredPrompt: output.structuredPrompt,
    systemPrompt: output.systemPrompt,
    userPrompt: output.userPrompt,
    developerPrompt: output.developerPrompt,
    variants: output.variants,
    rationaleSummary: output.rationaleSummary,
    qualityFlags: output.qualityFlags,
  });

  const inputTokens = estimateTokenCount(inputPayload);
  const outputTokens = estimateTokenCount(outputPayload);

  if (providerConfig.provider === "openai") {
    return estimateOpenAIModelRunCost(inputTokens, outputTokens, providerConfig.model);
  }

  if (providerConfig.provider === "anthropic") {
    return estimateAnthropicModelRunCost(inputTokens, outputTokens, providerConfig.model);
  }

  if (providerConfig.provider === "gemini") {
    return estimateGeminiModelRunCost(inputTokens, outputTokens, providerConfig.model);
  }

  return undefined;
}

function responseMode(mode: Mode, hasProviderConfig: boolean) {
  if (mode === "heuristic") {
    return "heuristic";
  }
  if (mode === "provider") {
    return hasProviderConfig ? "provider" : "heuristic_fallback";
  }

  return hasProviderConfig ? "provider" : "heuristic";
}

export async function POST(request: Request) {
  const invalidOrigin = rejectUntrustedOrigin(request, "Untrusted request origin.");
  if (invalidOrigin) {
    return invalidOrigin;
  }

  const currentUser = await getCurrentUser();
  const rateLimit = consumeRateLimit(request, {
    bucket: "prompt-generate",
    limit: currentUser ? 90 : 45,
    windowMs: 10 * 60 * 1000,
    identifier: currentUser?.id,
  });
  if (!rateLimit.ok) {
    return createRateLimitError(rateLimit, "Too many prompt runs in a short time. Please wait a moment and try again.");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return applyRateLimitHeaders(withError("Malformed JSON body"), rateLimit);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return applyRateLimitHeaders(
      withError(parsed.error.issues[0]?.message ?? "Invalid request payload"),
      rateLimit,
    );
  }

  const { settings, mode, providerConfig, compareModels } = parsed.data;
  const platform = getPlatformStatus();
  const canUseManagedProvider = currentUser?.planTier === "pro" && platform.managedRuntimeReady;
  const resolvedSettings: PromptSettings = {
    ...defaults,
    ...settings,
    id: settings.id ?? createId("settings"),
  };
  const input: PromptGenerationInput = { settings: resolvedSettings };
  const normalizedCompareModels = normalizeCompareModels(compareModels);
  const selectedProvider = normalizeProviderChoice(providerConfig);
  const context = resolveContext(mode, selectedProvider, canUseManagedProvider);

  const shouldUseProvider = (mode === "provider" || mode === "auto") && canUseProvider(selectedProvider, canUseManagedProvider);

  if (!shouldUseProvider && mode === "provider" && selectedProvider) {
    const fallback = await runHeuristicEngine(input);
    return applyRateLimitHeaders(NextResponse.json<ServerGenerationResponse>({
      output: fallback.output,
      diff: fallback.diff,
      mode: "heuristic_fallback",
    }), rateLimit);
  }

  if (!shouldUseProvider) {
    const fallback = await runHeuristicEngine(input);
    return applyRateLimitHeaders(NextResponse.json<ServerGenerationResponse>({
      output: fallback.output,
      diff: fallback.diff,
      mode: responseMode(mode, false),
    }), rateLimit);
  }

  try {
    const activeProviderConfig: ProviderRuntimeConfig = {
      provider: selectedProvider?.provider ?? "openai",
      model: selectedProvider?.model ?? context.providerConfig?.model ?? process.env.OPENAI_PROMPT_MODEL?.trim() ?? "openai/gpt-oss-20b",
      apiKey: selectedProvider?.apiKey,
      baseUrl: selectedProvider?.baseUrl,
    };
    const result = await buildComparisonOutput(input, context, activeProviderConfig);

    const outputComparisons = [] as PromptComparisonOutput[];

    if (normalizedCompareModels.length > 0) {
      const comparePromises = normalizedCompareModels
        .filter((model) => model !== activeProviderConfig.model)
        .map(async (model) => {
          try {
            const modelResult = await buildComparisonOutput(input, context, {
              provider: activeProviderConfig.provider,
              model,
              apiKey: activeProviderConfig.apiKey,
              baseUrl: activeProviderConfig.baseUrl,
            });

            return {
              id: crypto.randomUUID(),
              provider: activeProviderConfig.provider,
              model,
              output: modelResult.output,
              mode: "provider" as const,
              costEstimateUsd: estimateRunCost(
                {
                  provider: activeProviderConfig.provider,
                  model,
                  apiKey: activeProviderConfig.apiKey,
                  baseUrl: activeProviderConfig.baseUrl,
                },
                resolvedSettings,
                modelResult.output,
              ),
            } as PromptComparisonOutput;
          } catch {
            return null;
          }
        });

      const settled = await Promise.allSettled(comparePromises);
      for (const item of settled) {
        if (item.status === "fulfilled" && item.value) {
          outputComparisons.push(item.value);
        }
      }
    }

    return applyRateLimitHeaders(NextResponse.json<ServerGenerationResponse>({
      output: result.output,
      diff: result.diff,
      comparisons: outputComparisons,
      mode: responseMode(mode, true),
    }), rateLimit);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Provider generation failed; falling back to heuristic engine.", error);
    }
    const fallback = await runHeuristicEngine(input);
    return applyRateLimitHeaders(NextResponse.json<ServerGenerationResponse>({
      output: fallback.output,
      diff: fallback.diff,
      mode: "heuristic_fallback",
    }), rateLimit);
  }
}
