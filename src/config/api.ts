export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const WHATSAPP_API = {
    NOTIFICATION: `${API_BASE_URL}/api/whatsapp/notification`,
    ORDER_UPDATE: `${API_BASE_URL}/api/whatsapp/order-update`,
};

export const PUSH_API = {
    SEND: `${API_BASE_URL}/api/notifications/push`,
};
