import React, { useEffect, useRef, useState } from 'react';
import { X, Save, Trash2, Upload, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { BloDefaultProfile } from '../types/forms';
import {
  EMPTY_BLO_PROFILE,
  compressSealImageFile,
  hasBloProfileData,
} from '../utils/offlineStorage';

interface BloProfileModalProps {
  isOpen: boolean;
  initialProfile: BloDefaultProfile | null;
  onClose: () => void;
  onSave: (profile: BloDefaultProfile) => { saved: boolean; error?: string };
  onClear: () => void;
}

/**
 * 100% Offline, Login-Free BLO Default Profile Setup Modal.
 * Saves AC/PC/State/District/Place/Part No. & BLO Seal locally on-device
 * so every new Form-6, Form-7, or Form-8 auto-fills automatically.
 */
export const BloProfileModal: React.FC<BloProfileModalProps> = ({
  isOpen,
  initialProfile,
  onClose,
  onSave,
  onClear,
}) => {
  const [draft, setDraft] = useState<BloDefaultProfile>(initialProfile ?? EMPTY_BLO_PROFILE);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(initialProfile ?? EMPTY_BLO_PROFILE);
      setStatusMsg(null);
    }
  }, [isOpen, initialProfile]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateField = <K extends keyof BloDefaultProfile>(
    key: K,
    value: BloDefaultProfile[K]
  ) => {
    setStatusMsg(null);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSealFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please choose a valid image file (JPG, PNG, WebP).' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'Seal image must be smaller than 10 MB.' });
      return;
    }
    try {
      const compressed = await compressSealImageFile(file);
      updateField('bloSealSignDataUrl', compressed);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to process seal image.',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBloProfileData(draft)) {
      setStatusMsg({
        type: 'error',
        text: 'Enter at least one default field or upload a BLO Seal before saving.',
      });
      return;
    }
    const res = onSave(draft);
    if (!res.saved) {
      setStatusMsg({ type: 'error', text: res.error ?? 'Could not save BLO Default Profile.' });
      return;
    }
    setStatusMsg({
      type: 'success',
      text:
        res.error ??
        'BLO Default Profile saved offline! These details will auto-fill on every new form.',
    });
    window.setTimeout(() => {
      onClose();
    }, 650);
  };

  const handleClear = () => {
    onClear();
    setDraft(EMPTY_BLO_PROFILE);
    setStatusMsg({ type: 'success', text: 'Saved BLO Default Profile cleared from this device.' });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blo-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>100% Offline · No Login · Saved Only on This Device</span>
            </div>
            <h2 id="blo-profile-title" className="mt-0.5 text-base font-bold text-[#1E3A5F]">
              BLO Default Profile (Auto-Fill)
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              एक बार अपना निर्वाचन क्षेत्र, ज़िला, भाग संख्या और BLO मोहर सेव करें — हर नए Form-6, 7 और 8
              में अपने-आप भर जाएगा।
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close BLO Default Profile"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="bp-ac-no" className="block text-xs font-semibold text-slate-700">
                Assembly Const. No.
              </label>
              <input
                id="bp-ac-no"
                type="text"
                value={draft.acNo}
                onChange={(e) => updateField('acNo', e.target.value.toUpperCase())}
                placeholder="e.g. 48"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="bp-ac-name" className="block text-xs font-semibold text-slate-700">
                Assembly Constituency Name
              </label>
              <input
                id="bp-ac-name"
                type="text"
                value={draft.acName}
                onChange={(e) => updateField('acName', e.target.value.toUpperCase())}
                placeholder="e.g. MALVIYA NAGAR"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bp-pc-no" className="block text-xs font-semibold text-slate-700">
                Parliamentary No.
              </label>
              <input
                id="bp-pc-no"
                type="text"
                value={draft.pcNo}
                onChange={(e) => updateField('pcNo', e.target.value.toUpperCase())}
                placeholder="e.g. 07"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="bp-pc-name" className="block text-xs font-semibold text-slate-700">
                Parliamentary Const. Name
              </label>
              <input
                id="bp-pc-name"
                type="text"
                value={draft.pcName}
                onChange={(e) => updateField('pcName', e.target.value.toUpperCase())}
                placeholder="e.g. JAIPUR"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="bp-state" className="block text-xs font-semibold text-slate-700">
                State / Union Territory
              </label>
              <input
                id="bp-state"
                type="text"
                value={draft.stateName}
                onChange={(e) => updateField('stateName', e.target.value.toUpperCase())}
                placeholder="e.g. RAJASTHAN"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="bp-district" className="block text-xs font-semibold text-slate-700">
                Default District
              </label>
              <input
                id="bp-district"
                type="text"
                value={draft.districtName}
                onChange={(e) => updateField('districtName', e.target.value.toUpperCase())}
                placeholder="e.g. JAIPUR"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="bp-place" className="block text-xs font-semibold text-slate-700">
                Default Place (Declaration)
              </label>
              <input
                id="bp-place"
                type="text"
                value={draft.place}
                onChange={(e) => updateField('place', e.target.value.toUpperCase())}
                placeholder="e.g. JAIPUR"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bp-part" className="block text-xs font-semibold text-slate-700">
                Default Part No.
              </label>
              <input
                id="bp-part"
                type="text"
                value={draft.partNumber}
                onChange={(e) => updateField('partNumber', e.target.value.toUpperCase())}
                placeholder="e.g. 112"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>

            {/* BLO Seal with Signature */}
            <div className="sm:col-span-6">
              <span className="block text-xs font-semibold text-slate-700">
                Default BLO Seal with Signature (Auto-applied to Receipt)
              </span>
              <div className="mt-1.5 flex flex-col items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                {draft.bloSealSignDataUrl ? (
                  <img
                    src={draft.bloSealSignDataUrl}
                    alt="Saved BLO seal preview"
                    className="h-16 w-48 rounded border border-slate-300 bg-white object-contain p-1"
                  />
                ) : (
                  <div className="flex h-16 w-48 items-center justify-center rounded border border-dashed border-slate-300 bg-white text-[11px] text-slate-400">
                    No BLO Seal saved
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => void handleSealFile(e)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] hover:bg-slate-100 whitespace-nowrap"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{draft.bloSealSignDataUrl ? 'Replace Seal' : 'Upload BLO Seal'}</span>
                  </button>

                  {draft.bloSealSignDataUrl ? (
                    <button
                      type="button"
                      onClick={() => updateField('bloSealSignDataUrl', null)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {statusMsg ? (
            <div
              role="status"
              className={`mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${
                statusMsg.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : null}
              <span>{statusMsg.text}</span>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            {initialProfile ? (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear Profile</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">Stored strictly offline on device.</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[40px] items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#162d4b] whitespace-nowrap"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save BLO Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
