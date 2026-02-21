'use client';

import React, { useEffect, useState } from 'react';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { GrowthChart } from '@/components/ui/growth-chart';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GrowthData {
  date: string;
  value: number;
}

interface StatsData {
  totalUsers: number;
  totalArticles: number;
  totalTools: number;
  usersGrowthData: GrowthData[];
  articlesGrowthData: GrowthData[];
  toolsGrowthData: GrowthData[];
  usersGrowthPercentage: number;
  articlesGrowthPercentage: number;
  toolsGrowthPercentage: number;
  newArticles: number;
  newTools: number;
  articlesTrend: { direction: 'up' | 'down' | 'same'; percentage: number };
  toolsTrend: { direction: 'up' | 'down' | 'same'; percentage: number };
}

export default function CommunityGrowth() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const cacheBuster = `?t=${timestamp}`;

        const [usersRes, articlesRes, toolsRes, weeklyRes] = await Promise.all([
          fetch(`/api/stats/users${cacheBuster}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }),
          fetch(`/api/stats/articles${cacheBuster}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }),
          fetch(`/api/stats/tools${cacheBuster}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }),
          fetch(`/api/stats/weekly${cacheBuster}`, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }),
        ]);

        if (!usersRes.ok || !articlesRes.ok || !toolsRes.ok || !weeklyRes.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const [usersData, articlesData, toolsData, weeklyData] =
          await Promise.all([
            usersRes.json(),
            articlesRes.json(),
            toolsRes.json(),
            weeklyRes.json(),
          ]);

        setStats({
          totalUsers: usersData.totalUsers,
          totalArticles: articlesData.totalArticles,
          totalTools: toolsData.totalTools,
          usersGrowthData: usersData.growthData,
          articlesGrowthData: articlesData.growthData,
          toolsGrowthData: toolsData.growthData,
          usersGrowthPercentage: usersData.growthPercentage,
          articlesGrowthPercentage: articlesData.growthPercentage,
          toolsGrowthPercentage: toolsData.growthPercentage,
          newArticles: weeklyData.newArticles,
          newTools: weeklyData.newTools,
          articlesTrend: weeklyData.articlesTrend,
          toolsTrend: weeklyData.toolsTrend,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Nie udało się załadować statystyk społeczności');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="h-12 bg-neutral-800 rounded-lg animate-pulse mb-4"></div>
            <div className="h-6 bg-neutral-800 rounded-lg animate-pulse max-w-2xl mx-auto"></div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="h-64 bg-neutral-800 rounded-2xl animate-pulse"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-neutral-800 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-neutral-800 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-neutral-800 rounded-lg animate-pulse w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="card-base border border-red-500/20 bg-red-500/5 rounded-xl p-8">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!stats) return null;

  const WeeklyStatCard = ({
    title,
    value,
    trend,
  }: {
    title: string;
    value: number;
    trend: { direction: 'up' | 'down' | 'same'; percentage: number };
  }) => (
    <motion.div
      className="relative card-base border border-neutral-800/50 rounded-xl p-6 hover:border-neutral-700/50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlowingEffect
        disabled={false}
        proximity={100}
        spread={80}
        variant="default"
        className="rounded-xl"
      />

      <h4 className="text-neutral-400 text-sm font-medium mb-2">{title}</h4>
      <div className="text-3xl font-bold text-white mb-3">{value}</div>

      {trend.direction !== 'same' && (
        <div
          className={cn(
            'flex items-center gap-1 text-sm px-2 py-1 rounded-full w-fit',
            trend.direction === 'up'
              ? 'text-green-400 bg-green-500/10'
              : 'text-red-400 bg-red-500/10'
          )}
        >
          <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
          <span>{trend.percentage}%</span>
        </div>
      )}

      {trend.direction === 'same' && (
        <div className="text-neutral-400 text-sm">Bez zmian</div>
      )}
    </motion.div>
  );

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <TextGenerateEffect
            words="Nasza społeczność rośnie każdego dnia"
            className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-inter font-bold mb-6"
            duration={0.8}
            filter={true}
          />
          <motion.p
            className="text-xl text-neutral-400 max-w-3xl mx-auto font-source"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            Dołącz do tysięcy użytkowników, którzy już korzystają z naszej
            platformy edukacyjnej
          </motion.p>
        </div>

        {/* Users Growth Block */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <GlowingEffect
                disabled={false}
                proximity={100}
                spread={80}
                variant="default"
                className="rounded-2xl"
              />
              <GrowthChart
                data={stats.usersGrowthData}
                title="Użytkownicy"
                totalValue={stats.totalUsers}
                growthPercentage={stats.usersGrowthPercentage}
              />
            </div>
            <div className="lg:pl-8">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 font-inter">
                Rosnąca społeczność ekspertów
              </h3>
              <p className="text-neutral-300 text-lg leading-relaxed font-source mb-6">
                Każdego dnia do naszej platformy dołączają nowi użytkownicy –
                profesjonaliści, studenci oraz pasjonaci sztucznej inteligencji.
                Wspólnie tworzymy największą w Polsce społeczność edukacyjną
                skoncentrowaną na AI i nowoczesnych technologiach.
              </p>
              <p className="text-neutral-400 text-base font-source">
                Dołącz do nas, rozwijaj swoje umiejętności i buduj karierę razem
                z najlepszymi ekspertami w branży.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Articles Growth Block */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="lg:pr-8 order-2 lg:order-1">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 font-inter">
                Artykuły tworzone przez społeczność
              </h3>
              <p className="text-neutral-300 text-lg leading-relaxed font-source mb-6">
                Nasza biblioteka artykułów nieustannie się powiększa – i to
                właśnie dzięki Tobie! Każdy opublikowany tekst to wartościowy
                wkład w rozwój całej społeczności. Twoja wiedza i doświadczenie
                pomagają innym rozwijać umiejętności i budować karierę.
              </p>
              <p className="text-neutral-400 text-base font-source">
                <strong className="text-white font-bold">
                  Dołóż swoją cegiełkę!
                </strong>{' '}
                Podziel się wiedzą, napisz artykuł i zainspiruj innych do
                rozwoju.
              </p>
            </div>
            <div className="relative order-1 lg:order-2">
              <GlowingEffect
                disabled={false}
                proximity={100}
                spread={80}
                variant="default"
                className="rounded-2xl"
              />
              <GrowthChart
                data={stats.articlesGrowthData}
                title="Artykuły"
                totalValue={stats.totalArticles}
                growthPercentage={stats.articlesGrowthPercentage}
              />
            </div>
          </div>
        </motion.div>

        {/* Tools Library Growth Block */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <GlowingEffect
                disabled={false}
                proximity={100}
                spread={80}
                variant="default"
                className="rounded-2xl"
              />
              <GrowthChart
                data={stats.toolsGrowthData}
                title="Narzędzia AI"
                totalValue={stats.totalTools}
                growthPercentage={stats.toolsGrowthPercentage}
              />
            </div>
            <div className="lg:pl-8">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 font-inter">
                Największa biblioteka narzędzi AI
              </h3>
              <p className="text-neutral-300 text-lg leading-relaxed font-source mb-6">
                Nasza kolekcja narzędzi AI rozwija się w zawrotnym tempie!
                Każdego dnia dodajemy nowe rozwiązania, które ułatwiają pracę i
                pozwalają być na bieżąco z najnowszymi technologiami. Od
                automatyzacji po analizę danych – znajdziesz tu wszystko, czego
                potrzebujesz.
              </p>
              <p className="text-neutral-400 text-base font-source">
                Odkryj narzędzia, które odmienią Twój sposób pracy, zwiększą
                efektywność i sprawią, że codzienne zadania staną się prostsze i
                przyjemniejsze.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Weekly Stats */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-12 font-inter">
            Statystyki tygodniowe
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <WeeklyStatCard
              title="Nowe artykuły (7 dni)"
              value={stats.newArticles}
              trend={stats.articlesTrend}
            />
            <WeeklyStatCard
              title="Nowe narzędzia (7 dni)"
              value={stats.newTools}
              trend={stats.toolsTrend}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
