"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface TrackingPixelsData {
  metaPixelId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  googleAnalyticsId: string;
  gtmId: string;
  tiktokPixelId: string;
  isMetaEnabled: boolean;
  isGoogleAdsEnabled: boolean;
  isGoogleAnalyticsEnabled: boolean;
  isGtmEnabled: boolean;
  isTiktokEnabled: boolean;
}

export default function TrackingPixels() {
  const [pixels, setPixels] = useState<TrackingPixelsData | null>(null);

  useEffect(() => {
    fetch("/api/settings?keys=tracking_pixels")
      .then((res) => res.json())
      .then((data) => {
        if (data.tracking_pixels) {
          setPixels(data.tracking_pixels);
        }
      })
      .catch(() => {});
  }, []);

  if (!pixels) return null;

  return (
    <>
      {/* Google Tag Manager */}
      {pixels.isGtmEnabled && pixels.gtmId && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${pixels.gtmId.replace(/[^A-Za-z0-9-]/g, "")}');
            `,
          }}
        />
      )}

      {/* Meta (Facebook) Pixel */}
      {pixels.isMetaEnabled && pixels.metaPixelId && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixels.metaPixelId.replace(/[^0-9]/g, "")}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* Google Ads (gtag.js) */}
      {pixels.isGoogleAdsEnabled && pixels.googleAdsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(pixels.googleAdsId)}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-ads"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${pixels.googleAdsId.replace(/[^A-Za-z0-9-]/g, "")}');
                ${pixels.googleAdsConversionLabel ? `window.__GADS_CONVERSION_LABEL = '${pixels.googleAdsId.replace(/[^A-Za-z0-9-]/g, "")}/${pixels.googleAdsConversionLabel.replace(/[^A-Za-z0-9_-]/g, "")}';` : ""}
              `,
            }}
          />
        </>
      )}

      {/* Google Analytics 4 */}
      {pixels.isGoogleAnalyticsEnabled && pixels.googleAnalyticsId && !pixels.isGoogleAdsEnabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(pixels.googleAnalyticsId)}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${pixels.googleAnalyticsId.replace(/[^A-Za-z0-9-]/g, "")}');
              `,
            }}
          />
        </>
      )}

      {/* If both Google Ads and GA are enabled, configure both in the Ads script */}
      {pixels.isGoogleAdsEnabled && pixels.isGoogleAnalyticsEnabled && pixels.googleAnalyticsId && (
        <Script
          id="google-analytics-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof gtag === 'function') {
                gtag('config', '${pixels.googleAnalyticsId.replace(/[^A-Za-z0-9-]/g, "")}');
              }
            `,
          }}
        />
      )}

      {/* TikTok Pixel */}
      {pixels.isTiktokEnabled && pixels.tiktokPixelId && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
                ttq.load('${pixels.tiktokPixelId.replace(/[^A-Za-z0-9]/g, "")}');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      )}
    </>
  );
}
