import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  delay?: number;
  hover?: boolean;
  glow?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, delay = 0, hover = true, glow = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.4, 
          delay,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        whileHover={hover ? { 
          scale: 1.02, 
          y: -4,
          transition: { duration: 0.2 }
        } : undefined}
        className={cn(
          'bg-card rounded-xl border border-border/50 shadow-md transition-shadow',
          hover && 'cursor-pointer',
          glow && 'hover:shadow-glow',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

export const GlassCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, scale: 1, backdropFilter: 'blur(20px)' }}
        transition={{ duration: 0.5, delay }}
        className={cn(
          'glass-card rounded-xl p-6',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export const StaggerContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};