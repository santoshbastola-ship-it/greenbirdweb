import { NextRequest, NextResponse } from "next/server";
import { WhatsappService } from "@/services/whatsapp.service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, status, customerPhone } = body;

        if (!orderId || !status || !customerPhone) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const result = await WhatsappService.sendOrderUpdate(orderId, status, customerPhone);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Order Update Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
