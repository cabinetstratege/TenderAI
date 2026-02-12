import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'TenderAI',
  description: 'Le Compagnon des Marchés Publics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body>
        <div className="bg-noise" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
