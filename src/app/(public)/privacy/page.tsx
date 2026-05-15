import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-green-800">Privacy Policy</h1>
            <p className="mb-4 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 text-gray-700">
                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">1. Introduction</h2>
                    <p>
                        Welcome to Greenbird Homestead ("we," "our," or "us"). We represent a commitment to organic, fresh, and local produce.
                        This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or use our services.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">2. Information We Collect</h2>
                    <p className="mb-2">We collect information that you voluntarily provide to us when you:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Register for an account</li>
                        <li>Place an order for our products</li>
                        <li>Subscribe to our newsletter</li>
                        <li>Contact us for support</li>
                    </ul>
                    <p className="mt-2">This information may include your name, email address, phone number (specifically for WhatsApp notifications), and delivery address.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">3. How We Use Your Information</h2>
                    <p className="mb-2">We use your information for the following purposes:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Processing and delivering your orders.</li>
                        <li>Sending you order updates and notifications via WhatsApp (with your consent).</li>
                        <li>Improving our website and product offerings.</li>
                        <li> complying with legal obligations.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">4. WhatsApp Notifications</h2>
                    <p>
                        By providing your phone number, you consent to receive order status updates (e.g., "Order Confirmed", "Shipped") via WhatsApp.
                        We use the official WhatsApp Business API to send these notifications. You can opt-out at any time by replying "STOP" or contacting us.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">5. Data Deletion</h2>
                    <p>
                        You have the right to request deletion of your personal data. To do so, please contact us at our support email or via our Contact page.
                        We will process your request within 30 days.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">6. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us:
                    </p>
                    <p className="mt-2">
                        <strong>Email:</strong> greenbirdhomestead1@gmail.com<br />
                        <strong>Address:</strong> Nepal
                    </p>
                </section>
            </div>
        </div>
    );
}
