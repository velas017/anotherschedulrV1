import Link from "next/link";
import { Check } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const PricingPage = () => {
  const features = [
    "Unlimited appointments",
    "Client management system",
    "Calendar integration",
    "Email notifications",
    "Payment processing",
    "Custom branding",
    "Advanced reporting",
    "Mobile app access",
    "24/7 support",
    "API access"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6">
              <span className="mr-2">💰</span>
              Pricing
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple pricing based on your needs
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start scheduling for free, with no usage limits. For collaborative features, choose 
              one of our premium plans that fits your company size.
            </p>
          </div>

          {/* Single Pricing Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              {/* Card Header */}
              <div className="px-8 py-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional</h2>
                <p className="text-gray-600 mb-6">
                  Perfect for small businesses and independent professionals
                </p>
                
                <div className="mb-8">
                  <span className="text-5xl font-bold text-gray-900">$29</span>
                  <span className="text-gray-600 ml-2">per month</span>
                </div>
                
                <Link 
                  href="/signup"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 inline-block text-center"
                >
                  Get started
                </Link>
              </div>

              {/* Divider */}
              <div className="px-8">
                <div className="border-t border-gray-200"></div>
              </div>

              {/* Features Section */}
              <div className="px-8 py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Professional plan features:
                </h3>
                
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-4">
              Need something different? We offer custom enterprise solutions.
            </p>
            <Link 
              href="/contact"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact us for custom pricing
            </Link>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I change my plan later?
                </h3>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
                  Yes! We offer a 14-day free trial with full access to all Professional features. No credit card required.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer discounts for annual billing?
                </h3>
                <p className="text-gray-600">
                  Yes! Save 20% when you choose annual billing. That brings the Professional plan down to just $23/month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;