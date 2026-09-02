import Image from "next/image";
import { Mail, MapPin, Phone, MessageSquare } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#FCF9F1] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
            {/* Top Visual Hero Banner */}
            <div className="py-6 sm:py-10 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
                        <div className="relative h-72 sm:h-96 w-full">
                            <Image
                                src="/images/contact-banner.jpg"
                                alt="Contact Greenbird Homestead in Duwakot, Bhaktapur"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
                            <div className="absolute inset-0 p-6 sm:p-12 flex flex-col justify-center max-w-2xl text-white">
                                <span className="inline-flex items-center gap-1.5 bg-[#2D5A27] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 w-fit shadow-md">
                                    <MessageSquare className="w-3.5 h-3.5" /> Get In Touch
                                </span>
                                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
                                    Contact Greenbird Homestead
                                </h1>
                                <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                                    Have questions about vermicompost, bulk orders, organic produce, or farm visits? We&apos;d love to connect.
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-300">
                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                    <span>Bastola Chowk, Besi Gaun, Duwakot, Bhaktapur, Nepal</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
