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
import { TransactionType, PaymentStatus, OrderStatus, AppSettings } from "@/types";
import { getTodayNepali } from "@/lib/date-helper";
import dynamic from 'next/dynamic';
import RecommendedProducts from "@/components/shop/RecommendedProducts";
import WhatsAppOptInModal from "@/components/shop/WhatsAppOptInModal";

const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-200 text-xs md:text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";

// Default settings as fallback
const DEFAULT_SETTINGS: AppSettings = {
    deliveryFee: 75,
    freeDeliveryThreshold: 750,
    appDiscountPercentage: 5,
    minAppDiscount: 10
};

export default function CartPage() {
    const { items, updateQuantity, removeItem, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Profile form state
    const [phoneNumber, setPhoneNumber] = useState("");
    const [addresses, setAddresses] = useState<string[]>([]);
    const [newAddress, setNewAddress] = useState("");
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
    const [isAddressMode, setIsAddressMode] = useState(false); // To toggle adding new address

    // Delivery Preferences
    const [deliveryInstructions, setDeliveryInstructions] = useState("");
    const [expectedDate, setExpectedDate] = useState(getTodayNepali());
    const [expectedTime, setExpectedTime] = useState("");

    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    const { user, dbUser, refreshDbUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadAppSettings();
    }, []);

    const loadAppSettings = async () => {
        try {
            const settings = await SettingsService.getSettings();
            setAppSettings(settings);
        } catch (error) {
            console.error("Error loading app settings:", error);
        }
    };

    useEffect(() => {
        if (dbUser) {
            setPhoneNumber(dbUser.phoneNumber || "");
            setAddresses(dbUser.addresses || (dbUser.address ? [dbUser.address] : []));
        }
    }, [dbUser]);

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
            alert("Please provide a phone number for delivery updates.");
            return;
        }

        if (addresses.length === 0) {
            alert("Please add at least one delivery address.");
            return;
        }

        setPlacingOrder(true);
        try {
            // Update profile info if changed
            if (dbUser && (phoneNumber !== dbUser.phoneNumber || JSON.stringify(addresses) !== JSON.stringify(dbUser.addresses))) {
                await UserService.updateUser(user.uid, {
                    phoneNumber,
                    addresses,
                    address: addresses[selectedAddressIndex]
                });
                await refreshDbUser();
            }

            const activeProfile = {
                name: dbUser?.name || user.displayName || "Customer",
                phoneNumber,
                address: addresses[selectedAddressIndex]
            };

            await TransactionService.createTransaction({
                billNo: "OR-" + Math.floor(Math.random() * 100000),
                type: TransactionType.Sale,
                items: validItems.map(i => ({
                    productId: i.productId,
                    productName: i.productName,
                    businessType: i.businessType || 'product',
                    quantity: i.quantity,
                    unit: i.unit,
                    priceUnit: i.unit,
                    pricePerUnit: i.price,
                    totalPrice: i.price * i.quantity
                })),
                customerId: user.uid,
                partyName: activeProfile.name,
                date: new Date(),
                discount: appDiscount,
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
                expectedDeliveryTime: expectedTime
            });

            setOrderSuccess(true);
            clearCart();
            router.push("/shop?orderSuccess=true");
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Failed to place order. Please try again.");
            setPlacingOrder(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-gray-50 pt-20 text-center">Loading cart...</div>;

    // Defensive check: Ensure items is an array and filter out invalid ones
    const validItems = Array.isArray(items) ? items.filter(item => item && item.productId) : [];

    if (validItems.length === 0) {
        if (orderSuccess) {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="h-10 w-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
                        <p className="text-gray-600 mb-8">Your order has been recorded successfully. Please check WhatsApp for updates.</p>
                        <Link
                            href="/shop"
                            className="block w-full bg-[#2D5A27] text-white py-3 rounded-xl font-bold hover:bg-[#1e3d1a] transition-colors"
                        >
                            Return to Shop
                        </Link>
                    </div>
                    <WhatsAppOptInModal />
                </div>
            )
        }
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link
                    href="/shop"
                    className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition-colors"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    const subtotal = validItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + (price * quantity);
    }, 0);

    const isVerified = user && dbUser && !dbUser.email?.endsWith('@manual.entry');
    const deliveryFee = subtotal < appSettings.freeDeliveryThreshold ? appSettings.deliveryFee : 0;
    const appDiscount = isVerified
        ? Math.max(appSettings.minAppDiscount, Math.floor(subtotal * (appSettings.appDiscountPercentage / 100)))
        : 0;
    const total = subtotal + deliveryFee - appDiscount;

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
                                    const isEggs = item.productName.toLowerCase().includes('egg');
                                    const handleIncrement = () => {
                                        const step = isEggs ? 30 : 1;
                                        updateQuantity(item.productId, item.quantity + step);
                                    };
                                    const handleDecrement = () => {
                                        const step = isEggs ? 30 : 1;
                                        updateQuantity(item.productId, Math.max(0, item.quantity - step));
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
                                                        <p className="text-xs text-gray-500">Rs. {item.price} / {item.unit}</p>
                                                    </div>
                                                    <p className="text-sm md:text-base font-bold text-[#2D5A27] whitespace-nowrap">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                                                </div>

                                                {/* Quantity Controls and Remove - Mobile Optimized */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={handleDecrement}
                                                                className="p-1.5 md:p-2 hover:bg-gray-100 active:bg-gray-200 text-gray-700 transition-colors touch-manipulation"
                                                                aria-label="Decrease quantity"
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val === '') {
                                                                        updateQuantity(item.productId, 0);
                                                                        return;
                                                                    }
                                                                    const parsed = parseFloat(val);
                                                                    if (!isNaN(parsed)) {
                                                                        // Round to 2 decimals if needed
                                                                        const rounded = Math.round(parsed * 100) / 100;
                                                                        updateQuantity(item.productId, rounded);
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
                                                        <span className="text-xs font-bold text-gray-500 lowercase">{item.unit}</span>
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
                    </div>

                    {/* Recommended Products */}
                    <div className="md:col-span-1 lg:col-span-2 hidden lg:block">
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
                                            type="tel"
                                            required
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Enter your phone number"
                                            className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                        />
                                    </div>

                                    {/* Address Selection */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-xs font-bold text-gray-700 flex items-center">
                                                <MapPin className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Delivery Address
                                            </label>
                                            {!isAddressMode && (
                                                <button
                                                    onClick={() => setIsAddressMode(true)}
                                                    className="text-xs text-green-600 font-bold hover:text-green-700 flex items-center"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" /> Add New
                                                </button>
                                            )}
                                        </div>

                                        {isAddressMode ? (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                                <input
                                                    type="text"
                                                    value={newAddress}
                                                    onChange={(e) => setNewAddress(e.target.value)}
                                                    placeholder="Enter full address"
                                                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleAddAddress}
                                                        disabled={!newAddress.trim()}
                                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        Save Address
                                                    </button>
                                                    <button
                                                        onClick={() => setIsAddressMode(false)}
                                                        className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {addresses.length === 0 ? (
                                                    <button
                                                        onClick={() => setIsAddressMode(true)}
                                                        className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-green-500 hover:text-green-600 transition-all flex flex-col items-center justify-center gap-2"
                                                    >
                                                        <PlusCircle className="h-5 w-5" />
                                                        <span className="font-medium text-sm">Add Address</span>
                                                    </button>
                                                ) : (
                                                    addresses.map((addr, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => setSelectedAddressIndex(idx)}
                                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-start group ${selectedAddressIndex === idx
                                                                ? "border-green-500 bg-green-50/50"
                                                                : "border-gray-50 hover:border-gray-100"
                                                                }`}
                                                        >
                                                            <div className="flex gap-2.5">
                                                                <div className={`mt-0.5 h-3.5 w-3.5 rounded-full border flex items-center justify-center ${selectedAddressIndex === idx ? "border-green-600" : "border-gray-300"
                                                                    }`}>
                                                                    {selectedAddressIndex === idx && <div className="h-1.5 w-1.5 rounded-full bg-green-600" />}
                                                                </div>
                                                                <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{addr}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveAddress(idx);
                                                                }}
                                                                className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ))
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
                                <div className="flex justify-between text-sm text-[#2D5A27] font-bold">
                                    <span>App Discount</span>
                                    <span>- Rs. {appDiscount.toFixed(2)}</span>
                                </div>
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

                        {/* Mobile Recommended Products */}
                        <div className="lg:hidden pb-10">
                            <RecommendedProducts />
                        </div>
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
                            disabled={placingOrder || !user || addresses.length === 0 || !phoneNumber}
                            className="bg-[#2D5A27] text-white px-8 py-3.5 rounded-2xl font-bold text-base hover:bg-[#1e3d1a] transition-all shadow-xl shadow-green-900/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group min-w-[160px]"
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
    );
}
