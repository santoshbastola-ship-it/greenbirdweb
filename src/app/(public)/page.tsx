"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, Utensils, Bird, Trees, Calendar } from "lucide-react";
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
            Farm Fresh, <span className="text-[#FCF9F1]">Straight to You</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the taste of nature with our organically raised livestock and extensive crop selection.
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
              Experience the best of what Greenbird Homestead has to offer, from fresh produce to nature retreats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Farm-to-Table Dining */}
            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-2xl hover:border-green-100 transition-all duration-300 group">
              <div className="bg-[#2D5A27]/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2D5A27] transition-all duration-300 group-hover:rotate-6">
                <Utensils className="h-10 w-10 text-[#2D5A27] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Farm-to-Table</h3>
              <p className="text-gray-600 leading-relaxed">Meals prepared using fresh ingredients harvested directly from our fields.</p>
            </div>

            {/* Organic Produce */}
            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-2xl hover:border-green-100 transition-all duration-300 group">
              <div className="bg-[#2D5A27]/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2D5A27] transition-all duration-300 group-hover:rotate-6">
                <Leaf className="h-10 w-10 text-[#2D5A27] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Organic Produce</h3>
              <p className="text-gray-600 leading-relaxed">Pure, chemical-free vegetables grown with care and respect for the land.</p>
            </div>

            {/* Free-Range Livestock */}
            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-2xl hover:border-green-100 transition-all duration-300 group">
              <div className="bg-[#2D5A27]/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2D5A27] transition-all duration-300 group-hover:rotate-6">
                <Bird className="h-10 w-10 text-[#2D5A27] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Free-Range</h3>
              <p className="text-gray-600 leading-relaxed">Specializing in local free-range chicken and fresh farm-fresh eggs.</p>
            </div>

            {/* Nature Experience */}
            <div className="p-8 bg-white border border-gray-100 rounded-3xl text-center hover:shadow-2xl hover:border-green-100 transition-all duration-300 group">
              <div className="bg-[#2D5A27]/5 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2D5A27] transition-all duration-300 group-hover:rotate-6">
                <Trees className="h-10 w-10 text-[#2D5A27] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Nature Retreat</h3>
              <p className="text-gray-600 leading-relaxed">A sanctuary to reconnect with nature and escape the city bustle.</p>
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
