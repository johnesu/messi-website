'use client';

import { useFavorites } from '@/components/FavoritesProvider';
import { HeartIcon } from './icons';

export function FavoriteButton({ productId, className }: { productId: string; className?: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(productId);

  return (
    <button
      type="button"
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(productId);
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-110 ${
        active
          ? 'bg-accent-500 text-white'
          : 'bg-white/90 text-brand-500 hover:bg-accent-500 hover:text-white'
      } ${className ?? ''}`}
    >
      <HeartIcon width={17} height={17} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}