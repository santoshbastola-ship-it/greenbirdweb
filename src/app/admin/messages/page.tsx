"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";

type WhatsAppMessage = {
    id: string;
    from: string;
    body: string;
    timestamp: string;
    type: string;
    status: string;
};

export default function MessagesPage() {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for incoming messages
        const q = query(
            collection(db, "whatsapp_messages"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as WhatsAppMessage[];
            setMessages(msgList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Shared WhatsApp Inbox</h1>

            <div className="bg-white rounded-lg shadow min-h-[500px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                    <p className="text-sm text-gray-600">Showing last 50 messages from customers.</p>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <p className="text-gray-500 text-center py-10">Loading messages...</p>
                    ) : messages.length === 0 ? (
                        <p className="text-gray-400 text-center py-10">No messages yet.</p>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.type === 'outbound' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[70%] rounded-lg p-3 ${msg.type === 'outbound' ? 'bg-green-100' : 'bg-blue-50 border border-blue-100'}`}>
                                    <div className="flex justify-between items-start gap-4 mb-1">
                                        <span className="font-semibold text-xs text-gray-700">{msg.from}</span>
                                        <span className="text-[10px] text-gray-400">
                                            {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{msg.body}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
