"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Bird, 
  Sprout, 
  Home as HomeIcon, 
  ShieldCheck, 
  Truck, 
  Award, 
  CheckCircle2, 
  Quote, 
  ExternalLink, 
  Sparkles, 
  MapPin,
  ChevronRight,
  Star,
  Clock,
  Heart,
  Recycle,
  Leaf
} from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/types";
import { FarmActivity, Testimonial } from "@/types/extra";
import { getActivities } from "@/lib/services/activities";
import { getTestimonials } from "@/lib/services/testimonials";
import { ProductService } from "@/services/product.service";
import { useEffect, useState } from "react";
import LogoLoader from "@/components/ui/LogoLoader";
import MediaCarousel from "@/components/ui/MediaCarousel";
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
    "description": "Nepal's premier source for certified vermicompost, organic terrace gardening essentials, pasture-raised produce, and traditional village stays in Duwakot, Bhaktapur.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Duwakot, Bhaktapur",
      "addressCountry": "NP"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "contact@greenbirdhomestead.com.np"
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out")), 15000);
        });

        const [activitiesData, productsData, testimonialsData] = await Promise.race([
          Promise.all([
            getActivities(12),
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
    <div className="flex flex-col min-h-screen bg-[#FCF9F1] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      <JsonLd data={jsonLdData} />

      {/* 2. Hero Section (Above the Fold - Balanced Multi-Vertical Focus) */}
      <section className="relative bg-[#1f3e1b] text-white overflow-hidden min-h-[85vh] flex items-center">
        {/* Background Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-home.jpg"
            alt="Duwakot Farm Homestead Landscape"
            fill
            className="object-cover object-center scale-105 animate-pulse-subtle"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f3e1b]/50 via-transparent to-transparent z-10" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 flex flex-col justify-center">
          <div className="max-w-3xl">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 bg-[#2D5A27]/80 backdrop-blur-md border border-green-400/30 text-green-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Organic Soil • Farm Produce • Village Stay</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.15] text-white drop-shadow-md">
              Pure Earth, Fresh Harvest &amp; Rural Retreats.
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl leading-relaxed font-normal">
              Nepal&apos;s premier source for organic vermicompost, terrace gardening essentials, farm-fresh produce, pasture-raised country poultry, and authentic village stays in Duwakot, Bhaktapur.
            </p>

            {/* Dual Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <Link
                href="/shop"
                className="bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 text-base"
              >
                <span>Visit our Eco Marketplace</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/booking"
                className="bg-white/15 hover:bg-white/25 text-white border border-white/40 backdrop-blur-md font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-base"
              >
                <HomeIcon className="h-5 w-5" />
                <span>Explore Village Stay &amp; Tours</span>
              </Link>
            </div>

            {/* Location Tag Removed as requested */}
          </div>
        </div>
      </section>



      {/* 4. The Three Business Verticals Section (Redesigned & Expanded Cards) */}
      <section className="py-20 md:py-28 bg-[#FCF9F1] dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-[#2D5A27] dark:text-green-400 font-bold uppercase tracking-widest text-xs">
              What We Offer
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-2">
              Our Core <span className="text-[#2D5A27] dark:text-green-400">Services</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-4 text-base sm:text-lg leading-relaxed">
              Discover organic soil enrichers, fresh farm produce, and an authentic rural retreat in Duwakot.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* Card 1: Organic Soil & Inputs */}
            <div className="group bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden transform hover:-translate-y-1">
              <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                <Image
                  src="/images/vermicompost-vertical.jpg"
                  alt="Vermicompost & Garden Marketplace"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="inline-block bg-[#2D5A27]/10 text-[#2D5A27] dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-3">Eco Marketplace</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#2D5A27] dark:group-hover:text-green-400 transition-colors">
                    Organic Soil &amp; Inputs
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5">
                    Revitalize your terrace garden with our premium vermicompost and sustainable gardening essentials.
                  </p>
                  
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
                    <li className="flex items-center gap-3">
                      <Sprout className="w-5 h-5 text-[#2D5A27] dark:text-green-400" />
                      <span className="font-medium">Premium Vermicompost</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Bird className="w-5 h-5 text-[#2D5A27] dark:text-green-400" />
                      <span className="font-medium">Live Earthworm Cultures</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#2D5A27] dark:text-green-400" />
                      <span className="font-medium">Natural Biopesticides</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Sprout className="w-5 h-5 text-[#2D5A27] dark:text-green-400" />
                      <span className="font-medium">Agricultural Tools &amp; Essentials</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/shop"
                  className="w-full bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg"
                >
                  <span>Shop Gardening Needs</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 2: Fresh Farm Produce */}
            <div className="group bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden transform hover:-translate-y-1">
              <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                <Image
                  src="/images/produce-vertical.jpg"
                  alt="Farm Produce & Free-Range Poultry"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="inline-block bg-[#5C4033]/10 text-[#5C4033] dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-3">Farm Produce</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#5C4033] dark:group-hover:text-amber-400 transition-colors">
                    Fresh Farm Produce
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5">
                    Nourish your family with fresh, chemical-free vegetables and pasture-raised local poultry.
                  </p>

                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#5C4033] dark:text-amber-400" />
                      <span className="font-medium">Seasonal Vegetables</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#5C4033] dark:text-amber-400" />
                      <span className="font-medium">Free-Range Country Chicken</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#5C4033] dark:text-amber-400" />
                      <span className="font-medium">Farm-Fresh Eggs</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/shop?category=produce"
                  className="w-full bg-[#5C4033] hover:bg-[#432e25] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg"
                >
                  <span>Shop Fresh Produce</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card 3: Authentic Village Stay */}
            <div className="group bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden transform hover:-translate-y-1">
              <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                <Image
                  src="/images/stay-vertical.jpg"
                  alt="Agritourism & Village Stay"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <div className="inline-block bg-[#2D5A27]/10 text-[#2D5A27] dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-3">Farm Stay</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-[#2D5A27] dark:group-hover:text-green-400 transition-colors">
                    Authentic Village Stay
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5">
                    Escape the city and experience traditional Nepali farm life with organic dining and peaceful surroundings.
                  </p>

                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
                    <li className="flex items-center gap-3">
                      <HomeIcon className="w-5 h-5 text-[#2D5A27] dark:text-green-400" />
                      <span className="font-medium">Mud-Brick Cottages</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-[#2D5A27] dark:text-green-400" />
                      <span className="font-medium">Organic Farm Dining</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#2D5A27] dark:text-green-400" />
                      <span className="font-medium">Guided Farm Tours</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-[#2D5A27] dark:text-green-400" />
                      <span className="font-medium">Changu Narayan &amp; City Tours (Vehicle Provided)</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/booking"
                  className="w-full bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg"
                >
                  <span>Book Your Stay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Featured Products Grid (Quick Conversion Zone) */}
      <section className="py-20 md:py-28 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
            <div>
              <span className="text-[#2D5A27] dark:text-green-400 font-bold uppercase tracking-widest text-xs">
                Featured Catalog
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-2">
                Bestsellers &amp; <span className="text-[#2D5A27] dark:text-green-400">Quick Order</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-base max-w-xl">
                Certified vermicompost sacks, live breeding earthworms, grow bags, and seasonal produce delivered straight to your home.
              </p>
            </div>
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 text-[#2D5A27] dark:text-green-400 font-bold hover:underline transition-all text-sm shrink-0"
            >
              <span>View Full Shop Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
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
            <div className="text-center py-24 text-gray-500 dark:text-gray-400 bg-[#FCF9F1] dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              No featured products available at the moment. Please visit our shop!
            </div>
          )}
        </div>
      </section>

      {/* 6. Multi-Vertical Story & Transformation Section ("Rooted in Duwakot") */}
      <section className="py-20 md:py-28 bg-[#FCF9F1] dark:bg-gray-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-[#2D5A27] dark:text-green-400 font-bold uppercase tracking-widest text-xs">
              Rooted in Duwakot, Bhaktapur
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-2">
              Nurturing You, <span className="text-[#2D5A27] dark:text-green-400">Your Garden, and Your Soul</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-3 text-base sm:text-lg">
              Discover how our holistic approach to organic farming and traditional living can bring natural purity to your daily life, enrich your soil, and provide a peaceful sanctuary away from the city.
            </p>
          </div>

          {/* 3 Story Feature Grid */}
          <div className="space-y-16">

            {/* Story 1: Nourish the Body */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#5C4033]/10 text-[#5C4033] dark:text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  <Bird className="w-4 h-4" />
                  <span>Nourish the Body</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Farm Produce &amp; Free-Range Country Poultry
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">
                  Our farm produce and slow-grown poultry provide nutrient-dense, chemical-free food. Quality over speed ensures every bite is pure, natural, and directly nourishes your body with the best of nature. We pasture-raise our local country chickens (Bhale) for 180 full days across open fields in Duwakot, alongside chemical-free seasonal organic vegetables.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#5C4033] dark:text-amber-400 shrink-0" />
                    <span><strong>180-Day Pasture-Raised Bhale:</strong> Authentic local country chicken flavor, grown slowly for maximum nutrition.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#5C4033] dark:text-amber-400 shrink-0" />
                    <span><strong>Chemical-Free Daily Harvest:</strong> Fresh vegetables delivered straight from Duwakot, free of synthetic pesticides.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#5C4033] dark:text-amber-400 shrink-0" />
                    <span><strong>Farm-Fresh Egg Subscriptions:</strong> Scheduled weekly &amp; monthly doorstep deliveries for your daily protein needs.</span>
                  </div>
                </div>
                <Link
                  href="/shop?category=produce"
                  className="inline-flex items-center gap-2 bg-[#5C4033] hover:bg-[#432e25] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md"
                >
                  <span>Shop Farm Produce &amp; Poultry</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                <Image
                  src="/images/poultry-story.jpg"
                  alt="Free-range local country chickens"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-xl text-xs">
                  <span className="font-bold text-[#5C4033] dark:text-amber-400 block">Duwakot Open Pastures</span>
                  <span className="text-gray-600 dark:text-gray-300">180-Day Pasture-Raised Free-Range Chicken</span>
                </div>
              </div>
            </div>

            {/* Story 2: Nurture the Soil */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 lg:flex-row-reverse">
              <div className="lg:order-2">
                <div className="inline-flex items-center gap-2 bg-[#2D5A27]/10 text-[#2D5A27] dark:text-green-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  <Sprout className="w-4 h-4" />
                  <span>Nurture the Soil</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Eco-Marketplace for Sustainable Gardening
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">
                  Our Eco-Marketplace provides everything you need to cultivate your own green spaces sustainably. It begins with our premium, 90-day cured organic vermicompost, powered by 100% pure <em>Eisenia fetida</em> red wrigglers. Beyond soil enrichers, we offer a complete ecosystem of gardening tools, breathable grow bags, and natural bio-pesticides to empower you to grow your own food with confidence.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A27] dark:text-green-400 shrink-0" />
                    <span><strong>Premium 90-Day Vermicompost:</strong> Nutrient-dense organic castings to instantly restore your soil's vitality.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A27] dark:text-green-400 shrink-0" />
                    <span><strong>Natural Bio-Pesticides &amp; Tonics:</strong> 100% chemical-free pest protection to preserve soil microbiology.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A27] dark:text-green-400 shrink-0" />
                    <span><strong>Essential Gardening Tools:</strong> High-quality grow bags and tools to easily kickstart your terrace garden.</span>
                  </div>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md"
                >
                  <span>Explore Soil Inputs &amp; Worms</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 lg:order-1">
                <Image
                  src="/images/duwakot-heritage.jpg"
                  alt="Vermiculture Beds in Duwakot"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-xl text-xs">
                  <span className="font-bold text-[#2D5A27] dark:text-green-400 block">Duwakot Homestead Beds</span>
                  <span className="text-gray-600 dark:text-gray-300">100% Pure Eisenia fetida breeding cultures</span>
                </div>
              </div>
            </div>

            {/* Story 3: Restore the Soul */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#2D5A27]/10 text-[#2D5A27] dark:text-green-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  <HomeIcon className="w-4 h-4" />
                  <span>Restore the Soul</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Authentic Duwakot Village Homestead Experience
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">
                  Our traditional Nepali Farm Stays offer a sanctuary from city life. Experience peace, practice yoga, and reconnect with authentic village life. Unplug in mud-brick cottages in Duwakot, Bhaktapur, and enjoy wood-fired organic meals harvested by your own hands.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A27] dark:text-green-400 shrink-0" />
                    <span><strong>Traditional Mud-Brick Architecture:</strong> Authentic rustic Nepali village charm for a peaceful retreat.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A27] dark:text-green-400 shrink-0" />
                    <span><strong>Wood-Fired Organic Dining:</strong> Farm-to-table traditional meals that heal and comfort the soul.</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-[#2D5A27] dark:text-green-400 shrink-0" />
                    <span><strong>Guided Farm Tours:</strong> Hands-on vermiculture &amp; agriculture experience to ground yourself.</span>
                  </div>
                </div>
                <Link
                  href="/booking"
                  className="inline-flex items-center gap-2 bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md"
                >
                  <span>Book Village Stay &amp; Tours</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                <Image
                  src="/images/stay-vertical.jpg"
                  alt="Traditional Nepali Village Cottage in Duwakot"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-xl text-xs">
                  <span className="font-bold text-[#2D5A27] dark:text-green-400 block">Duwakot Homestead Cottage</span>
                  <span className="text-gray-600 dark:text-gray-300">Authentic Day Visits &amp; Organic Dining</span>
                </div>
              </div>
            </div>

          </div>

          {/* Farm Moments Media Carousel */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <span className="text-[#2D5A27] dark:text-green-400 font-bold uppercase tracking-widest text-xs block mb-2">
                Gallery &amp; Experience
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                Farm Moments &amp; Activities
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-2xl mx-auto">
                Real moments captured across our vermiculture beds, poultry fields, and village retreat.
              </p>
            </div>

            {loadingActivities ? (
              <div className="flex justify-center items-center py-16 bg-white dark:bg-gray-900 rounded-3xl">
                <LogoLoader size="sm" />
              </div>
            ) : activities.length > 0 ? (
              <MediaCarousel activities={activities} />
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl text-gray-400 font-medium border border-dashed border-gray-200 dark:border-gray-800">
                Check back soon for latest moments from the farm!
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 7. Customer Testimonials & Social Proof */}
      <section className="py-20 md:py-28 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-[#2D5A27] dark:text-green-400 font-bold uppercase tracking-widest text-xs">
              Verified Social Proof
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-2">
              Trusted by <span className="text-[#2D5A27] dark:text-green-400">Terrace Gardeners &amp; Visitors</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-3 text-base sm:text-lg">
              Hear from urban organic growers, agro-vets, and farm stay guests about their experience with Greenbird Homestead.
            </p>
          </div>

          {loadingTestimonials ? (
            <div className="flex justify-center items-center py-20">
              <LogoLoader size="sm" />
            </div>
          ) : testimonials.length > 0 ? (
            <div className="flex overflow-x-auto gap-6 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x snap-mandatory items-start">
              {testimonials.map((testimonial) => {
                const isExpanded = expandedTestimonials.includes(testimonial.id);
                const isLongText = testimonial.content.length > 180;

                return (
                  <div
                    key={testimonial.id}
                    className={`bg-[#FCF9F1] dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700 p-8 rounded-3xl hover:shadow-2xl hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 flex flex-col group relative flex-none w-[88vw] sm:w-[380px] snap-start ${isExpanded ? 'h-auto' : 'h-[400px]'}`}
                  >
                    <Quote className="absolute top-6 right-6 h-10 w-10 text-[#2D5A27]/15 dark:text-green-400/20 group-hover:text-[#2D5A27]/30 transition-colors" />
                    
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <div className="flex-1 flex flex-col h-full">
                      <div className={`text-gray-700 dark:text-gray-200 text-base leading-relaxed relative z-10 mb-4 ${!isExpanded ? 'line-clamp-6' : ''}`}>
                        &ldquo;{testimonial.content}&rdquo;
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
                          className="text-[#2D5A27] dark:text-green-400 font-bold text-xs hover:underline mb-4 text-left relative z-10"
                        >
                          {isExpanded ? "Show Less" : "Read Full Story"}
                        </button>
                      )}

                      <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-200/60 dark:border-gray-700">
                        <div className="h-12 w-12 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm flex-shrink-0 relative">
                          {testimonial.photoUrl ? (
                            <Image
                              src={testimonial.photoUrl}
                              alt={testimonial.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-emerald-100 text-emerald-800 font-bold">
                              {testimonial.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{testimonial.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <span>Verified Customer</span>
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
            <div className="text-center py-20 bg-[#FCF9F1] dark:bg-gray-800/40 rounded-3xl text-gray-500 dark:text-gray-400 font-medium border border-dashed border-gray-200 dark:border-gray-700">
              Be the first to share your experience with Greenbird Homestead!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
