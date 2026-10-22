export interface DeviceInfo {
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

export function detectDevice(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return { isMobile: false, isAndroid: false, isIOS: false };
  }
  const ua = navigator.userAgent || '';
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return {
    isMobile: isAndroid || isIOS,
    isAndroid,
    isIOS,
  };
}

export const ETAX_LINKS = {
  androidIntent: 'intent://#Intent;package=com.etaxmobile;scheme=etaxmobile;package=com.etaxmobile;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.etaxmobile;end',
  googlePlay: 'https://play.google.com/store/apps/details?id=com.etaxmobile&hl=vi',
  appStore: 'https://apps.apple.com/vn/app/etax-mobile/id1588647895',
  iosScheme: 'etaxmobile://',
  webPortal: 'https://canhan.gdt.gov.vn',
  universalRedirect: 'https://tax-agent-worker.ducviet-mta.workers.dev/api/etax-app',
};

/**
 * Attempts to launch eTax Mobile on mobile devices.
 * If on desktop, calls onDesktopFallback (e.g. to open QR modal).
 */
export function openETaxMobileApp(onDesktopFallback?: () => void): boolean {
  const device = detectDevice();

  if (device.isAndroid) {
    window.location.href = ETAX_LINKS.androidIntent;
    return true;
  }

  if (device.isIOS) {
    const start = Date.now();
    window.location.href = ETAX_LINKS.iosScheme;
    setTimeout(() => {
      if (Date.now() - start < 2500 && !document.hidden) {
        window.location.href = ETAX_LINKS.appStore;
      }
    }, 1500);
    return true;
  }

  if (onDesktopFallback) {
    onDesktopFallback();
  }
  return false;
}
