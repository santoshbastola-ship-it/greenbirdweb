"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { UserService } from "@/services/user.service";
import { TransactionService } from "@/services/transaction.service";
import { Product, StockUnit, TransactionType, PaymentStatus, OrderStatus, User } from "@/types";
import { ArrowLeft, Plus, Trash2, Save, Search, Calendar, User as UserIcon, Tag, CreditCard, ShoppingBag, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);

    // New missing fields state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [discount, setDiscount] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PaidCash);
    const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.Delivered);
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [soldBy, setSoldBy] = useState("");
    const [admins, setAdmins] = useState<User[]>([]);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        const data = await ProductService.getAllProducts();
        setProducts(data);
        const customersData = await UserService.getAllCustomers();
        setCustomers(customersData);
        const adminsData = await UserService.getAllUsers();
        setAdmins(adminsData);

        // Pick current user as default soldBy if available (assuming first admin for now)
        if (adminsData.length > 0) {
            setSoldBy(adminsData[0].name);
        }
    };

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.productId === product.id);
        if (existing) {
            // Increment if already exists
            updateQuantity(product.id, existing.quantity + 1);
        } else {
            // Add new
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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
    const totalPayable = Math.max(0, totalAmount - (discount || 0));

    // Sync paidAmount with totalPayable for Paid Statuses
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
            alert("Cart is empty");
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
                date: new Date(date),
                discount: Number(discount),
                soldBy: soldBy || "Admin",
                enteredBy: "admin",
                entryTimestamp: new Date(),
                paymentStatus: paymentStatus,
                status: orderStatus,
                paidAmount: Number(paidAmount),
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
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* Left: Product Selection */}
            <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="flex flex-col text-left p-3 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all active:scale-95"
                            >
                                <div className="h-24 w-full bg-gray-100 rounded-lg mb-3 overflow-hidden">
                                    <img src={product.images[0] || "/placeholder.png"} className="h-full w-full object-cover" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                                <p className="text-xs text-gray-500">{product.currentStock} {product.unit} available</p>
                                <p className="font-bold text-green-600 mt-1">Rs {product.currentPrice}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Cart & Checkout */}
            <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="font-bold text-gray-900 flex items-center">
                        <Link href="/admin/sales" className="mr-3 text-gray-500 hover:text-black">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        New Sale
                    </h2>
                    <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        {cart.length} Items
                    </span>
                </div>

                <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <UserIcon className="h-3 w-3" /> Customer / Party Name
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 font-medium"
                                placeholder="Enter name (e.g. Ram Bahadur)"
                                value={partyName}
                                onChange={(e) => setPartyName(e.target.value)}
                            />
                            <select
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm w-1/3"
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
                                <option value="">Guest / Manual</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name || c.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Date
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                <UserIcon className="h-3 w-3" /> Sold By
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
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

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Plus className="h-12 w-12 mb-2 opacity-50" />
                            <p>Add items from the left</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.productId} className="flex flex-col p-3 border border-gray-100 rounded-lg bg-gray-50 gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                                        <div className="text-xs text-gray-500">
                                            {item.price.toLocaleString()} per {item.unit}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center bg-white rounded-lg border border-gray-200 h-8">
                                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-2 hover:bg-gray-100 font-bold">-</button>
                                            <input
                                                type="number"
                                                className="w-12 text-center text-sm border-0 focus:ring-0 p-0 font-bold"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                            />
                                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-2 hover:bg-gray-100 font-bold">+</button>
                                        </div>
                                        <div className="font-bold text-gray-900 w-16 text-right">
                                            {item.total.toLocaleString()}
                                        </div>
                                        <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="Weight (Kg)"
                                            className="w-full text-xs p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500"
                                            value={item.weight || ""}
                                            onChange={(e) => updateQuantity(item.productId, item.quantity, parseFloat(e.target.value) || 0)}
                                        />
                                        {item.weight === 0 && <span className="absolute right-2 top-1.5 text-[10px] text-gray-400">Kg</span>}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Notes/Description"
                                        className="w-full text-xs p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500"
                                        value={item.description || ""}
                                        onChange={(e) => updateQuantity(item.productId, item.quantity, item.weight, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                                <Tag className="h-3 w-3" /> Discount
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                value={discount}
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                                <CreditCard className="h-3 w-3" /> Payment Status
                            </label>
                            <select
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                                <ShoppingBag className="h-3 w-3" /> Order Status
                            </label>
                            <select
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                value={orderStatus}
                                onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                            >
                                <option value={OrderStatus.Open}>Open</option>
                                <option value={OrderStatus.Accepted}>Accepted</option>
                                <option value={OrderStatus.Delivered}>Delivered</option>
                                <option value={OrderStatus.Cancelled}>Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                                <Info className="h-3 w-3" /> Paid Amount
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-green-700"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-500">Subtotal</span>
                            <span className="text-sm font-medium">Rs {totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-600 font-bold">Total Payable</span>
                            <span className="text-2xl font-bold text-green-700">Rs {totalPayable.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors flex items-center justify-center disabled:opacity-70"
                        >
                            <Save className="h-5 w-5 mr-2" />
                            {loading ? "Processing..." : "Complete Sale"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
