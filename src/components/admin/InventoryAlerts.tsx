import { Package, AlertTriangle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { InventoryAlert } from "@/lib/dashboard-utils";

interface InventoryAlertsProps {
    alerts: InventoryAlert[];
    loading?: boolean;
}

export default function InventoryAlerts({ alerts, loading = false }: InventoryAlertsProps) {
    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Inventory Alerts</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Inventory Alerts</h3>
                </div>
                <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-gray-500">All inventory levels are healthy</p>
                </div>
            </div>
        );
    }

    const getAlertColor = (level: string) => {
        switch (level) {
            case 'critical':
                return 'bg-red-50 border-red-200 text-red-700';
            case 'low':
                return 'bg-orange-50 border-orange-200 text-orange-700';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-700';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    const getAlertIcon = (level: string) => {
        switch (level) {
            case 'critical':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'low':
                return <AlertTriangle className="h-5 w-5 text-orange-500" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default:
                return <Package className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    <h3 className="font-bold text-gray-900">Inventory Alerts</h3>
                </div>
                <Link href="/admin/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All
                </Link>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.slice(0, 10).map((alert, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-lg border transition-all ${getAlertColor(alert.alertLevel)}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getAlertIcon(alert.alertLevel)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{alert.productName}</p>
                                    <p className="text-xs mt-1">
                                        Current: <span className="font-semibold">{alert.currentStock}</span> units
                                    </p>
                                    {alert.suggestedRestock > 0 && (
                                        <p className="text-xs mt-0.5 opacity-75">
                                            Restock: +{alert.suggestedRestock} units
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Link
                                href={`/admin/stock-update`}
                                className="flex-shrink-0 px-3 py-1 bg-white rounded-md text-xs font-medium hover:bg-opacity-80 transition-colors"
                            >
                                Restock
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
