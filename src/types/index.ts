export type BusinessType = 'livestock' | 'crop' | 'product' | 'asset';
export type StockUnit = string;
export type UserRole = 'admin' | 'manager' | 'customer';

export interface ProductDiscount {
    type: 'flat' | 'percentage';
    value: number;
    startDate?: string | Date; // ISO String
    endDate?: string | Date;   // ISO String
}

export enum TransactionType {
    Sale = 'Sale',
    Purchase = 'Purchase'
}

export enum PaymentStatus {
    Pending = 'Pending',
    PaidCash = 'PaidCash',
    PaidOnline = 'PaidOnline',
    PartialCash = 'PartialCash',
    PartialOnline = 'PartialOnline'
}

export enum OrderStatus {
    Open = 'open',
    Accepted = 'accepted',
    Delivered = 'delivered',
    Cancelled = 'cancelled'
}

export interface PaymentRecord {
    amount: number;
    date: Date;
    note?: string;
    enteredBy?: string;
}

export interface SalesItem {
    productId: string;
    productName: string;
    businessType: BusinessType;
    quantity: number;
    weight?: number; // in kg
    unit: StockUnit;
    priceUnit: StockUnit;
    pricePerUnit: number;
    originalPrice?: number; // Price before discount
    discount?: number; // Discount amount per unit
    description?: string;
    // Computed fields in UI, but useful to store snapshot
    totalPrice: number;
}

export interface TransactionRecord {
    id: string;
    billNo: string;
    type: TransactionType;
    items: SalesItem[];
    customerId?: string;
    partyName: string; // Customer or Vendor Name
    date: Date | string;
    discount: number;
    discountDetails?: string;
    deliveryFee?: number;
    deliveryAddress?: string;
    customerPhone?: string;
    deliveryInstructions?: string;
    expectedDeliveryDate?: string | Date;
    expectedDeliveryTime?: string;
    deliveryLocation?: {
        lat: number;
        lng: number;
        address?: string;
    };
    soldBy: string;
    enteredBy: string; // User ID
    entryTimestamp: Date | string;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
    cancellationReason?: string;
    paidAmount: number;
    payments: PaymentRecord[];
    logs?: OrderLog[];
    documentUrls?: string[];
    updatedAt?: Date | string;
}

export interface OrderLog {
    id: string; // unique id for key
    date: Date | string;
    action: string; // e.g., "Updated Quantity"
    details?: string; // e.g., "Changed from 2 to 5"
    changedBy: string; // Name of user
}

// Task Types
export enum TaskPriority {
    Urgent = 'urgent',
    High = 'high',
    Medium = 'medium',
    Low = 'low'
}

export enum TaskStatus {
    Open = 'open',
    InProgress = 'inProgress',
    Done = 'done'
}

export enum TaskRepetition {
    DoesNotRepeat = 'doesNotRepeat',
    Daily = 'daily',
    Weekdays = 'weekdays',
    Weekly = 'weekly',
    Monthly = 'monthly',
    Yearly = 'yearly',
    Custom = 'custom'
}

export interface TaskItem {
    id: string;
    taskId: string;
    title: string;
    description?: string;
    dueDate?: string | Date;
    hasTime: boolean;
    status: TaskStatus;
    priority: TaskPriority;
    category?: string;
    assignedTo?: string;
    createdBy?: string;
    repetition: TaskRepetition;
    createdDate: Date;
    completedDate?: Date;
    documentUrls?: string[];
}


export interface PriceHistoryEntry {
    price: number;
    date: Date | string;
    maxRetailPrice?: number;
    changedBy: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    businessType?: BusinessType;
    createdAt: Date | string;
    updatedAt: Date | string;
    isActive: boolean;
}

export type UnitType = 'stock' | 'price' | 'both';

