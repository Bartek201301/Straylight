import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LightTool - Quiz | StrayLight',
  description:
    'Znajdź idealne narzędzia AI dopasowane do Twoich potrzeb. Szybki quiz, inteligentne rekomendacje.',
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
