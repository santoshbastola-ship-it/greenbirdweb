"use client";

import { useEffect, useState, useRef } from "react";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus, TransactionType, PaymentStatus, PaymentRecord, OrderLog, Product, SalesItem, BusinessType } from "@/types";
import { Plus, X, Calendar, Clock, MapPin, User, ShoppingBag, CreditCard, Edit2, Save, RotateCcw, ChevronDown, ArrowUpRight, ArrowDownLeft, Share2, Loader2, Trash2, ExternalLink, Paperclip } from "lucide-react";
import { toNepali, formatDateTime, formatTime } from "@/lib/date-helper";
import NepaliDate from "nepali-date-converter";
import dynamic from 'next/dynamic';
import { toPng } from 'html-to-image';
import ShareableBill from "@/components/admin/ShareableBill";
import PaymentReceiptModal from "@/components/admin/PaymentReceiptModal";
import DocumentUpload from "@/components/admin/DocumentUpload";
import PaymentStatusDropdown from "@/components/admin/PaymentStatusDropdown";
import OrderStatusDropdown from "@/components/admin/OrderStatusDropdown";
import OrderPartialPaymentDialog from "@/components/admin/OrderPartialPaymentDialog";
import { useAuth } from "@/context/AuthContext";
import { ProductService } from "@/services/product.service";
import CancelOrderDialog from "@/components/admin/CancelOrderDialog";
import UserName from "@/components/ui/UserName";


const NepaliDatePicker = dynamic(() => import("nepali-datepicker-reactjs").then(mod => mod.NepaliDatePicker), {
    ssr: false,
    loading: () => <input type="text" placeholder="Loading Date..." className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
});

import "nepali-datepicker-reactjs/dist/index.css";

