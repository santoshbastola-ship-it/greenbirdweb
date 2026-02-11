"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerPhones = exports.getAdminPhones = void 0;
const firebase_1 = require("../lib/firebase");
const getAdminPhones = async (req, res) => {
    try {
        const adminSnap = await firebase_1.db.collection("users").where("role", "==", "admin").get();
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
    }
    catch (error) {
        console.error("Error fetching admin data:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.getAdminPhones = getAdminPhones;
const getCustomerPhones = async (req, res) => {
    try {
        const customerSnap = await firebase_1.db.collection("users").where("role", "==", "customer").get();
        const customers = customerSnap.docs
            .map(d => ({
            id: d.id,
            name: d.data().name,
            email: d.data().email,
            phoneNumber: d.data().phoneNumber || "NOT SET",
            phone: d.data().phone || "NOT SET",
            role: d.data().role
        }))
            .filter(c => (c.phoneNumber && c.phoneNumber.includes("9849850000")) ||
            (c.phone && c.phone.includes("9849850000")));
        res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });
    }
    catch (error) {
        console.error("Error fetching customer data:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.getCustomerPhones = getCustomerPhones;
//# sourceMappingURL=debug.controller.js.map