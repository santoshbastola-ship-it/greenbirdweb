import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    orderBy,
    Timestamp
} from "firebase/firestore";
import { Booking, BookingStatus } from "@/types/extra";

const BOOKING_COLLECTION = "bookings";

export const BookingService = {
    /**
     * Get all bookings ordered by creation date descending
     */
    async getAllBookings(): Promise<Booking[]> {
        const bookingRef = collection(db, BOOKING_COLLECTION);
        const q = query(bookingRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                checkInDate: data.checkInDate instanceof Timestamp ? data.checkInDate.toDate().toISOString() : data.checkInDate,
                checkOutDate: data.checkOutDate instanceof Timestamp ? data.checkOutDate.toDate().toISOString() : data.checkOutDate,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
            } as Booking;
        });
    },

    /**
     * Create a new booking
     */
    async createBooking(booking: Omit<Booking, "id" | "status" | "createdAt">): Promise<string> {
        const bookingRef = collection(db, BOOKING_COLLECTION);
        const docRef = await addDoc(bookingRef, {
            ...booking,
            checkInDate: Timestamp.fromDate(new Date(booking.checkInDate)),
            checkOutDate: Timestamp.fromDate(new Date(booking.checkOutDate)),
            status: 'pending' as BookingStatus,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    /**
     * Update booking status
     */
    async updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
        const bookingRef = doc(db, BOOKING_COLLECTION, id);
        await updateDoc(bookingRef, { status });
    },

    /**
     * Update a booking
     */
    async updateBooking(id: string, booking: Partial<Booking>): Promise<void> {
        const bookingRef = doc(db, BOOKING_COLLECTION, id);
        const updateData: any = { ...booking };

        if (booking.checkInDate) {
            updateData.checkInDate = Timestamp.fromDate(new Date(booking.checkInDate));
        }
        if (booking.checkOutDate) {
            updateData.checkOutDate = Timestamp.fromDate(new Date(booking.checkOutDate));
        }

        delete updateData.id;
        delete updateData.createdAt;

        await updateDoc(bookingRef, updateData);
    },

    /**
     * Delete a booking
     */
    async deleteBooking(id: string): Promise<void> {
        await deleteDoc(doc(db, BOOKING_COLLECTION, id));
    }
};
