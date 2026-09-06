'use client';

import { motion, useMotionValue, useSpring, useTransform, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

export function FadeIn({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const stageVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={stageVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  );
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const motionMap = {
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  p: motion.p,
  dl: motion.dl,
  span: motion.span,
  li: motion.li,
  details: motion.details,
  summary: motion.summary,
};

export function Item({
  as = 'div',
  children,
  className,
  variants = itemVariants,
}: {
  as?: keyof typeof motionMap;
  children: ReactNode;
  className?: string;
  variants?: Variants;
}) {
  const Comp = motionMap[as] ?? motion.div;
  return (
    <Comp className={className} variants={variants}>
      {children}
    </Comp>
  );
}

export function Float({
  children,
  amplitude = 12,
  duration = 5,
  className,
}: {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

export function TiltCard({
  children,
  className,
  maxTilt = 10,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [maxTilt, -maxTilt]), { stiffness: 260, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-maxTilt, maxTilt]), { stiffness: 260, damping: 20 });
  const scale = useSpring(1.02, { stiffness: 200, damping: 20 });

  return (
    <motion.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, scale, transformStyle: 'preserve-3d', perspective: 800 }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width - 0.5);
        my.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
