"use client";

import { useCartStore } from "@/store/useCartStore";
import { Minus, Plus, Trash2, ArrowRight, Phone, MapPin, PlusCircle, X, Check, Truck, CreditCard, Clock, Calendar, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TransactionService } from "@/services/transaction.service";
import { UserService } from "@/services/user.service";
import { SettingsService } from "@/services/settings.service";
import { TransactionType, PaymentStatus, OrderStatus, AppSettings, Unit } from "@/types";
import { getTodayNepali } from "@/lib/date-helper";
import { UnitService } from "@/services/unit.service";
import dynamic from 'next/dynamic';
import RecommendedProducts from "@/components/shop/RecommendedProducts";
import { FRESH_EGGS_PRODUCT_ID } from "@/lib/constants";


const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-200 text-xs md:text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";
import LocationPicker from "@/components/ui/LocationPicker";
import { ChevronDown, ChevronUp } from "lucide-react";

// Default settings as fallback
const DEFAULT_SETTINGS: AppSettings = {
    deliveryFee: 75,
    freeDeliveryThreshold: 750,
    enableAppDiscount: true,
    appDiscountPercentage: 5,
    minAppDiscount: 10,
    enableFirstOrderDiscount: false,
    firstOrderDiscountAmount: 0,
    firstOrderCountThreshold: 1
};

