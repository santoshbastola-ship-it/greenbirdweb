"use client";

import { useCartStore } from "@/store/useCartStore";
import { Minus, Plus, Trash2, ArrowRight, Phone, MapPin, PlusCircle, X } from "lucide-react";
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
    const [showProfileForm, setShowProfileForm] = useState(false);

    // Profile form state
    const [phoneNumber, setPhoneNumber] = useState("");
    const [addresses, setAddresses] = useState<string[]>([]);
    const [newAddress, setNewAddress] = useState("");
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

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
            setAddresses([...addresses, newAddress.trim()]);
            setNewAddress("");
        }
    };

    const handleRemoveAddress = (index: number) => {
        const updated = addresses.filter((_, i) => i !== index);
        setAddresses(updated);
        if (selectedAddressIndex >= updated.length) {
            setSelectedAddressIndex(Math.max(0, updated.length - 1));
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!phoneNumber) {
            alert("Please provide a phone number.");
            return;
        }
        if (addresses.length === 0) {
            alert("Please add at least one address.");
            return;
        }

        try {
            const profileUpdate = {
                phoneNumber,
                addresses,
                address: addresses[selectedAddressIndex]
            };

            await UserService.updateUser(user.uid, profileUpdate);
            await refreshDbUser();
            setShowProfileForm(false);

            // Pass the data directly to checkout to avoid waiting for state update
            await proceedToCheckout(profileUpdate);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile. Please try again.");
        }
    };

    const handleCheckout = async () => {
        if (!user) {
            router.push("/login");
            return;
        }

        // Check if phone or address is missing
        if (!dbUser?.phoneNumber || !dbUser?.addresses || dbUser.addresses.length === 0) {
            setShowProfileForm(true);
            return;
        }

        await proceedToCheckout();
    };

    const proceedToCheckout = async (profileData?: any) => {
        // Use provided profileData or fallback to dbUser
        const activeProfile = profileData || dbUser;

        if (!user || !activeProfile) {
            console.error("Missing user or profile data", { user, activeProfile });
            alert("Unable to proceed: Missing user or profile information.");
            return;
        }

        setPlacingOrder(true);
        try {
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const totalAmount = subtotal + DELIVERY_FEE;

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
                partyName: activeProfile.name || user.displayName || user.email || "Customer",
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
                deliveryAddress: activeProfile.address || activeProfile.addresses?.[0],
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
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Cart Items */}
                    <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.productId} className="flex flex-col sm:flex-row items-center border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="h-24 w-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mb-4 sm:mb-0 box-content">
                                        <img
                                            src={item.imageUrl || "/placeholder.png"}
                                            alt={item.productName}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>

                                    <div className="flex-1 sm:ml-6 text-center sm:text-left">
                                        <h3 className="text-lg font-bold text-gray-900">{item.productName}</h3>
                                        <p className="text-sm text-gray-500 mb-2">Unit Price: Rs. {item.price} / {item.unit}</p>

                                        <div className="flex items-center justify-center sm:justify-start space-x-4 mt-4">
                                            <div className="flex items-center border border-gray-200 rounded-lg">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                    className="p-2 hover:bg-gray-50 text-gray-500"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                    className="p-2 hover:bg-gray-50 text-gray-500"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.productId)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 sm:mt-0 sm:ml-6 text-right">
                                        <p className="text-xl font-bold text-gray-900">Rs. {item.price * item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>Rs. {subtotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span>Rs. {DELIVERY_FEE}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-xl text-gray-900">
                                    <span>Total</span>
                                    <span>Rs. {total}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={placingOrder}
                                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-shadow shadow-lg shadow-green-600/20 flex items-center justify-center disabled:opacity-70">
                                {placingOrder ? "Processing..." : (
                                    <>
                                        Checkout <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Taxes calculated at checkout
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Completion Modal */}
            {showProfileForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
                            <button onClick={() => setShowProfileForm(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-8">Please provide your contact details and delivery address to continue.</p>

                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-green-600" /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter your phone number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-green-600" /> Delivery Addresses
                                </label>
                                <div className="space-y-3 mb-4">
                                    {addresses.map((addr, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedAddressIndex(idx)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedAddressIndex === idx
                                                ? "border-green-500 bg-green-50"
                                                : "border-gray-100 hover:border-gray-200"
                                                }`}
                                        >
                                            <span className="text-sm text-gray-700">{addr}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveAddress(idx);
                                                }}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newAddress}
                                        onChange={(e) => setNewAddress(e.target.value)}
                                        placeholder="Add new address"
                                        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddAddress}
                                        className="bg-gray-100 p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors"
                                    >
                                        <PlusCircle className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={placingOrder}
                                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-shadow shadow-lg shadow-green-600/20 disabled:opacity-70"
                                >
                                    {placingOrder ? "Placing Order..." : "Save and Place Order"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
