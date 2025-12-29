/**
 * Page Transition Template
 *
 * This template provides smooth page transitions using Framer Motion.
 * It wraps all pages in the (main) route group and applies
 * a fade-in animation when navigating between pages.
 *
 * Template files are re-rendered on navigation (unlike layouts),
 * making them perfect for page transition animations.
 *
 * @module app/[lang]/(main)/template
 */

'use client';

import { motion } from 'motion/react';

/**
 * Template Props Interface
 */
interface TransitionTemplateProps {
  children: React.ReactNode;
}

/**
 * Page Transition Component
 *
 * Uses Framer Motion to animate page transitions.
 * Animation: Fade in with ease-in-out timing
 */
export default function TransitionTemplate({
  children,
}: TransitionTemplateProps) {
  return (
    <motion.div
      // Initial state: invisible
      initial={{ opacity: 0 }}
      // Animate to: fully visible
      animate={{ opacity: 1 }}
      // Smooth transition timing
      transition={{
        ease: 'easeInOut',
        duration: 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}
