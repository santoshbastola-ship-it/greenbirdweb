import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://greenbirdhomestead.com.np";

    // Static routes
    const routes = [
        "",
        "/about",
        "/shop",
        "/activities",
        "/booking",
        "/contact",
        "/cart",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1 : 0.8,
    }));

    return routes;
}
