import React from 'react';

export default function TermsOfService() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-green-800">Terms of Service</h1>
            <p className="mb-4 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-6 text-gray-700">
                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">1. Agreement to Terms</h2>
                    <p>
                        These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Greenbird Homestead ("we", "us", or "our"), concerning your access to and use of our website and services.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">2. User Registration</h2>
                    <p>
                        You may be required to register with the Site to access certain features (like placing orders). You agree to keep your password confidential and will be responsible for all use of your account and password.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">3. Products and Orders</h2>
                    <p>
                        All products are subject to availability. We reserve the right to discontinue any product at any time. Prices for all products are subject to change.
                        We reserve the right to refuse any order placed through the Site.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">4. WhatsApp Communication</h2>
                    <p>
                        By providing your phone number, you agree to receive transactional messages related to your orders. Standard messaging rates may apply.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-green-700">5. Contact Us</h2>
                    <p>
                        In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: greenbirdhomestead@gmail.com
                    </p>
                </section>
            </div>
        </div>
    );
}
