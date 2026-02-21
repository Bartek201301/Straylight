'use client';

import { useTransform, motion, useScroll, MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface StackingCardItem {
  question: string;
  answer: string;
}

const stackingCards: StackingCardItem[] = [
  {
    question: 'Kim jesteśmy?',
    answer:
      'Młodzi ludzie korzystają z AI, ale wciąż obawiają się, że sztuczna inteligencja zabierze im pracę. Naszym celem jest zmiana tego podejścia. Dlatego stworzyliśmy społeczność, w której każdy może nie tylko korzystać z wiedzy, ale także ją współtworzyć.',
  },
  {
    question: 'Co robimy?',
    answer:
      'Tworzymy społeczność młodych ludzi, w której każdy może publikować artykuły, poznawać nowe narzędzia oparte na sztucznej inteligencji oraz wzmacniać swoje CV poprzez aktywny udział na stronie.',
  },
  {
    question: 'Dla kogo jesteśmy?',
    answer:
      'Dla studentów, osób na początku kariery i specjalistów Gen‑Z, którzy chcą zrozumieć rynek pracy kształtowany przez AI i rozwijać swoje umiejętności.',
  },
  {
    question: 'Jak pomagamy?',
    answer:
      'Zapewniamy dostęp do biblioteki zasobów oraz artykułów, a także wsparcie społeczności — wszystko po to, by ułatwić realny postęp.',
  },
  {
    question: 'Nasza misja',
    answer:
      'Uprościć rozwój kariery w świecie AI i uczynić go bardziej dostępnym, praktycznym i nastawionym na działania — bez zbędnego szumu.',
  },
];

// Dodatkowy opis dla każdej karty – więcej treści, aby wypełnić przestrzeń
const moreTexts: string[] = [
  '',
  '',
  '',
  '',
  'Redukujemy szum informacyjny i skupiamy się na praktyce. Dostarczamy narzędzia, które realnie przesuwają karierę do przodu.',
];

function StackingCardsSection(): JSX.Element {
  const container = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <section className="w-full" ref={container}>
      {stackingCards.map((item, i) => {
        const targetScale = 1 - (stackingCards.length - i) * 0.05;
        return (
          <StackingCard
            key={`stack_${i}`}
            i={i}
            progress={scrollYProgress}
            range={[i * 0.25, 1]}
            targetScale={targetScale}
            question={item.question}
            answer={item.answer}
          />
        );
      })}
    </section>
  );
}

interface CardProps {
  i: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
  question: string;
  answer: string;
}

function StackingCard({
  i,
  progress,
  range,
  targetScale,
  question,
  answer,
}: CardProps): JSX.Element {
  const itemRef = useRef<HTMLDivElement | null>(null);
  useScroll({
    target: itemRef,
    offset: ['start end', 'start start'],
  });
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={itemRef}
      className="h-screen flex items-center justify-center sticky top-0"
    >
      <motion.div
        style={{ scale, top: `calc(-5vh + ${i * 25}px)` }}
        className="relative -top-[25%] h-[620px] w-11/12 sm:w-[88%] md:w-[65%] origin-top rounded-2xl backdrop-blur-md border border-white/15 bg-black/90 hover:bg-black/95 hover:border-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-300"
      >
        <div className="h-full w-full p-6 sm:p-8 md:p-10 flex flex-col md:grid md:grid-cols-2 md:gap-8 justify-between">
          {/* Text content - left side on desktop */}
          <div className="flex flex-col justify-between md:justify-start md:items-start">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/20 grid place-content-center">
                {i === 0 && (
                  <svg
                    className="w-5 h-5 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M3 22a9 9 0 0118 0"
                    />
                  </svg>
                )}
                {i === 1 && (
                  <svg
                    className="w-5 h-5 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M14.7 6.3a4 4 0 105.657 5.657L14 6.3z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M11 7l-8 8 2 2 8-8"
                    />
                  </svg>
                )}
                {i === 2 && (
                  <svg
                    className="w-5 h-5 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="8" strokeWidth={1.6} />
                    <circle cx="12" cy="12" r="3" strokeWidth={1.6} />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M12 2v3M12 19v3M2 12h3M19 12h3"
                    />
                  </svg>
                )}
                {i === 3 && (
                  <svg
                    className="w-5 h-5 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="8" strokeWidth={1.6} />
                    <circle cx="12" cy="12" r="4" strokeWidth={1.6} />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M12 4v4M12 16v4M4 12h4M16 12h4"
                    />
                  </svg>
                )}
                {i === 4 && (
                  <svg
                    className="w-5 h-5 text-white/80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M4 4v16"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.6}
                      d="M4 5h11l-2 3 2 3H4z"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {question}
                </h3>
                <div className="mt-2 h-px w-10 bg-white/20" />
              </div>
            </div>

            <div className="mt-2 md:mt-4">
              <p className="text-lg sm:text-xl leading-8 sm:leading-9 text-white/85">
                {answer}
              </p>
              {moreTexts[i] && (
                <p className="mt-2 text-base sm:text-lg leading-7 sm:leading-8 text-white/80">
                  {moreTexts[i]}
                </p>
              )}
            </div>
          </div>

          {/* Graphics area - right side on desktop, bottom on mobile */}
          <div className="mt-5 sm:mt-6 md:mt-0 md:flex md:items-center">
            <div className="h-56 sm:h-64 md:h-full md:min-h-[300px] w-full rounded-lg overflow-hidden">
              <img
                src={`/aboutpage/${i + 1}.svg`}
                alt={`Illustration for ${question}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default StackingCardsSection;
