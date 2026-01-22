import { Product } from "@/types";

export const MOCK_PRODUCTS: Product[] = [
    {
        id: "1",
        name: "Fresh Organic Eggs",
        businessType: "livestock",
        unit: "pcs",
        priceUnit: "pcs",
        currentPrice: 350,
        currentStock: 50,
        stockHistory: [],
        priceHistory: [],
        createdAt: new Date(),
        createdBy: "admin",
        images: ["https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800"], // Eggs
        description: "Farm fresh organic eggs, collected daily from free-range chickens.",
        isAvailableForSale: true,
    },
    {
        id: "2",
        name: "Green Spinach (Saag)",
        businessType: "crop",
        unit: "kg",
        priceUnit: "kg",
        currentPrice: 80,
        currentStock: 20,
        stockHistory: [],
        priceHistory: [],
        createdAt: new Date(),
        createdBy: "admin",
        images: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800"], // Spinach
        description: "Freshly harvested organic spinach.",
        isAvailableForSale: true,
    },
    {
        id: "3",
        name: "Local Goat Meat",
        businessType: "livestock",
        unit: "kg",
        priceUnit: "kg",
        currentPrice: 1200,
        currentStock: 10,
        stockHistory: [],
        priceHistory: [],
        createdAt: new Date(),
        createdBy: "admin",
        images: ["https://images.unsplash.com/photo-1606211475515-534570dfba41?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"], // Meat
        description: "Premium quality local goat meat.",
        isAvailableForSale: true,
    },
    {
        id: "4",
        name: "Organic Honey",
        businessType: "product",
        unit: "pcs",
        priceUnit: "pcs",
        currentPrice: 800,
        currentStock: 15,
        stockHistory: [],
        priceHistory: [],
        createdAt: new Date(),
        createdBy: "admin",
        images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800"], // Honey
        description: "Pure organic honey from our apiary.",
        isAvailableForSale: true,
    },
    {
        id: "5",
        name: "Tractor Rental (Per Hour)",
        businessType: "asset",
        unit: "pcs",
        priceUnit: "pcs",
        currentPrice: 2500,
        currentStock: 1,
        stockHistory: [],
        priceHistory: [],
        createdAt: new Date(),
        createdBy: "admin",
        images: ["https://images.unsplash.com/photo-1592973979730-1c0953c84852?auto=format&fit=crop&q=80&w=800"], // Tractor
        description: "Heavy duty tractor available for rental services.",
        isAvailableForSale: false,
    }
];

export const MOCK_BLOG_POSTS = [
    {
        id: "post-1",
        title: "The Joy of Organic Farming",
        slug: "joy-of-organic-farming",
        excerpt: "Discover why organic farming is better for your health and the environment.",
        content: "Organic farming is more than just a trend; it's a commitment to the health of our planet and ourselves. By avoiding synthetic pesticides and fertilizers, we allow nature to take its course, resulting in produce that is richer in nutrients and free from harmful chemicals...",
        imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800",
        date: new Date().toISOString(),
        author: "Farmer Santosh",
        readTime: 5,
        categories: ["Organic", "Sustainability"],
        tags: ["farming", "nature", "health"]
    },
    {
        id: "post-2",
        title: "Raising Free-Range Chickens",
        slug: "raising-free-range-chickens",
        excerpt: "Learn the secrets to happy, healthy, and productive free-range chickens.",
        content: "Happy chickens make the best eggs! In this post, we discuss the importance of space, natural forage, and a stress-free environment for our feathered friends. From building the perfect coop to understanding their social behavior...",
        imageUrl: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800",
        date: new Date().toISOString(),
        author: "Admin",
        readTime: 7,
        categories: ["Livestock", "Poultry"],
        tags: ["chickens", "eggs", "farming"]
    }
];
