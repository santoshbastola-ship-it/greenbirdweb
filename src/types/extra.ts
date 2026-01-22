export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    date: Date | string;
    categories: string[];
    imageUrl: string;
    readTime: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
    id: string;
    customerId?: string;
    name: string;
    email: string;
    phone: string;
    checkInDate: Date | string;
    checkOutDate: Date | string;
    guests: number;
    specialRequests?: string;
    status: BookingStatus;
    createdAt: Date | string;
}

export interface BookingRequest {
    name: string;
    email: string;
    date: Date;
    guests: number;
    notes?: string;
}

export interface BookingResponse {
    success: boolean;
    bookingId?: string;
    message: string;
}

export interface InventoryStatus {
    eggsInStock: number;
    activeBhales: number;
    lastUpdated: Date;
    isAvailable: boolean;
}
