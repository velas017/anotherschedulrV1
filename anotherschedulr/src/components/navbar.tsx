"use client";

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';


const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full pt-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="w-full relative mx-auto flex items-center justify-between rounded-full backdrop-blur-md bg-white/10 border border-white/20 py-2.5 px-5">
                    {/* Logo */}
                    <div className="flex items-center">
                        <a href="#" className="text-white font-semibold text-lg">
                            anotherschedulr
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#" className="text-white/90 hover:text-white transition-colors duration-200">
                            Product
                        </a>
                        <a href="#" className="text-white/90 hover:text-white transition-colors duration-200">
                            Mission
                        </a>
                        <a href="#" className="text-white/90 hover:text-white transition-colors duration-200">
                            Pricing
                        </a>
                    </nav>

                    {/* Desktop Sign Up */}
                    <div className="hidden md:flex">
                        <a href="/signup" className="bg-white text-blue-600 px-4 py-2 rounded-full hover:bg-white/90 transition-colors duration-200">
                            Sign Up
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="md:hidden p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-5 h-5 text-white" />
                        ) : (
                            <Menu className="w-5 h-5 text-white" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}>
                    <div className="mt-2 py-4 px-5 backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-lg">
                        <nav className="flex flex-col space-y-4">
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 py-2">
                                Product
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 py-2">
                                Mission
                            </a>
                            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 py-2">
                                Pricing
                            </a>
                            <div className="pt-4 border-t border-white/20">
                                <a href="/signup" className="block w-full text-center bg-white text-blue-600 px-4 py-2 rounded-full hover:bg-white/90 transition-colors duration-200">
                                    Sign Up
                                </a>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;