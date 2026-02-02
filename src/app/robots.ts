import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin/", "/api/"], // Disallow admin and api routes
        },
        sitemap: "https://greenbirdhomestead.com.np/sitemap.xml",
    };
}
