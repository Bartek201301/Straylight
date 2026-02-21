'use client';

import React from 'react';
import { TracingBeam } from '@/components/ui/tracing-beam';
import { motion } from 'framer-motion';

export const ProblemSolution = () => {
  return (
    <section className="px-4 sm:px-6 pt-16 sm:pt-20 pb-4 sm:pb-8 relative bg-black">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage:
              'radial-gradient(ellipse 800px 600px at center, black 30%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 800px 600px at center, black 30%, transparent 80%)',
          }}
        ></div>
      </div>

      <div className="relative z-10">
        <TracingBeam className="px-6">
          <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 lg:space-y-24">
            {/* Problem Section */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-3 space-y-4 lg:space-y-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-800/50 border border-neutral-700/50">
                    <span className="text-sm font-medium text-neutral-400">
                      Problem
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white font-inter leading-none">
                    Sztuczna inteligencja rozwija się w rekordowym tempie.
                  </h2>

                  <p className="text-base sm:text-lg text-white/70 font-source leading-relaxed">
                    Pomożemy ci się odnaleźć w tym chaosie.
                  </p>
                </div>

                <div className="lg:col-span-2 relative">
                  {/* Image Placeholder - Chaotic Collage */}
                  <div className="aspect-[4/3] rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <img
                      src="/placehold1.svg"
                      alt="Chaotic collage representing information overload"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Solution Section */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
                <div className="order-2 lg:order-1 lg:col-span-2 relative">
                  {/* Image Placeholder - StrayLight Logo + Gradient */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-ai-teal-500/20 to-ai-purple-500/20 rounded-2xl border border-white/10 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-ai-teal-500/10 via-transparent to-ai-purple-500/10"></div>

                    {/* Animated gradient orb */}
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        rotate: {
                          duration: 20,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                        scale: {
                          duration: 4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }}
                      className="absolute inset-4 bg-gradient-to-r from-ai-teal-500/30 via-ai-purple-500/30 to-ai-teal-500/30 rounded-full blur-xl"
                    />

                    <div className="relative z-10 text-center space-y-2">
                      <div className="w-80 h-80 mx-auto flex items-center justify-center mb-4 mt-10">
                        <img
                          src="/transparent-logo.svg"
                          alt="StrayLight Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2 lg:col-span-3 space-y-4 lg:space-y-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-800/50 border border-neutral-700/50">
                    <span className="text-sm font-medium text-neutral-400">
                      Rozwiązanie
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white font-inter leading-none">
                    Najlepsze treści i narzędzia AI, które realnie pomogą ci w
                    pracy, szkole i życiu codziennym.
                  </h2>

                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-2 h-2 rounded-full bg-ai-teal-500"></div>
                      <span className="text-sm font-source">
                        Rzetelne źródła naukowe
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-2 h-2 rounded-full bg-ai-purple-500"></div>
                      <span className="text-sm font-source">
                        Dostępna forma przekazu
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <div className="w-2 h-2 rounded-full bg-ai-teal-500"></div>
                      <span className="text-sm font-source">
                        Aktywna społeczność
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </TracingBeam>
      </div>
    </section>
  );
};
