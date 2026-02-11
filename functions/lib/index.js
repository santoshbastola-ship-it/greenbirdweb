"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const whatsappController = __importStar(require("./controllers/whatsapp.controller"));
const notificationController = __importStar(require("./controllers/notification.controller"));
// Initialize Express App
const app = (0, express_1.default)();
// Automatically allow cross-origin requests
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({
    verify: (req, res, buf) => {
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
// WhatsApp
app.get("/whatsapp/webhook", whatsappController.verifyWebhook);
app.post("/whatsapp/webhook", whatsappController.handleWebhookEvent);
app.post("/whatsapp/notification", whatsappController.sendNotification);
app.post("/whatsapp/order-update", whatsappController.updateOrder);
// Notifications
app.post("/notifications/push", notificationController.sendPush);
// Debug
const debugController = __importStar(require("./controllers/debug.controller"));
app.get("/debug/admin-phone", debugController.getAdminPhones);
app.get("/debug/customer-phone", debugController.getCustomerPhones);
app.get("/debug/health", (req, res) => {
    res.send("API is online.");
});
// Export the API as a Cloud Function
// Last deploy: 2026-02-05T12:08:00
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map