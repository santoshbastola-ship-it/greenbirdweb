"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { UserService } from "@/services/user.service";
import { TransactionService } from "@/services/transaction.service";
import { Product, StockUnit, TransactionType, PaymentStatus, OrderStatus, User } from "@/types";
import { ArrowLeft, Plus, Trash2, Save, Search, Calendar, User as UserIcon, Tag, CreditCard, ShoppingBag, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { SettingsService } from "@/services/settings.service";
import NepaliDate from "nepali-date-converter";

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
    price: number;
    quantity: number;
    total: number;
    weight?: number;
    description?: string;
}

export default function NewSalePage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [partyName, setPartyName] = useState("");
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);
    const [cart, setCart] = useState<POSItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [discount, setDiscount] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PaidCash);
    const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.Delivered);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [soldBy, setSoldBy] = useState("");
    const [admins, setAdmins] = useState<User[]>([]);
    const [deliveryFee, setDeliveryFee] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsData, customersData, adminsData] = await Promise.all([
                ProductService.getAllProducts(),
                UserService.getAllCustomers(),
                UserService.getAllUsers()
            ]);
            setProducts(productsData);
            setCustomers(customersData);
            setAdmins(adminsData);

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
        if (existing) {
            updateQuantity(product.id, existing.quantity + 1);
        } else {
            setCart([...cart, {
                productId: product.id,
                productName: product.name,
                unit: product.unit,
                price: product.currentPrice,
                quantity: 1,
                total: product.currentPrice
            }]);
        }
    };

    const updateQuantity = (id: string, qty: number, weight?: number, desc?: string) => {
        if (qty <= 0 && weight === undefined && desc === undefined) {
            removeFromCart(id);
            return;
        }
        setCart(cart.map(item =>
            item.productId === id
                ? {
                    ...item,
                    quantity: qty,
                    weight: weight !== undefined ? weight : item.weight,
                    description: desc !== undefined ? desc : item.description,
                    total: item.unit === 'pcs' && (weight || item.weight) ? (weight || item.weight || 0) * item.price : qty * item.price
                }
                : item
        ));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.productId !== id));
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
    const totalPayable = Math.max(0, totalAmount + deliveryFee - (discount || 0));

    useEffect(() => {
        if (paymentStatus === PaymentStatus.PaidCash || paymentStatus === PaymentStatus.PaidOnline) {
            setPaidAmount(totalPayable);
        }
    }, [totalPayable, paymentStatus]);

    const handleSave = async () => {
        if (!partyName) {
            alert("Please enter Party/Customer Name");
            return;
        }
        if (cart.length === 0) {
            alert("Please add at least one item");
            return;
        }

        setLoading(true);
        try {
            await TransactionService.createTransaction({
                billNo: "SAL-" + Math.floor(Math.random() * 100000),
                type: TransactionType.Sale,
                items: cart.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    businessType: 'product',
                    quantity: item.quantity,
                    weight: item.weight,
                    unit: item.unit,
                    priceUnit: item.unit,
                    pricePerUnit: item.price,
                    totalPrice: item.total,
                    description: item.description
                })),
                ...(customerId ? { customerId } : {}),
                partyName: partyName,
                date: new NepaliDate(date).toJsDate(),
                discount: Number(discount),
                soldBy: soldBy || "Admin",
                enteredBy: "admin",
                entryTimestamp: new Date(),
                paymentStatus: paymentStatus,
                status: orderStatus,
                paidAmount: Number(paidAmount),
                deliveryFee: deliveryFee,
                payments: [{
                    amount: Number(paidAmount),
                    date: new Date(),
                    note: "POS Sale"
                }]
            });

            alert("Sale saved successfully");
            router.push("/admin/sales");
        } catch (error) {
            console.error("Error saving sale:", error);
            alert("Failed to save sale");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6 pb-20 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/sales" className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm bg-gray-50 border border-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
                        <p className="text-sm text-gray-500">Record a new sales transaction</p>
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
                                <Search className="h-4 w-4 text-gray-400" /> Select Customer (Optional)
                            </label>
                            <select
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                onChange={(e) => {
                                    const selectedUser = customers.find(c => c.id === e.target.value);
                                    if (selectedUser) {
                                        setCustomerId(selectedUser.id);
                                        setPartyName(selectedUser.name || selectedUser.email || "");
                                    } else {
                                        setCustomerId(undefined);
                                        setPartyName("");
                                    }
                                }}
                                value={customerId || ""}
                            >
                                <option value="">Manual Entry / Guest</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name || c.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-gray-400" /> Customer / Party Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium"
                                placeholder="Enter customer name"
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                            />
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
                            <select
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                onChange={(e) => handleProductSelect(e.target.value)}
                                value=""
                            >
                                <option value="" disabled>Choose a product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} - Rs {p.currentPrice} ({p.currentStock} {p.unit} in stock)
                                    </option>
                                ))}
                            </select>
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
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">{item.productName}</h4>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        Rs {item.price.toLocaleString()} per {item.unit}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center bg-white rounded-xl border border-gray-200 h-9 p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                            className="px-2.5 hover:bg-gray-50 text-gray-500 font-bold transition-colors"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            className="w-10 text-center text-sm border-0 focus:ring-0 p-0 font-bold bg-transparent"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                                        />
                                                        <button
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                            className="px-2.5 hover:bg-gray-50 text-green-600 font-bold transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="font-bold text-gray-900 text-right min-w-[80px]">
                                                        Rs {item.total.toLocaleString()}
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.productId)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        placeholder="Weight (Kg)"
                                                        className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                                        value={item.weight || ""}
                                                        onChange={(e) => updateQuantity(item.productId, item.quantity, parseFloat(e.target.value) || 0)}
                                                    />
                                                    {item.unit === 'kg' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">Kg</span>}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Notes/Description"
                                                    className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                                    value={item.description || ""}
                                                    onChange={(e) => updateQuantity(item.productId, item.quantity, item.weight, e.target.value)}
                                                />
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
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-gray-400" /> Order Status
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                                >
                                    <option value={OrderStatus.Open}>Open</option>
                                    <option value={OrderStatus.Accepted}>Accepted</option>
                                    <option value={OrderStatus.Delivered}>Delivered</option>
                                    <option value={OrderStatus.Cancelled}>Cancelled</option>
                                </select>
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
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
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
                                <span className={deliveryFee === 0 ? "text-green-600 font-bold" : ""}>
                                    {deliveryFee === 0 ? "Free Delivery" : `Rs ${deliveryFee.toLocaleString()}`}
                                </span>
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
                        {loading ? "Processing..." : <><Save className="h-6 w-6" /> Save Transaction</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
