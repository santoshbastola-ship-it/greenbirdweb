import { Facebook, MessageCircle, Mail, MapPin, Phone, Instagram, Youtube } from "lucide-react";
import { VersionManager } from "../VersionManager";

interface FooterProps {
    minimized?: boolean;
}

export default function Footer({ minimized = false }: FooterProps) {
    // Minimized footer for mobile app-like experience (e.g., cart page)
    if (minimized) {
        return (
            <footer className="bg-[#5C4033] text-white md:pt-12 md:pb-8">
                {/* Minimized version for mobile */}
                <div className="md:hidden py-3 px-4">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                        <span>&copy; {new Date().getFullYear()} Greenbird Homestead</span>
                        <div className="flex gap-2">
                            <a
                                href="https://wa.me/9779849850000"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                                aria-label="WhatsApp"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                            <a
                                href="https://facebook.com/greenbirdhomestead"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-3.5 w-3.5" />
                            </a>
                            <a
                                href="https://www.instagram.com/greenbirdhomestead"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Simple version for desktop when minimized */}
                <div className="hidden md:block py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-300 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-white dark:bg-gray-200 p-1 rounded inline-block">
                                    <img
                                        src="/images/logo.png"
                                        alt="Greenbird Homestead"
                                        className="h-8 w-auto object-contain"
                                    />
                                </div>
                                <span>&copy; {new Date().getFullYear()} Greenbird Homestead. All rights reserved.</span>
                            </div>
                            <div className="flex gap-4">
                                <a href="https://wa.me/9779849850000" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="WhatsApp">
                                    <MessageCircle className="h-4 w-4" />
                                </a>
                                <a href="https://facebook.com/greenbirdhomestead" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
                                    <Facebook className="h-4 w-4" />
                                </a>
                                <a href="https://www.instagram.com/greenbirdhomestead" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
                                    <Instagram className="h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    // Default full footer
    return (
        <footer className="bg-[#5C4033] text-white pt-12 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div>
                        <div className="bg-white dark:bg-gray-200 p-2 rounded-lg inline-block mb-4">
                            <img
                                src="/images/logo.png"
                                alt="Greenbird Homestead"
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            The homestead emphasizes "Organic.Fresh.Local" as its primary mission.
                            Sustainable farming for a better future.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li><a href="/shop" className="hover:text-white transition-colors">Shop</a></li>
                            <li><a href="/about" className="hover:text-white transition-colors">Our Story</a></li>
                            <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                            <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Contact</h4>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>Bastola Chowk, Besi Gaun, Duwakot, Bhaktapur, Nepal</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <a href="mailto:greenbirdhomestead@gmail.com" className="hover:text-white transition-colors">
                                    greenbirdhomestead@gmail.com
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <a href="tel:+9779849850000" className="hover:text-white transition-colors">
                                    +977 9849850000
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
                        <div className="flex gap-3">
                            <a
                                href="https://wa.me/9779849850000"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                                aria-label="WhatsApp"
                            >
                                <MessageCircle className="h-5 w-5" />
                            </a>
                            <a
                                href="https://facebook.com/greenbirdhomestead"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.instagram.com/greenbirdhomestead"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://www.youtube.com/@greenbirdhomestead"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                                aria-label="YouTube"
                            >
                                <Youtube className="h-5 w-5" />
                            </a>
                        </div>
                        <p className="text-gray-300 text-sm mt-4">
                            Follow us for farm updates, recipes, and special offers!
                        </p>
                    </div>
                </div>

                <div className="border-t border-white/20 pt-8 text-center text-sm text-gray-300 flex flex-col items-center gap-2">
                    <div>&copy; {new Date().getFullYear()} Greenbird Homestead. All rights reserved.</div>
                    <VersionManager className="opacity-50 hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </footer>
    );
}

