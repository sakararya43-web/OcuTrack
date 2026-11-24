import React from 'react';
import { motion, type Variants } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}

const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: 'easeOut',
    },
  },
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  delay = 0,
  as: Component = 'div',
}) => {
  const MotionComponent = motion.create(Component as React.ElementType);

  return (
    <MotionComponent
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: revealVariants.hidden,
        visible: {
          ...revealVariants.visible,
          transition: {
            ...(revealVariants.visible as { transition?: Record<string, unknown> }).transition,
            delay,
          },
        },
      }}
    >
      {children}
    </MotionComponent>
  );
};

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 0.08 }) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        ...staggerContainerVariants,
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.div
      className={className}
      variants={staggerItemVariants}
    >
      {children}
    </motion.div>
  );
};
