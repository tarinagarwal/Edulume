import React, { useState, useEffect } from "react";
import { ChevronUp, Zap } from "lucide-react";

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 group"
          aria-label="Scroll to top"
        >
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 bg-alien-green rounded-full opacity-20 animate-pulse scale-110"></div>

            {/* Main button */}
            <div className="relative w-12 h-12 bg-smoke-gray border-2 border-alien-green rounded-full flex items-center justify-center shadow-alien-glow hover:shadow-alien-glow-strong transition-all duration-300 hover:scale-110 hover:bg-alien-green/10">
              {/* Icon container with animation */}
              <div className="relative">
                <ChevronUp
                  className="text-alien-green group-hover:text-alien-green transition-colors duration-300"
                  size={20}
                />

                {/* Animated spark effect */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-alien-green rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
              </div>
            </div>

            {/* Hover tooltip */}
          </div>
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
