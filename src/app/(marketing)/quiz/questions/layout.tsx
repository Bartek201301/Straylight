import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LightTool Quiz | StrayLight',
  description:
    'Znajdź idealne narzędzia AI dopasowane do Twoich potrzeb. Szybki quiz, inteligentne rekomendacje.',
};

/**
 * Quiz Questions Layout
 * Clean layout without navigation and footer for focused quiz experience
 */
export default function QuizQuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
