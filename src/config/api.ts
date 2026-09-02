export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const PUSH_API = {
    SEND: `${API_BASE_URL}/api/notifications/push`,
};
