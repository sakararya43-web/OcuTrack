import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: React.ElementType;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  delayMs = 0,
  as: Component = 'div',
}) => {
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Immediate reveal if no window / IntersectionObserver or user prefers reduced motion
    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsRevealed(true);
      return;
    }

    const currentEl = elementRef.current;
    if (!currentEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(currentEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Component
      ref={elementRef}
      style={{
        transitionDelay: `${delayMs}ms`,
      }}
      className={cn(
        'transition-all duration-400 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100',
        isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className
      )}
    >
      {children}
    </Component>
  );
};
