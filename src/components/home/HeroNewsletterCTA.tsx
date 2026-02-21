'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HeroNewsletterCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: 'Subscriber',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Nie udało się zapisać do newslettera');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Błąd sieciowy. Spróbuj ponownie.');
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content (Mobile First) */}
          <motion.div
            className="space-y-8 lg:order-1"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-inter leading-tight mb-6">
                Bądź pierwszym, który dowie się o naszych nowościach
              </h2>
              <p className="text-lg text-gray-400 font-source leading-relaxed">
                Wciąż budujemy platformę. Zapisz się, aby otrzymywać
                aktualizacje i 20% zniżki przy premierze. Bez spamu, obiecujemy!
              </p>
            </div>

            {status === 'success' ? (
              <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-6">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-xl font-semibold mb-2 font-inter text-white">
                  Gratulacje! Jesteś w naszej społeczności!
                </h3>
                <p className="font-source text-white/80">
                  Zostałeś pomyślnie zapisany do newslettera StrayLight.
                  Będziesz otrzymywać najnowsze informacje o AI i technologii.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Wprowadź swój email"
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none transition-all duration-200"
                      disabled={status === 'loading'}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading' || !email.trim()}
                    className="px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {status === 'loading' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        <span>Zapisywanie...</span>
                      </div>
                    ) : (
                      'Zapisz się'
                    )}
                  </button>
                </div>

                {status === 'error' && (
                  <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-red-300 text-sm">
                    {errorMessage}
                  </div>
                )}
              </form>
            )}

            <p className="text-sm text-gray-500">
              Dbamy o Twoje dane zgodnie z naszą{' '}
              <button className="underline hover:text-gray-400 transition-colors">
                polityką prywatności
              </button>
            </p>
          </motion.div>

          {/* Right Column - Mobile Phone Mockup */}
          <motion.div
            className="relative flex justify-center lg:order-2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* iPhone Mockup */}
            <div className="relative">
              <div className="w-72 h-[600px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden">
                {/* Phone Status Bar */}
                <div className="bg-black h-8 flex items-center justify-between px-6 text-white text-sm">
                  <span>9:41</span>
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48L5.91 12l-.91-.47L4.15 12.95zM6.5 8.5c0-2.19 1.81-4 4-4s4 1.81 4 4-1.81 4-4 4-4-1.81-4-4zm3.5 6c2.62 0 8 1.34 8 4v2H2v-2c0-2.66 5.38-4 8-4z" />
                    </svg>
                    {/* Battery Icon */}
                    <div className="flex items-center">
                      <div className="w-6 h-3 border border-white rounded-sm relative">
                        <div className="w-4 h-1.5 bg-white rounded-sm absolute top-0.5 left-0.5"></div>
                      </div>
                      <div className="w-0.5 h-1.5 bg-white rounded-r-sm ml-0.5"></div>
                    </div>
                  </div>
                </div>

                {/* Newsletter preview screenshot */}
                <div className="bg-gray-900 h-full relative overflow-hidden">
                  <Image
                    src="/gallery/features/newsletter-screen.png"
                    alt="Podgląd newslettera StrayLight Insights"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 18rem, 18rem"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
