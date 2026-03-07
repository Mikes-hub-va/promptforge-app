import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCurrentSiteUrl, getSiteUrlFromHeaders, shouldAllowSearchIndexing } from "@/lib/platform/runtime";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const currentSiteUrl = getSiteUrlFromHeaders(requestHeaders) ?? getCurrentSiteUrl();
  const allowIndexing = shouldAllowSearchIndexing();

  return {
    rules: allowIndexing
      ? {
          userAgent: "*",
          allow: "/",
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: allowIndexing ? `${currentSiteUrl}/sitemap.xml` : undefined,
    host: currentSiteUrl,
  };
}
