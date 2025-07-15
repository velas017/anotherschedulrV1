import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-500 via-blue-600 to-blue-700">
            <Navbar />
            {/* Hero Section */}
            <main className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 pt-20">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                        Flexible scheduling software curated for your small business
                    </h1>
                    
                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Client scheduling, secure payments, all designed for your small business at a fraction of the cost with premium features for one price.
                    </p>
                    
                    {/* CTA Button */}
                    <div className="flex flex-col items-center space-y-4">
                        <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                            Get started
                        </button>
                        <p className="text-white/70 text-sm">
                            No credit card needed
                        </p>
                    </div>
                </div>
            </main>

            {/* Optional: Add some subtle background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            </div>
            <Footer />
        </div>
    );
};

export default LandingPage;