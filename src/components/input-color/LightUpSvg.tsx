import { BoltIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function LightUpSvg() {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger the animation at random intervals
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500); // Duration of the light-up effect
    }, Math.random() * 2000); // Random interval between 0 and 2000 milliseconds

    return () => clearInterval(interval);
  }, []);

  const variants = {
    active: { opacity: 1 }, // Light-up effect properties
    inactive: { opacity: 0.7 },
  };

  return (
    <motion.svg
      animate={isAnimating ? 'active' : 'inactive'}
      variants={variants}
    >
      <BoltIcon style={{ color: 'orange' }} />
    </motion.svg>
  );
}
