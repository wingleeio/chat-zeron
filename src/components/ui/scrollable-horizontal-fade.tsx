import { motion } from "framer-motion";
import React, { useRef, useState, useEffect, type ReactNode } from "react";

interface ScrollableFadeProps {
  children: ReactNode; // Accepts any valid React children
  className?: string; // Optional additional class names for the outer container
}

export const ScrollableHorizontalFade: React.FC<ScrollableFadeProps> = ({
  children,
  className = "",
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowingLeft, setIsOverflowingLeft] = useState(false);
  const [isOverflowingRight, setIsOverflowingRight] = useState(false);

  // Function to check for overflow
  const checkOverflow = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setIsOverflowingLeft(scrollLeft > 0);
      setIsOverflowingRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  // Add event listeners for scroll and resize
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkOverflow(); // Initial check
      container.addEventListener("scroll", checkOverflow);
      window.addEventListener("resize", checkOverflow);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkOverflow);
      }
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="fade-gradient-left"
        animate={{ opacity: isOverflowingLeft ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        className="fade-gradient-right"
        animate={{ opacity: isOverflowingRight ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="no-scrollbar relative flex gap-2 overflow-x-auto"
      >
        {children}
      </div>
    </div>
  );
};
