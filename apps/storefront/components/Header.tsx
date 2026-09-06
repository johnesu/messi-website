'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from './CartProvider';
import { useFavorites } from './FavoritesProvider';
import { SearchIcon, CartIcon, HeartIcon } from './icons';

const LEFT_NAV = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
];

const RIGHT_NAV = [
  { href: '/training', label: 'Training' },
  { href: '/bespoke', label: 'Bespoke' },
];

export function Header() {
  const { itemCount } = useCart();
  const { favoritesCount } = useFavorites();

  return (
    <motion.header
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22, delay: 0.1 }}
      className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4"
    >
      <div className="container-page">
        <div className="relative flex items-center overflow-hidden rounded-2xl border border-white/60 bg-white/75 px-5 py-2.5 shadow-[0_12px_40px_-12px_rgba(120,40,20,0.35)] backdrop-blur-xl sm:px-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-brand-700/[0.06] via-transparent to-accent-500/[0.06]"
          />

          <nav className="flex flex-1 items-center gap-6 text-sm font-medium text-ink-600">
            {LEFT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative py-1 transition-colors hover:text-ink-900"
              >
                {item.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex-0 flex-none text-center">
            <Link
              href="/"
              className="group relative font-display text-xl font-extrabold tracking-tight text-brand-700"
            >
              MESI
              <span className="absolute -inset-x-2 -inset-y-1 -z-10 rounded-xl bg-brand-600/0 transition-colors duration-300 group-hover:bg-brand-600/10" />
            </Link>
          </div>

          <nav className="flex flex-1 items-center justify-end gap-1 text-sm font-medium text-ink-600">
            {RIGHT_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative px-2 py-1 transition-colors hover:text-ink-900"
              >
                {item.label}
                <span className="absolute inset-x-2 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-brand-600 to-accent-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            ))}

            <Link
              href="/shop"
              className="ml-1 rounded-md p-2 transition-all duration-200 hover:scale-110 hover:bg-ink-100 hover:text-brand-700 md:hidden"
              title="Shop"
            >
              <SearchIcon />
            </Link>
            <Link
              href="/favorites"
              className="relative hidden rounded-md p-2 transition-all duration-200 hover:scale-110 hover:bg-ink-100 hover:text-brand-700 lg:block"
              title="Favorites"
            >
              <span className="relative">
                <HeartIcon />
                {favoritesCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </span>
            </Link>
            <Link
              href="/cart"
              className="group relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-ink-100"
            >
              <span className="relative">
                <CartIcon width={21} height={21} className="transition-transform duration-200 group-hover:scale-110" />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white ring-2 ring-white"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </motion.span>
                )}
              </span>
              <span className="hidden text-sm font-semibold lg:inline">Cart</span>
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
