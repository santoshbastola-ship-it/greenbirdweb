"use client";

import Link from "next/link";
import { ArrowRight, Leaf, Utensils, Bird, Trees, Calendar } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { Product } from "@/types";
import { FarmActivity } from "@/types/extra";
import { getActivities } from "@/lib/services/activities";
import { ProductService } from "@/services/product.service";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import LogoLoader from "@/components/ui/LogoLoader";

export default function Home() {
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesData, productsData] = await Promise.all([
          getActivities(3),
          ProductService.getFeaturedProducts()
        ]);
        setActivities(activitiesData);
        setFeaturedProducts(productsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingActivities(false);
        setLoadingProducts(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#2D5A27] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-48 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Farm Fresh, <span className="text-[#FCF9F1]">Straight to You</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-10 max-w-2xl mx-auto">
            Experience the taste of nature with our organically raised livestock and extensive crop selection.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/shop"
              className="bg-white text-[#2D5A27] hover:bg-[#FCF9F1] font-bold py-4 px-8 rounded-full transition-colors flex items-center justify-center shadow-lg"
            >
              Shop Fresh <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/booking"
              className="bg-[#5C4033] hover:bg-[#3d2a22] text-white font-bold py-4 px-8 rounded-full transition-colors shadow-lg"
            >
              Book Homestead
            </Link>
          </div>
        </div>
      </section>



      {/* Core Offerings & Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Core Offerings & Products</h2>
            <p className="text-gray-600 mt-2">Experience the best of what Greenbird Homestead has to offer</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Farm-to-Table Dining */}
            <div className="p-6 bg-[#2D5A27]/5 rounded-2xl text-center hover:shadow-lg transition-shadow group">
              <div className="bg-[#2D5A27]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#2D5A27] transition-colors">
                <Utensils className="h-8 w-8 text-[#2D5A27] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Farm-to-Table Dining</h3>
              <p className="text-gray-600 text-sm">Dining experience where meals are prepared using fresh ingredients harvested directly from the farm.</p>
            </div>

            {/* Organic Produce */}
            <div className="p-6 bg-[#2D5A27]/5 rounded-2xl text-center hover:shadow-lg transition-shadow group">
              <div className="bg-[#2D5A27]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#2D5A27] transition-colors">
                <Leaf className="h-8 w-8 text-[#2D5A27] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Organic Produce</h3>
              <p className="text-gray-600 text-sm">The farm grows a variety of organic vegetables without the use of synthetic chemicals.</p>
            </div>

            {/* Free-Range Livestock */}
            <div className="p-6 bg-[#2D5A27]/5 rounded-2xl text-center hover:shadow-lg transition-shadow group">
              <div className="bg-[#2D5A27]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#2D5A27] transition-colors">
                <Bird className="h-8 w-8 text-[#2D5A27] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free-Range Livestock</h3>
              <p className="text-gray-600 text-sm">Specializing in local free-range chicken and fresh farm eggs.</p>
            </div>

            {/* Nature Experience */}
            <div className="p-6 bg-[#2D5A27]/5 rounded-2xl text-center hover:shadow-lg transition-shadow group">
              <div className="bg-[#2D5A27]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#2D5A27] transition-colors">
                <Trees className="h-8 w-8 text-[#2D5A27] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nature Experience</h3>
              <p className="text-gray-600 text-sm">A "place to have fun" and connect with nature, perfect for escaping the city.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Activities Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Farm Life & Activities</h2>
            <p className="text-gray-600 mt-2">Catch a glimpse of daily life at Greenbird Homestead</p>
          </div>

          {loadingActivities ? (
            <div className="flex justify-center items-center py-12">
              <LogoLoader size="sm" />
            </div>
          ) : activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {activities.map((activity) => (
                <div key={activity.id} className="group overflow-hidden rounded-2xl bg-[#FCF9F1] shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[#2D5A27] text-sm font-medium mb-3">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(activity.date), "MMM dd, yyyy")}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Check back soon for latest updates from the farm!
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-[#FCF9F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-600 mt-2">Bestsellers from our farm this week</p>
            </div>
            <Link href="/shop" className="text-[#2D5A27] font-semibold hover:text-[#1f3e1b] flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center items-center py-12">
              <LogoLoader size="sm" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 col-span-full">
              No featured products available at the moment.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