export default function TransactionDetailsModal({
    transaction,
    onClose,
    onUpdate,
    onDelete: parentDelete,
    setConfirmModal
}: {
    transaction: TransactionRecord;
    onClose: () => void;
    onUpdate: () => void;
    onDelete: (id: string) => Promise<void>;
    setConfirmModal: (modal: any) => void;
}) {
    // Helper to format date for picker (YYYY-MM-DD from Date or string)
    const formatDateForPicker = (d: any) => {
        try {
            if (!d) return "";
            const formatted = typeof d === 'string' ? d : new NepaliDate(new Date(d)).format("YYYY-MM-DD");
            // If it's already in nepali format (string), just return
            // Wait, if it's a string it might be "YYYY-MM-DD" nepali or ISO date string
            // Assuming simplified usage here: if string, trust it's compatible or try new NepaliDate
            return formatted;
        } catch (e) {
            console.error("Date parsing error", e);
            return "";
        }
    };

    const [isUpdating, setIsUpdating] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
    const { dbUser } = useAuth();
    const [showLogs, setShowLogs] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const billCaptureRef = useRef<HTMLDivElement>(null);
    const [receiptData, setReceiptData] = useState<{
        isOpen: boolean;
        receivedAmount: number;
    }>({ isOpen: false, receivedAmount: 0 });

    const isManager = dbUser?.role === 'manager';

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<TransactionRecord>(JSON.parse(JSON.stringify(transaction)));
    const [products, setProducts] = useState<Product[]>([]);
    const [isProductsLoading, setIsProductsLoading] = useState(false);

    const totalItemsPrice = (isEditing ? editForm.items : transaction.items).reduce((sum, item) => sum + item.totalPrice, 0);
    const finalTotal = totalItemsPrice - ((isEditing ? editForm.discount : transaction.discount) || 0) + (transaction.deliveryFee || 0);
    const remainingAmount = finalTotal - (transaction.paidAmount || 0);

    // Initialize products when entering edit mode
    useEffect(() => {
        if (isEditing && products.length === 0) {
            loadProducts();
        }
    }, [isEditing]);

    const loadProducts = async () => {
        setIsProductsLoading(true);
        try {
            const allProducts = await ProductService.getAllProducts();
            setProducts(allProducts.filter(p => p.isAvailableForSale));
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsProductsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: OrderStatus, reason?: string) => {
        if (newStatus === transaction.status) return;
        setIsUpdating(true);
        try {
            await TransactionService.updateTransactionStatus(transaction.id, newStatus, reason, dbUser?.name || "Admin");
            onUpdate();
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
        if (newStatus === transaction.paymentStatus) return;

        if (newStatus === PaymentStatus.PartialCash || newStatus === PaymentStatus.PartialOnline) {
            setShowPaymentDialog(true);
            return;
        }

        setIsUpdating(true);
        try {
            let payAmount = 0;
            let payments = transaction.payments || [];

            if (newStatus === PaymentStatus.PaidCash || newStatus === PaymentStatus.PaidOnline) {
                payAmount = finalTotal;
                const remaining = finalTotal - (transaction.paidAmount || 0);
                if (remaining > 0) {
                    payments = [...payments, {
                        amount: remaining,
                        date: new Date(),
                        note: `Full Payment - ${newStatus === PaymentStatus.PaidOnline ? "Online" : "Cash"}`
                    }];
                }
            } else if (newStatus === PaymentStatus.Pending) {
                payAmount = 0;
            }

            await TransactionService.updatePaymentStatus(transaction.id, newStatus, payAmount, payments, dbUser?.name || "Admin");

            // Show receipt modal if paid or partial
            if (newStatus === PaymentStatus.PaidCash || newStatus === PaymentStatus.PaidOnline) {
                const justPaid = payAmount - (transaction.paidAmount || 0);
                if (justPaid > 0) {
                    setReceiptData({ isOpen: true, receivedAmount: justPaid });
                }
            }
            onUpdate();
        } catch (error) {
            console.error("Error updating payment status:", error);
            alert("Failed to update payment status");
        } finally {
            setIsUpdating(false);
        }

    };

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            if (!billCaptureRef.current) {
                console.error("Capture ref is null");
                throw new Error("Shareable component not found");
            }

            const dataUrl = await toPng(billCaptureRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
            });

            if (!dataUrl) throw new Error("Failed to generate image URL");

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `Greenbird-Bill-${transaction.billNo}.png`, { type: 'image/png' });

            let shared = false;
            // @ts-ignore
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Bill #${transaction.billNo}`,
                        text: `Bill from Greenbird Homestead for ${transaction.partyName}`
                    });
                    shared = true;
                } catch (shareErr: any) {
                    console.warn("Native share failed, falling back to download:", shareErr);
                    if (shareErr.name === 'AbortError') shared = true;
                }
            }

            if (!shared) {
                const link = document.createElement('a');
                link.download = `Greenbird-Bill-${transaction.billNo}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error('Failed to share receipt:', err);
            alert("Could not share receipt. Please check your browser permissions or try downloading manually.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleDelete = async () => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Transaction",
            message: "Are you sure you want to PERMANENTLY delete this transaction? This action cannot be undone.",
            confirmText: "Yes, Delete Transaction",
            variant: "danger",
            onConfirm: async () => {
                // @ts-ignore
                setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
                onClose(); // Close the details modal first
                await parentDelete(transaction.id);
            }
        });
    };

    const handleSaveChanges = async () => {
        setConfirmModal({
            isOpen: true,
            title: "Save Changes",
            message: "Are you sure you want to save these changes?",
            confirmText: "Save Changes",
            variant: "info",
            onConfirm: async () => {
                // @ts-ignore
                setConfirmModal((prev: any) => ({ ...prev, isOpen: false }));
                await performSave();
            }
        });
    };

    const performSave = async () => {
        setIsUpdating(true);
        try {
            const changes: string[] = [];
            if (JSON.stringify(editForm.items) !== JSON.stringify(transaction.items)) {
                changes.push("Items updated");
            }
            if (editForm.partyName !== transaction.partyName) {
                changes.push(`Party Name changed to ${editForm.partyName}`);
            }
            // Helper for date comparison
            const getCompDateStr = (d: any) => {
                try {
                    return d instanceof Date ? new NepaliDate(d).format("YYYY-MM-DD") : d;
                } catch { return d; }
            };

            const originalDateStr = getCompDateStr(new Date(transaction.date));
            const newDateStr = getCompDateStr(new Date(editForm.date));
            if (originalDateStr !== newDateStr) {
                changes.push(`Date changed from ${originalDateStr} to ${newDateStr}`);
            }
            if (JSON.stringify(editForm.documentUrls) !== JSON.stringify(transaction.documentUrls)) {
                changes.push("Documents updated");
            }

            if (editForm.discount !== transaction.discount) {
                changes.push(`Discount changed from Rs ${transaction.discount || 0} to Rs ${editForm.discount || 0}`);
            }

            // Sales specific changes
            if (transaction.type === TransactionType.Sale) {
                if (editForm.deliveryAddress !== transaction.deliveryAddress) changes.push(`Items updated`); // Simplified message or detailed
                if (editForm.deliveryInstructions !== transaction.deliveryInstructions) changes.push(`Delivery Note updated`);
                // Check dates
                if (editForm.expectedDeliveryDate !== transaction.expectedDeliveryDate || editForm.expectedDeliveryTime !== transaction.expectedDeliveryTime) {
                    changes.push(`Delivery Schedule updated`);
                }
            }


            if (changes.length === 0) {
                setIsEditing(false);
                setIsUpdating(false);
                return;
            }

            const newLog: OrderLog = {
                id: Date.now().toString(),
                date: new Date(),
                action: "Transaction Edited",
                details: changes.join(", "),
                changedBy: dbUser?.name || "Admin"
            };

            await TransactionService.updateTransaction(transaction.id, {
                items: editForm.items,
                partyName: editForm.partyName,
                date: editForm.date,
                discount: editForm.discount,
                documentUrls: editForm.documentUrls,
                // Order specific fields
                deliveryAddress: editForm.deliveryAddress,
                deliveryInstructions: editForm.deliveryInstructions,
                expectedDeliveryDate: editForm.expectedDeliveryDate,
                expectedDeliveryTime: editForm.expectedDeliveryTime,
                logs: [...(transaction.logs || []), newLog],
            }, undefined, dbUser?.name || "Admin");

            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error("Failed to update transaction", error);
            alert("Failed to save changes: " + (error as Error).message);
        } finally {
            setIsUpdating(false);
        }
    };

    const updateItem = (index: number, field: keyof SalesItem, value: any) => {
        const newItems = [...editForm.items];
        newItems[index] = { ...newItems[index], [field]: value };
        const item = newItems[index];
        if (field === 'quantity' || field === 'pricePerUnit' || field === 'weight') {
            if (item.unit === item.priceUnit) {
                newItems[index].totalPrice = (item.quantity || 0) * (item.pricePerUnit || 0);
            } else {
                newItems[index].totalPrice = (item.weight || 0) * (item.pricePerUnit || 0);
            }
        }
        setEditForm({ ...editForm, items: newItems });
    };

    const removeItem = (index: number) => {
        const newItems = editForm.items.filter((_, i) => i !== index);
        setEditForm({ ...editForm, items: newItems });
    };

    const handleAddItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value;
        if (!productId) return;
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newItem: SalesItem = {
            productId: product.id,
            productName: product.name,
            businessType: product.businessType,
            quantity: 1,
            unit: product.unit,
            priceUnit: product.priceUnit,
            pricePerUnit: product.currentPrice,
            totalPrice: product.currentPrice
        };
        setEditForm({ ...editForm, items: [...editForm.items, newItem] });
        e.target.value = "";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <ShareableBill ref={billCaptureRef} transaction={transaction} />
            </div>

            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{transaction.billNo}</h3>
                            {isEditing && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">EDITING</span>}
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${transaction.type === TransactionType.Sale ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {transaction.type.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">{toNepali(transaction.date, "DD MMM YYYY")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {transaction.type === TransactionType.Sale && !isEditing && (
                            <button
                                onClick={handleShare}
                                disabled={isSharing}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                                <span className="text-sm font-medium hidden sm:inline">Share</span>
                            </button>
                        )}
                        <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Edit2 className="h-4 w-4" />
                                <span className="text-sm font-medium">Edit</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setEditForm(JSON.parse(JSON.stringify(transaction)));
                                        setIsEditing(false);
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span className="text-sm">Cancel</span>
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    <span className="text-sm font-medium">Save</span>
                                </button>
                            </div>
                        )}
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        {dbUser?.role === "admin" && !isEditing && (
                            <button
                                onClick={handleDelete}
                                disabled={isUpdating}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Transaction"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Party Info & Delivery Info */}
                        <div className="space-y-6">
                            {/* Party Info */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="h-5 w-5 text-gray-400" />
                                    <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{transaction.type === TransactionType.Sale ? 'Customer' : 'Vendor'}</h4>
                                </div>
                                <div className="space-y-1 pl-1">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.partyName}
                                            onChange={(e) => setEditForm({ ...editForm, partyName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2"
                                            placeholder="Party Name"
                                        />
                                    ) : (
                                        <p className="font-bold text-gray-900 text-lg">{transaction.partyName}</p>
                                    )}
                                    {transaction.customerPhone && <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-gray-400"></span> {transaction.customerPhone}
                                    </p>}
                                    {transaction.deliveryAddress && !isEditing && (
                                        <p className="text-sm text-gray-600 mt-2">{transaction.deliveryAddress}</p>
                                    )}
                                    {transaction.deliveryLocation && (
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${transaction.deliveryLocation.lat},${transaction.deliveryLocation.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 font-bold flex items-center gap-1.5 hover:text-blue-700 transition-colors"
                                            >
                                                <MapPin className="h-3.5 w-3.5" />
                                                View on Map
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs text-gray-400">Entered By: <UserName nameOrId={transaction.enteredBy} fallback="Admin" className="font-medium text-gray-600" /></p>
                                        <p className="text-xs text-gray-400">On: {transaction.entryTimestamp ? formatDateTime(transaction.entryTimestamp) : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Details Block - Only for Sales */}
                            {transaction.type === TransactionType.Sale && (
                                <div className={`rounded-xl p-5 border transition-colors ${isEditing ? 'bg-white border-blue-200 shadow-sm' : 'bg-blue-50/50 border-blue-100'}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <MapPin className={`h-5 w-5 ${isEditing ? 'text-blue-600' : 'text-blue-500'}`} />
                                        <h4 className={`text-sm font-bold uppercase tracking-wide ${isEditing ? 'text-blue-700' : 'text-blue-600'}`}>Delivery Details</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-0.5">Address</label>
                                            {isEditing ? (
                                                <textarea
                                                    value={editForm.deliveryAddress || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                                                    rows={2}
                                                    placeholder="Enter delivery address..."
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-gray-900 leading-relaxed bg-white/50 p-3 rounded-lg border border-transparent">
                                                    {transaction.deliveryAddress || <span className="text-gray-400 italic font-normal">No address provided</span>}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-0.5">Scheduled Date</label>
                                                {isEditing ? (
                                                    <div className="nepali-datepicker-container">
                                                        <NepaliDatePicker
                                                            value={typeof editForm.expectedDeliveryDate === 'string' ? editForm.expectedDeliveryDate : ''}
                                                            onChange={(date: string) => setEditForm({ ...editForm, expectedDeliveryDate: date })}
                                                            options={{ calenderLocale: "en", valueLocale: "en" }}
                                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm text-gray-900 bg-white/50 p-2.5 rounded-lg">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span>
                                                            {typeof transaction.expectedDeliveryDate === 'string'
                                                                ? transaction.expectedDeliveryDate
                                                                : transaction.expectedDeliveryDate instanceof Date
                                                                    ? toNepali(transaction.expectedDeliveryDate, "DD MMM YYYY")
                                                                    : "N/A"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {(transaction.expectedDeliveryTime || isEditing) && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-0.5">Time</label>
                                                    {isEditing ? (
                                                        <input
                                                            type="time"
                                                            value={editForm.expectedDeliveryTime || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, expectedDeliveryTime: e.target.value })}
                                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-sm text-gray-900 bg-white/50 p-2.5 rounded-lg">
                                                            <Clock className="h-4 w-4 text-gray-400" />
                                                            <span>{formatTime(transaction.expectedDeliveryTime)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-0.5">Delivery Note</label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.deliveryInstructions || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, deliveryInstructions: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
                                                    placeholder="Specific instructions..."
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-600 italic bg-white/50 p-3 rounded-lg">"{transaction.deliveryInstructions || 'None'}"</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Order Date & Status Info */}
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 h-fit">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Order Date</h4>
                                {isEditing ? (
                                    <div className="relative">
                                        <NepaliDatePicker
                                            inputClassName="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
                                            value={formatDateForPicker(editForm.date)}
                                            onChange={(value: string) => {
                                                const jsDate = new NepaliDate(value).toJsDate();
                                                setEditForm({ ...editForm, date: jsDate });
                                            }}
                                            options={{ calenderLocale: "en", valueLocale: "en" }}
                                        />
                                    </div>
                                ) : (
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {toNepali(transaction.date, "DD MMM YYYY")}
                                    </p>
                                )}
                            </div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Status & Payment</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Payment Status</label>
                                    <PaymentStatusDropdown
                                        currentStatus={transaction.paymentStatus || PaymentStatus.Pending}
                                        onChange={handlePaymentStatusChange}
                                        isUpdating={isUpdating}
                                        color={
                                            (transaction.paymentStatus === PaymentStatus.PaidCash || transaction.paymentStatus === PaymentStatus.PaidOnline) ? "green" :
                                                (transaction.paymentStatus === PaymentStatus.PartialCash || transaction.paymentStatus === PaymentStatus.PartialOnline) ? "orange" : "red"
                                        }
                                    />
                                </div>
                                {transaction.type === TransactionType.Sale && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Delivery Status</label>
                                        <OrderStatusDropdown
                                            currentStatus={transaction.status}
                                            onStatusChange={handleStatusChange}
                                            isUpdating={isUpdating}
                                            onCancelClick={() => setShowCancelDialog(true)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-gray-400" />
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Items</h4>
                            </div>
                            {isEditing && (
                                <div className="relative">
                                    <div className={`flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 ${isProductsLoading ? 'opacity-70 cursor-wait' : 'hover:bg-green-100 cursor-pointer'} text-green-700 transition-colors relative`}>
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        <span className="text-xs font-bold whitespace-nowrap">
                                            {isProductsLoading ? "Loading..." : "Add Item"}
                                        </span>
                                        {!isProductsLoading && (
                                            <select
                                                onChange={handleAddItem}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                disabled={isProductsLoading}
                                            >
                                                <option value="">Select product...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} (Rs {p.currentPrice})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Desktop Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50/50 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <div className="col-span-6">Item</div>
                                <div className="col-span-3 text-center">Qty / Price</div>
                                <div className="col-span-3 text-right">Total</div>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {isEditing ? (
                                    editForm.items.map((item, idx) => (
                                        <div key={idx} className="p-4 md:px-6 md:py-5 transition-colors hover:bg-gray-50/30">
                                            <div className="flex flex-col gap-4">
                                                {/* Item Header */}
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={item.productName}
                                                            onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                                                            className="w-full font-bold text-gray-900 text-sm block border-b border-dashed border-gray-300 focus:border-blue-500 outline-none bg-transparent hover:border-gray-400 transition-colors"
                                                            placeholder="Item Name"
                                                        />
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Rate: Rs {item.pricePerUnit} per {item.priceUnit}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* Inputs */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="flex-1 min-w-[120px]">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qty ({item.unit})</label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                            placeholder="Quantity"
                                                        />
                                                    </div>

                                                    {item.unit !== item.priceUnit && (
                                                        <div className="flex-1 min-w-[120px]">
                                                            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">{item.priceUnit} (Weight)</label>
                                                            <input
                                                                type="number"
                                                                value={item.weight || 0}
                                                                onChange={(e) => updateItem(idx, 'weight', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all text-blue-700"
                                                                placeholder="Weight"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-[120px]">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Price / {item.priceUnit}</label>
                                                        <input
                                                            type="number"
                                                            value={item.pricePerUnit}
                                                            onChange={(e) => updateItem(idx, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                            placeholder="Price"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-[100px] text-right ml-auto">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Total</label>
                                                        <span className="font-black text-gray-900">Rs {item.totalPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    transaction.items.map((item, idx) => (
                                        <div key={idx} className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-center hover:bg-gray-50/50 transition-colors">
                                            <div className="w-full md:col-span-6 font-medium text-gray-700 flex justify-between md:block">
                                                <span>{item.productName}</span>
                                                <span className="md:hidden text-gray-900 font-semibold">Rs. {item.totalPrice.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full md:col-span-3 text-sm text-gray-500 text-left md:text-center flex justify-between md:block">
                                                <span className="md:hidden text-xs uppercase font-medium text-gray-400">Rate</span>
                                                <span>
                                                    {item.weight ? `${item.weight} ${item.priceUnit}` : `${item.quantity} ${item.unit}`} x Rs. {item.pricePerUnit}/{item.priceUnit}
                                                </span>
                                            </div>
                                            <div className="hidden md:block col-span-3 text-right font-semibold text-gray-900">
                                                Rs. {item.totalPrice.toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="bg-gray-50 border-t border-gray-200 p-4 md:px-8">
                                <div className="flex flex-col gap-2 max-w-xs ml-auto">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">Rs. {totalItemsPrice.toLocaleString()}</span>
                                    </div>
                                    {isEditing ? (
                                        <div className="flex justify-between items-center text-sm text-red-600">
                                            <span>Discount</span>
                                            <input
                                                type="number"
                                                value={editForm.discount || ""}
                                                onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })}
                                                onFocus={(e) => e.target.select()}
                                                className="w-24 px-2 py-1 border border-red-200 rounded text-right font-bold focus:ring-1 focus:ring-red-500 outline-none"
                                            />
                                        </div>
                                    ) : (
                                        transaction.discount > 0 && (
                                            <div className="flex justify-between text-sm text-red-600">
                                                <span>Discount</span>
                                                <span>- Rs. {transaction.discount.toLocaleString()}</span>
                                            </div>
                                        )
                                    )}
                                    {transaction.deliveryFee && transaction.deliveryFee > 0 && (
                                        <div className="flex justify-between text-sm text-blue-600">
                                            <span>Delivery Fee</span>
                                            <span>+ Rs. {transaction.deliveryFee.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                                        <span>Total</span>
                                        <span className={transaction.type === TransactionType.Sale ? "text-green-700" : "text-red-700"}>Rs. {finalTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 pt-1">
                                        <span>Paid</span>
                                        <span className="font-medium text-gray-900">Rs. {transaction.paidAmount?.toLocaleString() || "0"}</span>
                                    </div>
                                    {remainingAmount > 0 && (
                                        <div className="flex justify-between text-sm font-bold text-orange-600 pt-1 border-t border-dashed border-gray-200">
                                            <span>Remaining</span>
                                            <span>Rs. {remainingAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {transaction.payments && transaction.payments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment History</h4>
                            <div className="space-y-2">
                                {transaction.payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                <CreditCard className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Rs. {p.amount.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">
                                                    {toNepali(p.date, "DD MMM YYYY")}
                                                    {p.enteredBy && <span className="hidden sm:inline"> • <UserName nameOrId={p.enteredBy} /></span>}
                                                </p>
                                            </div>
                                        </div>
                                        {p.note && <span className="text-xs text-gray-400 italic max-w-[150px] truncate">"{p.note}"</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Documents Section */}
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Paperclip className="h-5 w-5 text-gray-400" />
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Documents & Bills</h4>
                        </div>
                        {isEditing ? (
                            <DocumentUpload
                                documentUrls={editForm.documentUrls || []}
                                onChange={(urls) => setEditForm({ ...editForm, documentUrls: urls })}
                                folder={transaction.type === TransactionType.Sale ? "sales-bills" : "purchase-bills"}
                            />
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {transaction.documentUrls && transaction.documentUrls.length > 0 ? (
                                    transaction.documentUrls.map((url, idx) => (
                                        <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 hover:border-green-200 transition-all shadow-sm"
                                        >
                                            <img
                                                src={url}
                                                alt={`Document ${idx + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ExternalLink className="h-6 w-6 text-white" />
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <Paperclip className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-400">No documents attached</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* History Logs */}
                    {transaction.logs && transaction.logs.length > 0 && (
                        <div className="border-t border-gray-100 pt-4">
                            <button
                                onClick={() => setShowLogs(!showLogs)}
                                className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <span>History Logs ({transaction.logs.length})</span>
                                <ChevronDown className={`h-3 w-3 transition-transform ${showLogs ? 'rotate-180' : ''}`} />
                            </button>
                            {showLogs && (
                                <div className="space-y-2 mt-3 pl-1">
                                    {transaction.logs.slice().reverse().map((log) => (
                                        <div key={log.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                            <div className="flex justify-between items-start mb-1 gap-4">
                                                <span className="text-xs font-bold text-gray-700">{log.action}</span>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {formatDateTime(log.date, "DD MMM YYYY")}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 bg-white/50 p-2 rounded border border-gray-100 mt-1">
                                                {log.details}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">by <UserName nameOrId={log.changedBy} /></p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Payment Section */}
                    {!isEditing && remainingAmount > 0 && (
                        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="h-5 w-5 text-green-700" />
                                <h4 className="text-sm font-bold text-green-800">Add Payment</h4>
                            </div>
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex items-center gap-4 bg-white/60 p-2 rounded-lg border border-green-100 self-start">
                                    <label className="flex items-center gap-1 cursor-pointer px-2">
                                        <input type="radio" checked={paymentMethod === 'Cash'} onChange={() => setPaymentMethod('Cash')} className="text-green-600" />
                                        <span className="text-sm font-medium">Cash</span>
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer px-2">
                                        <input type="radio" checked={paymentMethod === 'Online'} onChange={() => setPaymentMethod('Online')} className="text-green-600" />
                                        <span className="text-sm font-medium">Online</span>
                                    </label>
                                </div>

                                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        id="payAmountInput"
                                        className="w-full sm:w-32 px-3 py-2 border border-green-200 rounded-lg text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Note"
                                        id="payNoteInput"
                                        className="flex-1 px-3 py-2 border border-green-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={async () => {
                                            const amountInput = document.getElementById('payAmountInput') as HTMLInputElement;
                                            const noteInput = document.getElementById('payNoteInput') as HTMLInputElement;
                                            const amount = parseFloat(amountInput.value);

                                            if (isNaN(amount) || amount <= 0) {
                                                alert("Invalid amount");
                                                return;
                                            }

                                            const newPaidAmount = (transaction.paidAmount || 0) + amount;
                                            const newPayments = [...(transaction.payments || []), {
                                                amount,
                                                date: new Date(),
                                                note: noteInput.value || `${paymentMethod} Payment`,
                                                enteredBy: dbUser?.name || "Admin"
                                            }];

                                            let newStatus = transaction.paymentStatus;
                                            if (newPaidAmount >= finalTotal) {
                                                newStatus = paymentMethod === 'Online' ? PaymentStatus.PaidOnline : PaymentStatus.PaidCash;
                                            } else {
                                                newStatus = paymentMethod === 'Online' ? PaymentStatus.PartialOnline : PaymentStatus.PartialCash;
                                            }

                                            try {
                                                await TransactionService.updatePaymentStatus(transaction.id, newStatus, newPaidAmount, newPayments);
                                                onUpdate();
                                                amountInput.value = "";
                                            } catch (error) {
                                                alert("Failed to save payment");
                                            }

                                            setReceiptData({ isOpen: true, receivedAmount: amount });
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm text-sm"
                                    >
                                        Record Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCancelDialog && (
                <CancelOrderDialog
                    transaction={transaction}
                    onClose={() => setShowCancelDialog(false)}
                    onConfirm={(reason) => {
                        handleStatusChange(OrderStatus.Cancelled, reason);
                        setShowCancelDialog(false);
                    }}
                />
            )}
            {showPaymentDialog && (
                <OrderPartialPaymentDialog
                    order={transaction}
                    onClose={() => setShowPaymentDialog(false)}
                    onSuccess={(amount) => {
                        onUpdate();
                        if (amount && amount > 0) {
                            setReceiptData({ isOpen: true, receivedAmount: amount });
                        }
                    }}
                />
            )}

            <PaymentReceiptModal
                isOpen={receiptData.isOpen}
                onClose={() => setReceiptData({ ...receiptData, isOpen: false })}
                order={transaction}
                receivedAmount={receiptData.receivedAmount}
            />
        </div>
    );
}
