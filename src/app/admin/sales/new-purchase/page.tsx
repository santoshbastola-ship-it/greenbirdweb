"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { UserService } from "@/services/user.service";
import { TransactionService } from "@/services/transaction.service";
import { Product, StockUnit, TransactionType, PaymentStatus, OrderStatus, User, SalesItem, BusinessType } from "@/types";
import { ArrowLeft, Plus, Trash2, Save, UserPlus, Calendar, Package, Info, Edit, CreditCard, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import AddPartnerModal from "@/components/admin/AddPartnerModal";
import NepaliDate from "nepali-date-converter";
import { toNepali } from "@/lib/date-helper";

// Dynamic import for NepaliDatePicker to avoid SSR issues
const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading..." className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
});

import "nepali-datepicker-reactjs/dist/index.css";

export default function NewPurchasePage() {
    const router = useRouter();
    const [vendors, setVendors] = useState<User[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddVendor, setShowAddVendor] = useState(false);

    // Form State
    const [purchaseDate, setPurchaseDate] = useState(toNepali(new Date(), "YYYY-MM-DD"));
    const [selectedVendor, setSelectedVendor] = useState<User | null>(null);
    const [purchasedBy, setPurchasedBy] = useState<string>("Admin");
    const [items, setItems] = useState<SalesItem[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.Pending);
    const [paidAmount, setPaidAmount] = useState<string>("0");
    const [discount, setDiscount] = useState<string>("0");

    // Item Entry State
    const [entryItem, setEntryItem] = useState({
        name: "",
        quantity: "",
        totalPrice: "",
        description: "",
        businessType: 'product' as BusinessType,
        unit: 'pcs' as StockUnit
    });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [allVendors, allUsers] = await Promise.all([
            UserService.getAllVendors(),
            UserService.getAllUsers()
        ]);
        setVendors(allVendors);
        setAvailableUsers(allUsers);

        // Find current user or default to first admin
        const adminUser = allUsers.find(u => u.role === 'admin');
        if (adminUser) setPurchasedBy(adminUser.name);
    };

    const handleAddItem = () => {
        if (!entryItem.name || !entryItem.quantity || !entryItem.totalPrice) {
            alert("Please fill in all required item fields (Name, Quantity, Total Price)");
            return;
        }

        const qty = parseFloat(entryItem.quantity) || 0;
        const total = parseFloat(entryItem.totalPrice) || 0;

        const newItem: SalesItem = {
            productId: editingIndex !== null ? items[editingIndex].productId : Date.now().toString(),
            productName: entryItem.name,
            businessType: entryItem.businessType,
            quantity: qty,
            unit: entryItem.unit,
            priceUnit: entryItem.unit,
            pricePerUnit: qty > 0 ? total / qty : 0,
            totalPrice: total,
            description: entryItem.description
        };

        if (editingIndex !== null) {
            const updatedItems = [...items];
            updatedItems[editingIndex] = newItem;
            setItems(updatedItems);
            setEditingIndex(null);
        } else {
            setItems([...items, newItem]);
        }

        // Reset Entry Form
        setEntryItem({
            name: "",
            quantity: "",
            totalPrice: "",
            description: "",
            businessType: 'product',
            unit: 'pcs'
        });
    };

    const handleEditItem = (index: number) => {
        const item = items[index];
        setEntryItem({
            name: item.productName,
            quantity: item.quantity.toString(),
            totalPrice: item.totalPrice.toString(),
            description: item.description || "",
            businessType: item.businessType,
            unit: item.unit
        });
        setEditingIndex(index);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
            setEntryItem({
                name: "",
                quantity: "",
                totalPrice: "",
                description: "",
                businessType: 'product',
                unit: 'pcs'
            });
        }
    };

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalPayable = subtotal - (parseFloat(discount) || 0);

    const handleSave = async () => {
        if (!selectedVendor) {
            alert("Please select or add a Vendor");
            return;
        }
        if (items.length === 0) {
            alert("Please add at least one item to the purchase");
            return;
        }

        setLoading(true);
        try {
            // Convert Nepali Date BS to AD Date object
            const nepaliDate = new NepaliDate(purchaseDate);
            const adDate = nepaliDate.toJsDate();

            await TransactionService.createTransaction({
                billNo: "PUR-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
                type: TransactionType.Purchase,
                items: items,
                customerId: selectedVendor.id,
                partyName: selectedVendor.name,
                date: adDate,
                discount: parseFloat(discount) || 0,
                soldBy: purchasedBy,
                enteredBy: "Admin", // Should be actual logged in user
                entryTimestamp: new Date(),
                paymentStatus: paymentStatus,
                status: OrderStatus.Delivered,
                paidAmount: parseFloat(paidAmount) || 0,
                payments: parseFloat(paidAmount) > 0 ? [{
                    amount: parseFloat(paidAmount),
                    date: new Date(),
                    note: "Initial Payment"
                }] : []
            });

            alert("Purchase recorded successfully");
            router.push("/admin/sales");
        } catch (error) {
            console.error("Error saving purchase:", error);
            alert("Failed to record purchase. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddVendor = async (vendorData: any) => {
        try {
            const newVendorId = await UserService.createCustomer({
                ...vendorData,
                partnerType: "vendor"
            });
            const newVendor: User = {
                id: newVendorId,
                ...vendorData,
                role: 'customer',
                partnerType: 'vendor',
                isActive: true,
                createdAt: new Date()
            };
            setVendors([newVendor, ...vendors]);
            setSelectedVendor(newVendor);
            setShowAddVendor(false);
        } catch (error) {
            console.error("Error adding vendor:", error);
            alert("Failed to add vendor");
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/sales" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New Purchase</h1>
                        <p className="text-sm text-gray-500">Record a new stock purchase or supply entry</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading || items.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Recording..." : <><Save className="h-5 w-5" /> Record Purchase</>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: General Info & Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Information Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Info className="h-5 w-5 text-red-500" /> General Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" /> Purchase Date (BS)
                                </label>
                                <div className="nepali-datepicker-container">
                                    <NepaliDatePicker
                                        value={purchaseDate}
                                        onChange={(date: string) => setPurchaseDate(date)}
                                        options={{ calenderLocale: "en", valueLocale: "en" }}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <UserPlus className="h-4 w-4 text-gray-400" /> Vendor / Supplier
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                        value={selectedVendor?.id || ""}
                                        onChange={(e) => {
                                            const v = vendors.find(v => v.id === e.target.value);
                                            setSelectedVendor(v || null);
                                        }}
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowAddVendor(true)}
                                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                        title="Add New Vendor"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Entry Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Package className="h-5 w-5 text-red-500" /> Purchase Items
                            </h3>
                            {items.length > 0 && (
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    {items.length} {items.length === 1 ? 'item' : 'items'} added
                                </span>
                            )}
                        </div>

                        {/* Item Entry Form */}
                        <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Item Name (e.g. Chicken Feed, Seeds)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                                        value={entryItem.name}
                                        onChange={e => setEntryItem({ ...entryItem, name: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                                        value={entryItem.quantity}
                                        onChange={e => setEntryItem({ ...entryItem, quantity: e.target.value })}
                                    />
                                    <select
                                        className="w-24 px-2 py-2 border border-gray-200 rounded-xl outline-none bg-white text-sm"
                                        value={entryItem.unit}
                                        onChange={e => setEntryItem({ ...entryItem, unit: e.target.value as StockUnit })}
                                    >
                                        <option value="pcs">Pcs</option>
                                        <option value="kg">Kg</option>
                                        <option value="ltr">Ltr</option>
                                        <option value="crate">Crate</option>
                                        <option value="carton">Carton</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs</span>
                                    <input
                                        type="number"
                                        placeholder="Total Price"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                                        value={entryItem.totalPrice}
                                        onChange={e => setEntryItem({ ...entryItem, totalPrice: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Remarks/Description (Optional)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
                                        value={entryItem.description}
                                        onChange={e => setEntryItem({ ...entryItem, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddItem}
                                className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-[0.98]"
                            >
                                {editingIndex !== null ? <><Edit className="h-5 w-5" /> Update Item</> : <><Plus className="h-5 w-5" /> Add to List</>}
                            </button>
                        </div>

                        {/* Items List */}
                        {items.length > 0 ? (
                            <div className="overflow-hidden border border-gray-100 rounded-2xl">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase">Item</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase text-right">Qty</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase text-right">Rate</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase text-right">Total</th>
                                            <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {items.map((item, index) => (
                                            <tr key={item.productId} className="group hover:bg-red-50/30 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-gray-900">{item.productName}</div>
                                                    {item.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</div>}
                                                </td>
                                                <td className="px-4 py-4 text-right font-medium text-gray-600">
                                                    {item.quantity} <span className="text-[10px] uppercase font-bold text-gray-400">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm text-gray-500">
                                                    {item.pricePerUnit.toFixed(1)}
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-gray-900">
                                                    Rs {item.totalPrice.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditItem(index)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleRemoveItem(index)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <Package className="h-12 w-12 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No items added yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Checkout & Settings */}
                <div className="space-y-6">
                    {/* Payment Settings Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-red-500" /> Payment & Status
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                                >
                                    <option value={PaymentStatus.Pending}>Pending (Credit)</option>
                                    <option value={PaymentStatus.PaidCash}>Paid in Cash</option>
                                    <option value={PaymentStatus.PaidOnline}>Paid Online</option>
                                    <option value={PaymentStatus.PartialCash}>Partial - Cash</option>
                                    <option value={PaymentStatus.PartialOnline}>Partial - Online</option>
                                </select>
                            </div>

                            {(paymentStatus.includes('Partial') || paymentStatus.startsWith('Paid')) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex justify-between">
                                        <span>Amount Paid (Rs)</span>
                                        <button
                                            onClick={() => setPaidAmount(totalPayable.toString())}
                                            className="text-[10px] font-bold text-red-600 uppercase tracking-wider hover:underline"
                                        >
                                            Pay Full
                                        </button>
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold text-green-600"
                                        value={paidAmount}
                                        onChange={e => setPaidAmount(e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-gray-400" /> Discount Received (Rs)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-red-600 font-medium"
                                    value={discount}
                                    onChange={e => setDiscount(e.target.value)}
                                />
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchased By</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                    value={purchasedBy}
                                    onChange={(e) => setPurchasedBy(e.target.value)}
                                >
                                    {availableUsers.map(u => (
                                        <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-red-600 rounded-2xl shadow-lg p-6 text-white space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-red-100 font-medium">
                                <span>Subtotal</span>
                                <span>Rs {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-red-100 font-medium">
                                <span>Discount</span>
                                <span>- Rs {(parseFloat(discount) || 0).toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-red-500 my-4" />
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-red-100 text-xs font-bold uppercase tracking-wider mb-1">Grand Total</div>
                                    <div className="text-3xl font-black">Rs {totalPayable.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {(paymentStatus.includes('Partial')) && (
                            <div className="bg-red-700/50 rounded-xl p-3 text-sm text-red-100 border border-red-500/30">
                                <div className="flex justify-between font-bold text-white mb-1">
                                    <span>Remaining Balance</span>
                                    <span>Rs {(totalPayable - (parseFloat(paidAmount) || 0)).toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] italic">Outstanding amount will be added to vendor ledger</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vendor Modal */}
            {showAddVendor && (
                <AddPartnerModal
                    partnerType="vendor"
                    onClose={() => setShowAddVendor(false)}
                    onAdd={handleAddVendor}
                />
            )}
        </div>
    );
}
