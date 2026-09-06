'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SLIDES = [
  { src: 'https://www.motthelabel.com/cdn/shop/files/Atsi1d.jpg?crop=center&height=1620&width=1080', alt: 'Heritage couture gown' },
  { src: 'https://www.motthelabel.com/cdn/shop/files/Sanaa1b.jpg?crop=center&height=1620&width=1080', alt: 'Signature tailored dress' },
  { src: 'https://www.motthelabel.com/cdn/shop/files/1V5A6272_copy.jpg?crop=center&height=2400&width=1600', alt: 'Evening couture dress' },
  { src: 'https://www.motthelabel.com/cdn/shop/files/1V5A6051copy.jpg?crop=center&height=2400&width=1600', alt: 'Designer draped piece' },
  { src: 'https://www.motthelabel.com/cdn/shop/files/Tariset1a.jpg?crop=center&height=1620&width=1080', alt: 'Modern tailored set' },
];

export function HeroBackground({ interval = 3000 }: { interval?: number }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);

  useEffect(() => {
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [next, interval]);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <AnimatePresence>
        <motion.img
          key={index}
          src={SLIDES[index].src}
          alt={SLIDES[index].alt}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      </AnimatePresence>
    </div>
  );
}