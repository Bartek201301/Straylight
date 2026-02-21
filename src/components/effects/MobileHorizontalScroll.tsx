'use client';

import { motion, useTransform, useScroll } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';
import { LinkedInIcon, InstagramIcon } from '@/components/ui/icons';

type CarouselCard = {
  id: number;
  img: string;
  name: string;
  role: string;
  bio: string;
  linkedin?: string;
  instagram?: string;
};

const cards: CarouselCard[] = [
  {
    id: 1,
    img: '/kai profilowe.jpg',
    name: 'Kajetan',
    role: 'Co-founder',
    bio: '',
    linkedin: 'https://www.linkedin.com/in/kajetan-kotfis-1931b1353/',
    instagram: 'https://www.instagram.com/kotfis2025/',
  },
  {
    id: 2,
    img: '/julian profiowe.jpg',
    name: 'Julian',
    role: 'Co-founder',
    bio: '',
    linkedin: 'https://www.linkedin.com/in/julian-malicki-216367218/',
    instagram: 'https://www.instagram.com/juianmalicki/',
  },
  {
    id: 3,
    img: '/bartek profile.jpg',
    name: 'Bartek',
    role: 'Co-founder',
    bio: '',
    linkedin: 'https://www.linkedin.com/in/bartosz-swiridow-96520636b/',
    instagram: 'https://www.instagram.com/bartekswiridow/',
  },
  {
    id: 4,
    img: '/maciek profilowe.jpg',
    name: 'Maciek',
    role: 'Co-founder',
    bio: '',
    linkedin: 'https://www.linkedin.com/in/maciej-d%C4%99bicki-3aaa5b363/',
    instagram: 'https://www.instagram.com/maciek_debicki_/',
  },
];

export default function MobileHorizontalScroll(): JSX.Element {
  return (
    <section className="relative">
      <HorizontalScrollCarousel />
    </section>
  );
}

function HorizontalScrollCarousel(): JSX.Element {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', `-${(cards.length - 1) * 100}vw`]
  );

  return (
    <section
      ref={targetRef}
      className="relative"
      style={{ height: `${cards.length * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div
          style={{ x, width: `${cards.length * 100}vw` }}
          className="flex gap-0"
        >
          {cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Card({ card }: { card: CarouselCard }): JSX.Element {
  return (
    <div className="group relative h-screen w-screen overflow-hidden border-b border-white/10 bg-black">
      <div className="h-1/2 w-full grid place-content-center border-b border-white/10">
        <div className="relative h-56 w-56 sm:h-64 sm:w-64 rounded-full overflow-hidden bg-neutral-500/40 border border-white/20 ring-2 ring-white/30 shadow-2xl">
          <Image
            src={card.img}
            alt={card.name}
            fill
            sizes="(max-width: 640px) 14rem, 16rem"
            className="object-cover"
            priority
          />
        </div>
      </div>
      <div className="px-6 py-6 text-center">
        <h4 className="text-white text-4xl font-bold">{card.name}</h4>
        <p className="mt-2 text-sm font-semibold text-white/70 uppercase tracking-wider">
          {card.role}
        </p>
        {(card.linkedin || card.instagram) && (
          <div className="mt-3 flex items-center justify-center gap-4">
            {card.linkedin && (
              <a
                href={card.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors"
                aria-label={`${card.name}'s LinkedIn profile`}
              >
                <LinkedInIcon size={24} />
              </a>
            )}
            {card.instagram && (
              <a
                href={card.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors"
                aria-label={`${card.name}'s Instagram profile`}
              >
                <InstagramIcon size={24} />
              </a>
            )}
          </div>
        )}
        <div className="mx-auto mt-3 h-px w-12 bg-white/20" />
        <p className="mt-4 text-base text-white/80 leading-7 max-w-md mx-auto">
          {card.bio}
        </p>
      </div>
    </div>
  );
}
