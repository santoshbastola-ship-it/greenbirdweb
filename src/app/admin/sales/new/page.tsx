"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { UserService } from "@/services/user.service";
import { TransactionService } from "@/services/transaction.service";
import { UnitService } from "@/services/unit.service";
import { Product, StockUnit, TransactionType, PaymentStatus, OrderStatus, User, Unit } from "@/types";
import { ArrowLeft, Plus, Trash2, Save, Search, Calendar, User as UserIcon, Tag, CreditCard, ShoppingBag, Info, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { SettingsService } from "@/services/settings.service";
import NepaliDate from "nepali-date-converter";
import { Toast, ToastType } from "@/components/ui/Toast";
import EditCustomerModal from "@/components/admin/EditCustomerModal";
import AddCustomerModal from "@/components/admin/AddCustomerModal";
import DocumentUpload from "@/components/admin/DocumentUpload";
import { UserRole } from "@/types";
import { useAuth } from "@/context/AuthContext";

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";

// Local interface for line items in the POS
interface POSItem {
    productId: string;
    productName: string;
    unit: StockUnit;
    priceUnit: StockUnit;
    price: number;
    quantity: number;
    pricingQuantity: number; // Used when priceUnit differs from unit
    total: number;
    description?: string;
}

export default function NewSalePage() {
    const { dbUser } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [partyName, setPartyName] = useState("");
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);
    const [cart, setCart] = useState<POSItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState<User[]>([]);
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    // Form state
    const [date, setDate] = useState(() => {
        // Initialize with today's date in YYYY-MM-DD format suitable for NepaliDatePicker
        const today = new NepaliDate();
        return today.format("YYYY-MM-DD");
    });
    const [discount, setDiscount] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.Pending);
    const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.Delivered);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [soldBy, setSoldBy] = useState("");
    const [admins, setAdmins] = useState<User[]>([]);
    const [customDeliveryFee, setCustomDeliveryFee] = useState<string>("");
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [units, setUnits] = useState<Unit[]>([]);
    const [documentUrls, setDocumentUrls] = useState<string[]>([]);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type });
    };


    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsData, customersData, adminsData, unitData] = await Promise.all([
                ProductService.getAllProducts(),
                UserService.getAllCustomers(),
                UserService.getAllUsers(),
                UnitService.getActiveUnits()
            ]);
            setProducts(productsData);
            setCustomers(customersData);
            setAdmins(adminsData);
            setUnits(unitData);


            const settings = await SettingsService.getSettings();
            setDeliveryFee(settings.deliveryFee || 0);

            if (adminsData.length > 0) {
                setSoldBy(adminsData[0].name);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    const handleProductSelect = (productId: string) => {
        if (!productId) return;
        const product = products.find(p => p.id === productId);
        if (product) {
            addToCart(product);
        }
    };

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.productId === product.id);

        // Custom logic for eggs
        const isEgg = product.name.toLowerCase().includes("egg");
        const step = isEgg ? 30 : 1;

        if (existing) {
            updateQuantity(product.id, existing.quantity + step);
        } else {
            const priceUnit = product.priceUnit || product.unit;
            setCart([...cart, {
                productId: product.id,
                productName: product.name,
                unit: product.unit,
                priceUnit: priceUnit,
                price: product.currentPrice,
                quantity: step, // Default to 30 for eggs, 1 for others
                pricingQuantity: (product.unit === priceUnit) ? 1 : 0, // Default to 0 if units differ to force input
                total: product.currentPrice * (product.unit === priceUnit ? step : 1) // Initial total calculation
            }]);
        }
    };

    const updateQuantity = (id: string, qty: number, priceQty?: number, desc?: string) => {
        if (qty <= 0 && priceQty === undefined && desc === undefined) {
            // Only remove if quantity is explicitly set to 0 or less (and not just updating other fields)
            // But usually we want explicit remove button. checking for consistency with previous code.
            // Previous code: if (qty <= 0 && weight === undefined && desc === undefined) removeFromCart(id);
            // Let's keep it safe: only remove if qty <= 0 AND it was a direct quantity change (implied).
            if (qty <= 0 && desc === undefined && priceQty === undefined) {
                removeFromCart(id);
                return;
            }
        }

        setCart(cart.map(item => {
            if (item.productId !== id) return item;

            // Check decimal restrictions
            const stockUnitInfo = units.find(u => u.name.toLowerCase() === item.unit.toLowerCase());
            const priceUnitInfo = units.find(u => u.name.toLowerCase() === item.priceUnit.toLowerCase());

            let newQuantity = qty >= 0 ? qty : 0;
            if (stockUnitInfo && stockUnitInfo.allowDecimals === false) {
                newQuantity = Math.floor(newQuantity);
            }

            let newPricingQuantity = priceQty !== undefined ? priceQty : item.pricingQuantity;
            if (priceUnitInfo && priceUnitInfo.allowDecimals === false && priceQty !== undefined) {
                newPricingQuantity = Math.floor(newPricingQuantity);
            }

            const newDesc = desc !== undefined ? desc : item.description;

            // Calculate Total
            // If unit == priceUnit, Total = Quantity * Price
            // If unit != priceUnit, Total = PricingQuantity * Price
            let newTotal = 0;
            if (item.unit === item.priceUnit) {
                newTotal = newQuantity * item.price;
            } else {
                newTotal = newPricingQuantity * item.price;
            }

            return {
                ...item,
                quantity: newQuantity,
                pricingQuantity: newPricingQuantity,
                description: newDesc,
                total: newTotal
            };
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.productId !== id));
    };

    const parsedCustomFee = customDeliveryFee ? parseFloat(customDeliveryFee) : NaN;
    const currentDeliveryFee = !isNaN(parsedCustomFee) ? parsedCustomFee : deliveryFee;
    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

    // Online order discount for verified users (also applying to POS for consistency if customer is verified)
    const selectedCustomer = customerId ? customers.find(c => c.id === customerId) : null;
    const isVerified = selectedCustomer && selectedCustomer.email && !selectedCustomer.email.endsWith('@manual.entry');

    // Calculate auto discount for verified users
    const [autoDiscount, setAutoDiscount] = useState(0);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await SettingsService.getSettings();
                if (isVerified && totalAmount > 0) {
                    const calculated = Math.max(settings.minAppDiscount || 0, Math.floor(totalAmount * ((settings.appDiscountPercentage || 0) / 100)));
                    setAutoDiscount(calculated);
                    setDiscount(calculated);
                } else if (!isVerified) {
                    setAutoDiscount(0);
                    // We don't necessarily reset 'discount' to 0 because admin might have entered it manually
                }
            } catch (err) {
                console.error("Failed to load settings for auto-discount", err);
            }
        };
        loadSettings();
    }, [isVerified, totalAmount]);

    const totalPayable = Math.max(0, totalAmount + currentDeliveryFee - (discount || 0));

    // Removed auto-update of paidAmount based on totalPayable as per user request
    // Default paidAmount is 0
    useEffect(() => {
        // Filter customers based on partyName input if not selected
        if (!customerId) {
            const lower = partyName.toLowerCase();
            if (lower) {
                const matches = customers.filter(c =>
                    c.name.toLowerCase().includes(lower) ||
                    (c.email && c.email.toLowerCase().includes(lower))
                );
                setFilteredCustomers(matches);
                // Only show dropdown if we have matches and the input isn't exactly one of the matches names (prevent reopening on selection)
                // Actually simpler: always show matches if typing
                setShowCustomerDropdown(true);
            } else {
                setFilteredCustomers([]);
                setShowCustomerDropdown(false);
            }
        }
    }, [partyName, customerId, customers]);

    useEffect(() => {
        // Filter products based on search query
        const lower = productSearchQuery.toLowerCase();
        if (lower) {
            const matches = products.filter(p =>
                p.name.toLowerCase().includes(lower)
            );
            setFilteredProducts(matches);
        } else {
            setFilteredProducts(products);
        }
    }, [productSearchQuery, products]);

    const handleSave = async () => {
        if (!partyName) {
            showToast("Please enter Party/Customer Name", "error");
            return;
        }
        if (cart.length === 0) {
            showToast("Please add at least one item", "error");
            return;
        }

        setLoading(true);
        try {
            await TransactionService.createTransaction({
                billNo: "SL-" + Math.floor(Math.random() * 100000),
                type: TransactionType.Sale,
                items: cart.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    businessType: 'product',
                    quantity: item.quantity,
                    // If units differ, use pricingQuantity as weight, otherwise undefined or 0
                    weight: item.unit !== item.priceUnit ? item.pricingQuantity : undefined,
                    unit: item.unit,
                    priceUnit: item.priceUnit,
                    pricePerUnit: item.price,
                    totalPrice: item.total,
                    description: item.description
                })),
                ...(customerId ? { customerId } : {}),
                partyName: partyName,
                date: new NepaliDate(date).toJsDate(),
                discount: Number(discount),
                soldBy: soldBy || "Admin",
                enteredBy: dbUser?.name || "Admin",
                entryTimestamp: new Date(),
                paymentStatus: paymentStatus,
                status: orderStatus,
                paidAmount: Number(paidAmount),
                deliveryFee: currentDeliveryFee,
                payments: [{
                    amount: Number(paidAmount),
                    date: new Date(),
                    note: "POS Sale"
                }],
                documentUrls: documentUrls
            }, dbUser?.name || "Admin");

            showToast("Sale saved successfully");
            setTimeout(() => {
                router.push("/admin/sales");
            }, 1000);
        } catch (error: any) {
            console.error("Error saving sale:", error);
            // Provide more detailed error message if possible
            const errorMessage = error.message || "Unknown error occurred";
            showToast(`Failed to save sale: ${errorMessage}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCustomer = async (userId: string, data: Partial<User>) => {
        try {
            await UserService.updateUser(userId, data);

            // Update local state
            setCustomers(prev => prev.map(c => c.id === userId ? { ...c, ...data } : c));
            setFilteredCustomers(prev => prev.map(c => c.id === userId ? { ...c, ...data } : c));

            // Update selected customer name if it changed
            if (userId === customerId && data.name) {
                setPartyName(data.name);
            }

            showToast("Customer updated successfully");
        } catch (error: any) {
            console.error("Error updating customer:", error);
            showToast("Failed to update customer", "error");
        }
    };

    const handleAddCustomerSuccess = (newCustomer: User) => {
        setCustomers(prev => [...prev, newCustomer]);
        setPartyName(newCustomer.name);
        setCustomerId(newCustomer.id);
        showToast("Customer added successfully");
    };

    return (
        <div className="max-w-3xl mx-auto pt-4 pb-20 px-4">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/sales" className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm bg-gray-50 border border-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Processing..." : <><Save className="h-5 w-5" /> Save Sale</>}
                </button>
            </div>

            <div className="space-y-6">
                {/* Customer Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-green-500" /> Customer Information
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-gray-400" /> Customer / Party Name <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium"
                                        placeholder="Search"
                                        value={partyName}
                                        onChange={(e) => {
                                            setPartyName(e.target.value);
                                            setCustomerId(undefined); // Reset ID when typing
                                        }}
                                        onFocus={() => {
                                            if (partyName) setShowCustomerDropdown(true);
                                        }}
                                        onBlur={() => {
                                            // Delay create to allow click on dropdown
                                            setTimeout(() => setShowCustomerDropdown(false), 200);
                                        }}
                                    />
                                    {customerId && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">
                                                <UserIcon className="h-3 w-3" /> Existing
                                            </span>
                                            <button
                                                onClick={() => setShowEditCustomerModal(true)}
                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                title="Edit Customer Details"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Customer Autocomplete Dropdown */}
                                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                                            {filteredCustomers.map(customer => (
                                                <button
                                                    key={customer.id}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group border-b border-gray-50 last:border-0"
                                                    onClick={() => {
                                                        setPartyName(customer.name);
                                                        setCustomerId(customer.id);
                                                        setShowCustomerDropdown(false);
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-green-700">{customer.name}</div>
                                                        {customer.phoneNumber && <div className="text-xs text-gray-500">{customer.phoneNumber}</div>}
                                                    </div>
                                                    <div className="text-xs text-gray-400 group-hover:text-green-600">Select</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowAddCustomerModal(true)}
                                    className="flex items-center justify-center w-11 h-11 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                                    title="Add New Customer"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" /> Sale Date
                                </label>
                                <NepaliDatePicker
                                    inputClassName="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    value={date}
                                    onChange={(value: string) => setDate(value)}
                                    options={{ calenderLocale: "en", valueLocale: "en" }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-gray-400" /> Sold By
                                </label>
                                <select
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    value={soldBy}
                                    onChange={(e) => setSoldBy(e.target.value)}
                                >
                                    <option value="">Select Admin</option>
                                    {admins.map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items & Cart Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-green-500" /> Sales Items
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                <Plus className="h-4 w-4 text-gray-400" /> Select Item to Add
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium"
                                    placeholder="Search for a product..."
                                    value={productSearchQuery}
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                    onFocus={() => setShowProductDropdown(true)}
                                    onBlur={() => {
                                        // Delay to allow click on dropdown
                                        setTimeout(() => setShowProductDropdown(false), 200);
                                    }}
                                />

                                {/* Product Autocomplete Dropdown */}
                                {showProductDropdown && filteredProducts.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                                        {filteredProducts.map(product => (
                                            <button
                                                key={product.id}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group border-b border-gray-50 last:border-0"
                                                onClick={() => {
                                                    handleProductSelect(product.id);
                                                    setProductSearchQuery("");
                                                    setShowProductDropdown(false);
                                                }}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 group-hover:text-green-700">{product.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        Rs {product.currentPrice} per {product.priceUnit || product.unit} • {product.currentStock} {product.unit} in stock
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Plus className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-3">
                            {cart.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                    <ShoppingBag className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No items added yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map((item) => (
                                        <div key={item.productId} className="flex flex-col p-4 border border-gray-100 rounded-2xl bg-gray-50 gap-3 group">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 truncate">{item.productName}</h4>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Rs {item.price.toLocaleString()} per {item.priceUnit}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.productId)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-xl border border-gray-100">
                                                    {/* Stock Quantity Controls */}
                                                    <div className="flex-1 min-w-[120px]">
                                                        <div className="flex items-center justify-between mb-1 px-1">
                                                            <span className="text-[10px] uppercase text-gray-400 font-bold">{item.unit}</span>
                                                        </div>
                                                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 h-10 p-1">
                                                            <button
                                                                onClick={() => {
                                                                    const isEgg = item.productName.toLowerCase().includes("egg");
                                                                    const step = isEgg ? 30 : 1;
                                                                    updateQuantity(item.productId, item.quantity - step);
                                                                }}
                                                                className="w-10 h-full flex items-center justify-center hover:bg-white rounded-md text-gray-500 font-bold transition-all active:scale-90"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="flex-1 min-w-0 text-center text-sm border-0 focus:ring-0 p-0 font-bold bg-transparent"
                                                                value={item.quantity}
                                                                step={units.find(u => u.name.toLowerCase() === item.unit.toLowerCase())?.allowDecimals === false ? "1" : "0.01"}
                                                                onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                                                onFocus={(e) => e.target.select()}
                                                                title={`Quantity in ${item.unit}`}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const isEgg = item.productName.toLowerCase().includes("egg");
                                                                    const step = isEgg ? 30 : 1;
                                                                    updateQuantity(item.productId, item.quantity + step);
                                                                }}
                                                                className="w-10 h-full flex items-center justify-center hover:bg-white rounded-md text-green-600 font-bold transition-all active:scale-90"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Pricing Quantity Controls (Only if units differ) */}
                                                    {item.unit !== item.priceUnit && (
                                                        <div className="flex-1 min-w-[120px]">
                                                            <div className="flex items-center justify-between mb-1 px-1">
                                                                <span className="text-[10px] uppercase text-gray-400 font-bold">{item.priceUnit} (Weight)</span>
                                                            </div>
                                                            <div className="flex items-center bg-green-50/50 rounded-lg border border-green-100 h-10 p-1">
                                                                <input
                                                                    type="number"
                                                                    className="w-full text-center text-sm border-0 focus:ring-0 p-0 font-bold bg-transparent text-gray-700"
                                                                    value={item.pricingQuantity}
                                                                    step={units.find(u => u.name.toLowerCase() === item.priceUnit.toLowerCase())?.allowDecimals === false ? "1" : "0.01"}
                                                                    onChange={(e) => updateQuantity(item.productId, item.quantity, parseFloat(e.target.value) || 0)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    placeholder="0"
                                                                    title={`Quantity in ${item.priceUnit}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Total and Trash */}
                                                    <div className="flex flex-col items-end justify-center min-w-[100px] ml-auto">
                                                        <span className="text-[10px] uppercase text-gray-400 font-bold mb-1">Total</span>
                                                        <div className="font-black text-gray-900 text-sm">
                                                            Rs {item.total.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment & Status Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-green-500" /> Payment & Status
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-gray-400" /> Discount (Rs)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all ${isVerified ? 'border-green-200 bg-green-50/30' : ''}`}
                                        value={discount || ""}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                    />
                                    {isVerified && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                                            Auto Verified
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-gray-400" /> Delivery Fee (Rs)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    placeholder={deliveryFee.toString()}
                                    value={customDeliveryFee}
                                    onChange={(e) => setCustomDeliveryFee(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-gray-400" /> Payment Status
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                                >
                                    <option value={PaymentStatus.Pending}>Pending</option>
                                    <option value={PaymentStatus.PaidCash}>Paid Cash</option>
                                    <option value={PaymentStatus.PaidOnline}>Paid Online</option>
                                    <option value={PaymentStatus.PartialCash}>Partial Cash</option>
                                    <option value={PaymentStatus.PartialOnline}>Partial Online</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Info className="h-4 w-4 text-gray-400" /> Paid Amount (Rs)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold text-green-700"
                                    value={paidAmount || ""}
                                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Document Upload Section */}
                    <div className="pt-6 border-t border-gray-100">
                        <DocumentUpload
                            documentUrls={documentUrls}
                            onChange={setDocumentUrls}
                            folder="sales-bills"
                        />
                    </div>

                    {/* Summary Footer */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex flex-col gap-2 max-w-xs ml-auto">
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>Rs {totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Discount</span>
                                <span>- Rs {discount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Delivery Fee</span>
                                <span>Rs {currentDeliveryFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                                <span className="text-gray-900 font-bold">Total Payable</span>
                                <span className="text-2xl font-black text-green-600">Rs {totalPayable.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Save Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-12 py-4 bg-green-600 text-white rounded-2xl font-black text-lg hover:bg-green-700 transition-all shadow-xl shadow-green-900/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {loading ? "Processing..." : <><Save className="h-6 w-6" /> Save Sale</>}
                    </button>
                </div>
            </div>


            <EditCustomerModal
                isOpen={showEditCustomerModal}
                user={customerId ? customers.find(c => c.id === customerId) || null : null}
                onClose={() => setShowEditCustomerModal(false)}
                onSubmit={handleUpdateCustomer}
            />

            <AddCustomerModal
                isOpen={showAddCustomerModal}
                onClose={() => setShowAddCustomerModal(false)}
                onSuccess={handleAddCustomerSuccess}
            />
        </div>

    );
}
