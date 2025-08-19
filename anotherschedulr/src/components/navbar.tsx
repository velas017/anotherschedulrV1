"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';


const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full pt-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="w-full relative mx-auto flex items-center justify-between rounded-full py-2.5 px-5 transition-all duration-300 bg-white border border-gray-200 shadow-sm">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="font-semibold text-lg transition-colors duration-300 text-gray-900">
                            anotherschedulr
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="transition-colors duration-200 text-gray-700 hover:text-gray-900">
                            Home
                        </Link>
                        <Link href="/mission" className="transition-colors duration-200 text-gray-700 hover:text-gray-900">
                            Mission
                        </Link>
                        <Link href="/pricing" className="transition-colors duration-200 text-gray-700 hover:text-gray-900">
                            Pricing
                        </Link>
                    </nav>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/signin" className="text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium">
                            Log in
                        </Link>
                        <Link href="/signup" className="px-4 py-2 rounded-full transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700">
                            Sign Up
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="md:hidden p-2 rounded-full transition-colors duration-200 hover:bg-gray-100"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-5 h-5 text-gray-900" />
                        ) : (
                            <Menu className="w-5 h-5 text-gray-900" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}>
                    <div className="mt-2 py-4 px-5 rounded-2xl shadow-lg bg-white border border-gray-200">
                        <nav className="flex flex-col space-y-4">
                            <Link href="/" className="transition-colors duration-200 py-2 text-gray-700 hover:text-gray-900">
                                Home
                            </Link>
                            <Link href="/mission" className="transition-colors duration-200 py-2 text-gray-700 hover:text-gray-900">
                                Mission
                            </Link>
                            <Link href="/pricing" className="transition-colors duration-200 py-2 text-gray-700 hover:text-gray-900">
                                Pricing
                            </Link>
                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <Link href="/signin" className="block text-center py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium">
                                    Log in
                                </Link>
                                <Link href="/signup" className="block w-full text-center px-4 py-2 rounded-full transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700">
                                    Sign Up
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;