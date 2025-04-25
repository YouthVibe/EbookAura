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
        // Delay ad loading slightly to ensure DOM is ready and AdSense script is loaded
        const timer = setTimeout(() => {
          try {
            // Check if AdSense is loaded
            if (window.adsbygoogle) {
              // Initialize adsbygoogle push command
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              console.log("AdSense ad request sent for Home Ad");
            } else {
              console.warn("AdSense not loaded yet. Waiting for script to load...");
              // Try again after a short delay if adsbygoogle isn't available yet
              setTimeout(() => {
                try {
                  (window.adsbygoogle = window.adsbygoogle || []).push({});
                  console.log("AdSense ad request sent after delay");
                } catch (retryError) {
                  console.error("AdSense retry error:", retryError);
                }
              }, 1000);
            }
          } catch (e) {
            console.error("AdSense error:", e);
          }
        }, 500); // Increased timeout to ensure script is loaded
        
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <div 
      ref={adContainerRef}
      className="ad-container"
      style={{ 
        width: "100%", 
        minHeight: "280px", // Increased height for better ad visibility
        display: "block", 
        margin: "20px auto",
        overflow: "hidden",
        textAlign: "center" // Center ad unit
      }}
    >
      {/* Home Ad - Using the exact parameters provided by user */}
      <ins
        className="adsbygoogle"
        style={{ 
          display: "block",
          width: "100%",
          minHeight: "280px"
        }}
        data-ad-client="ca-pub-2456537810743091"
        data-ad-slot="5891811261"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default HomeAdComponent;
