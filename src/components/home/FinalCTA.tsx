'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Text and CTAs */}
          <div className="space-y-8">
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-inter leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Dołącz do tysięcy użytkowników rozwijających swoją karierę w AI
            </motion.h2>

            <motion.p
              className="text-lg text-gray-400 font-source leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Rozpocznij swoją przygodę z najbardziej zaawansowaną polską
              platformą edukacyjną skupioną na AI i nowoczesnych technologiach.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-3 bg-transparent border border-gray-700 text-gray-300 text-base font-medium rounded-lg hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-300"
              >
                Dowiedz się więcej
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-black text-base font-medium rounded-lg hover:bg-gray-100 transition-all duration-300"
              >
                Rozpocznij za darmo
              </Link>
            </motion.div>
          </div>

          {/* Right Column - Dashboard Mockup */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative bg-gray-700 rounded-2xl border border-gray-600 overflow-hidden shadow-2xl">
              {/* Browser Header */}
              <div className="bg-gray-800 px-4 py-3 border-b border-gray-600 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-gray-400 text-sm">
                      straylightcenter.com
                    </span>
                  </div>
                </div>
              </div>

              {/* Dashboard screenshot */}
              <div className="relative h-80 bg-gray-700">
                <Image
                  src="/gallery/features/home-dashboard-screen.png"
                  alt="Podgląd pulpitu platformy StrayLight"
                  fill
                  className="hidden md:block object-cover"
                  sizes="(max-width: 767px) 0px, (max-width: 1024px) 36rem, 36rem"
                />
                <Image
                  src="/gallery/features/home-dashboard-cta.png"
                  alt="Mobilny podgląd pulpitu StrayLight"
                  fill
                  className="md:hidden object-cover"
                  sizes="(max-width: 767px) 100vw, 0px"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
