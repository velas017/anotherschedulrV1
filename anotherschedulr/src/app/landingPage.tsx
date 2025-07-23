import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import Link from "next/link";

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            {/* Hero Section */}
            <main className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 pt-20">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                        Flexible scheduling software curated for your small business
                    </h1>
                    
                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Client scheduling, secure payments, all designed for your small business at a fraction of the cost with premium features for one price.
                    </p>
                    
                    {/* CTA Button */}
                    <div className="flex flex-col items-center space-y-4">
                        <Link href="/signup" className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                            Get started
                        </Link>
                        <Link href="/demo" className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-200">
                            View Dashboard Demo →
                        </Link>
                        <p className="text-gray-500 text-sm">
                            No credit card needed
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;