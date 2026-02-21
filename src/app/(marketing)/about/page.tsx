import type { Metadata } from 'next';
import AboutContent from './_components/AboutContent';

export const metadata: Metadata = {
  title: 'About StrayLight - AI Career Guidance for Gen-Z Professionals',
  description:
    "Learn about StrayLight's mission to guide Gen-Z professionals through the AI revolution. Discover how we bridge research and practical career guidance.",
};

export default function AboutPage() {
  return <AboutContent />;
}
