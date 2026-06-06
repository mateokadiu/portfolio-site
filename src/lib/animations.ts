// Shared motion primitives so every tile feels the same.

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT_QUAD = [0.45, 0, 0.55, 1] as const;

export const spring = {
  soft: { type: 'spring' as const, stiffness: 220, damping: 28, mass: 0.6 },
  snappy: { type: 'spring' as const, stiffness: 360, damping: 26, mass: 0.5 },
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as const },
  transition: { duration: 0.55, ease: EASE_OUT_EXPO },
};
