import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    QuerySnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EnergyBill, EnergyType, PaymentStatus } from '@/types';

const COLLECTION_NAME = 'energy_bills';

// Helper to convert Firestore data to EnergyBill
const convertToEnergyBill = (id: string, data: DocumentData): EnergyBill => {
    return {
        id,
        type: data.type as EnergyType,
        month: data.month || '',
        year: data.year || new Date().getFullYear() + 57,
        amount: data.amount || 0,
        paymentStatus: data.paymentStatus as PaymentStatus || PaymentStatus.Pending,
        paidAmount: data.paidAmount || 0,
        meterReadingDate: data.meterReadingDate?.toDate(),
        dueDate: data.dueDate?.toDate(),
        purchaseDate: data.purchaseDate?.toDate(),
        remarks: data.remarks,
        enteredBy: data.enteredBy || '',
        entryDate: data.entryDate?.toDate() || new Date(),
    };
};

// Helper to convert EnergyBill to Firestore data
const convertToFirestoreData = (bill: Partial<EnergyBill>) => {
    const data: any = {
        type: bill.type,
        month: bill.month,
        year: bill.year,
        amount: bill.amount,
        paymentStatus: bill.paymentStatus,
        paidAmount: bill.paidAmount || 0,
        remarks: bill.remarks || null,
        enteredBy: bill.enteredBy,
    };

    if (bill.meterReadingDate) {
        data.meterReadingDate = Timestamp.fromDate(bill.meterReadingDate);
    }
    if (bill.dueDate) {
        data.dueDate = Timestamp.fromDate(bill.dueDate);
    }
    if (bill.purchaseDate) {
        data.purchaseDate = Timestamp.fromDate(bill.purchaseDate);
    }
    if (bill.entryDate) {
        data.entryDate = Timestamp.fromDate(bill.entryDate);
    }

    return data;
};

/**
 * Subscribe to real-time energy bills updates
 */
export const subscribeToEnergyBills = (
    callback: (bills: EnergyBill[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('entryDate', 'desc')
    );

    return onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
            const bills: EnergyBill[] = [];
            snapshot.forEach((doc) => {
                try {
                    bills.push(convertToEnergyBill(doc.id, doc.data()));
                } catch (error) {
                    console.error(`Error parsing bill ${doc.id}:`, error);
                }
            });
            callback(bills);
        },
        (error) => {
            console.error('Error fetching energy bills:', error);
            if (onError) onError(error);
        }
    );
};

/**
 * Add a new energy bill
 */
export const addEnergyBill = async (bill: Omit<EnergyBill, 'id'>): Promise<string> => {
    try {
        const data = convertToFirestoreData({
            ...bill,
            entryDate: bill.entryDate || new Date(),
        });

        const docRef = await addDoc(collection(db, COLLECTION_NAME), data);
        return docRef.id;
    } catch (error) {
        console.error('Error adding energy bill:', error);
        throw error;
    }
};

/**
 * Update an existing energy bill
 */
export const updateEnergyBill = async (
    id: string,
    updates: Partial<EnergyBill>
): Promise<void> => {
    try {
        const data = convertToFirestoreData(updates);
        const billRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(billRef, data);
    } catch (error) {
        console.error('Error updating energy bill:', error);
        throw error;
    }
};

/**
 * Delete an energy bill
 */
export const deleteEnergyBill = async (id: string): Promise<void> => {
    try {
        const billRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(billRef);
    } catch (error) {
        console.error('Error deleting energy bill:', error);
        throw error;
    }
};

/**
 * Update payment status of a bill
 */
export const updatePaymentStatus = async (
    id: string,
    paymentStatus: PaymentStatus,
    paidAmount?: number
): Promise<void> => {
    try {
        const billRef = doc(db, COLLECTION_NAME, id);
        const updates: any = { paymentStatus };

        if (paidAmount !== undefined) {
            updates.paidAmount = paidAmount;
        }

        await updateDoc(billRef, updates);
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

/**
 * Get display name for energy type
 */
export const getEnergyTypeDisplayName = (type: EnergyType): string => {
    switch (type) {
        case EnergyType.Electricity:
            return 'Electricity';
        case EnergyType.Water:
            return 'Water';
        case EnergyType.Gas:
            return 'Gas';
        case EnergyType.Food:
            return 'Food Bill';
        default:
            return type;
    }
};

/**
 * Get payment status display name
 */
export const getPaymentStatusDisplayName = (status: PaymentStatus): string => {
    switch (status) {
        case PaymentStatus.Pending:
            return 'Pending';
        case PaymentStatus.PaidCash:
            return 'Paid - Cash';
        case PaymentStatus.PaidOnline:
            return 'Paid - Online';
        case PaymentStatus.PartialCash:
            return 'Partial - Cash';
        case PaymentStatus.PartialOnline:
            return 'Partial - Online';
        default:
            return status;
    }
};

/**
 * Calculate remaining amount for a bill
 */
export const calculateRemainingAmount = (bill: EnergyBill): number => {
    if (bill.paymentStatus === PaymentStatus.PartialCash ||
        bill.paymentStatus === PaymentStatus.PartialOnline) {
        return bill.amount - bill.paidAmount;
    }
    return bill.paymentStatus === PaymentStatus.Pending ? bill.amount : 0;
};

/**
 * Nepali months for dropdowns
 */
export const NEPALI_MONTHS = [
    'Baisakh',
    'Jestha',
    'Asar',
    'Shrawan',
    'Bhadra',
    'Ashwin',
    'Kartik',
    'Mangsir',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra'
];
