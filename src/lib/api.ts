import { InventoryStatus, BookingRequest, BookingResponse, BlogPost } from "@/types/extra";

/**
 * Placeholder for getInventory() to link with Farm Management app
 */
export const getInventory = async (): Promise<InventoryStatus> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
        eggsInStock: 245,
        activeBhales: 12,
        lastUpdated: new Date(),
        isAvailable: true
    };
};

/**
 * Placeholder for createBooking() to link with E-commerce/Homestead reservation system
 */
export const createBooking = async (booking: BookingRequest): Promise<BookingResponse> => {
    console.log("Creating booking request:", booking);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    return {
        success: true,
        bookingId: `HB-${Math.floor(Math.random() * 10000)}`,
        message: "Your homestead booking request has been received. We will contact you soon."
    };
};

/**
 * Placeholder for fetching blog posts
 */
export const getBlogPosts = async (): Promise<BlogPost[]> => {
    return [
        {
            id: "1",
            title: "Benefits of Organic Free-Range Eggs",
            slug: "benefits-organic-eggs",
            excerpt: "Discover why our happy hens produce more nutritious and tasty eggs for your family.",
            content: "Full content about organic eggs...",
            author: "Farm Manager",
            date: new Date("2024-01-15"),
            categories: ["Health", "Farm Life"],
            imageUrl: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=2070&auto=format&fit=crop",
            readTime: 5,
            published: true,
            views: 0
        },
        {
            id: "2",
            title: "Our Sustainable Farming Practices",
            slug: "sustainable-farming-practices",
            excerpt: "How we ensure the highest quality produce while caring for the environment.",
            content: "Full content here...",
            author: "Greenbird Team",
            date: new Date('2024-01-10'),
            categories: ["Sustainability", "Farm Life"],
            imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854",
            readTime: 4,
            published: true,
            views: 0
        }
    ];
};
