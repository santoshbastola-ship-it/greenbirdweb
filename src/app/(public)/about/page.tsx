import Image from "next/image";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#FCF9F1]">
            {/* Header Section */}
            <div className="bg-[#2D5A27] text-white py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Roots & Our Vision</h1>
                    <div className="w-24 h-1 bg-[#F5E6D3] mx-auto mb-6"></div>
                    <p className="text-xl text-gray-100 max-w-2xl mx-auto font-light">
                        Engineering a better way to eat, from our soil to your soul.
                    </p>
                </div>
            </div>

            {/* 1. The Founder’s StorySection */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#2D5A27] mb-8">The Founder’s Story: From Code to Compost</h2>
                            <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
                                <blockquote className="border-l-4 border-[#5C4033] pl-6 italic text-[#2D5A27] py-2">
                                    "Most people ask why an IT professional would spend his weekends in a chicken coop. The answer is simple: Integrity."
                                </blockquote>
                                <p>
                                    I spent years building digital systems where logic and quality mattered. When I looked at the food system in our cities, I saw a lack of that same logic. We were eating "fast" food that took shortcuts.
                                </p>
                                <p>
                                    Greenbird Homestead was born from a desire to apply that same professional precision to the soil. We aren&apos;t just farming; we are engineering a better way to eat.
                                </p>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2070&auto=format&fit=crop"
                                    alt="Founder's Inspiration"
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-[#2D5A27]/5"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. The Greenbird Philosophy Section */}
            <section className="py-20 bg-white px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-[#2D5A27] mb-6">The Greenbird Philosophy: Why We Do &quot;Slow Food&quot;</h2>
                        <p className="text-gray-600 max-w-3xl mx-auto text-lg italic">
                            At Greenbird, we believe that nature cannot be &quot;overclocked.&quot; While commercial farms use chemicals to speed up growth, we embrace the Slow-Growth Cycle.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PhilosophyCard
                            title="180-Day Bhale"
                            description="Our roosters aren't raised in 40 days. They live for 6 months under the sun, developing natural immunity and a rich, deep flavor."
                            icon="🐓"
                            tagline="Quality over speed"
                        />
                        <PhilosophyCard
                            title="Chemical-Free Soil"
                            description="We use vermicompost and traditional Nepali farming wisdom to ensure every vegetable is as clean as the air in Duwakot."
                            icon="🌱"
                            tagline="Pure by design"
                        />
                        <PhilosophyCard
                            title="The Happy Bird Rule"
                            description="Our chickens have 2,000 sq. ft. of outdoor ground to roam. Happy birds produce the most nutrient-dense eggs."
                            icon="🥚"
                            tagline="Welfare equals nutrition"
                        />
                    </div>
                </div>
            </section>

            {/* 3. A Bridge Between Tech and Tradition Section */}
            <section className="py-24 px-4 bg-[#2D5A27] text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="relative h-[400px] w-full rounded-2xl overflow-hidden shadow-xl border-4 border-white/10">
                                <img
                                    src="https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2072&auto=format&fit=crop"
                                    alt="Technology in Farming"
                                    className="object-cover w-full h-full opacity-90"
                                />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-8">A Bridge Between Tech and Tradition</h2>
                            <div className="space-y-6 text-gray-100/90 leading-relaxed text-lg">
                                <p>
                                    We use modern tools—like our <span className="text-[#F5E6D3] font-semibold">Farm Management App</span>—to track every bird&apos;s health and every harvest&apos;s yield.
                                </p>
                                <p>
                                    This <span className="text-[#F5E6D3] font-semibold">&quot;Data-Driven Farming&quot;</span> allows us to be efficient with our small team while ensuring 100% transparency for you.
                                </p>
                                <p className="bg-white/10 p-6 rounded-xl border border-white/20">
                                    When you buy from us, you aren&apos;t just a customer; you&apos;re part of a <span className="text-[#F5E6D3] font-bold">transparent food ecosystem</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function PhilosophyCard({ title, description, icon, tagline }: { title: string, description: string, icon: string, tagline: string }) {
    return (
        <div className="bg-[#FCF9F1] p-10 rounded-3xl border border-[#2D5A27]/5 hover:shadow-2xl transition-all duration-300 group">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">{icon}</div>
            <h3 className="text-2xl font-bold text-[#2D5A27] mb-2">{title}</h3>
            <span className="text-[#5C4033] text-xs font-bold uppercase tracking-widest mb-4 block">{tagline}</span>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    );
}
