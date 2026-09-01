"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, Utensils, Bird, Trees, Calendar, Sprout, ShoppingBag, Home as HomeIcon, Clock } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/types";
import { FarmActivity, Testimonial } from "@/types/extra";
import { getActivities } from "@/lib/services/activities";
import { getTestimonials } from "@/lib/services/testimonials";
import { ProductService } from "@/services/product.service";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import LogoLoader from "@/components/ui/LogoLoader";
import MediaCarousel from "@/components/ui/MediaCarousel";
import { Quote, ExternalLink, User } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";


export default function Home() {
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [expandedTestimonials, setExpandedTestimonials] = useState<string[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Greenbird Homestead",
    "url": "https://greenbirdhomestead.com.np",
    "logo": "https://greenbirdhomestead.com.np/icon.png",
    "sameAs": [
      // Add social profiles here if available
    ],
    "description": "Organic.Fresh.Local - Farm fresh products, organic produce, free-range livestock and farm operations management in Nepal.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Nepal",
      "addressCountry": "NP"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "contact@greenbirdhomestead.com.np" // Placeholder, should be updated if real email exists
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Create a timeout promise that rejects after 15 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out")), 15000);
        });

        const [activitiesData, productsData, testimonialsData] = await Promise.race([
          Promise.all([
            getActivities(12), // Fetch more to allow for filtering
            ProductService.getFeaturedProducts(),
            getTestimonials(10)
          ]),
          timeoutPromise
        ]) as [FarmActivity[], Product[], Testimonial[]];

        setActivities(activitiesData.filter(a => a.isPublished).slice(0, 3));
        setFeaturedProducts(productsData);
        setTestimonials(testimonialsData.filter(t => t.isPublished));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingActivities(false);
        setLoadingProducts(false);
        setLoadingTestimonials(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd data={jsonLdData} />
      {/* Hero Section */}
      <section className="relative bg-[#2D5A27] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/images/hero-home.jpg"
            alt="Farm landscape"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-56 text-center animate-fadeIn">
          <h1 className="text-4xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Farm Fresh Living, <span className="text-[#FCF9F1]">Delivered & Experienced</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Subscribe to pasture-raised local country chicken and fresh farm eggs, shop sustainable agri-tools, or escape to our traditional Nepali village retreat.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/shop"
              className="bg-white text-[#2D5A27] hover:bg-[#FCF9F1] font-bold py-4 px-10 rounded-full transition-all duration-300 flex items-center justify-center shadow-xl hover:-translate-y-1"
            >
              Shop Fresh <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/booking"
              className="bg-[#5C4033] hover:bg-[#3d2a22] text-white font-bold py-4 px-10 rounded-full transition-all duration-300 shadow-xl hover:-translate-y-1"
            >
              Book Homestead
            </Link>
          </div>
        </div>
      </section>

      {/* Core Offerings Section */}
      <section className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Our <span className="text-[#2D5A27]">Core Offerings</span>
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              Explore our four core business pillars—from vermiculture and fresh organic subscriptions to eco-marketplace goods and traditional village stays.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Vertical 1: Vermicompost & Live Eisenia fetida Worms */}
            <div className="relative p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-2xl hover:border-green-100 transition-all duration-300 group flex flex-col justify-between overflow-hidden">
              {/* Coming Soon Badge Overlay */}
              <div className="absolute top-4 right-4 bg-[#5C4033] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Coming Soon
              </div>

              <div>
                <div className="bg-[#2D5A27]/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2D5A27] transition-all duration-300 group-hover:rotate-6">
                  <Sprout className="h-10 w-10 text-[#2D5A27] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Vermicompost & Worms</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Pure organic vermicompost & live <em>Eisenia fetida</em> breeding worms with precise sizing & bulk matrices.
                </p>
                <div className="bg-[#FCF9F1] rounded-2xl p-3.5 mb-6 border border-[#2D5A27]/10 text-xs text-left space-y-1.5">
                  <div className="font-bold text-[#2D5A27] text-center mb-1 uppercase tracking-wider text-[10px]">Sizing & Bulk Matrix</div>
                  <div className="flex justify-between text-gray-700"><span>Retail Pouches:</span><span className="font-semibold text-gray-900">1kg & 2kg</span></div>
                  <div className="flex justify-between text-gray-700"><span>Garden Packs:</span><span className="font-semibold text-gray-900">5kg & 10kg</span></div>
                  <div className="flex justify-between text-gray-700"><span>Bulk HDPE Sacks:</span><span className="font-semibold text-[#5C4033]">25kg Sacks</span></div>
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-block w-full bg-gray-100 text-gray-500 font-semibold py-3 px-6 rounded-xl text-sm border border-gray-200 cursor-not-allowed">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Vertical 2: Subscription Country Chicken & Eggs */}
            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-2xl hover:border-green-100 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="bg-[#2D5A27]/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2D5A27] transition-all duration-300 group-hover:rotate-6">
                  <Bird className="h-10 w-10 text-[#2D5A27] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Country Chicken & Eggs</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Subscription-focused 180-day pasture-raised local country chicken (Bhale) & fresh farm eggs.
                </p>
                <div className="bg-[#FCF9F1] rounded-2xl p-3.5 mb-6 border border-[#2D5A27]/10 text-xs text-left space-y-2 text-gray-700">
                  <div className="font-bold text-[#2D5A27] text-center mb-1 uppercase tracking-wider text-[10px]">Subscription Benefits</div>
                  <div className="flex items-center gap-2"><span>🥚</span><span>Weekly & Monthly Egg Delivery</span></div>
                  <div className="flex items-center gap-2"><span>🐓</span><span>180-Day Free-Range Bhale</span></div>
                  <div className="flex items-center gap-2"><span>🚚</span><span>Scheduled Doorstep Service</span></div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="w-full bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  Subscribe <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Vertical 3: Eco-Marketplace */}
            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-2xl hover:border-green-100 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="bg-[#2D5A27]/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2D5A27] transition-all duration-300 group-hover:rotate-6">
                  <ShoppingBag className="h-10 w-10 text-[#2D5A27] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Eco-Marketplace</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Partnered marketplace for eco-friendly green goods, durable agri-tools, & thriving indoor plants.
                </p>
                <div className="bg-[#FCF9F1] rounded-2xl p-3.5 mb-6 border border-[#2D5A27]/10 text-xs text-left space-y-1.5 text-gray-700">
                  <div className="font-bold text-[#2D5A27] text-center mb-1 uppercase tracking-wider text-[10px]">Marketplace Categories</div>
                  <div className="flex justify-between"><span>Agri-Tools:</span><span className="font-semibold text-gray-900">Handcraft Implements</span></div>
                  <div className="flex justify-between"><span>Indoor Plants:</span><span className="font-semibold text-gray-900">Air Purifying Plants</span></div>
                  <div className="flex justify-between"><span>Green Goods:</span><span className="font-semibold text-gray-900">Bio Enhancers</span></div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="w-full bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  Buy Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Vertical 4: Agritourism & Airbnb Stay */}
            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-2xl hover:border-green-100 transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="bg-[#2D5A27]/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2D5A27] transition-all duration-300 group-hover:rotate-6">
                  <HomeIcon className="h-10 w-10 text-[#2D5A27] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Agritourism & Stay</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Traditional Nepali village-style Airbnb accommodations in Duwakot with organic farm dining & tours.
                </p>
                <div className="bg-[#FCF9F1] rounded-2xl p-3.5 mb-6 border border-[#2D5A27]/10 text-xs text-left space-y-2 text-gray-700">
                  <div className="font-bold text-[#2D5A27] text-center mb-1 uppercase tracking-wider text-[10px]">Village Experience</div>
                  <div className="flex items-center gap-2"><span>🏡</span><span>Mud-Brick Village Cottage</span></div>
                  <div className="flex items-center gap-2"><span>🍲</span><span>Wood-Fired Organic Meals</span></div>
                  <div className="flex items-center gap-2"><span>🧑‍🌾</span><span>Hands-on Farm Tours</span></div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/booking"
                  className="w-full bg-[#5C4033] hover:bg-[#432e25] text-white font-bold py-3 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  Book Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Activities Section */}
      <section className="py-12 md:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto relative">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Farm Life & <span className="text-[#2D5A27]">Activities</span>
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              Experience the rhythm of nature. From dawn till dusk, there's always something beautiful happening at Greenbird Homestead.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/activities" className="flex items-center gap-2 text-[#2D5A27] font-semibold group cursor-pointer hover:text-[#1f3e1b] transition-colors">
                View All Moments <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {loadingActivities ? (
            <div className="flex justify-center items-center py-20 bg-gray-50 rounded-[2.5rem]">
              <LogoLoader size="sm" />
            </div>
          ) : activities.length > 0 ? (
            <MediaCarousel activities={activities} />
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] text-gray-400 font-medium border border-dashed border-gray-200">
              Check back soon for latest moments from the farm!
            </div>
          )}
        </div>
      </section>


      {/* Featured Products */}
      <section className="py-12 md:py-24 bg-[#FCF9F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Featured <span className="text-[#2D5A27]">Products</span>
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              Bestsellers from our farm this week. Freshly harvested and ready for your kitchen.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/shop" className="text-[#2D5A27] font-semibold hover:text-[#1f3e1b] flex items-center transition-colors">
                Shop All Products <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center items-center py-20">
              <LogoLoader size="sm" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 text-gray-500 bg-white/50 rounded-[2.5rem] border border-dashed border-gray-200">
              No featured products available at the moment.
            </div>
          )}
        </div>
      </section>
      {/* Testimonials Section */}
      <section className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Customer <span className="text-[#2D5A27]">Stories</span>
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              Hear what our visitors and customers have to say about their experience at Greenbird Homestead.
            </p>
          </div>

          {loadingTestimonials ? (
            <div className="flex justify-center items-center py-20">
              <LogoLoader size="sm" />
            </div>
          ) : testimonials.length > 0 ? (
            <div className="flex overflow-x-auto gap-8 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x snap-mandatory items-start">
              {testimonials.map((testimonial) => {
                const isExpanded = expandedTestimonials.includes(testimonial.id);
                const isLongText = testimonial.content.length > 180;

                return (
                  <div
                    key={testimonial.id}
                    className={`bg-white border border-gray-100 p-8 rounded-[2rem] hover:shadow-2xl hover:border-green-100 transition-all duration-300 flex flex-col group relative flex-none w-[85vw] sm:w-[400px] snap-start ${isExpanded ? 'h-auto' : 'h-[420px]'}`}
                  >
                    <Quote className="absolute top-8 right-8 h-12 w-12 text-green-50/50 group-hover:text-green-50 transition-colors" />
                    <div className="flex-1 flex flex-col h-full">
                      <div className={`text-gray-700 text-lg italic leading-relaxed relative z-10 mb-6 ${!isExpanded ? 'line-clamp-6' : ''}`}>
                        "{testimonial.content}"
                      </div>

                      {isLongText && (
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedTestimonials(prev => prev.filter(id => id !== testimonial.id));
                            } else {
                              setExpandedTestimonials(prev => [...prev, testimonial.id]);
                            }
                          }}
                          className="text-[#2D5A27] font-semibold text-sm hover:underline mb-4 text-left relative z-10"
                        >
                          {isExpanded ? "View Less" : "View More"}
                        </button>
                      )}

                      <div className="flex items-center gap-4 mt-auto">
                        <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm transition-transform duration-500 group-hover:scale-110 flex-shrink-0 relative">
                          {testimonial.photoUrl ? (
                            <Image
                              src={testimonial.photoUrl}
                              alt={testimonial.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{testimonial.name}</h4>
                          <div className="flex items-center gap-2">
                            {testimonial.customerProfileUrl && (
                              <a
                                href={testimonial.customerProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600 transition-colors inline-block"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] text-gray-400 font-medium border border-dashed border-gray-200">
              Be the first to share your experience!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
