"use client";

import { useCartStore } from "@/store/useCartStore";
import { Minus, Plus, Trash2, ArrowRight, Phone, MapPin, PlusCircle, X, Check, Truck, CreditCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TransactionService } from "@/services/transaction.service";
import { UserService } from "@/services/user.service";
import { TransactionType, PaymentStatus, OrderStatus } from "@/types";

const DELIVERY_FEE = 50;

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

    const { user, dbUser, refreshDbUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

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

        if (!confirm("Confirm your order?")) return;

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
                billNo: "ORD-" + Math.floor(Math.random() * 100000),
                type: TransactionType.Sale,
                items: items.map(i => ({
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
                discount: 0,
                deliveryFee: DELIVERY_FEE,
                soldBy: "Online",
                enteredBy: user.uid,
                entryTimestamp: new Date(),
                paymentStatus: PaymentStatus.Pending,
                status: OrderStatus.Open,
                paidAmount: 0,
                payments: [],
                deliveryAddress: activeProfile.address,
                customerPhone: activeProfile.phoneNumber
            });

            clearCart();
            router.push("/shop?orderSuccess=true");
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setPlacingOrder(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-gray-50 pt-20 text-center">Loading cart...</div>;

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + DELIVERY_FEE;

    if (items.length === 0) {
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

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* LEFT COLUMN: Cart Items */}
                    <div className="flex-1 space-y-6">
                        {/* Cart Items List */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="bg-green-100 text-green-800 h-8 w-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                                Review Cart Items
                            </h2>
                            <div className="space-y-6">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex flex-col sm:flex-row items-center border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                        <div className="h-20 w-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mb-4 sm:mb-0 box-content">
                                            <img
                                                src={item.imageUrl || "/placeholder.png"}
                                                alt={item.productName}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 sm:ml-6 text-center sm:text-left w-full">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900">{item.productName}</h3>
                                                    <p className="text-sm text-gray-500">Rs. {item.price} / {item.unit}</p>
                                                </div>
                                                <p className="text-base font-bold text-gray-900 hidden sm:block">Rs. {item.price * item.quantity}</p>
                                            </div>

                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center border border-gray-200 rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="p-1.5 hover:bg-gray-50 text-gray-500"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        className="p-1.5 hover:bg-gray-50 text-gray-500"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.productId)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Shipping & Payment */}
                    <div className="w-full lg:w-[480px] space-y-6">

                        {/* Shipping Details */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="bg-green-100 text-green-800 h-8 w-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                                Shipping Details
                            </h2>

                            {!user ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl">
                                    <p className="text-gray-600 mb-4">Please login to enter shipping details</p>
                                    <Link href="/login?redirect=/cart" className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors inline-block">
                                        Login to Checkout
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Customer Info (Read-only) */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Customer</p>
                                        <p className="font-semibold text-gray-900">{user.displayName || "Valued Customer"}</p>
                                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <Phone className="h-4 w-4 mr-2 text-green-600" /> Contact Number
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Enter your phone number"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                        />
                                    </div>

                                    {/* Address Selection */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700 flex items-center">
                                                <MapPin className="h-4 w-4 mr-2 text-green-600" /> Delivery Address
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
                                                    placeholder="Enter full address (e.g. Street, City, Landmark)"
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleAddAddress}
                                                        disabled={!newAddress.trim()}
                                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        Save Address
                                                    </button>
                                                    <button
                                                        onClick={() => setIsAddressMode(false)}
                                                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {addresses.length === 0 ? (
                                                    <button
                                                        onClick={() => setIsAddressMode(true)}
                                                        className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 transition-all flex flex-col items-center justify-center gap-2"
                                                    >
                                                        <PlusCircle className="h-6 w-6" />
                                                        <span className="font-medium">Add Delivery Address</span>
                                                    </button>
                                                ) : (
                                                    addresses.map((addr, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => setSelectedAddressIndex(idx)}
                                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-start ${selectedAddressIndex === idx
                                                                ? "border-green-500 bg-green-50/50"
                                                                : "border-gray-100 hover:border-gray-200"
                                                                }`}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center ${selectedAddressIndex === idx ? "border-green-600" : "border-gray-300"
                                                                    }`}>
                                                                    {selectedAddressIndex === idx && <div className="h-2 w-2 rounded-full bg-green-600" />}
                                                                </div>
                                                                <p className="text-sm text-gray-700 leading-snug">{addr}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveAddress(idx);
                                                                }}
                                                                className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>Rs. {subtotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span className="flex items-center"><Truck className="h-4 w-4 mr-1" /> Delivery Fee</span>
                                    <span>Rs. {DELIVERY_FEE}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                    <span className="font-bold text-lg text-gray-900">Total Amount</span>
                                    <span className="font-bold text-2xl text-green-700">Rs. {total}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                                    <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-blue-800">Payment Method</p>
                                        <p className="text-xs text-blue-600">Cash on Delivery (Standard)</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={placingOrder || !user || addresses.length === 0 || !phoneNumber}
                                    className="w-full bg-[#2D5A27] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#1e3d1a] transition-all shadow-lg shadow-green-900/10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {placingOrder ? "Placing Order..." : (
                                        <>
                                            Place Order <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-400 text-center">
                                    By placing this order, you agree to our Terms of Service.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
