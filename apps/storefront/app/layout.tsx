import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartProvider } from '@/components/CartProvider';
import { FavoritesProvider } from '@/components/FavoritesProvider';

export const metadata: Metadata = {
  title: 'MESI | Mother Elizabeth Sewing Institute',
  description: 'Mother Elizabeth Sewing Institute — empowering lives through the art of fashion. Heritage craftsmanship meets modern innovation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <FavoritesProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
