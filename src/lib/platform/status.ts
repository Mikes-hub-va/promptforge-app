import { getStripeConfigStatus } from "@/lib/billing/stripe";
import { isAnthropicConfigured } from "@/lib/prompt-engine/providers/anthropic";
import { isGeminiConfigured } from "@/lib/prompt-engine/providers/gemini";
import { isOpenAIConfigured } from "@/lib/prompt-engine/providers/openai";
import {
  getManagedRuntimeGuardMessage,
  getStripeRuntimeGuardMessage,
  isManagedRuntimeAllowedInCurrentEnvironment,
  isStripeModeAllowedInCurrentEnvironment,
} from "@/lib/platform/runtime";

function getConfiguredManagedProviderLabels() {
  return [
    isOpenAIConfigured() ? (process.env.OPENAI_PROVIDER_LABEL?.trim() || "OpenAI-compatible") : null,
    isAnthropicConfigured() ? "Anthropic" : null,
    isGeminiConfigured() ? "Gemini" : null,
  ].filter((provider): provider is string => Boolean(provider));
}

export function getManagedProviderLabels() {
  const configuredProviders = getConfiguredManagedProviderLabels();
  if (!isManagedRuntimeAllowedInCurrentEnvironment()) {
    return [];
  }

  return configuredProviders;
}

export function getPlatformStatus() {
  const configuredManagedProviders = getConfiguredManagedProviderLabels();
  const managedProviders = getManagedProviderLabels();
  const billing = getStripeConfigStatus();
  const billingRuntimeAllowed = isStripeModeAllowedInCurrentEnvironment();
  const billingGuardMessage = getStripeRuntimeGuardMessage();
  const managedRuntimeGuardMessage = getManagedRuntimeGuardMessage(configuredManagedProviders.length > 0);

  return {
    billing: {
      ...billing,
      runtimeAllowed: billingRuntimeAllowed,
      runtimeGuardMessage: billingGuardMessage,
    },
    billingReady: billing.billingReady && billingRuntimeAllowed,
    managedProviders,
    managedRuntimeReady: managedProviders.length > 0,
    managedRuntimeConfigured: configuredManagedProviders.length > 0,
    managedRuntimeGuardMessage,
  };
}
