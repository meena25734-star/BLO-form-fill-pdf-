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
} from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Automatically suppress when already running as a standalone installed mobile app
  if (isInstalled) {
    return null;
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyUrl = async () => {
    if (!appUrl) return;
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
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
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 sm:px-3.5 sm:text-sm whitespace-nowrap shrink-0"
        title="Install BLO ECI App on Mobile or package Android APK"
      >
        {isInstallable ? (
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {isInstallable ? 'Install App' : isIOS ? 'Install on iPhone' : 'Mobile App / APK'}
        </span>
        <span className="sm:hidden">{isInstallable ? 'Install' : 'App'}</span>
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
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Android &amp; iOS Standalone App · Offline Ready
                </p>
                <h2
                  id="mobile-app-install-title"
                  className="mt-0.5 text-base font-bold text-[#1E3A5F] sm:text-lg"
                >
                  Install BLO ECI Mobile App / Export Android APK
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
                    Option 1: Direct Android App Install (Fastest — No APK Warning)
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
                    The <strong>BLO ECI App</strong> icon installs in your App Drawer, opens
                    full-screen without the browser bar, and caches all 3 official ECI PDF
                    templates for <strong>offline use</strong>.
                  </li>
                </ol>
              </div>

              {/* Option 2: Export .APK via PWABuilder */}
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <Package className="h-4 w-4 text-[#1E3A5F] shrink-0" aria-hidden="true" />
                  <span>Option 2: Generate a Shareable Android .APK File</span>
                </div>
                <p className="text-xs text-slate-600">
                  This app is configured with a complete Web App Manifest, Service Worker, and
                  Android maskable icons so you can wrap it into a signed Android{' '}
                  <span className="font-mono font-medium text-slate-800">.apk</span> in 2 minutes:
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-600">
                  <li>Copy your live app URL below.</li>
                  <li>
                    Open <strong>pwabuilder.com</strong>, paste the URL, and click{' '}
                    <strong>Start</strong>.
                  </li>
                  <li>
                    Choose <strong>Package for Stores → Android → Download Package</strong> to get
                    your ready-to-install <span className="font-mono">.apk</span> file for WhatsApp
                    / offline sharing.
                  </li>
                </ol>

                {appUrl ? (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-700">
                      {appUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopyUrl()}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1E3A5F] transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                    >
                      {copied ? (
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
                ) : null}
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
