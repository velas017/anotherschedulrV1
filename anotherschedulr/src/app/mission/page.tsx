import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const MissionPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About anotherschedulr
            </h1>
            <p className="text-lg text-gray-600 uppercase tracking-wide font-medium">
              SIMPLIFYING SCHEDULING FOR SMALL BUSINESSES
            </p>
          </div>

          {/* Open Letter Section */}
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              An open letter
            </h2>
            
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p>
                When I started my own service-based business, I quickly realized how challenging it was to manage client appointments efficiently. Existing scheduling solutions were either too expensive, too complex, or didn't cater to the unique needs of small businesses and independent professionals.
              </p>
              
              <p>
                After spending countless hours researching alternatives and finding nothing that truly fit the needs of small business owners like myself, I decided to build anotherschedulr. What started as a personal solution has evolved into a platform designed specifically for entrepreneurs who need powerful scheduling tools without the enterprise price tag.
              </p>
              
              <p>
                From the very first day, anotherschedulr was founded with the mission to democratize professional scheduling. We fundamentally believe that every small business deserves access to tools that help them grow and succeed, regardless of their budget or technical expertise.
              </p>
              
              <p>
                When designing not only the product, but also the company culture, we've put a lot of thought into <Link href="/pricing" className="text-blue-600 hover:text-blue-700 underline">affordability</Link> and simplicity. We want to ensure that anotherschedulr remains accessible to every entrepreneur who needs it, from solo practitioners to growing teams.
              </p>
              
              <p>
                Our vision is simple: to create a world where managing appointments is effortless, where small businesses can focus on what they do best instead of wrestling with complicated scheduling systems. We believe that by removing these barriers, we can help more entrepreneurs succeed and thrive.
              </p>
              
              <p>
                Every feature we build, every decision we make, is guided by one question: "How can we make this easier for small business owners?" This principle drives everything we do, from our intuitive interface to our transparent pricing model.
              </p>
              
              <p>
                We're not just building scheduling software – we're building a tool that empowers entrepreneurs to take control of their time, serve their clients better, and grow their businesses with confidence.
              </p>
              
              <p>
                Thank you for being part of our journey. Whether you're a solo entrepreneur just starting out or a growing business looking to streamline your operations, anotherschedulr is here to help you succeed.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to simplify your scheduling?
              </h3>
              <p className="text-gray-600 mb-6">
                Join thousands of small businesses who have already transformed their appointment management with anotherschedulr.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/signup"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Get Started Free
                </Link>
                <Link 
                  href="/pricing"
                  className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Our Values
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Simplicity</h3>
                <p className="text-gray-600">
                  We believe powerful software doesn't have to be complicated. Every feature is designed with ease of use in mind.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Affordability</h3>
                <p className="text-gray-600">
                  Professional scheduling shouldn't break the bank. We offer enterprise-level features at small business prices.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Reliability</h3>
                <p className="text-gray-600">
                  Your business depends on consistent scheduling. We're committed to providing a platform you can trust.
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

export default MissionPage;