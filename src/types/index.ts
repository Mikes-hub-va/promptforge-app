export type ID = string;

export type UseCaseCategory =
  | "writing"
  | "coding"
  | "marketing"
  | "research"
  | "business"
  | "design"
  | "images"
  | "video"
  | "agents"
  | "productivity";

export type PromptTone =
  | "neutral"
  | "professional"
  | "friendly"
  | "authoritative"
  | "creative"
  | "minimal"
  | "sales"
  | "technical";

export type OutputFormat = "plain" | "bullet" | "markdown" | "json" | "table" | "steps";
export type DetailLevel = "concise" | "balanced" | "detailed";

export type PlanTier = "free" | "pro" | "team";

export interface PromptSettings {
  id: ID;
  rawPrompt: string;
  goal: string;
  targetModel: string;
  useCase: UseCaseCategory;
  tone: PromptTone;
  outputFormat: OutputFormat;
  detailLevel: DetailLevel;
  includeContext: boolean;
  context: string;
  audience: string;
  includeConstraints: boolean;
  constraints: string;
  includeExamples: boolean;
  examples: string;
  desiredStructure: string;
  templateId?: ID;
}

export interface PromptOutputVariant {
  id: ID;
  label: string;
  prompt: string;
  rationale: string[];
  isModelSpecific?: boolean;
}

export interface PromptOutput {
  id: ID;
  sourceSettingsId: ID;
  createdAt: string;
  basePrompt: string;
  variants: PromptOutputVariant[];
  structuredPrompt: string;
  systemPrompt: string;
  userPrompt: string;
  developerPrompt?: string;
  rationaleSummary: string[];
}

export interface PromptDraft {
  id: ID;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: PromptSettings;
  output: PromptOutput;
  tags: string[];
  isStarred: boolean;
  isFavorite: boolean;
  folder?: string;
}

export interface SavedPrompt extends PromptDraft {
  source: "local";
}

export interface HistoryEntry {
  id: ID;
  createdAt: string;
  settings: PromptSettings;
  output: PromptOutput;
}

export interface TemplatePreset {
  id: ID;
  slug: string;
  title: string;
  description: string;
  category: UseCaseCategory;
  icon: string;
  recommendedFields: {
    tone?: PromptTone;
    targetModel?: string;
    outputFormat?: OutputFormat;
    detailLevel?: DetailLevel;
    hasAudience?: boolean;
    hasContext?: boolean;
    hasConstraints?: boolean;
    hasExamples?: boolean;
  };
  defaultSettings: Partial<PromptSettings>;
  exampleInputs: {
    rawPrompt: string;
    goal: string;
    audience?: string;
    context?: string;
    constraints?: string;
  };
  outputStyle: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface NavItem {
  href: string;
  label: string;
}

export interface Plan {
  id: ID;
  name: string;
  handle?: string;
  subtitle?: string;
  accent?: string;
  price: string;
  frequency: string;
  highlight?: boolean;
  comingSoon?: boolean;
  description: string;
  features: string[];
  cta: string;
  ctaHint: string;
}

export interface PromptDiffPoint {
  label: string;
  note: string;
}
