import { TransactionRecord } from "@/types";
import { toNepali } from "@/lib/date-helper";
import { forwardRef } from "react";

interface ShareableBillProps {
    transaction: TransactionRecord;
}

const ShareableBill = forwardRef<HTMLDivElement, ShareableBillProps>(({ transaction }, ref) => {
    const totalAmount = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0) - (transaction.discount || 0);
    const paidAmount = transaction.paidAmount || 0;
    const remaining = totalAmount - paidAmount;

    return (
        <div
            ref={ref}
            className="w-[500px] min-h-[600px] bg-white p-8 text-gray-900 font-sans flex flex-col relative"
            style={{
                // Ensure high resolution for the image
                transform: 'scale(1)',
                transformOrigin: 'top left'
            }}
        >
            {/* Header / Logo */}
            <div className="flex flex-col items-center justify-center mb-6 border-b border-gray-100 pb-6">
                <div className="w-24 h-24 relative mb-2">
                    {/* Using standard img for reliable html-to-image capturing vs Next.js Image */}
                    <img
                        src="/images/logo.png"
                        alt="Greenbird Homestead"
                        className="w-full h-full object-contain"
                    />
                </div>
                <h1 className="text-2xl font-bold text-green-800">Greenbird Homestead</h1>
                <p className="text-sm text-gray-500">Naturally Grown, Freshly Delivered</p>
                <div className="flex flex-col items-center gap-1 mt-2 text-xs text-gray-500">
                    <span>📞 +977 9849850000</span>
                    <span>📍 Besi Gaun, Duwakot, Bhaktapur</span>
                </div>
            </div>

            {/* Bill Details */}
            <div className="flex justify-between items-start mb-6 text-sm">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Receipt</h3>
                    <p className="text-gray-500">Bill No: <span className="text-gray-900 font-medium">#{transaction.billNo}</span></p>
                    <p className="text-gray-500">Date: <span className="text-gray-900 font-medium">{toNepali(transaction.date, "DD MMM YYYY")}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500">Billed To:</p>
                    <p className="font-bold text-gray-900 text-lg">{transaction.partyName}</p>
                    {transaction.customerPhone && <p className="text-gray-600">{transaction.customerPhone}</p>}
                </div>
            </div>

            {/* Items Table */}
            <div className="flex-grow">
                <table className="w-full text-sm mb-6">
                    <thead>
                        <tr className="bg-green-50 text-green-800 border-b border-green-100">
                            <th className="text-left py-2 px-3 rounded-l-lg">Item</th>
                            <th className="text-center py-2 px-3">Qty</th>
                            <th className="text-right py-2 px-3">Price</th>
                            <th className="text-right py-2 px-3 rounded-r-lg">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dashed divide-gray-200">
                        {transaction.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-2 px-3 text-gray-800 font-medium">{item.productName}</td>
                                <td className="py-2 px-3 text-center text-gray-600">{item.quantity} {item.unit}</td>
                                <td className="py-2 px-3 text-right text-gray-600">Rs. {item.pricePerUnit.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right text-gray-900 font-medium">Rs. {item.totalPrice.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rs. {(totalAmount + (transaction.discount || 0)).toLocaleString()}</span>
                </div>
                {transaction.discount > 0 && (
                    <div className="flex justify-between mb-2 text-green-600">
                        <span>Discount</span>
                        <span>- Rs. {transaction.discount.toLocaleString()}</span>
                    </div>
                )}
                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-lg">Total Amount</span>
                    <span className="font-bold text-gray-900 text-xl">Rs. {totalAmount.toLocaleString()}</span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 border-dashed">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Paid Amount</span>
                        <span className="font-medium text-green-700">Rs. {paidAmount.toLocaleString()}</span>
                    </div>
                    {remaining > 0 && (
                        <div className="flex justify-between bg-orange-50 p-2 rounded mt-2 border border-orange-100">
                            <span className="text-orange-800 font-medium">Due Balance</span>
                            <span className="text-orange-800 font-bold">Rs. {remaining.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${paidAmount >= totalAmount ? 'bg-green-100 text-green-800 border-green-200' :
                        remaining > 0 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-red-100 text-red-800 border-red-200'
                        }`}>
                        {transaction.paymentStatus}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-auto">
                <p className="text-green-800 font-handwriting text-lg italic font-medium mb-1">Thank you for your business!</p>
                <p className="text-gray-400 text-xs">Generated from Greenbird Homestead App</p>
                <p className="text-gray-400 text-[10px] mt-2">{new Date().toLocaleString()}</p>
            </div>
        </div>
    );
});

ShareableBill.displayName = "ShareableBill";

export default ShareableBill;
