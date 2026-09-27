import { useEffect, useRef, useState } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';
// Injected into the iframe document on mobile so the landing page reads as a
// native mobile screen instead of a shrunken desktop site (drops the fixed
// desktop nav header). Desktop viewports keep the full landing page as-is.
const MOBILE_HIDE_CSS = 'header{display:none!important}body{padding-top:0!important}';

export default function About() {
  const iframeRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const apply = () => {
      const doc = iframe.contentDocument;
      if (!doc || !doc.head) return;
      let style = doc.getElementById('btau-mobile-hide');
      if (isMobile) {
        if (!style) {
          style = doc.createElement('style');
          style.id = 'btau-mobile-hide';
          doc.head.appendChild(style);
        }
        style.textContent = MOBILE_HIDE_CSS;
      } else if (style) {
        style.remove();
      }
    };
    iframe.addEventListener('load', apply);
    apply();
    return () => iframe.removeEventListener('load', apply);
  }, [isMobile]);

  return (
    <iframe
      ref={iframeRef}
      src="/landing.html"
      title="Back That App Up! — Landing"
      className={`h-[100dvh] w-full border-0 ${isMobile ? 'mx-auto max-w-md' : ''}`}
    />
  );
}