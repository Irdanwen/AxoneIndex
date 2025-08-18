import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  className = '',
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.5 });

  useEffect(() => {
    if (isInView) {
      const startTime = Date.now();
      const startValue = 0;
      
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (value - startValue) * easeOutQuart);
        
        setCount(currentValue);
        
        if (progress >= 1) {
          clearInterval(timer);
          setCount(value);
        }
      }, 16); // ~60fps
      
      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  return (
    <span ref={ref} className={`font-bold ${className}`}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;
