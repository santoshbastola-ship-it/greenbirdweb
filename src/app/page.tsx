import Link from "next/link";
import { ArrowRight, Leaf, Utensils, Bird, Trees } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";

import { Product } from "@/types";

// Mock Data for Display
const FEATURED_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Fresh Organic Eggs",
    businessType: "livestock",
    unit: "pcs",
    priceUnit: "pcs",
    currentPrice: 350,
    currentStock: 50,
    stockHistory: [],
    priceHistory: [],
    createdAt: new Date(),
    createdBy: "admin",
    images: ["https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800"],
    description: "Farm fresh organic eggs, collected daily from free-range chickens.",
    isAvailableForSale: true,
  },
  {
    id: "2",
    name: "Premium Goat Meat",
    businessType: "livestock",
    unit: "kg",
    priceUnit: "kg",
    currentPrice: 1800,
    currentStock: 10,
    stockHistory: [],
    priceHistory: [],
    createdAt: new Date(),
    createdBy: "admin",
    images: ["https://images.unsplash.com/photo-1606211475515-534570dfba41?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
    description: "Tender, fresh goat meat processed hygienically. Perfect for curries.",
    isAvailableForSale: true,
  },
  {
    id: "3",
    name: "Seasonal Vegetables Mix",
    businessType: "crop",
    unit: "kg",
    priceUnit: "kg",
    currentPrice: 150,
    currentStock: 0, // Out of stock
    stockHistory: [],
    priceHistory: [],
    createdAt: new Date(),
    createdBy: "admin",
    images: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800"],
    description: "A basket of freshly harvested seasonal vegetables including spinach.",
    isAvailableForSale: true,
  },
];

export default function Home() {
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
