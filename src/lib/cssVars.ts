import type { CSSProperties } from 'react';

/** Typed inline style for CSS custom properties (e.g. the `.anim-enter` offsets). */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}
