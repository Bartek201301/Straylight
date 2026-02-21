'use client';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Iphone15Pro } from './iphone-15-pro';

type StickyContentItem = {
  title: React.ReactNode;
  description: string;
  imageSrc: string;
  imageAlt: string;
  blurDataURL?: string;
};

const EAGER_LOAD_COUNT = 3;
const PREFETCH_AHEAD_COUNT = 2;

export const StickyScroll = ({ content }: { content: StickyContentItem[] }) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(false);
  const ref = useRef<any>(null);
  const mobileContentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const desktopContentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Layout detection
  useEffect(() => {
    const checkLayout = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkLayout();
    window.addEventListener('resize', checkLayout);

    return () => {
      window.removeEventListener('resize', checkLayout);
    };
  }, []);

  // Use intersection observer for smooth scroll detection
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Choose the correct ref array based on current layout
    const currentRefs = isMobile
      ? mobileContentRefs.current
      : desktopContentRefs.current;

    currentRefs.forEach((contentRef, index) => {
      if (contentRef) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              // Change active card when section is prominently in view
              if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                setActiveCard(index);
              }
            });
          },
          {
            threshold: [0, 0.1, 0.3, 0.5, 0.7, 1],
            rootMargin: '-20% 0px -20% 0px', // Better mobile detection
          }
        );

        observer.observe(contentRef);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [content.length, isMobile]); // Re-run when layout changes

  const shouldReduceMotion = useReducedMotion();
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const prefetchedIndexes = useRef<Set<number>>(new Set());
  const markImageLoaded = useCallback((index: number) => {
    setLoadedImages((prev) =>
      prev[index] ? prev : { ...prev, [index]: true }
    );
  }, []);
  const registerImageLoad = useCallback(
    (index: number) => {
      markImageLoaded(index);
    },
    [markImageLoaded]
  );

  const activeItem = content[activeCard];
  const imageTransition = useMemo(
    () => ({
      duration: shouldReduceMotion ? 0 : 0.6,
      ease: 'easeInOut' as const,
    }),
    [shouldReduceMotion]
  );

  // Preload the next few images for smoother transitions
  useEffect(() => {
    if (typeof window === 'undefined' || content.length === 0) {
      return;
    }

    const preloadTargets: number[] = [];
    for (let offset = 1; offset <= PREFETCH_AHEAD_COUNT; offset++) {
      preloadTargets.push((activeCard + offset) % content.length);
    }

    preloadTargets.forEach((index) => {
      if (prefetchedIndexes.current.has(index)) {
        return;
      }

      const nextImage = new window.Image();
      nextImage.src = content[index].imageSrc;
      nextImage.onload = () => {
        prefetchedIndexes.current.add(index);
        registerImageLoad(index);
      };
    });
  }, [activeCard, content, registerImageLoad]);

  // Mark the initial eager images as prefetched on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    content.slice(0, EAGER_LOAD_COUNT).forEach((item, index) => {
      if (prefetchedIndexes.current.has(index)) {
        return;
      }

      const eagerImage = new window.Image();
      eagerImage.src = item.imageSrc;
      eagerImage.onload = () => {
        prefetchedIndexes.current.add(index);
        registerImageLoad(index);
      };
    });
  }, [content, registerImageLoad]);

  const isActiveImageLoaded = loadedImages[activeCard];
  const skeletonClassName = shouldReduceMotion
    ? 'absolute inset-0 bg-slate-900/60 pointer-events-none'
    : 'absolute inset-0 bg-slate-900/60 animate-pulse pointer-events-none';

  if (!activeItem) {
    return null;
  }

  return (
    <div className="relative w-full bg-black" ref={ref}>
      {/* Mobile Layout: iPhone Only */}
      <div className="block lg:hidden">
        <div className="relative pt-32">
          {/* Sticky Container with Fixed Layout */}
          <div className="sticky top-0 h-screen overflow-hidden z-10">
            {/* iPhone Container - Fixed Position */}
            <div className="absolute inset-0 flex items-center justify-center pt-8 pb-80">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative flex items-center justify-center"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`phone-mobile-${activeCard}`}
                    initial={{
                      opacity: shouldReduceMotion ? 1 : 0,
                      scale: shouldReduceMotion ? 1 : 0.94,
                    }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{
                      opacity: shouldReduceMotion ? 1 : 0,
                      scale: shouldReduceMotion ? 1 : 0.94,
                    }}
                    transition={imageTransition}
                    className="relative inline-flex"
                  >
                    {!isActiveImageLoaded && (
                      <div
                        className={`${skeletonClassName} rounded-[55.75px]`}
                        aria-hidden
                      />
                    )}
                    <Iphone15Pro
                      width={280}
                      height={560}
                      className="drop-shadow-2xl max-h-[50vh] max-w-[80vw] w-auto h-auto"
                      src={activeItem.imageSrc}
                    />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Text Content - Fixed Position at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-80 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-6 mx-4">
              <motion.h2
                key={`mobile-title-${activeCard}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-2xl font-bold text-white mb-3 text-center font-inter"
              >
                {activeItem.title}
              </motion.h2>
              <motion.p
                key={`mobile-desc-${activeCard}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                className="text-sm sm:text-base text-slate-300 text-center leading-relaxed font-source max-h-32 overflow-hidden"
              >
                {activeItem.description}
              </motion.p>
            </div>
          </div>

          {/* Invisible scroll trigger sections distributed throughout the scroll area */}
          {content.map((item, index) => (
            <div
              key={`mobile-trigger-${index}`}
              ref={(el) => {
                mobileContentRefs.current[index] = el;
              }}
              className="absolute w-1 h-1 opacity-0 pointer-events-none"
              style={{
                top: `${index * 100 + 10}vh`,
                left: '50%',
              }}
            />
          ))}

          {/* Scroll area - creates the scrollable space */}
          <div style={{ height: `${(content.length - 1) * 100 + 120}vh` }} />
        </div>
      </div>

      {/* Desktop Layout: Sticky Side-by-side */}
      <div className="hidden lg:flex">
        {/* Content Side - Takes up left half */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="py-20">
            {content.map((item, index) => (
              <motion.div
                key={`desktop-item-${index}`}
                ref={(el) => {
                  desktopContentRefs.current[index] = el;
                }}
                className="min-h-[60vh] flex flex-col justify-center py-16"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20%' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <motion.h2
                  animate={{
                    opacity: activeCard === index ? 1 : 0.3,
                    scale: activeCard === index ? 1 : 0.96,
                    x: activeCard === index ? 0 : 15,
                  }}
                  initial={{
                    opacity: index === 0 ? 1 : 0.3,
                    scale: index === 0 ? 1 : 0.96,
                    x: index === 0 ? 0 : 15,
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 font-inter"
                >
                  {item.title}
                </motion.h2>
                <motion.p
                  animate={{
                    opacity: activeCard === index ? 1 : 0.3,
                    x: activeCard === index ? 0 : 15,
                  }}
                  initial={{
                    opacity: index === 0 ? 1 : 0.3,
                    x: index === 0 ? 0 : 15,
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                  className="text-lg sm:text-xl text-slate-300 leading-relaxed font-source max-w-xl"
                >
                  {item.description}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature Display Side - Sticky Container */}
        <div className="flex-1 relative">
          <div className="sticky top-0 h-screen flex items-center justify-center p-4 lg:p-8 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative flex items-center justify-center w-full h-full"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`phone-desktop-${activeCard}`}
                  initial={{
                    opacity: shouldReduceMotion ? 1 : 0,
                    scale: shouldReduceMotion ? 1 : 0.92,
                  }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: shouldReduceMotion ? 1 : 0,
                    scale: shouldReduceMotion ? 1 : 0.92,
                  }}
                  transition={imageTransition}
                  className="relative inline-flex"
                >
                  {!isActiveImageLoaded && (
                    <div
                      className={`${skeletonClassName} rounded-[55.75px]`}
                      aria-hidden
                    />
                  )}
                  <Iphone15Pro
                    width={300}
                    height={600}
                    className="drop-shadow-2xl max-h-[70vh] max-w-[80vw] w-auto h-auto"
                    src={activeItem.imageSrc}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
