import React, { useMemo, useState, useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Download,
  Eye,
  RotateCcw,
  FileCheck,
  RefreshCw,
  ClipboardList,
  Trash2,
  ArrowLeft,
  Home,
  Save,
  SlidersHorizontal,
  FilePlus2,
} from 'lucide-react';
import { FormProvider, useFormStore } from './context/FormContext';
import { CommonHeaderSection } from './components/CommonHeaderSection';
import { Form6View } from './components/Form6View';
import { Form7View } from './components/Form7View';
import { Form8View } from './components/Form8View';
import { HomeLauncherScreen } from './components/HomeLauncherScreen';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { BloProfileModal } from './components/BloProfileModal';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallControls';
import { FormId, SavedFormRecord } from './types/forms';
import {
  buildDownloadFileName,
  generateFilledForm6Pdf,
  generateFilledForm7Pdf,
  generateFilledForm8Pdf,
  saveOrDownloadPdf,
} from './pdf/pdfEngine';
import { registerNativeBackHandler } from './utils/nativeBridge';
import {
  ValidationIssue,
  validateForm6,
  validateForm7,
  validateForm8,
} from './utils/validation';

const FORM_TABS: { id: FormId; label: string; shortLabel: string; pages: string; code: string }[] = [
  {
    id: 'form6',
    label: 'Form-6 (New Inclusion)',
    shortLabel: 'Form-6',
    pages: '2 Pages',
    code: 'Form_6_English.pdf',
  },
  {
    id: 'form7',
    label: 'Form-7 (Deletion/Objection)',
    shortLabel: 'Form-7',
    pages: '1 Page',
    code: 'Form_7_English.pdf',
  },
  {
    id: 'form8',
    label: 'Form-8 (Correction/Shifting/PwD)',
    shortLabel: 'Form-8',
    pages: '2 Pages',
    code: 'Form_8_English.pdf',
  },
];

const SECTION_NAV: Record<FormId, { id: string; label: string }[]> = {
  form6: [
    { id: 'common-header', label: '00. Constituency & Receipt' },
    { id: 'f6-sec1', label: '01. Name & Passport Photo' },
    { id: 'f6-sec2', label: '02. Relative Details' },
    { id: 'f6-sec3', label: '03–04. Contact Info' },
    { id: 'f6-sec5', label: '05. Aadhaar Details' },
    { id: 'f6-sec6', label: '06. Gender' },
    { id: 'f6-sec7', label: '07. DoB & Proof' },
    { id: 'f6-sec8', label: '08. Address & Proof' },
    { id: 'f6-sec9', label: '09. Disability (Optional)' },
    { id: 'f6-sec10', label: '10. Family Member' },
    { id: 'f6-declaration', label: '11. Declaration & Sign' },
  ],
  form7: [
    { id: 'common-header', label: '00. Constituency & Receipt' },
    { id: 'f7-applicant', label: '01. Applicant Details' },
    { id: 'f7-type', label: '02. Application Type' },
    { id: 'f7-reason', label: '03. Specific Reason' },
    { id: 'f7-target', label: '04. Target Person Details' },
    { id: 'f7-declaration', label: '05. Declaration & Sign' },
  ],
  form8: [
    { id: 'common-header', label: '00. Constituency & Receipt' },
    { id: 'f8-applicant', label: '01. Applicant & Aadhaar' },
    { id: 'f8-purpose', label: '02. Primary Purpose' },
    { id: 'f8-details', label: '03. Purpose Details' },
    { id: 'f8-declaration', label: '04. Declaration & Sign' },
  ],
};

