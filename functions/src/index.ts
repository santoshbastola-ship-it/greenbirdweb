import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import * as notificationController from "./controllers/notification.controller";

// Initialize Express App
const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json({
    verify: (req: any, res, buf) => {
        req.rawBody = buf;
    }
}));

// Routes
app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "Greenbird Homestead API is running.",
        version: "1.0.0"
    });
});

// Notifications
app.post("/notifications/push", notificationController.sendPush);

// Debug
import * as debugController from "./controllers/debug.controller";
app.get("/debug/admin-phone", debugController.getAdminPhones);
app.get("/debug/customer-phone", debugController.getCustomerPhones);
app.get("/debug/health", (req, res) => {
    res.send("API is online.");
});

// Export the API as a Cloud Function
// Last deploy: 2026-02-05T12:08:00
export const api = functions.https.onRequest(app);
