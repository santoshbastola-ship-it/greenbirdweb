import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#FCF9F1]">
            {/* Header Section */}
            <div className="bg-[#2D5A27] text-white py-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
                    <p className="text-xl text-gray-100 max-w-2xl mx-auto">
                        Have questions? We'd love to hear from you.
                    </p>
                </div>
            </div>

            {/* Contact Information Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ContactCard
                            title="Visit Us"
                            content="Bastola Chowk, Besi Gaun, Duwakot, Bhaktapur, Nepal"
                            description="Come see our sustainable practices in person."
                            icon={<MapPin className="h-8 w-8 text-[#2D5A27]" />}
                        />
                        <ContactCard
                            title="Email Us"
                            content="greenbirdhomestead1@gmail.com"
                            description="We'll get back to you within 24 hours."
                            icon={<Mail className="h-8 w-8 text-[#2D5A27]" />}
                            href="mailto:greenbirdhomestead1@gmail.com"
                        />
                        <ContactCard
                            title="Call Us"
                            content="+977 9849850000"
                            description="Feel free to reach out anytime."
                            icon={<Phone className="h-8 w-8 text-[#2D5A27]" />}
                            href="tel:+9779849850000"
                        />
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#2D5A27] mb-4">Locate Us</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Visit us at our homestead in Duwakot to learn more about our sustainable farming practices.
                        </p>
                    </div>
                    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white h-[450px] relative">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14129.579733920962!2d85.40287086459178!3d27.705090018938986!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1b8d48047a05%3A0x11b568b26f18fdd1!2sGreenBird%20Homestead!5e0!3m2!1sen!2snp!4v1769169417753!5m2!1sen!2snp"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Greenbird Location Map"
                        />
                    </div>
                </div>
            </section>

            {/* Simple Message Section */}
            <section className="py-20 bg-white px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-[#2D5A27] mb-6">Send us a message</h2>
                    <p className="text-gray-600 mb-8">
                        You can also reach out to us on our social media channels or via WhatsApp for quicker responses.
                    </p>
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://wa.me/9779849850000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#2D5A27] text-white px-8 py-3 rounded-full font-bold hover:bg-[#1f3e1b] transition-colors"
                        >
                            WhatsApp Us
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ContactCard({ title, content, description, icon, href }: {
    title: string,
    content: string,
    description: string,
    icon: React.ReactNode,
    href?: string
}) {
    return (
        <div className="bg-white p-8 rounded-2xl border border-[#2D5A27]/10 hover:shadow-lg transition-all text-center">
            <div className="bg-[#2D5A27]/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-[#2D5A27] mb-2">{title}</h3>
            {href ? (
                <a href={href} className="text-lg font-semibold text-[#5C4033] hover:underline block mb-2">
                    {content}
                </a>
            ) : (
                <p className="text-lg font-semibold text-[#5C4033] mb-2">{content}</p>
            )}
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
