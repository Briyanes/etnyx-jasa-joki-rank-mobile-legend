"use client";

import Script from "next/script";

interface LiveChatProps {
  propertyId?: string;
  widgetId?: string;
}

export default function LiveChat({ 
  propertyId = "YOUR_PROPERTY_ID", 
  widgetId = "YOUR_WIDGET_ID" 
}: LiveChatProps) {
  // Don't render if no valid IDs provided
  if (propertyId === "YOUR_PROPERTY_ID" || widgetId === "YOUR_WIDGET_ID") {
    return null;
  }

  return (
    <Script
      id="tawk-to"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
}
