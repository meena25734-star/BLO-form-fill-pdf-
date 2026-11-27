import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  WifiOff,
  X,
  Check,
  Copy,
  Package,
  Share,
  MoreVertical,
  ShieldCheck,
  Image as ImageIcon,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

const PLAY_STORE_ASSETS = [
  {
    label: 'App Icon (512×512 PNG)',
    href: '/pwa-512x512.png',
    downloadName: 'blo-form-fill-pdf-icon-512x512.png',
  },
  {
    label: 'Feature Graphic (1024×500 PNG)',
    href: '/screenshots/feature-graphic-1024x500.png',
    downloadName: 'blo-form-fill-pdf-feature-1024x500.png',
  },
  {
    label: 'Mobile Screenshot 1 — Home (1080×1920)',
    href: '/screenshots/mobile-home.png',
    downloadName: 'blo-form-fill-pdf-mobile-home.png',
  },
  {
    label: 'Mobile Screenshot 2 — Form 6 (1080×1920)',
    href: '/screenshots/mobile-form6.png',
    downloadName: 'blo-form-fill-pdf-mobile-form6.png',
  },
  {
    label: 'Tablet / Wide Screenshot (1920×1080)',
    href: '/screenshots/desktop-home.png',
    downloadName: 'blo-form-fill-pdf-desktop-home.png',
  },
];

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'app' | 'privacy' | null>(null);

  // Automatically suppress when already running as a standalone installed mobile app
  if (isInstalled) {
    return null;
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const privacyUrl = appUrl ? `${appUrl}/privacy-policy.html` : '/privacy-policy.html';

  const handleCopy = async (text: string, key: 'app' | 'privacy') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  };

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handlePrimaryClick()}
        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 sm:px-3.5 sm:text-sm whitespace-nowrap shrink-0"
        title="Install blo form fill pdf on Mobile or package Android APK / Play Store AAB"
      >
        {isInstallable ? (
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {isInstallable ? 'Install App' : isIOS ? 'Install on iPhone' : 'Mobile App / Play Store'}
        </span>
        <span className="sm:hidden">{isInstallable ? 'Install' : 'App / APK'}</span>
      </button>

      {showGuideModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-app-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[1px]"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  blo form fill pdf · Offline Ready · PWABuilder &amp; Play Store Ready
                </p>
                <h2
                  id="mobile-app-install-title"
                  className="mt-0.5 text-base font-bold text-[#1E3A5F] sm:text-lg"
                >
                  Install Mobile App / Export Android APK &amp; Play Store Package
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close mobile installation guide"
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-5 text-xs leading-relaxed text-slate-700 sm:text-sm">
              {/* Option 1: Direct Install on Android Chrome */}
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Smartphone className="h-4 w-4 text-[#1E3A5F] shrink-0" aria-hidden="true" />
                  <span>
                    Option 1: Direct Android App Install (Fastest)
                    {isAndroid ? ' · Detected Android' : ''}
                  </span>
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-600">
                  <li>
                    Open this app URL directly in <strong>Google Chrome</strong> on your Android
                    phone.
                  </li>
                  <li>
                    Tap the{' '}
                    <span className="inline-flex items-center font-semibold text-slate-800">
                      <MoreVertical className="mx-0.5 h-3.5 w-3.5" aria-hidden="true" />
                      menu
                    </span>{' '}
                    at top-right and select <strong>Install app</strong> (or{' '}
                    <strong>Add to Home screen</strong>).
                  </li>
                  <li>
                    <strong>blo form fill pdf</strong> installs in your App Drawer, opens
                    full-screen, and caches all 3 official ECI PDF templates for{' '}
                    <strong>100% offline use</strong>.
                  </li>
                </ol>
              </div>

              {/* Option 2: PWABuilder Android APK / Google Play Store AAB */}
              <div className="space-y-2.5 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Package className="h-4 w-4 text-[#1E3A5F] shrink-0" aria-hidden="true" />
                  <span>Option 2: PWABuilder Android .APK &amp; Google Play Store (.AAB)</span>
                </div>
                <p className="text-xs text-slate-600">
                  Configured with Web App Manifest, Service Worker, narrow + wide screenshots,
                  app shortcuts, maskable icons, and Privacy Policy for{' '}
                  <strong>pwabuilder.com</strong> and <strong>Google Play Console</strong>:
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-600">
                  <li>Copy your live app URL below and open <strong>pwabuilder.com</strong>.</li>
                  <li>
                    Paste the URL, click <strong>Start</strong>, then choose{' '}
                    <strong>Package for Stores → Android</strong>.
                  </li>
                  <li>
                    Download the signed package (includes <span className="font-mono">.aab</span>{' '}
                    for Google Play Store and <span className="font-mono">.apk</span> for direct
                    testing).
                  </li>
                </ol>

                {appUrl ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        App URL
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-700">
                        {appUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopy(appUrl, 'app')}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1E3A5F] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                      >
                        {copiedKey === 'app' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            Copy URL
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <ShieldCheck
                        className="h-3.5 w-3.5 text-emerald-700 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        Privacy URL
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-700">
                        {privacyUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleCopy(privacyUrl, 'privacy')}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1E3A5F] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                      >
                        {copiedKey === 'privacy' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Downloadable Play Store Graphics & Screenshots */}
                <div className="pt-2">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <ImageIcon className="h-3.5 w-3.5 text-[#1E3A5F]" aria-hidden="true" />
                    <span>Google Play Console Store Assets (Ready to Download)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {PLAY_STORE_ASSETS.map((asset) => (
                      <a
                        key={asset.href}
                        href={asset.href}
                        download={asset.downloadName}
                        className="inline-flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-medium text-slate-700 transition-colors hover:border-[#1E3A5F] hover:text-[#1E3A5F]"
                      >
                        <span className="truncate">{asset.label}</span>
                        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option 3: iPhone / iPad Safari */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Share className="h-4 w-4 text-[#1E3A5F] shrink-0" aria-hidden="true" />
                  <span>
                    Option 3: iPhone / iPad (Safari){isIOS ? ' · Detected iOS' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Open in <strong>Safari</strong>, tap the <strong>Share</strong> icon in the
                  toolbar, then tap <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#162d4b]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export const DirectInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showQuickSteps, setShowQuickSteps] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallAction = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowQuickSteps((prev) => !prev);
  };

  return (
    <section
      aria-label="Direct App Install"
      className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 sm:px-4"
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-emerald-950 sm:text-sm">
            Direct Mobile App Install · No Protection Warning
          </p>
          <p className="font-devanagari mt-0.5 truncate text-[11px] text-emerald-800 sm:text-xs">
            बिना APK या किसी परमिशन के 1 क्लिक में ऑफ़लाइन ऐप इंस्टॉल करें
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void handleInstallAction()}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{isInstallable ? 'Install App' : 'Install Now'}</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install banner"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {showQuickSteps && !isInstallable ? (
        <div className="mt-2.5 border-t border-emerald-200/80 pt-2 text-[11px] leading-relaxed text-emerald-950">
          {isIOS ? (
            <p className="font-devanagari">
              <strong>iPhone / Safari:</strong> नीचे <strong>Share</strong> बटन दबाएं →{' '}
              <strong>Add to Home Screen</strong> चुनें।
            </p>
          ) : (
            <p className="font-devanagari">
              <strong>Android Chrome:</strong> ऊपर दाईं ओर{' '}
              <strong>⋮ (तीन डॉट)</strong> दबाएं → <strong>Install app</strong> चुनें — बिना किसी
              सिक्योरिटी वार्निंग के ऐप सीधे मोबाइल में आ जाएगा।{' '}
              <a
                href="/download.html"
                className="font-semibold text-[#1E3A5F] underline underline-offset-2"
              >
                Download Page खोलें
              </a>
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
};

export const ShareAppWhatsAppBar: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const shareText = [
    '*blo form fill pdf* — Form-6, Form-7 & Form-8 ऑफ़लाइन PDF ऐप',
    '',
    'बिना किसी APK या Unknown-Source परमिशन के सीधे Chrome में खोलकर 1-क्लिक में *Install App* करें:',
    shareUrl,
    '',
    '• 100% Offline & Free · No Login',
    '• Live Camera Photo & Signature Crop',
    '• BLO Default Profile Auto-Fill & Direct PDF Preview',
  ].join('\n');

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'blo form fill pdf — Offline Form 6, 7 & 8 PDF Tool',
          text: 'बिना किसी APK परमिशन के सीधे Chrome में खोलकर 1-क्लिक में Install App करें (100% Offline):',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed; fall back to copy
      }
    }
    await handleCopyLink();
  };

  return (
    <section
      aria-label="Share App on WhatsApp"
      className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900">Share App Link on WhatsApp</h3>
        <p className="font-devanagari mt-0.5 text-xs text-slate-600">
          दूसरे BLO साथियों को सीधे WhatsApp पर लिंक भेजें — वे बिना किसी APK या सिक्योरिटी परमिशन के
          सीधे 1-क्लिक में ऐप इंस्टॉल कर सकेंगे।
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span>Share on WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={() => void handleNativeShare()}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              <span>Link Copied</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Share / Copy Link</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 z-40 flex items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900 shadow-md sm:bottom-4 sm:left-4 sm:right-auto"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-700" aria-hidden="true" />
      <span>Offline Mode — Cached ECI templates &amp; local draft active.</span>
    </div>
  );
};
