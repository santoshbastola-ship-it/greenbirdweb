import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req: NextRequest) {
    try {
        // Get all users with role 'customer' and phone number containing 9849850000
        const q = query(collection(db, "users"), where("role", "==", "customer"));
        const customerSnap = await getDocs(q);

        const customers = customerSnap.docs
            .map(d => ({
                id: d.id,
                name: d.data().name,
                email: d.data().email,
                phoneNumber: d.data().phoneNumber || "NOT SET",
                phone: d.data().phone || "NOT SET",
                role: d.data().role
            }))
            .filter(c =>
                c.phoneNumber.includes("9849850000") ||
                c.phone.includes("9849850000")
            );

        return NextResponse.json({
            success: true,
            count: customers.length,
            customers
        });

    } catch (error: any) {
        console.error("Error fetching customer data:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
