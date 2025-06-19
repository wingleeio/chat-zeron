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

  // Add event listeners for scroll, resize, and DOM changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    checkOverflow();

    // Scroll and resize listeners
    container.addEventListener("scroll", checkOverflow);
    window.addEventListener("resize", checkOverflow);

    // ResizeObserver to detect content size changes
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(checkOverflow);
    });
    resizeObserver.observe(container);

    // MutationObserver to detect when children are added/removed
    const mutationObserver = new MutationObserver(() => {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(checkOverflow);
    });
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"], // Monitor style changes that might affect layout
    });

    // Cleanup function
    return () => {
      container.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  // Re-check overflow when children change
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated after children change
    requestAnimationFrame(checkOverflow);
  }, [children]);

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