export interface Unit {
    id: string;
    name: string;
    type: UnitType;
    isActive: boolean;
    allowDecimals: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface StockHistoryEntry {
    id: string;
    productId: string;
    oldStock: number;
    newStock: number;
    changeAmount: number;
    actionType: 'initial' | 'add' | 'remove' | 'set' | 'sale' | 'purchase';
    date: Date | string;
    changedBy: string; // User ID
    note?: string;
}

export interface Product {
    id: string;
    name: string;
    businessType: BusinessType;
    unit: StockUnit;
    priceUnit: StockUnit;
    currentPrice: number;
    currentStock: number;
    stockHistory: StockHistoryEntry[];
    priceHistory: PriceHistoryEntry[];
    createdAt: Date;
    createdBy: string;
    images: string[];
    description?: string;
    categoryId?: string;
    categoryName?: string;
    isAvailableForSale: boolean;
    isFeatured?: boolean;
    relatedProductIds?: string[]; // IDs of products to recommend when this product is viewed/carted
    tags?: string[];
    discount?: ProductDiscount;
    showInApp?: boolean; // If false, hide from customers
    updatedAt?: string | Date;
}

export interface User {
    id: string;
    email?: string; // Optional for vendors
    name: string;
    role: UserRole;
    partnerType?: "customer" | "vendor"; // Type of partner
    totalTransactionAmount?: number; // Total volume of transactions
    createdAt: Date;
    phoneNumber?: string;
    address?: string;
    addresses?: string[];
    isActive?: boolean;
    deliveryLocation?: {
        lat: number;
        lng: number;
        address?: string;
    };
    remarks?: string; // Additional notes about the partner
    fcmToken?: string; // Firebase Cloud Messaging Token
}

export interface CartItem {
    productId: string;
    productName: string;
    price: number;
    originalPrice?: number; // Price before discount
    discount?: number;     // Discount amount
    quantity: number;
    weight?: number; // Weight in priceUnit (e.g., kg) when priceUnit !== unit
    unit: StockUnit;
    imageUrl?: string;
    availableStock: number;
    businessType?: BusinessType;
    priceUnit?: StockUnit;
}

// Report Types
export enum ReportType {
    Sales = 'Sales',
    Purchases = 'Purchases',
    Stock = 'Stock',
    Customer = 'Customer',
    Vendor = 'Vendor'
}

export interface ReportFilters {
    reportType: ReportType;
    startDate: Date;
    endDate: Date;
    businessType?: BusinessType;
    paymentStatus?: PaymentStatus;
    productId?: string;
    customerId?: string;
}

// Energy Bill Types
export enum EnergyType {
    Electricity = 'electricity',
    Water = 'water',
    Gas = 'gas',
    Food = 'food'
}

export interface EnergyBill {
    id: string;
    type: EnergyType;
    month: string; // Nepali month name (e.g., "Baisakh")
    year: number; // Nepali year (BS)
    amount: number;
    paymentStatus: PaymentStatus;
    paidAmount: number; // For partial payments
    payments?: PaymentRecord[]; // History of payments
    meterReadingDate?: Date; // For electricity/water
    dueDate?: Date; // For electricity/water
    purchaseDate?: Date; // For gas
    remarks?: string; // For food bills and notes
    enteredBy: string;
    entryDate: Date;
    documentUrls?: string[];
}

export interface AppSettings {
    deliveryFee: number;
    freeDeliveryThreshold: number;

    // App Discount (Percentage)
    enableAppDiscount: boolean;
    appDiscountPercentage: number;
    minAppDiscount: number;
    appDiscountStartDate?: string;
    appDiscountEndDate?: string;

    // First Order(s) Discount (Flat Amount)
    enableFirstOrderDiscount: boolean;
    firstOrderDiscountAmount: number; // Flat Rs amount
    firstOrderCountThreshold: number; // Applies to first X orders (e.g. 1 means only 1st order)
    firstOrderDiscountStartDate?: string;
    firstOrderDiscountEndDate?: string;
    // WhatsApp
    whatsappBotNumber?: string;
}

// Notifications
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationChannel = 'in-app' | 'whatsapp' | 'email' | 'push';

export interface Notification {
    id: string;
    targetUserId: string; // The user who should receive this
    title: string;
    message: string;
    type: NotificationType;
    channels?: NotificationChannel[];
    isRead: boolean;
    createdAt: string | Date;
    relatedEntityId?: string; // ID of Order, Task, etc.
    relatedEntityType?: 'transaction' | 'task' | 'alert' | 'offer';
    route?: string; // In-app route to navigate to
    validUntil?: string | Date; // Expiry date for the notification
    imageUrl?: string; // Image for the notification (e.g., for offers)
    whatsappTemplate?: string; // Template name from config
    whatsappTemplateParams?: string[]; // Params for the template
}

export interface BroadcastHistory {
    id: string;
    title: string;
    message: string;
    sentAt: string; // ISO string
    sentBy: string; // Admin UID
    recipientCount: number;
    type: NotificationType;
    imageUrl?: string;
    validUntil?: string;
}
