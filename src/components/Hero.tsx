import gsap from 'gsap';
import { useEffect, useRef } from 'react';

// Lightweight char-splitter — we don't ship the paid SplitText plugin, but the
// effect is the same: per-character wrappers with a stagger.
function splitChars(node: HTMLElement): HTMLSpanElement[] {
  const text = node.textContent ?? '';
  node.textContent = '';
  const out: HTMLSpanElement[] = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? ' ' : ch;
    span.style.display = 'inline-block';
    span.style.willChange = 'transform, opacity';
    node.appendChild(span);
    out.push(span);
  }
  return out;
}

export default function Hero() {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!nameRef.current || !taglineRef.current || !cueRef.current) return;

    if (reduce) {
      gsap.set(nameRef.current, { opacity: 1 });
      gsap.set(taglineRef.current, { opacity: 1 });
      gsap.set(cueRef.current, { opacity: 1 });
      return;
    }

    const chars = splitChars(nameRef.current);
    gsap.set(chars, { yPercent: 110, opacity: 0 });
    gsap.set(taglineRef.current, { opacity: 0, y: 14 });
    gsap.set(cueRef.current, { opacity: 0, y: 8 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(chars, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.025 })
      .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.7 }, '-=0.45')
      .to(cueRef.current, { opacity: 1, y: 0, duration: 0.5 }, '-=0.25');

    const cueTween = gsap.to(cueRef.current, {
      y: 6,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      tl.kill();
      cueTween.kill();
    };
  }, []);

  return (
    <section className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-6 pb-12 pt-20 sm:pt-28">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
        tirana, al · senior full-stack
      </p>
      <h1
        ref={nameRef}
        className="hero-name mt-4 overflow-hidden font-display text-[clamp(3rem,9vw,8.5rem)] font-semibold leading-[0.95] tracking-tight text-foreground"
      >
        Mateo Kadiu
      </h1>
      <p
        ref={taglineRef}
        className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted sm:text-lg"
      >
        Every tile below is a project I shipped. Click in for an interactive demo of how it works.
      </p>

      <div
        ref={cueRef}
        className="mt-14 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted"
        aria-hidden="true"
      >
        <span>scroll</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4v16m0 0l-6-6m6 6l6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
