import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(req: NextRequest) {
    try {
        // Fetch all admin users
        const q = query(collection(db, "users"), where("role", "==", "admin"));
        const adminSnap = await getDocs(q);

        const admins = adminSnap.docs.map(d => ({
            id: d.id,
            name: d.data().name,
            email: d.data().email,
            phoneNumber: d.data().phoneNumber || "NOT SET",
            role: d.data().role
        }));

        return NextResponse.json({
            success: true,
            count: admins.length,
            admins
        });

    } catch (error: any) {
        console.error("Error fetching admin data:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
