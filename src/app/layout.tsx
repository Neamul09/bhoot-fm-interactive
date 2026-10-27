import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bhoot FM — Immersive Supernatural Audio Experience | ভূত এফএম',
  description:
    'Step inside the atmosphere of legendary Bhoot FM Bengali supernatural radio episodes with real-time 3D spatial audio, reactive weather, flickering hurricane lamps, and explorable rural environments.',
  keywords: ['Bhoot FM', 'RJ Russell', 'Spatial Audio', 'Three.js', 'Horror', 'Web Audio API', 'Interactive Storytelling'],
  authors: [{ name: 'Bhoot Interactive Experience Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07080a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="dark">
      <body className="antialiased bg-black text-stone-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
