import Script from "next/script";
import { useEffect, useRef } from "react";

const HomeAdComponent = () => {
  const adContainerRef = useRef(null);

  useEffect(() => {
    // Make sure the component is mounted and window is available
    if (typeof window !== 'undefined' && adContainerRef.current) {
      // Ensure container has minimum width
      const containerWidth = adContainerRef.current.clientWidth || 300;
      
      // Only try to load ads if we have a visible container with width
      if (containerWidth > 0) {
        // Delay ad loading slightly to ensure DOM is ready
        const timer = setTimeout(() => {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            console.error("AdSense error:", e);
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <div 
      ref={adContainerRef}
      style={{ 
        width: "100%", 
        minHeight: "100px", 
        display: "block", 
        margin: "10px auto",
        overflow: "hidden"
      }}
    >
      {/* Home Ad */}
      <ins
        className="adsbygoogle"
        style={{ 
          display: "block",
          width: "100%",
          minHeight: "100px"
        }}
        data-ad-client="ca-pub-2456537810743091"
        data-ad-slot="5891811261"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>

      {/* No need to include the script tag here as it's already in layout.js */}
    </div>
  );
};

export default HomeAdComponent;
