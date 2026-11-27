import React, { useState } from 'react';
import {
  UserPlus,
  UserMinus,
  FileEdit,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  SlidersHorizontal,
  Info,
  FolderOpen,
  MessageCircle,
  FileText,
  ArrowLeft,
  X,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { BloDefaultProfile, FormId, SavedFormRecord, TemplateState } from '../types/forms';
import { SavedFormsSection } from './SavedFormsSection';
import { DirectInstallBanner } from './PWAInstallControls';

interface FormCardConfig {
  id: FormId;
  shortTitle: string;
  englishSubtitle: string;
  hindiSubtitle: string;
  pages: string;
  icon: React.FC<{ className?: string }>;
}

const LAUNCHER_CARDS: FormCardConfig[] = [
  {
    id: 'form6',
    shortTitle: 'Form-6',
    englishSubtitle: 'New Voter Inclusion',
    hindiSubtitle: 'नए मतदाता का नाम जोड़ने हेतु',
    pages: '2 Pages',
    icon: UserPlus,
  },
  {
    id: 'form7',
    shortTitle: 'Form-7',
    englishSubtitle: 'Deletion / Objection',
    hindiSubtitle: 'नाम हटाने या आपत्ति दर्ज करने हेतु',
    pages: '1 Page',
    icon: UserMinus,
  },
  {
    id: 'form8',
    shortTitle: 'Form-8',
    englishSubtitle: 'Correction / Shifting / PwD',
    hindiSubtitle: 'संशोधन, स्थानांतरण, नया EPIC या PwD हेतु',
    pages: '2 Pages',
    icon: FileEdit,
  },
];

interface HomeLauncherScreenProps {
  templates: Record<FormId, TemplateState>;
  reloadTemplate: (formId: FormId) => Promise<void>;
  onSelectForm: (formId: FormId) => void;
  draftFlags: Record<FormId, boolean>;
  formattedDraftTime: string | null;
  draftRestored: boolean;
  onClearAllDrafts: () => void;
  bloProfile: BloDefaultProfile | null;
  onOpenBloProfile: () => void;
  savedForms: SavedFormRecord[];
  onOpenSavedRecord: (record: SavedFormRecord) => void;
  onDownloadSavedRecordPdf: (record: SavedFormRecord) => Promise<void>;
  onDeleteSavedRecord: (id: string) => Promise<void>;
  onClearAllSavedRecords: () => Promise<void>;
}

export const HomeLauncherScreen: React.FC<HomeLauncherScreenProps> = ({
  templates,
  reloadTemplate,
  onSelectForm,
  draftFlags,
  formattedDraftTime,
  draftRestored,
  onClearAllDrafts,
  bloProfile,
  onOpenBloProfile,
  savedForms,
  onOpenSavedRecord,
  onDownloadSavedRecordPdf,
  onDeleteSavedRecord,
  onClearAllSavedRecords,
}) => {
  const [homeTab, setHomeTab] = useState<'forms' | 'saved'>('forms');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const whatsappText = [
    '*blo form fill pdf* — Form-6, Form-7 & Form-8 ऑफ़लाइन PDF ऐप',
    '',
    'बिना किसी APK या Unknown-Source परमिशन के सीधे Chrome में खोलकर 1-क्लिक में *Install App* करें:',
    shareUrl,
    '',
    '• 100% Offline & Free · No Login',
    '• Live Camera Photo & Signature Crop',
    '• BLO Default Profile Auto-Fill & Direct PDF Preview',
  ].join('\n');
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const bloShortLabel = bloProfile
    ? [bloProfile.acNo ? `AC ${bloProfile.acNo}` : '', bloProfile.acName || bloProfile.districtName]
        .filter(Boolean)
        .join(' · ') || 'Active'
    : 'Not Set';

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  };

  return (
    <>
      <main className="mx-auto max-w-[960px] px-4 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-7">
        {/* Desktop Segmented Switcher (Forms vs Saved Register) */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-xl">
              {homeTab === 'forms' ? 'Select ECI Form' : 'Offline Saved Forms'}
            </h2>
            <p className="font-devanagari text-xs text-slate-500">
              {homeTab === 'forms'
                ? 'फ़ॉर्म चुनें · 100% Offline · No Login'
                : 'मोबाइल की लोकल मेमोरी में सेव किए गए सभी फ़ॉर्म'}
            </p>
          </div>

          <div className="hidden items-center rounded-lg border border-slate-200 bg-white p-0.5 sm:inline-flex">
            <button
              type="button"
              onClick={() => setHomeTab('forms')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                homeTab === 'forms'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Forms</span>
            </button>
            <button
              type="button"
              onClick={() => setHomeTab('saved')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                homeTab === 'saved'
                  ? 'bg-[#1E3A5F] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Saved ({savedForms.length})</span>
            </button>
          </div>

          {homeTab === 'saved' ? (
            <button
              type="button"
              onClick={() => setHomeTab('forms')}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Forms</span>
            </button>
          ) : null}
        </div>

        {/* 1-Tap Direct Install Prompt (only appears in Chrome when installable) */}
        {homeTab === 'forms' ? <DirectInstallBanner /> : null}

        {homeTab === 'forms' ? (
          <>
            {/* PRIMARY: Compact Native-App Style 3 Form Tiles (Visible immediately above the fold) */}
            <section
              aria-label="Choose ECI Form"
              className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3"
            >
              {LAUNCHER_CARDS.map((card) => {
                const Icon = card.icon;
                const tpl = templates[card.id];
                const hasDraft = draftFlags[card.id];

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onSelectForm(card.id)}
                    className="group flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-all duration-150 hover:border-[#1E3A5F] hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 md:flex-col md:items-start md:justify-between md:p-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1E3A5F] text-white transition-colors group-hover:bg-[#162d4b]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1 md:mt-3 md:w-full">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-[#1E3A5F]">
                          {card.shortTitle}{' '}
                          <span className="font-medium text-slate-500">
                            · {card.englishSubtitle}
                          </span>
                        </h3>
                      </div>

                      <p className="font-devanagari mt-0.5 truncate text-xs font-medium text-[#1E3A5F]">
                        {card.hindiSubtitle}
                      </p>

                      <div className="mt-1.5 flex items-center gap-2 text-[11px] tabular-nums">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            tpl.status === 'loaded'
                              ? 'text-emerald-700'
                              : tpl.status === 'loading'
                              ? 'text-amber-700'
                              : 'text-red-600'
                          }`}
                        >
                          {tpl.status === 'loaded' ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                          ) : tpl.status === 'loading' ? (
                            <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
                          ) : (
                            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>
                            {tpl.status === 'loaded'
                              ? 'Offline Ready'
                              : tpl.status === 'loading'
                              ? 'Loading...'
                              : 'Retry in Info'}
                          </span>
                        </span>

                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500">{card.pages}</span>

                        {hasDraft ? (
                          <>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-semibold text-amber-700">Draft</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <ChevronRight
                      className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1E3A5F] md:hidden"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </section>

            {/* SECONDARY: Compact 4-Icon Quick Tools Grid (True App Launcher Feel) */}
            <section aria-label="Quick App Tools" className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quick Tools
              </p>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1. BLO Default Profile */}
                <button
                  type="button"
                  onClick={onOpenBloProfile}
                  className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3 text-center transition-colors hover:border-[#1E3A5F] hover:bg-slate-50 active:scale-[0.98]"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      bloProfile
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#1E3A5F]/10 text-[#1E3A5F]'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-slate-800">
                    BLO Profile
                  </span>
                  <span className="max-w-full truncate text-[10px] text-slate-500">
                    {bloShortLabel}
                  </span>
                </button>

                {/* 2. Offline Saved Forms Register */}
                <button
                  type="button"
                  onClick={() => setHomeTab('saved')}
                  className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3 text-center transition-colors hover:border-[#1E3A5F] hover:bg-slate-50 active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F]">
                    <FolderOpen className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-slate-800">
                    Saved List
                  </span>
                  <span className="font-mono text-[10px] font-medium text-slate-500 tabular-nums">
                    {savedForms.length} {savedForms.length === 1 ? 'form' : 'forms'}
                  </span>
                </button>

                {/* 3. Direct WhatsApp Share */}
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3 text-center transition-colors hover:border-emerald-600 hover:bg-emerald-50/40 active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-slate-800">
                    WhatsApp
                  </span>
                  <span className="text-[10px] text-slate-500">Share App</span>
                </a>

                {/* 4. App Info, Templates & Policy */}
                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-3 text-center transition-colors hover:border-[#1E3A5F] hover:bg-slate-50 active:scale-[0.98]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-slate-800">
                    App Info
                  </span>
                  <span className="text-[10px] text-slate-500">Policy &amp; Status</span>
                </button>
              </div>
            </section>

            {/* Compact Play Store Independent / Unofficial Disclaimer (Always visible cleanly without bulk) */}
            <section
              aria-label="Independent Utility Disclaimer"
              className="mt-5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-500"
            >
              <span className="font-semibold text-slate-700">Disclaimer:</span> Independent
              unofficial offline PDF helper — not affiliated with Election Commission of India (
              <a
                href="https://voters.eci.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#1E3A5F] underline underline-offset-2"
              >
                voters.eci.gov.in
              </a>
              ). All data stays 100% offline on your device.{' '}
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="font-semibold text-[#1E3A5F] underline underline-offset-2"
              >
                Details
              </button>
            </section>
          </>
        ) : (
          /* Dedicated Offline Saved Forms Register View */
          <SavedFormsSection
            className="mt-2"
            records={savedForms}
            onOpenRecord={onOpenSavedRecord}
            onDownloadRecordPdf={onDownloadSavedRecordPdf}
            onDeleteRecord={onDeleteSavedRecord}
            onClearAllRecords={onClearAllSavedRecords}
          />
        )}
      </main>

      {/* Native Mobile Bottom Navigation Bar (Home Screen) */}
      <nav
        aria-label="App Navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden"
      >
        <div className="grid grid-cols-4">
          <button
            type="button"
            onClick={() => setHomeTab('forms')}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold transition-colors ${
              homeTab === 'forms' ? 'text-[#1E3A5F]' : 'text-slate-500'
            }`}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>Forms</span>
          </button>

          <button
            type="button"
            onClick={() => setHomeTab('saved')}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold transition-colors tabular-nums ${
              homeTab === 'saved' ? 'text-[#1E3A5F]' : 'text-slate-500'
            }`}
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            <span>Saved ({savedForms.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenBloProfile}
            className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold text-slate-600 active:bg-slate-100"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>BLO Profile</span>
          </button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold text-emerald-700 active:bg-emerald-50"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>Share</span>
          </a>
        </div>
      </nav>

      {/* Compact App Info, Offline Status, Draft Reset & Full Disclaimer Modal */}
      {showInfoModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-info-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 id="app-info-modal-title" className="text-base font-bold text-[#1E3A5F]">
                  blo form fill pdf — Info &amp; Status
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>100% Offline · No Login · Zero Server Upload</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                aria-label="Close app info"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600">
              {/* Offline PDF Templates Check */}
              <div>
                <p className="mb-1.5 font-semibold text-slate-800">Offline PDF Templates</p>
                <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3">
                  {LAUNCHER_CARDS.map((card) => {
                    const tpl = templates[card.id];
                    return (
                      <div key={card.id} className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-slate-700">{tpl.fileName}</span>
                        {tpl.status === 'error' ? (
                          <button
                            type="button"
                            onClick={() => void reloadTemplate(card.id)}
                            className="inline-flex items-center gap-1 font-semibold text-[#1E3A5F] underline"
                          >
                            <RefreshCw className="h-3 w-3" aria-hidden="true" />
                            Retry
                          </button>
                        ) : (
                          <span
                            className={
                              tpl.status === 'loaded'
                                ? 'font-semibold text-emerald-700'
                                : 'text-amber-700'
                            }
                          >
                            {tpl.status === 'loaded' ? 'Cached Ready' : 'Loading...'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Share & Local Draft Management */}
              <div className="space-y-2">
                <p className="font-semibold text-slate-800">Quick Actions</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyShareLink()}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy App Link</span>
                      </>
                    )}
                  </button>

                  {formattedDraftTime ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClearAllDrafts();
                        setShowInfoModal(false);
                      }}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Clear Local Draft</span>
                    </button>
                  ) : null}
                </div>
                {formattedDraftTime ? (
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {draftRestored
                      ? `Active draft restored · Saved ${formattedDraftTime}`
                      : `Active draft auto-saved · ${formattedDraftTime}`}
                  </p>
                ) : null}
              </div>

              {/* Full Independent / Unofficial Disclaimer */}
              <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3 leading-relaxed">
                <p className="font-semibold text-slate-800">
                  Unofficial / Independent Utility Disclaimer
                </p>
                <p>
                  <strong>blo form fill pdf</strong> is an independent offline PDF typing and
                  printing tool. It is <strong>not affiliated with or endorsed by the Election
                  Commission of India (ECI)</strong> or any government agency. Official electoral
                  services and blank forms are available free of charge at{' '}
                  <a
                    href="https://voters.eci.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#1E3A5F] underline"
                  >
                    voters.eci.gov.in
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://eci.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#1E3A5F] underline"
                  >
                    eci.gov.in
                  </a>
                  .
                </p>
                <p className="font-devanagari">
                  अस्वीकरण: यह एक स्वतंत्र (Unofficial) ऑफ़लाइन PDF सहायक टूल है और भारत निर्वाचन आयोग
                  (ECI) से संबद्ध नहीं है। सभी जानकारी केवल आपके फ़ोन में ऑफ़लाइन सुरक्षित रहती है।
                </p>
                <div className="pt-1">
                  <a
                    href="/privacy-policy.html"
                    className="font-semibold text-[#1E3A5F] underline underline-offset-2"
                  >
                    Open Full Privacy Policy →
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#162d4b]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
