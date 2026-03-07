import { MetadataRoute } from "next";
import { PRESET_LIBRARY } from "@/data/presets";
import { TEMPLATE_GUIDES } from "@/data/template-guides";
import { getPrimarySiteUrl, shouldAllowSearchIndexing } from "@/lib/platform/runtime";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!shouldAllowSearchIndexing()) {
    return [];
  }

  const primarySiteUrl = getPrimarySiteUrl();
  const routes = [
    "",
    "/workspace",
    "/templates",
    "/pricing",
    "/resources",
    "/about",
    "/faq",
    "/saved",
    "/history",
    "/privacy",
    "/terms",
    "/contact",
  ];

  const templateRoutes = PRESET_LIBRARY.map((preset) => `/templates/${preset.slug}`);
  const guideRoutes = TEMPLATE_GUIDES.map((guide) => `/resources/${guide.slug}`);

  return [...routes, ...templateRoutes, ...guideRoutes].map((route) => ({
    url: `${primarySiteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.6,
  }));
}