function FormFillerWorkspace() {
  const {
    activeTab,
    setActiveTab,
    templates,
    reloadTemplate,
    common,
    form6,
    form7,
    form8,
    loadSampleData,
    resetActiveForm,
    startNewEntry,
    clearAllDrafts,
    lastSavedAt,
    draftRestored,
    draftStorageWarning,
    bloProfile,
    saveBloDefaultProfile,
    clearBloDefaultProfile,
    savedForms,
    activeRecordId,
    saveCurrentFormToOfflineList,
    loadSavedFormRecord,
    deleteSavedFormRecord,
    clearAllSavedFormRecords,
  } = useFormStore();

  const [isBloProfileOpen, setIsBloProfileOpen] = useState(false);

  // Support Android PWA manifest shortcuts (/?form=form6|form7|form8) while defaulting to Main Home Screen
  const [selectedForm, setSelectedForm] = useState<FormId | null>(() => {
    if (typeof window === 'undefined') return null;
    const param = new URLSearchParams(window.location.search).get('form');
    if (param === 'form6' || param === 'form7' || param === 'form8') {
      return param;
    }
    return null;
  });

  useEffect(() => {
    if (selectedForm) {
      setActiveTab(selectedForm);
    }
  }, [selectedForm, setActiveTab]);

  const formattedDraftTime = useMemo(() => {
    if (!lastSavedAt) return null;
    try {
      return new Date(lastSavedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return null;
    }
  }, [lastSavedAt]);

  const draftFlags = useMemo<Record<FormId, boolean>>(
    () => ({
      form6: Boolean(
        form6.firstNameEnglish ||
          form6.firstNameRegional ||
          form6.mobileNumber ||
          form6.photoDataUrl ||
          form6.signatureDataUrl
      ),
      form7: Boolean(
        form7.applicantFirstName ||
          form7.applicantEpic ||
          form7.targetFirstName ||
          form7.objectionType
      ),
      form8: Boolean(
        form8.applicantFirstName || form8.applicantEpic || form8.purpose || form8.mobileNumber
      ),
    }),
    [form6, form7, form8]
  );

  const [isCompiling, setIsCompiling] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([]);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<{
    bytes: Uint8Array | null;
    fileName: string;
  }>({ bytes: null, fileName: '' });

  // Connect Android hardware Back button smoothly inside standalone Capacitor APK
  useEffect(() => {
    return registerNativeBackHandler(() => {
      if (previewState.bytes) {
        setPreviewState({ bytes: null, fileName: '' });
        return true;
      }
      if (isBloProfileOpen) {
        setIsBloProfileOpen(false);
        return true;
      }
      if (selectedForm !== null) {
        setSelectedForm(null);
        setValidationErrors([]);
        setSystemError(null);
        setSuccessMessage(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      }
      return false;
    });
  }, [previewState.bytes, isBloProfileOpen, selectedForm]);

  const openForm = (formId: FormId) => {
    setActiveTab(formId);
    setSelectedForm(formId);
    setValidationErrors([]);
    setSystemError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const returnToHome = () => {
    setSelectedForm(null);
    setValidationErrors([]);
    setSystemError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentFormId: FormId = selectedForm ?? activeTab;
  const activeTemplate = templates[currentFormId];
  const activeTabMeta = FORM_TABS.find((t) => t.id === currentFormId)!;

  const liveIssues = useMemo(() => {
    if (currentFormId === 'form6') return validateForm6(common, form6);
    if (currentFormId === 'form7') return validateForm7(common, form7);
    return validateForm8(common, form8);
  }, [currentFormId, common, form6, form7, form8]);

  const getApplicantNameForFile = (): string => {
    if (currentFormId === 'form6') {
      return [form6.firstNameEnglish, form6.surnameEnglish].filter(Boolean).join('_');
    }
    if (currentFormId === 'form7') {
      return [form7.applicantFirstName, form7.applicantSurname].filter(Boolean).join('_');
    }
    return [form8.applicantFirstName, form8.applicantSurname].filter(Boolean).join('_');
  };

  const compileCurrentForm = async (mode: 'download' | 'preview') => {
    setSystemError(null);
    setSuccessMessage(null);

    if (activeTemplate.status !== 'loaded' || !activeTemplate.bytes) {
      setSystemError(
        `Blank PDF template (${activeTemplate.fileName}) is not loaded yet. Click Retry before generating.`
      );
      return;
    }

    const issues =
      currentFormId === 'form6'
        ? validateForm6(common, form6)
        : currentFormId === 'form7'
        ? validateForm7(common, form7)
        : validateForm8(common, form8);

    if (issues.length > 0) {
      setValidationErrors(issues);
      const firstEl = document.getElementById(issues[0].sectionId);
      firstEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setValidationErrors([]);
    setIsCompiling(true);

    try {
      let compiledBytes: Uint8Array;
      if (currentFormId === 'form6') {
        compiledBytes = await generateFilledForm6Pdf(activeTemplate.bytes, common, form6);
      } else if (currentFormId === 'form7') {
        compiledBytes = await generateFilledForm7Pdf(activeTemplate.bytes, common, form7);
      } else {
        compiledBytes = await generateFilledForm8Pdf(activeTemplate.bytes, common, form8);
      }

      const fileName = buildDownloadFileName(currentFormId, getApplicantNameForFile());

      if (mode === 'download') {
        await saveOrDownloadPdf(compiledBytes, fileName);
        // Automatically save entry to Offline Saved Forms Register for quick re-download/editing
        try {
          await saveCurrentFormToOfflineList(currentFormId);
        } catch {
          // Non-fatal if IndexedDB is blocked
        }
        setSuccessMessage(
          `Compiled and downloaded ${fileName} locally — entry also saved to Offline Saved Forms Register.`
        );
      } else {
        setPreviewState({ bytes: compiledBytes, fileName });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected PDF compilation error.';
      setSystemError(`PDF generation failed: ${msg}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSaveToOfflineList = async () => {
    setSystemError(null);
    try {
      const saved = await saveCurrentFormToOfflineList(currentFormId);
      setSuccessMessage(
        `Saved "${saved.applicantName}" to your 100% Offline Saved Forms Register on this device.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save entry offline.';
      setSystemError(msg);
    }
  };

  const handleOpenSavedRecord = (record: SavedFormRecord) => {
    loadSavedFormRecord(record);
    setSelectedForm(record.formId);
    setValidationErrors([]);
    setSystemError(null);
    setSuccessMessage(`Loaded offline saved entry for "${record.applicantName}".`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownloadSavedRecordPdf = async (record: SavedFormRecord) => {
    const tpl = templates[record.formId];
    if (tpl.status !== 'loaded' || !tpl.bytes) {
      setSystemError(`Blank PDF template (${tpl.fileName}) is still loading.`);
      return;
    }
    try {
      let bytes: Uint8Array;
      if (record.formId === 'form6' && record.form6) {
        bytes = await generateFilledForm6Pdf(tpl.bytes, record.common, record.form6);
      } else if (record.formId === 'form7' && record.form7) {
        bytes = await generateFilledForm7Pdf(tpl.bytes, record.common, record.form7);
      } else if (record.formId === 'form8' && record.form8) {
        bytes = await generateFilledForm8Pdf(tpl.bytes, record.common, record.form8);
      } else {
        return;
      }
      const fileName = buildDownloadFileName(record.formId, record.applicantName);
      await saveOrDownloadPdf(bytes, fileName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to compile saved PDF.';
      setSystemError(msg);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-900 ${
        selectedForm ? 'pb-20 sm:pb-0' : ''
      }`}
    >
      {/* Persistent Top Bar (Strict 3-zone contract) */}
      <header className="safe-top sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 sm:h-16 sm:gap-8 sm:px-6">
          {/* Zone 1: Brand wordmark (clicks return to Main Screen) */}
          <div className="flex min-w-0 items-center gap-2.5">
            {selectedForm ? (
              <button
                type="button"
                onClick={returnToHome}
                aria-label="Back to Main Screen"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:hidden"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={returnToHome}
              className="min-w-0 truncate text-left text-sm font-bold tracking-tight text-[#1E3A5F] transition-colors hover:text-[#162d4b] sm:text-lg whitespace-nowrap"
            >
              blo form fill pdf
            </button>
          </div>

          {/* Zone 2: Clean single-line desktop links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-6 text-sm font-medium md:flex"
          >
            <button
              type="button"
              onClick={returnToHome}
              aria-current={selectedForm === null ? 'page' : undefined}
              className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                selectedForm === null
                  ? 'font-semibold text-[#1E3A5F]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Home
              {selectedForm === null ? (
                <span className="absolute inset-x-0 -bottom-[19px] h-0.5 bg-[#1E3A5F]" />
              ) : null}
            </button>
            {FORM_TABS.map((tab) => {
              const active = selectedForm === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => openForm(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'font-semibold text-[#1E3A5F]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.shortLabel}
                  {active ? (
                    <span className="absolute inset-x-0 -bottom-[19px] h-0.5 bg-[#1E3A5F]" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Contextual Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedForm === null ? (
              <PWAInstallButton />
            ) : (
              <button
                type="button"
                disabled={isCompiling}
                onClick={() => void compileCurrentForm('download')}
                className="inline-flex items-center gap-2 rounded-md bg-[#1E3A5F] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#162d4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:opacity-60 sm:px-4 sm:text-sm whitespace-nowrap shrink-0"
              >
                {isCompiling ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Generate &amp; Download Filled PDF</span>
                <span className="sm:hidden">Download</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SCREEN 1: Main Home Screen with 3 Separate Form Buttons & Offline Saved Register */}
      {selectedForm === null ? (
        <HomeLauncherScreen
          templates={templates}
          reloadTemplate={reloadTemplate}
          onSelectForm={openForm}
          draftFlags={draftFlags}
          formattedDraftTime={formattedDraftTime}
          draftRestored={draftRestored}
          onClearAllDrafts={() => {
            clearAllDrafts();
            setValidationErrors([]);
            setSuccessMessage(null);
          }}
          bloProfile={bloProfile}
          onOpenBloProfile={() => setIsBloProfileOpen(true)}
          savedForms={savedForms}
          onOpenSavedRecord={handleOpenSavedRecord}
          onDownloadSavedRecordPdf={handleDownloadSavedRecordPdf}
          onDeleteSavedRecord={deleteSavedFormRecord}
          onClearAllSavedRecords={clearAllSavedFormRecords}
        />
      ) : (
        /* SCREEN 2: Focused Active Form Workspace (opens only after clicking a Form button) */
        <>
          {/* Compact Active Form Sub-Bar with Back Button & Template Status */}
          <div className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-2.5 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={returnToHome}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>मुख्य स्क्रीन / All Forms</span>
                </button>
                <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="truncate text-sm font-bold text-[#1E3A5F]">
                  {activeTabMeta.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <div className="inline-flex items-center gap-1.5">
                  {activeTemplate.status === 'loaded' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  ) : activeTemplate.status === 'loading' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                  )}
                  <span className="font-mono text-[11px] text-slate-700">
                    {activeTemplate.fileName}
                  </span>
                  <span
                    className={
                      activeTemplate.status === 'loaded'
                        ? 'font-medium text-emerald-700'
                        : activeTemplate.status === 'loading'
                        ? 'text-amber-700'
                        : 'font-medium text-red-600'
                    }
                  >
                    {activeTemplate.status === 'loaded'
                      ? 'Template Loaded'
                      : activeTemplate.status === 'loading'
                      ? 'Loading Template...'
                      : 'Failed'}
                  </span>
                  {activeTemplate.status === 'error' ? (
                    <button
                      type="button"
                      onClick={() => void reloadTemplate(selectedForm)}
                      className="ml-1 inline-flex items-center gap-1 text-[#1E3A5F] underline hover:text-blue-900"
                    >
                      <RefreshCw className="h-3 w-3" aria-hidden="true" />
                      Retry
                    </button>
                  ) : null}
                </div>

                <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
                  ·
                </span>

                <span className="text-slate-500 tabular-nums">
                  {draftRestored && formattedDraftTime
                    ? `Draft restored · Saved ${formattedDraftTime}`
                    : formattedDraftTime
                    ? `Draft saved · ${formattedDraftTime}`
                    : 'Auto-saves locally'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Responsive Form Workspace */}
          <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:py-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
              {/* Left Sticky Sidebar (Section Index & BLO Quick Tools) */}
              <aside className="space-y-6 lg:sticky lg:top-24">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="border-b border-slate-100 pb-3.5">
                    <p className="text-xs font-medium text-slate-500">
                      Active ECI Form · {activeTabMeta.pages}
                    </p>
                    <h2 className="mt-1 text-base font-bold text-slate-900">
                      {activeTabMeta.label}
                    </h2>
                  </div>

                  {/* Section Quick-Jump List */}
                  <nav aria-label="Form Sections" className="mt-3.5 space-y-1">
                    {SECTION_NAV[selectedForm].map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className="block w-full rounded px-2.5 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        {sec.label}
                      </button>
                    ))}
                  </nav>

                  {/* Readiness Counter */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">Required Fields</span>
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          liveIssues.length === 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {liveIssues.length === 0 ? 'Ready' : `${liveIssues.length} remaining`}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {liveIssues.length === 0
                        ? 'All mandatory fields completed. Ready to compile and download PDF.'
                        : `Next required: ${liveIssues[0].field}`}
                    </p>
                  </div>

                  {/* Local Draft Persistence Summary */}
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">Local Draft</span>
                      <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                        {formattedDraftTime ? formattedDraftTime : 'Not saved'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {draftStorageWarning
                        ? draftStorageWarning
                        : draftRestored
                        ? 'Previous session inputs restored automatically from this browser.'
                        : formattedDraftTime
                        ? 'Inputs are auto-saved locally and survive page refresh.'
                        : 'Start typing to automatically save a local browser draft.'}
                    </p>
                  </div>

                  {/* Utility Controls */}
                  <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsBloProfileOpen(true)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-[#1E3A5F]/30 bg-white px-3 py-2 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-[#1E3A5F]/5 whitespace-nowrap"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                      {bloProfile ? 'BLO Default Profile' : 'Set BLO Default'}
                    </button>
                    {activeRecordId ? (
                      <button
                        type="button"
                        onClick={() => {
                          startNewEntry(selectedForm);
                          setValidationErrors([]);
                          setSuccessMessage('Started a new blank entry with BLO Default Profile auto-filled.');
                        }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 whitespace-nowrap"
                      >
                        <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
                        New Voter Entry
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleSaveToOfflineList()}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      {activeRecordId ? 'Update Saved Entry' : 'Save to Offline List'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        loadSampleData(selectedForm);
                        setValidationErrors([]);
                        setSuccessMessage(null);
                      }}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                    >
                      <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                      Fill Sample Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetActiveForm(selectedForm);
                        setValidationErrors([]);
                        setSuccessMessage(null);
                      }}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Reset {activeTabMeta.shortLabel}
                    </button>
                    {lastSavedAt ? (
                      <button
                        type="button"
                        onClick={() => {
                          clearAllDrafts();
                          setValidationErrors([]);
                          setSuccessMessage(null);
                        }}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 whitespace-nowrap"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Clear Saved Draft
                      </button>
                    ) : null}
                  </div>
                </div>
              </aside>

              {/* Right Primary Form Sheet (Single-Elevation Depth) */}
              <div className="space-y-5">
                {systemError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="font-semibold">PDF Generation Error</p>
                      <p className="mt-0.5 text-xs text-red-700">{systemError}</p>
                    </div>
                  </div>
                ) : null}

                {validationErrors.length > 0 ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
                  >
                    <div className="flex items-center gap-2 font-semibold text-amber-900">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                      <span>
                        Please complete {validationErrors.length} required{' '}
                        {validationErrors.length === 1 ? 'field' : 'fields'} before generating the
                        PDF:
                      </span>
                    </div>
                    <ul className="mt-2.5 space-y-1.5 text-xs">
                      {validationErrors.map((issue, idx) => (
                        <li key={`${issue.field}-${idx}`}>
                          <button
                            type="button"
                            onClick={() => scrollToSection(issue.sectionId)}
                            className="text-left text-amber-900 underline decoration-amber-400 underline-offset-2 hover:text-amber-700"
                          >
                            {issue.message}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {successMessage ? (
                  <div
                    role="status"
                    className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                  >
                    <FileCheck className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    <span>{successMessage}</span>
                  </div>
                ) : null}

                {/* Primary Form Sheet */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void compileCurrentForm('download');
                  }}
                  className="rounded-lg border border-slate-200 bg-white p-5 sm:p-8"
                  noValidate
                >
                  <div className="space-y-8">
                    <CommonHeaderSection />

                    <div className="border-t border-slate-200 pt-8">
                      {selectedForm === 'form6' ? <Form6View /> : null}
                      {selectedForm === 'form7' ? <Form7View /> : null}
                      {selectedForm === 'form8' ? <Form8View /> : null}
                    </div>
                  </div>

                  {/* Action Footer Inside Sheet */}
                  <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-600">
                      <span className="font-medium text-slate-800">Output Filename: </span>
                      <span className="font-mono text-slate-700">
                        {buildDownloadFileName(selectedForm, getApplicantNameForFile())}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => void handleSaveToOfflineList()}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        {activeRecordId ? 'Update Saved' : 'Save Offline'}
                      </button>

                      <button
                        type="button"
                        disabled={isCompiling}
                        onClick={() => void compileCurrentForm('preview')}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap shrink-0"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Preview PDF
                      </button>

                      <button
                        type="submit"
                        disabled={isCompiling}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1E3A5F] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#162d4b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2 disabled:opacity-60 whitespace-nowrap shrink-0"
                      >
                        {isCompiling ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Download className="h-4 w-4" aria-hidden="true" />
                        )}
                        Generate &amp; Download Filled PDF
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </main>

          {/* Mobile Sticky Bottom Action Bar (Only inside active form view) */}
          <nav
            aria-label="Mobile Form Actions"
            className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden"
          >
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <button
                type="button"
                onClick={returnToHome}
                className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold text-slate-700 active:bg-slate-100"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Home</span>
              </button>
              <button
                type="button"
                disabled={isCompiling}
                onClick={() => void compileCurrentForm('preview')}
                className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold text-[#1E3A5F] active:bg-slate-100 disabled:opacity-50"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                <span>Preview PDF</span>
              </button>
              <button
                type="button"
                disabled={isCompiling}
                onClick={() => void compileCurrentForm('download')}
                className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 bg-[#1E3A5F] py-2 text-[11px] font-semibold text-white active:bg-[#162d4b] disabled:opacity-60"
              >
                {isCompiling ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                <span>Download PDF</span>
              </button>
            </div>
          </nav>
        </>
      )}

      {/* Quiet Institutional Footer (Desktop only; mobile uses native bottom nav & App Info sheet) */}
      <footer className="mt-10 hidden border-t border-slate-200 bg-white sm:block">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            blo form fill pdf — Independent Unofficial PDF Utility (Not affiliated with ECI)
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>100% Offline &amp; On-Device · No Login</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <a
              href="/privacy-policy.html"
              className="font-medium text-[#1E3A5F] underline underline-offset-2 hover:text-[#162d4b]"
            >
              Privacy Policy &amp; Disclaimer
            </a>
          </div>
        </div>
      </footer>

      {/* 100% Offline BLO Default Profile Setup Modal */}
      <BloProfileModal
        isOpen={isBloProfileOpen}
        initialProfile={bloProfile}
        onClose={() => setIsBloProfileOpen(false)}
        onSave={saveBloDefaultProfile}
        onClear={clearBloDefaultProfile}
      />

      {/* Compiled PDF Direct Offline Preview Modal */}
      <PdfPreviewModal
        bytes={previewState.bytes}
        fileName={previewState.fileName}
        onClose={() => {
          setPreviewState({ bytes: null, fileName: '' });
        }}
        onDownload={() => {
          if (previewState.bytes) {
            void saveOrDownloadPdf(previewState.bytes, previewState.fileName);
          }
        }}
      />

      {/* Non-intrusive Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <FormProvider>
      <FormFillerWorkspace />
    </FormProvider>
  );
}
