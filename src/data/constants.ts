import { FAQItem, NavItem, Plan, UseCaseCategory } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/workspace", label: "Workspace" },
  { href: "/saved", label: "Saved" },
  { href: "/history", label: "History" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

export const FEATURE_HIGHLIGHTS = [
  {
    title: "From rough draft to execution-ready",
    description:
      "PromptForge turns vague ideas into clear, constrained instructions your model can follow consistently.",
  },
  {
    title: "Built for every workflow",
    description:
      "Code, content, marketing, research, visuals, and app building are first-class paths with model-aware tuning.",
  },
  {
    title: "No waiting on APIs",
    description:
      "A deterministic engine gives immediate results and still produces professional structured prompts without keys.",
  },
];

export const MODEL_OPTIONS = [
  { value: "chatgpt", label: "ChatGPT / GPT-5" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "midjourney", label: "Midjourney" },
  { value: "sora", label: "Sora" },
  { value: "copilot", label: "Microsoft Copilot" },
  { value: "other", label: "Custom / Other" },
];

export const USE_CASE_LABELS: Record<UseCaseCategory, string> = {
  writing: "Content Writing",
  coding: "Coding",
  marketing: "Marketing",
  research: "Research",
  business: "Business",
  design: "Design",
  images: "Image Generation",
  video: "Video Generation",
  agents: "Agent Instructions",
  productivity: "Productivity",
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    frequency: "forever",
    description: "For individuals who want immediate value with prompt quality controls.",
    features: [
      "100 prompt generations / month",
      "Local deterministic engine",
      "Template library access",
      "History + local saves",
      "Markdown/TXT export",
    ],
    cta: "Start Forging",
    ctaHint: "Free tier active",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    frequency: "/month",
    highlight: true,
    description: "For power users who ship prompts into regular workflows.",
    features: [
      "10,000 local generations / month",
      "Advanced prompt variants",
      "Saved folders + favorites",
      "Compare rationale view",
      "Priority templates updates",
      "Future API model integration",
    ],
    cta: "Choose Pro",
    ctaHint: "Placeholder pricing for MVP",
  },
  {
    id: "team",
    name: "Team",
    price: "Coming Soon",
    frequency: "",
    comingSoon: true,
    description: "Multi-user workspace, shared prompts, and org-wide governance.",
    features: [
      "Collaborative workspace",
      "Role-based access control",
      "Audit trails",
      "Billing per seat",
      "Team prompt standards",
    ],
    cta: "Join Waitlist",
    ctaHint: "Rollout planned",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Do I need an API key to use PromptForge?",
    answer:
      "No. PromptForge works immediately with a local heuristic engine. API integrations are prepared in the architecture but optional and additive.",
  },
  {
    question: "How are prompts improved?",
    answer:
      "PromptForge analyzes your raw input, extracts objective/context/tone constraints, and rebuilds a structured instruction set using reusable patterns and safety checks.",
  },
  {
    question: "Can I generate multiple versions?",
    answer:
      "Yes. Each generation includes a balanced default, concise, detailed, and model-aware alternatives, plus a structured variant.",
  },
  {
    question: "Is data sent anywhere?",
    answer:
      "For MVP, all history and saved prompts are stored in your browser localStorage. No server-side account persistence is enabled yet.",
  },
  {
    question: "Can I export prompts?",
    answer:
      "Yes, copy as markdown, plain text, or download as TXT/MD.",
  },
];

export const APP_DOMAIN = "https://promptforge.app";