export default function CartPage() {
    const { items, updateQuantity, removeItem, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);


    // Profile form state
    const [phoneNumber, setPhoneNumber] = useState("");
    const [addresses, setAddresses] = useState<string[]>([]);
    const [newAddress, setNewAddress] = useState("");
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
    const [isAddressMode, setIsAddressMode] = useState(false); // To toggle adding new address
    const [showValidationErrors, setShowValidationErrors] = useState(false);

    // Delivery Preferences
    const [deliveryInstructions, setDeliveryInstructions] = useState("");
    const [expectedDate, setExpectedDate] = useState(getTodayNepali());
    const [expectedTime, setExpectedTime] = useState("");
    const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number, address?: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'address' | 'map'>('address');
    const [isMapSelected, setIsMapSelected] = useState(false);

    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [units, setUnits] = useState<Unit[]>([]);

    const { user, dbUser, refreshDbUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadAppSettings();
    }, []);

    const loadAppSettings = async () => {
        try {
            const [settings, unitsData] = await Promise.all([
                SettingsService.getSettings(),
                UnitService.getActiveUnits()
            ]);
            setAppSettings(settings);
            setUnits(unitsData);
        } catch (error) {
            console.error("Error loading settings/units:", error);
        }
    };

    useEffect(() => {
        if (dbUser) {
            setPhoneNumber(dbUser.phoneNumber || "");
            setAddresses(dbUser.addresses || (dbUser.address ? [dbUser.address] : []));
            setDeliveryLocation(dbUser.deliveryLocation || null);
        }
    }, [dbUser]);

    // State for order history count
    const [pastOrderCount, setPastOrderCount] = useState<number>(0);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const checkOrderHistory = async () => {
        if (!user) return;
        setLoadingHistory(true);
        try {
            const transactions = await TransactionService.getTransactionsByCustomerId(user.uid);
            // Count only valid sales (not cancelled)
            const validOrders = transactions.filter(t => t.type === TransactionType.Sale && t.status !== OrderStatus.Cancelled);
            setPastOrderCount(validOrders.length);
        } catch (error) {
            console.error("Failed to check order history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (user) {
            checkOrderHistory();
        }
    }, [user]);

    const handleAddAddress = () => {
        if (newAddress.trim()) {
            const updatedAddresses = [...addresses, newAddress.trim()];
            setAddresses(updatedAddresses);
            setSelectedAddressIndex(updatedAddresses.length - 1); // Select the new address
            setNewAddress("");
            setIsAddressMode(false);
        }
    };

    const handleRemoveAddress = (index: number) => {
        const updated = addresses.filter((_, i) => i !== index);
        setAddresses(updated);
        if (selectedAddressIndex >= updated.length) {
            setSelectedAddressIndex(Math.max(0, updated.length - 1));
        }
    };

    const handleCheckout = async () => {
        if (!user) {
            router.push("/login?redirect=/cart");
            return;
        }

        if (!phoneNumber) {
            setShowValidationErrors(true);
            const phoneInput = document.getElementById('phone-input');
            if (phoneInput) {
                phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                phoneInput.focus();
            }
            return;
        }

        if (addresses.length === 0 && !deliveryLocation) {
            setShowValidationErrors(true);
            const addressSection = document.getElementById('address-section');
            if (addressSection) {
                addressSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setPlacingOrder(true);
        try {
            // Update profile info if changed
            if (dbUser) {
                const hasLocationChanged = JSON.stringify(deliveryLocation || null) !== JSON.stringify(dbUser.deliveryLocation || null);

                if (phoneNumber !== dbUser.phoneNumber || JSON.stringify(addresses) !== JSON.stringify(dbUser.addresses) || hasLocationChanged) {
                    // Prepare location for Firestore - ensuring NO undefined fields
                    const firestoreLocation = deliveryLocation ? {
                        lat: deliveryLocation.lat,
                        lng: deliveryLocation.lng,
                        address: deliveryLocation.address || "Pinned Location"
                    } : undefined;

                    await UserService.updateUser(user.uid, {
                        phoneNumber,
                        addresses,
                        address: isMapSelected && deliveryLocation ? (deliveryLocation.address || "Pinned Location") : addresses[selectedAddressIndex],
                        deliveryLocation: firestoreLocation
                    });
                    await refreshDbUser();
                }
            }

            const activeAddress = isMapSelected && deliveryLocation
                ? (deliveryLocation.address || "Pinned Location")
                : addresses[selectedAddressIndex];

            const activeProfile = {
                name: dbUser?.name || user.displayName || "Customer",
                phoneNumber,
                address: activeAddress
            };

            // Prepare transaction location
            const transactionLocation = deliveryLocation ? {
                lat: deliveryLocation.lat,
                lng: deliveryLocation.lng,
                address: deliveryLocation.address || "Pinned Location"
            } : undefined;

            // Calculate discounts for checkout
            const subtotal = validItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const isVerified = user && dbUser && !dbUser.email?.endsWith('@manual.entry');
            const deliveryFee = subtotal < appSettings.freeDeliveryThreshold ? appSettings.deliveryFee : 0;

            // Helper to check date validity (duplicated for safety inside handler)
            const isDateValid = (startDate?: string, endDate?: string) => {
                const now = new Date();
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(23, 59, 59, 999);
                if (start && now < start) return false;
                if (end && now > end) return false;
                return true;
            };

            let appDiscount = 0;
            let firstOrderDiscount = 0;

            // 1. Check First Order Discount Eligibility
            if (isVerified && appSettings.enableFirstOrderDiscount) {
                if (isDateValid(appSettings.firstOrderDiscountStartDate, appSettings.firstOrderDiscountEndDate)) {
                    if (pastOrderCount < (appSettings.firstOrderCountThreshold || 1)) {
                        firstOrderDiscount = appSettings.firstOrderDiscountAmount || 0;
                    }
                }
            }

            // 2. Check App Discount Eligibility (Only if First Order Discount is NOT applied)
            if (firstOrderDiscount > 0) {
                appDiscount = 0; // mutually exclusive
            } else if (isVerified && appSettings.enableAppDiscount !== false) {
                if (isDateValid(appSettings.appDiscountStartDate, appSettings.appDiscountEndDate)) {
                    appDiscount = Math.max(appSettings.minAppDiscount, Math.floor(subtotal * (appSettings.appDiscountPercentage / 100)));
                }
            }

            const totalDiscount = appDiscount + firstOrderDiscount;

            await TransactionService.createTransaction({
                billNo: "OR-" + Math.floor(Math.random() * 100000),
                type: TransactionType.Sale,
                items: validItems.map(i => {
                    const priceUnit = i.priceUnit || i.unit;
                    const usesWeight = priceUnit !== i.unit;
                    return {
                        productId: i.productId,
                        productName: i.productName,
                        businessType: i.businessType || 'product',
                        quantity: usesWeight ? 1 : i.quantity, // For weight-based, quantity is always 1 item
                        weight: usesWeight ? i.quantity : undefined, // For weight-based, quantity field holds the weight
                        unit: i.unit,
                        priceUnit: priceUnit,
                        pricePerUnit: i.price,
                        totalPrice: i.quantity * i.price // quantity holds weight for weight-based items
                    };
                }),
                customerId: user.uid,
                partyName: activeProfile.name,
                date: new Date(),
                discount: totalDiscount,
                discountDetails: discountDetails,
                deliveryFee: deliveryFee,
                soldBy: "Online",
                enteredBy: user.uid,
                entryTimestamp: new Date(),
                paymentStatus: PaymentStatus.Pending,
                status: OrderStatus.Open,
                paidAmount: 0,
                payments: [],
                deliveryAddress: activeProfile.address,
                customerPhone: activeProfile.phoneNumber,
                deliveryInstructions,
                expectedDeliveryDate: expectedDate,
                expectedDeliveryTime: expectedTime,
                deliveryLocation: transactionLocation
            }, activeProfile.name || dbUser?.name || "Customer");

            clearCart();

            // Redirect to dedicated success page
            router.push("/order-success");
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Failed to place order. Please try again.");
            setPlacingOrder(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-gray-50 pt-20 text-center">Loading cart...</div>;

    // Defensive check: Ensure items is an array and filter out invalid ones
    const validItems = Array.isArray(items) ? items.filter(item => item && item.productId) : [];

    // Safety check for unit to prevent crashes if data is corrupted
    const getSafeUnit = (unit?: string) => unit || "unit";


    if (validItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-center text-center mb-12">
                        <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="h-10 w-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h1>
                        <p className="text-gray-500 mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Browse our products to find something you'll love.</p>
                        <Link
                            href="/shop"
                            className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-900/10"
                        >
                            Start Shopping
                        </Link>
                    </div>

                    <RecommendedProducts />
                </div>
            </div>
        );
    }


    // Helper to check if a date is within range (inclusive)
    const isDateValid = (startDate?: string, endDate?: string) => {
        const now = new Date();
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        if (start && now < start) return false;
        if (end && now > end) return false;
        return true;
    };

    const subtotal = validItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + (price * quantity);
    }, 0);

    const isVerified = user && dbUser && !dbUser.email?.endsWith('@manual.entry');
    const deliveryFee = subtotal < appSettings.freeDeliveryThreshold ? appSettings.deliveryFee : 0;

    // --- Discount Calculation Logic ---
    let appDiscount = 0;
    let firstOrderDiscount = 0;

    // 1. Check First Order Discount Eligibility
    if (isVerified && appSettings.enableFirstOrderDiscount) {
        if (isDateValid(appSettings.firstOrderDiscountStartDate, appSettings.firstOrderDiscountEndDate)) {
            // Check if user's past order count is less than the threshold
            // e.g. Threshold 1: apply if count is 0. Threshold 2: apply if count is 0 or 1.
            if (pastOrderCount < (appSettings.firstOrderCountThreshold || 1)) {
                firstOrderDiscount = appSettings.firstOrderDiscountAmount || 0;
            }
        }
    }

    // 2. Check App Discount Eligibility (Only if First Order Discount is NOT applied)
    if (firstOrderDiscount > 0) {
        appDiscount = 0; // mutually exclusive
    } else if (isVerified && appSettings.enableAppDiscount !== false) { // Default to true if undefined
        if (isDateValid(appSettings.appDiscountStartDate, appSettings.appDiscountEndDate)) {
            appDiscount = Math.max(appSettings.minAppDiscount, Math.floor(subtotal * (appSettings.appDiscountPercentage / 100)));
        }
    }

    const totalDiscount = appDiscount + firstOrderDiscount;
    let discountDetails = "";
    if (totalDiscount > 0) {
        if (firstOrderDiscount > 0) {
            discountDetails = `First Order Discount (Rs. ${firstOrderDiscount})`;
        } else if (appDiscount > 0) {
            discountDetails = `App Discount (${appSettings.appDiscountPercentage}%)`;
        }
    }
    const total = Math.max(0, subtotal + deliveryFee - totalDiscount);

    return (
        <div className="min-h-screen bg-gray-50 py-6 md:py-12 pb-32 md:pb-36">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Checkout</h1>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                    {/* LEFT COLUMN: Cart Items */}
                    <div className="flex-1 space-y-4 md:space-y-6">
                        {/* Cart Items List */}
                        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center">
                                <span className="bg-green-100 text-green-800 h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center text-xs md:text-sm mr-2 md:mr-3">1</span>
                                Review Cart Items
                            </h2>
                            <div className="space-y-3 md:space-y-4">
                                {validItems.map((item) => {
                                    const isEggs = item.productId === FRESH_EGGS_PRODUCT_ID;
                                    const handleIncrement = () => {
                                        const step = isEggs ? 30 : 1;
                                        const safeUnit = getSafeUnit(item.priceUnit || item.unit);
                                        const unitInfo = units.find(u => u.name.toLowerCase() === safeUnit.toLowerCase());
                                        const allowDecimals = unitInfo ? unitInfo.allowDecimals !== false : true;
                                        const newVal = item.quantity + step;
                                        updateQuantity(item.productId, allowDecimals ? newVal : Math.floor(newVal));
                                    };
                                    const handleDecrement = () => {
                                        const step = isEggs ? 30 : 1;
                                        const safeUnit = getSafeUnit(item.priceUnit || item.unit);
                                        const unitInfo = units.find(u => u.name.toLowerCase() === safeUnit.toLowerCase());
                                        const allowDecimals = unitInfo ? unitInfo.allowDecimals !== false : true;
                                        const newVal = Math.max(0, item.quantity - step);
                                        updateQuantity(item.productId, allowDecimals ? newVal : Math.floor(newVal));
                                    };

                                    return (
                                        <div key={item.productId} className="flex items-center gap-3 md:gap-4 border-b border-gray-50 pb-3 md:pb-4 last:border-0 last:pb-0">
                                            {/* Product Image - Smaller on mobile */}
                                            <div className="h-14 w-14 md:h-16 md:w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.imageUrl || "/placeholder.png"}
                                                    alt={item.productName}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm md:text-base font-bold text-gray-900 truncate">{item.productName}</h3>
                                                        <p className="text-xs text-gray-500">Rs. {item.price} / {getSafeUnit(item.priceUnit || item.unit)}</p>
                                                    </div>
                                                    <p className="text-sm md:text-base font-bold text-[#2D5A27] whitespace-nowrap">
                                                        Rs. {((item.priceUnit && item.priceUnit !== item.unit) ? (item.quantity * item.price) : (item.price * item.quantity)).toFixed(2)}
                                                    </p>
                                                </div>

                                                {/* Quantity Controls and Remove - Mobile Optimized */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={handleIncrement}
                                                                className="p-1.5 md:p-2 hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors touch-manipulation"
                                                                aria-label="Decrease quantity"
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                step={units.find(u => u.name.toLowerCase() === getSafeUnit(item.priceUnit || item.unit).toLowerCase())?.allowDecimals === false ? "1" : "0.01"}
                                                                min="0"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    const safeUnit = getSafeUnit(item.priceUnit || item.unit);
                                                                    const unitInfo = units.find(u => u.name.toLowerCase() === safeUnit.toLowerCase());
                                                                    const allowDecimals = unitInfo ? unitInfo.allowDecimals !== false : true;

                                                                    if (val === '') {
                                                                        updateQuantity(item.productId, 0);
                                                                        return;
                                                                    }
                                                                    let parsed = parseFloat(val);
                                                                    if (!isNaN(parsed)) {
                                                                        if (!allowDecimals) parsed = Math.floor(parsed);
                                                                        else parsed = Math.round(parsed * 100) / 100;
                                                                        updateQuantity(item.productId, parsed);
                                                                    }
                                                                }}
                                                                className="w-10 text-center font-bold text-sm bg-transparent border-0 focus:outline-none focus:ring-0 rounded-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 h-8"
                                                                aria-label="Quantity"
                                                            />
                                                            <button
                                                                onClick={handleIncrement}
                                                                className="p-1.5 md:p-2 hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors touch-manipulation"
                                                                aria-label="Increase quantity"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-500 lowercase">{getSafeUnit(item.priceUnit || item.unit)}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => removeItem(item.productId)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recommended Products - Now in the same column */}
                        <RecommendedProducts />
                    </div>



                    {/* RIGHT COLUMN: Shipping & Payment */}
                    <div className="w-full lg:w-[420px] space-y-6">

                        {/* Shipping Details */}
                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center">
                                <span className="bg-green-100 text-green-800 h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center text-xs md:text-sm mr-2 md:mr-3">2</span>
                                Shipping Details
                            </h2>

                            {!user ? (
                                <div className="text-center py-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-dashed border-green-200">
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <ShoppingBag className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">Ready to checkout?</h3>
                                    <p className="text-gray-600 mb-4 text-sm">Please login to complete your order</p>
                                    <Link
                                        href="/login?redirect=/cart"
                                        className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                                    >
                                        Login to Continue
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4 md:space-y-5">
                                    {/* Customer Info (Read-only) */}
                                    <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Customer</p>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{user.displayName || "Valued Customer"}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center">
                                            <Phone className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Contact Number
                                        </label>
                                        <input
                                            id="phone-input"
                                            type="tel"
                                            required
                                            value={phoneNumber}
                                            onChange={(e) => {
                                                setPhoneNumber(e.target.value);
                                                if (e.target.value) setShowValidationErrors(false);
                                            }}
                                            placeholder="Enter your phone number"
                                            className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:ring-2 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white ${showValidationErrors && !phoneNumber
                                                ? "border-red-500 ring-red-200 focus:ring-red-500"
                                                : "border-gray-200 focus:ring-green-500"
                                                }`}
                                        />
                                        {showValidationErrors && !phoneNumber && (
                                            <p className="text-red-500 text-xs mt-1 font-medium animate-in slide-in-from-top-1">
                                                Please enter your phone number
                                            </p>
                                        )}
                                    </div>

                                    {/* Address Selection */}
                                    <div id="address-section">
                                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
                                            <button
                                                onClick={() => setActiveTab('address')}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'address'
                                                    ? "bg-white text-green-700 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                            >
                                                <div className={`h-2 w-2 rounded-full ${activeTab === 'address' ? "bg-green-500" : "bg-gray-300"}`} />
                                                Saved Address
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('map')}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'map'
                                                    ? "bg-white text-blue-700 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                            >
                                                <MapPin className="h-3 w-3" />
                                                Pin on Map
                                            </button>
                                        </div>

                                        {activeTab === 'map' ? (
                                            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <LocationPicker
                                                    initialLocation={deliveryLocation}
                                                    onLocationSelect={(loc) => {
                                                        setDeliveryLocation(loc);
                                                        if (loc) {
                                                            setIsMapSelected(true);
                                                            setSelectedAddressIndex(-1); // Deselect saved address
                                                            setActiveTab('address'); // Auto-switch to address tab
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                                {/* Unified Address List */}
                                                <div className="space-y-2">
                                                    {/* Pinned Location Entry (if exists) */}
                                                    {deliveryLocation && (
                                                        <div
                                                            onClick={() => {
                                                                setIsMapSelected(true);
                                                                setSelectedAddressIndex(-1);
                                                            }}
                                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-start group relative overflow-hidden ${isMapSelected
                                                                ? "border-green-500 bg-green-50/50"
                                                                : "border-gray-100 bg-white hover:border-green-100"
                                                                }`}
                                                        >
                                                            {isMapSelected && (
                                                                <div className="absolute top-0 right-0 p-1 bg-green-500 rounded-bl-lg text-white">
                                                                    <Check className="h-2.5 w-2.5" />
                                                                </div>
                                                            )}
                                                            <div className="flex gap-3">
                                                                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isMapSelected ? "border-green-500" : "border-gray-300"
                                                                    }`}>
                                                                    {isMapSelected && <div className="h-2 w-2 rounded-full bg-green-500" />}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-xs font-bold text-gray-800">
                                                                            📍 Pinned Location
                                                                        </span>
                                                                        {isMapSelected && <span className="text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Selected</span>}
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                                                                        {deliveryLocation.address || "Address not found"}
                                                                    </p>
                                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                                                                        <MapPin className="h-2.5 w-2.5" />
                                                                        {deliveryLocation.lat.toFixed(5)}, {deliveryLocation.lng.toFixed(5)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeliveryLocation(null);
                                                                    setIsMapSelected(false);
                                                                }}
                                                                className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Saved Addresses */}
                                                    {addresses.map((addr, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedAddressIndex(idx);
                                                                setIsMapSelected(false);
                                                            }}
                                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-start group relative overflow-hidden ${(!isMapSelected && selectedAddressIndex === idx)
                                                                ? "border-green-500 bg-green-50/50"
                                                                : "border-gray-100 bg-white hover:border-gray-200"
                                                                }`}
                                                        >
                                                            {(!isMapSelected && selectedAddressIndex === idx) && (
                                                                <div className="absolute top-0 right-0 p-1 bg-green-500 rounded-bl-lg text-white">
                                                                    <Check className="h-2.5 w-2.5" />
                                                                </div>
                                                            )}
                                                            <div className="flex gap-3">
                                                                <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${(!isMapSelected && selectedAddressIndex === idx) ? "border-green-500" : "border-gray-300"
                                                                    }`}>
                                                                    {(!isMapSelected && selectedAddressIndex === idx) && <div className="h-2 w-2 rounded-full bg-green-500" />}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className="text-xs font-bold text-gray-800">
                                                                            Home / Office
                                                                        </span>
                                                                        {(!isMapSelected && selectedAddressIndex === idx) && <span className="text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Selected</span>}
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">{addr}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveAddress(idx);
                                                                }}
                                                                className="text-gray-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add New Address Button */}
                                                {!isAddressMode ? (
                                                    <button
                                                        onClick={() => setIsAddressMode(true)}
                                                        className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 text-xs font-bold hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Add New Address
                                                    </button>
                                                ) : (
                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 animate-in fade-in zoom-in-95">
                                                        <label className="block text-xs font-bold text-gray-700 mb-2">Enter New Address</label>
                                                        <input
                                                            type="text"
                                                            value={newAddress}
                                                            onChange={(e) => setNewAddress(e.target.value)}
                                                            placeholder="e.g., House No 123, Street Name"
                                                            className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white mb-3"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleAddAddress}
                                                                disabled={!newAddress.trim()}
                                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => setIsAddressMode(false)}
                                                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white text-xs font-bold bg-white shadow-sm"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Delivery Preferences */}
                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                        <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center">
                                            <Truck className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Delivery
                                        </h3>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
                                                <div className="nepali-datepicker-container">
                                                    <NepaliDatePicker
                                                        value={expectedDate}
                                                        onChange={(date: string) => setExpectedDate(date)}
                                                        options={{ calenderLocale: "en", valueLocale: "en" }}
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-green-500 outline-none text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Time</label>
                                                <input
                                                    type="time"
                                                    value={expectedTime}
                                                    onChange={(e) => setExpectedTime(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-1 focus:ring-green-500 outline-none text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <textarea
                                                value={deliveryInstructions}
                                                onChange={(e) => setDeliveryInstructions(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-green-500 outline-none resize-none"
                                                placeholder="Special instructions (e.g. Leave at door)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:sticky lg:top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>Rs. {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span className="flex items-center">Delivery {subtotal >= appSettings.freeDeliveryThreshold && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-black uppercase">FREE</span>}</span>
                                <span className={subtotal >= appSettings.freeDeliveryThreshold ? "line-through opacity-50" : ""}>Rs. {deliveryFee}</span>
                            </div>

                            {/* Discounts Display */}
                            {appDiscount > 0 && (
                                <div className="flex justify-between text-sm text-green-700">
                                    <span>App Discount ({appSettings.appDiscountPercentage}%)</span>
                                    <span>- Rs. {appDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            {firstOrderDiscount > 0 && (
                                <div className="flex justify-between text-sm text-blue-700">
                                    <div className="flex flex-col">
                                        <span>First Order Discount</span>
                                        <span className="text-[10px] opacity-75">Welcome Offer</span>
                                    </div>
                                    <span>- Rs. {firstOrderDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {(appDiscount === 0 && firstOrderDiscount === 0 && isVerified) && (
                                <div className="text-xs text-gray-400 italic text-center py-1">
                                    No discounts applicable
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="font-bold text-2xl text-[#2D5A27]">Rs. {total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-[#2D5A27]/5 p-4 rounded-xl flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-[#2D5A27]" />
                            <div className="flex-1">
                                <p className="text-xs font-bold text-gray-900">Cash on Delivery</p>
                                <p className="text-[10px] text-gray-500">Pay when you receive items</p>
                            </div>
                        </div>
                    </div>



                    {/* Floating Checkout Button */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50 safe-area-bottom">
                        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Amount</span>
                                    <span className="text-xl font-black text-[#2D5A27]">Rs. {total.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={placingOrder}
                                    className={`px-8 py-3.5 rounded-2xl font-bold text-base transition-all shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group min-w-[160px] ${placingOrder
                                        ? "bg-gray-400 cursor-not-allowed shadow-none"
                                        : "bg-[#2D5A27] text-white hover:bg-[#1e3d1a] shadow-green-900/20"
                                        }`}
                                >
                                    {placingOrder ? (
                                        <span className="flex items-center"><div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" /> Processing...</span>
                                    ) : (
                                        <>
                                            Place Order <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
