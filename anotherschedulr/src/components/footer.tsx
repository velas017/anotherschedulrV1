import { Twitter, Linkedin, Github, Mail } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
    },
    {
      name: 'GitHub',
      icon: Github,
    },
    {
      name: 'Email',
      icon: Mail,
    },
  ];

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-16">
          <div className="flex justify-center">
            {/* Brand section */}
            <div className="text-center">
              <div className="inline-block">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  anotherschedulr
                </div>
              </div>
              <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-sm">
                Flexible scheduling software curated for your small business at a fraction of the cost with premium features for one price.
              </p>
              
              {/* Social links */}
              <div className="mt-6 flex justify-center space-x-3">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.name}
                      className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                      aria-label={item.name}
                    >
                      <Icon size={16} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="py-6 border-t border-gray-800">
          <div className="text-center">
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} anotherschedulr.io. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;