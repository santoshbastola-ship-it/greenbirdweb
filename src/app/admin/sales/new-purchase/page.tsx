"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { UserService } from "@/services/user.service";
import { TransactionService } from "@/services/transaction.service";
import { Product, StockUnit, TransactionType, PaymentStatus, OrderStatus, User } from "@/types";
import { ArrowLeft, Plus, Trash2, Save, Search, ShoppingBag } from "lucide-react";
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
}

export default function NewPurchasePage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<User[]>([]);
    const [partyName, setPartyName] = useState("");
    const [vendorId, setVendorId] = useState<string | undefined>(undefined);
    const [cart, setCart] = useState<POSItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await ProductService.getAllProducts();
        setProducts(data);
        // Assuming UserService has a method for vendors or we filter users
        const allUsers = await UserService.getAllUsers();
        const vendorsData = allUsers.filter(u => u.partnerType === "vendor");
        setVendors(vendorsData);
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

    const updateQuantity = (id: string, qty: number) => {
        if (qty <= 0) {
            removeFromCart(id);
            return;
        }
        setCart(cart.map(item =>
            item.productId === id
                ? { ...item, quantity: qty, total: qty * item.price }
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

    const handleSave = async () => {
        if (!partyName) {
            alert("Please enter Vendor/Supplier Name");
            return;
        }
        if (cart.length === 0) {
            alert("Cart is empty");
            return;
        }

        setLoading(true);
        try {
            await TransactionService.createTransaction({
                billNo: "PUR-" + Math.floor(Math.random() * 100000),
                type: TransactionType.Purchase,
                items: cart.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    businessType: 'product',
                    quantity: item.quantity,
                    unit: item.unit,
                    priceUnit: item.unit,
                    pricePerUnit: item.price,
                    totalPrice: item.total
                })),
                ...(vendorId ? { customerId: vendorId } : {}),
                partyName: partyName,
                date: new Date(),
                discount: 0,
                soldBy: "Admin",
                enteredBy: "admin",
                entryTimestamp: new Date(),
                paymentStatus: PaymentStatus.Pending, // Purchases often pending
                status: OrderStatus.Delivered,
                paidAmount: 0,
                payments: []
            });

            alert("Purchase saved successfully");
            router.push("/admin/sales");
        } catch (error) {
            console.error("Error saving purchase:", error);
            alert("Failed to save purchase");
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
                            placeholder="Search materials/products..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-red-500 focus:border-red-500"
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
                                className="flex flex-col text-left p-3 border border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all active:scale-95"
                            >
                                <div className="h-24 w-full bg-gray-100 rounded-lg mb-3 overflow-hidden">
                                    <img src={product.images[0] || "/placeholder.png"} className="h-full w-full object-cover" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                                <p className="text-xs text-gray-500">{product.currentStock} {product.unit} in stock</p>
                                <p className="font-bold text-red-600 mt-1">Rs {product.currentPrice}</p>
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
                        New Purchase
                    </h2>
                    <span className="text-sm font-medium bg-red-100 text-red-800 px-3 py-1 rounded-full">
                        {cart.length} Items
                    </span>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Vendor / Supplier Name
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 font-medium"
                            placeholder="Enter vendor name"
                            value={partyName}
                            onChange={(e) => setPartyName(e.target.value)}
                        />
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm w-1/3"
                            onChange={(e) => {
                                const selectedUser = vendors.find(v => v.id === e.target.value);
                                if (selectedUser) {
                                    setVendorId(selectedUser.id);
                                    setPartyName(selectedUser.name || "");
                                } else {
                                    setVendorId(undefined);
                                    setPartyName("");
                                }
                            }}
                            value={vendorId || ""}
                        >
                            <option value="">Manual Entry</option>
                            {vendors.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ShoppingBag className="h-12 w-12 mb-2 opacity-50" />
                            <p>Add purchase items from the left</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{item.productName}</h4>
                                    <div className="text-xs text-gray-500">
                                        {item.quantity} {item.unit} x {item.price}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center bg-white rounded-lg border border-gray-200 h-8">
                                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-2 hover:bg-gray-100">-</button>
                                        <input
                                            type="number"
                                            className="w-12 text-center text-sm border-0 focus:ring-0 p-0"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                                        />
                                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-2 hover:bg-gray-100">+</button>
                                    </div>
                                    <div className="font-bold text-gray-900 w-16 text-right">
                                        {item.total.toLocaleString()}
                                    </div>
                                    <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total Purchase Value</span>
                        <span className="text-2xl font-bold text-red-700">Rs {totalAmount.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-70"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        {loading ? "Saving..." : "Record Purchase"}
                    </button>
                </div>
            </div>
        </div>
    );
}
