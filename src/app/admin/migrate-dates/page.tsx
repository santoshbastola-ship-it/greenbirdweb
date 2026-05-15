"use client";

import { useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface TransactionAudit {
    id: string;
    billNo: string;
    partyName: string;
    rawDate: any;
    rawEntryTimestamp: any;
    isDateCorrupted: boolean;
    fixedDate: string;
}

function isDateCorrupted(d: any): boolean {
    if (!d) return true;
    if (typeof d.toDate === "function") return false; // Firestore Timestamp – valid
    if (typeof d === "string" && !isNaN(new Date(d).getTime())) return false; // valid ISO string
    if (d instanceof Date && !isNaN(d.getTime())) return false; // valid Date
    // Corrupted: empty object {}, invalid string, number NaN, etc.
    return true;
}

function resolveDate(rawDate: any, rawEntry: any): Date {
    // Try the stored date first
    if (!isDateCorrupted(rawDate)) {
        if (typeof rawDate.toDate === "function") return rawDate.toDate();
        return new Date(rawDate);
    }
    // Fall back to entryTimestamp
    if (!isDateCorrupted(rawEntry)) {
        if (typeof rawEntry.toDate === "function") return rawEntry.toDate();
        return new Date(rawEntry);
    }
    return new Date(); // absolute last resort
}

export default function MigrateDatesPage() {
    const { dbUser } = useAuth();
    const router = useRouter();
    const [audits, setAudits] = useState<TransactionAudit[]>([]);
    const [loading, setLoading] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [done, setDone] = useState(false);
    const [progress, setProgress] = useState({ fixed: 0, total: 0 });

    if (dbUser?.role !== "admin") {
        return (
            <div className="p-8 text-center text-red-600 font-bold">
                Access Denied – Admin only.
            </div>
        );
    }

    const handleScan = async () => {
        setLoading(true);
        setAudits([]);
        setDone(false);
        try {
            const snap = await getDocs(collection(db, "transactions"));
            const results: TransactionAudit[] = [];

            snap.forEach((d) => {
                const data = d.data();
                const corrupted = isDateCorrupted(data.date);
                if (corrupted) {
                    const fixed = resolveDate(data.date, data.entryTimestamp);
                    results.push({
                        id: d.id,
                        billNo: data.billNo || d.id,
                        partyName: data.partyName || "Unknown",
                        rawDate: data.date,
                        rawEntryTimestamp: data.entryTimestamp,
                        isDateCorrupted: true,
                        fixedDate: fixed.toISOString(),
                    });
                }
            });

            setAudits(results);
        } catch (err) {
            console.error(err);
            alert("Error scanning transactions. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const handleMigrate = async () => {
        if (audits.length === 0) return;
        setMigrating(true);
        setProgress({ fixed: 0, total: audits.length });

        let fixed = 0;
        for (const audit of audits) {
            try {
                await updateDoc(doc(db, "transactions", audit.id), {
                    date: audit.fixedDate,
                });
                fixed++;
                setProgress({ fixed, total: audits.length });
            } catch (err) {
                console.error(`Failed to fix ${audit.id}:`, err);
            }
        }

        setMigrating(false);
        setDone(true);
        alert(`Migration complete! Fixed ${fixed} / ${audits.length} transactions.`);
    };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🔧 Fix Transaction Dates</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Scans all transactions for corrupted date fields and restores them using{" "}
                        <code className="bg-gray-100 px-1 rounded">entryTimestamp</code> as a fallback.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/admin/sales")}
                    className="text-sm text-gray-500 hover:underline"
                >
                    ← Back to Sales
                </button>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={handleScan}
                    disabled={loading || migrating}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                    {loading ? "Scanning..." : "1. Scan for Corrupted Dates"}
                </button>

                {audits.length > 0 && !done && (
                    <button
                        onClick={handleMigrate}
                        disabled={migrating}
                        className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
                    >
                        {migrating
                            ? `Fixing... ${progress.fixed}/${progress.total}`
                            : `2. Fix All ${audits.length} Transactions`}
                    </button>
                )}

                {done && (
                    <span className="px-6 py-2.5 bg-green-100 text-green-700 rounded-xl font-semibold">
                        ✅ Migration Complete!
                    </span>
                )}
            </div>

            {audits.length === 0 && !loading && (
                <div className="text-gray-500 italic text-sm">
                    {done
                        ? "All dates are now fixed."
                        : "Click 'Scan' to find transactions with corrupted dates."}
                </div>
            )}

            {audits.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                        <p className="text-sm font-semibold text-amber-800">
                            Found {audits.length} transactions with corrupted dates. The table below shows
                            what date will be assigned (from <code>entryTimestamp</code>).
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Bill No</th>
                                    <th className="px-4 py-3 text-left">Party</th>
                                    <th className="px-4 py-3 text-left">Stored Date (raw)</th>
                                    <th className="px-4 py-3 text-left">Will be fixed to</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {audits.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono font-bold text-gray-700">{a.billNo}</td>
                                        <td className="px-4 py-3 text-gray-600">{a.partyName}</td>
                                        <td className="px-4 py-3 text-red-600 font-mono">
                                            {JSON.stringify(a.rawDate)}
                                        </td>
                                        <td className="px-4 py-3 text-green-700 font-mono">{a.fixedDate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
