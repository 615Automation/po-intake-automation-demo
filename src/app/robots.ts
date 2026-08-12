import type { MetadataRoute } from "next";

/** The direct-link demo is public to visitors but intentionally not indexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
