'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getFavorites, toggleFavorite, subscribeFavorites } from '@/lib/favorites';

interface FavoritesContextValue {
  favorites: string[];
  favoritesCount: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const update = () => setFavorites(getFavorites());
    update();
    const unsub = subscribeFavorites(update);
    return unsub;
  }, []);

  const toggle = useCallback((productId: string) => {
    setFavorites(toggleFavorite(productId));
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoritesCount: favorites.length,
      isFavorite: (id) => favorites.includes(id),
      toggleFavorite: toggle,
    }),
    [favorites, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}