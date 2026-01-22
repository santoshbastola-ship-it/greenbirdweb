"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TransactionService } from "@/services/transaction.service";
import { TransactionRecord, OrderStatus } from "@/types";
import { useRouter } from "next/navigation";
import { Package, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";


export default function MyOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<TransactionRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/orders");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (user) {
                setLoading(true);
                try {
                    const data = await TransactionService.getTransactionsByCustomerId(user.uid);
                    setOrders(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    if (loading || authLoading) return <div className="min-h-screen pt-20 text-center">Loading orders...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet.</p>
                        <Link href="/shop" className="bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition-colors">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-green-200 transition-colors">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                                        <div className="flex items-start md:items-center space-x-4 mb-4 md:mb-0">
                                            <div className="bg-green-50 p-3 rounded-lg">
                                                <Package className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">Order #{order.billNo}</h3>
                                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <StatusBadge status={order.status} />
                                            <span className="font-bold text-lg text-gray-900">Rs. {getGrandTotal(order)}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Items</h4>
                                        <div className="space-y-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-900 mr-2">{item.productName}</span>
                                                        <span className="text-gray-500">
                                                            ({item.quantity} {item.unit} x {item.pricePerUnit})
                                                        </span>
                                                    </div>
                                                    <span className="font-medium text-gray-900">
                                                        Rs. {(item.quantity * item.pricePerUnit).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {order.enteredBy === 'admin' ?
                                        <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400 italic">
                                            Placed via Store
                                        </div>
                                        : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: OrderStatus }) {
    const colors = {
        [OrderStatus.Open]: "bg-blue-100 text-blue-800",
        [OrderStatus.Accepted]: "bg-yellow-100 text-yellow-800",
        [OrderStatus.Delivered]: "bg-green-100 text-green-800",
        [OrderStatus.Cancelled]: "bg-red-100 text-red-800",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colors[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    );
}

function getGrandTotal(order: TransactionRecord) {
    return order.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0) - (order.discount || 0);
}
