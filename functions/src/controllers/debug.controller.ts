import { Request, Response } from "express";
import { db } from "../lib/firebase";

export const getAdminPhones = async (req: Request, res: Response) => {
    try {
        const adminSnap = await db.collection("users").where("role", "==", "admin").get();
        const admins = adminSnap.docs.map(d => ({
            id: d.id,
            name: d.data().name,
            email: d.data().email,
            phoneNumber: d.data().phoneNumber || "NOT SET",
            role: d.data().role
        }));

        res.status(200).json({
            success: true,
            count: admins.length,
            admins
        });
    } catch (error: any) {
        console.error("Error fetching admin data:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getCustomerPhones = async (req: Request, res: Response) => {
    try {
        const customerSnap = await db.collection("users").where("role", "==", "customer").get();
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
                (c.phoneNumber && c.phoneNumber.includes("9849850000")) ||
                (c.phone && c.phone.includes("9849850000"))
            );

        res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (error: any) {
        console.error("Error fetching customer data:", error);
        res.status(500).json({ error: error.message });
    }
};
