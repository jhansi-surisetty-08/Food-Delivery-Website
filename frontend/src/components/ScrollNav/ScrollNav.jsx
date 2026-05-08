import { useEffect, useState } from "react";
import "./ScrollNav.css";

const ScrollNav = () => {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const updateScrollState = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      const canScroll = fullHeight > viewportHeight + 40;
      const nearBottom = scrollTop + viewportHeight >= fullHeight - 120;

      setIsScrollable(canScroll);
      setIsNearBottom(nearBottom);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  if (!isScrollable) {
    return null;
  }

  const handleClick = () => {
    window.scrollTo({
      top: isNearBottom ? 0 : document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      className="scroll-nav"
      onClick={handleClick}
      aria-label={isNearBottom ? "Scroll to top" : "Scroll to bottom"}
      title={isNearBottom ? "Scroll to top" : "Scroll to bottom"}
    >
      <span>{isNearBottom ? "↑" : "↓"}</span>
    </button>
  );
};

export default ScrollNav;
