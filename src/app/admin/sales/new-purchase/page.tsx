"use client";

import { useState, useEffect } from "react";
import { ProductService } from "@/services/product.service";
import { UserService } from "@/services/user.service";
import { TransactionService } from "@/services/transaction.service";
import { Product, StockUnit, TransactionType, PaymentStatus, OrderStatus, User, SalesItem, BusinessType } from "@/types";
import { ArrowLeft, Plus, Trash2, Save, UserPlus, Calendar, Package, Info, Edit, CreditCard, Tag, ShoppingBag, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import AddPartnerModal from "@/components/admin/AddPartnerModal";
import NepaliDate from "nepali-date-converter";
import { toNepali } from "@/lib/date-helper";
import { Toast, ToastType } from "@/components/ui/Toast";

// Dynamic import for NepaliDatePicker to avoid SSR issues
const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
});

import "nepali-datepicker-reactjs/dist/index.css";

export default function NewPurchasePage() {
    const router = useRouter();
    const [vendors, setVendors] = useState<User[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddVendor, setShowAddVendor] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type });
    };

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
        try {
            const [allVendors, allUsers] = await Promise.all([
                UserService.getAllVendors(),
                UserService.getAllUsers()
            ]);
            setVendors(allVendors);
            setAvailableUsers(allUsers);

            const adminUser = allUsers.find(u => u.role === 'admin');
            if (adminUser) setPurchasedBy(adminUser.name);
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    const handleAddItem = () => {
        if (!entryItem.name || !entryItem.quantity || !entryItem.totalPrice) {
            showToast("Please fill in all required item fields (Name, Quantity, Total Price)", "error");
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
            showToast("Please select or add a Vendor", "error");
            return;
        }
        if (items.length === 0) {
            showToast("Please add at least one item to the purchase", "error");
            return;
        }

        setLoading(true);
        try {
            const nepaliDate = new NepaliDate(purchaseDate);
            const adDate = nepaliDate.toJsDate();

            await TransactionService.createTransaction({
                billNo: "PR-" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
                type: TransactionType.Purchase,
                items: items,
                customerId: selectedVendor.id,
                partyName: selectedVendor.name,
                date: adDate,
                discount: parseFloat(discount) || 0,
                soldBy: purchasedBy,
                enteredBy: "Admin",
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

            showToast("Purchase recorded successfully");
            setTimeout(() => {
                router.push("/admin/sales");
            }, 1000);
        } catch (error) {
            console.error("Error saving purchase:", error);
            showToast("Failed to record purchase. Please try again.", "error");
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
            showToast("Vendor added successfully");
        } catch (error) {
            console.error("Error adding vendor:", error);
            showToast("Failed to add vendor", "error");
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6 pb-20 px-4">
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
                        <h1 className="text-2xl font-bold text-gray-900">New Purchase</h1>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading || items.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Processing..." : <><Save className="h-5 w-5" /> Save Purchase</>}
                </button>
            </div>

            <div className="space-y-6">
                {/* Vendor Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-red-500" /> Vendor Information
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Search className="h-4 w-4 text-gray-400" /> Select Vendor</span>
                                <button
                                    onClick={() => setShowAddVendor(true)}
                                    className="text-xs font-bold text-red-600 uppercase tracking-wider hover:underline"
                                >
                                    + Add New Vendor
                                </button>
                            </label>
                            <select
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
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
                        </div>

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
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Info className="h-4 w-4 text-gray-400" /> Purchased By
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    value={purchasedBy}
                                    onChange={(e) => setPurchasedBy(e.target.value)}
                                >
                                    {availableUsers.map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items & List Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-red-500" /> Purchase Items
                    </h3>

                    <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                        <div className="grid grid-cols-1 gap-4">
                            <input
                                type="text"
                                placeholder="Item Name (e.g. Chicken Feed, Seeds)"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                value={entryItem.name}
                                onChange={e => setEntryItem({ ...entryItem, name: e.target.value })}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                                        value={entryItem.quantity}
                                        onChange={e => setEntryItem({ ...entryItem, quantity: e.target.value })}
                                    />
                                    <select
                                        className="w-28 px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm transition-all focus:ring-2 focus:ring-red-500"
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
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs</span>
                                    <input
                                        type="number"
                                        placeholder="Total Price"
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold"
                                        value={entryItem.totalPrice}
                                        onChange={e => setEntryItem({ ...entryItem, totalPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                            <input
                                type="text"
                                placeholder="Remarks/Description (Optional)"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
                                value={entryItem.description}
                                onChange={e => setEntryItem({ ...entryItem, description: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={handleAddItem}
                            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all active:scale-[0.98] shadow-sm"
                        >
                            {editingIndex !== null ? <><Edit className="h-5 w-5" /> Update Item</> : <><Plus className="h-5 w-5" /> Add to List</>}
                        </button>
                    </div>

                    {/* Added Items List */}
                    <div className="space-y-3">
                        {items.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <Package className="h-12 w-12 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No items added to list</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.productId} className="flex flex-col p-4 border border-gray-100 rounded-2xl bg-gray-50 gap-2 group relative">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-bold text-gray-900">{item.productName}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {item.quantity} {item.unit}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="font-bold text-gray-900">Rs {item.totalPrice.toLocaleString()}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEditItem(index)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleRemoveItem(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-gray-400 italic">Note: {item.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment & Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-red-500" /> Payment & Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-gray-400" /> Payment Status
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    value={paymentStatus}
                                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                                >
                                    <option value={PaymentStatus.Pending}>Pending (Credit)</option>
                                    <option value={PaymentStatus.PaidCash}>Paid Cash</option>
                                    <option value={PaymentStatus.PaidOnline}>Paid Online</option>
                                    <option value={PaymentStatus.PartialCash}>Partial Cash</option>
                                    <option value={PaymentStatus.PartialOnline}>Partial Online</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-gray-400" /> Discount (Rs)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    value={discount}
                                    onChange={e => setDiscount(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Info className="h-4 w-4 text-gray-400" /> Paid Amount (Rs)</span>
                                    <button
                                        onClick={() => setPaidAmount(totalPayable.toString())}
                                        className="text-[10px] font-bold text-red-600 uppercase tracking-wider hover:underline"
                                    >
                                        Pay Full
                                    </button>
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold text-green-700"
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Final Totals */}
                    <div className="pt-6 border-t border-gray-100 italic">
                        <div className="flex flex-col gap-2 max-w-xs ml-auto text-right">
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>Rs {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>Discount</span>
                                <span>- Rs {(parseFloat(discount) || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                                <span className="text-gray-900 font-bold">Total Payable</span>
                                <span className="text-2xl font-black text-red-600">Rs {totalPayable.toLocaleString()}</span>
                            </div>
                            {totalPayable - (parseFloat(paidAmount) || 0) > 0 && (
                                <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">
                                    Remaining: Rs {(totalPayable - (parseFloat(paidAmount) || 0)).toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Save Button */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={loading || items.length === 0}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-12 py-4 bg-red-600 text-white rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-900/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {loading ? "Processing..." : <><Save className="h-6 w-6" /> Save Purchase</>}
                    </button>
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
        </div>
    );
}
