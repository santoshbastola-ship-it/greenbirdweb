import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TransactionRecord, TransactionType, OrderStatus, PaymentStatus, PaymentRecord } from "@/types";

const COLLECTION_NAME = "transactions";

export const TransactionService = {
    // Create a new transaction (Sale or Purchase)
    createTransaction: async (transaction: Omit<TransactionRecord, "id">): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...transaction,
                entryTimestamp: new Date().toISOString(), // Ensure serializable date
                date: new Date(transaction.date).toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating transaction:", error);
            throw error;
        }
    },

    // Get all transactions
    getAllTransactions: async (): Promise<TransactionRecord[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("entryTimestamp", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: new Date(doc.data().date), // Convert back to Date object
                entryTimestamp: new Date(doc.data().entryTimestamp)
            } as TransactionRecord));
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
    },

    // Get transactions by Customer ID
    getTransactionsByCustomerId: async (customerId: string): Promise<TransactionRecord[]> => {
        try {
            // Simplified query to avoid composite index requirement
            const q = query(
                collection(db, COLLECTION_NAME),
                where("customerId", "==", customerId)
            );

            const querySnapshot = await getDocs(q);

            // Filter and sort in memory
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: new Date(doc.data().date),
                    entryTimestamp: new Date(doc.data().entryTimestamp)
                } as TransactionRecord))
                .filter(record => record.type === TransactionType.Sale)
                .sort((a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime());
        } catch (error) {
            console.error("Error fetching customer transactions:", error);
            return [];
        }
    },

    // Get transactions by Partner ID (for transaction history)
    getTransactionsByPartnerId: async (partnerId: string, type?: TransactionType): Promise<TransactionRecord[]> => {
        try {
            let q;
            if (type) {
                q = query(
                    collection(db, COLLECTION_NAME),
                    where("customerId", "==", partnerId),
                    where("type", "==", type),
                    orderBy("entryTimestamp", "desc")
                );
            } else {
                q = query(
                    collection(db, COLLECTION_NAME),
                    where("customerId", "==", partnerId),
                    orderBy("entryTimestamp", "desc")
                );
            }
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: new Date(doc.data().date),
                entryTimestamp: new Date(doc.data().entryTimestamp)
            } as TransactionRecord));
        } catch (error) {
            console.error("Error fetching partner transactions by ID:", error);
            return [];
        }
    },

    // Get transactions by Partner Name (for backward compatibility)
    getTransactionsByPartnerName: async (partnerName: string, type?: TransactionType): Promise<TransactionRecord[]> => {
        try {
            let q;
            if (type) {
                q = query(
                    collection(db, COLLECTION_NAME),
                    where("partyName", "==", partnerName),
                    where("type", "==", type),
                    orderBy("entryTimestamp", "desc")
                );
            } else {
                q = query(
                    collection(db, COLLECTION_NAME),
                    where("partyName", "==", partnerName),
                    orderBy("entryTimestamp", "desc")
                );
            }
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: new Date(doc.data().date),
                entryTimestamp: new Date(doc.data().entryTimestamp)
            } as TransactionRecord));
        } catch (error) {
            console.error("Error fetching partner transactions by name:", error);
            return [];
        }
    },

    // Update Transaction Status (e.g. for Admin to change Order Status)
    updateTransactionStatus: async (id: string, status: OrderStatus, reason?: string): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const updateData: any = { status };

            // If cancelling, add the reason
            if (status === OrderStatus.Cancelled && reason) {
                updateData.cancellationReason = reason;
            }

            await updateDoc(docRef, updateData);
        } catch (error) {
            console.error("Error updating transaction status:", error);
        }
    },
    // Update Payment Status and Amount
    updatePaymentStatus: async (id: string, paymentStatus: PaymentStatus, paidAmount: number, payments: PaymentRecord[]): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                paymentStatus,
                paidAmount,
                payments
            });
        } catch (error) {
            console.error("Error updating payment status:", error);
            throw error;
        }
    }
};
