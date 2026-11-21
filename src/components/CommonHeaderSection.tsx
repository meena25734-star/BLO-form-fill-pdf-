import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { useFormStore } from '../context/FormContext';
import { FormSection, TextField } from './FormPrimitives';

export const CommonHeaderSection: React.FC = () => {
  const { common, updateCommon } = useFormStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 280;
    const h = 76;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (!common.bloSealSignDataUrl) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.setLineDash([]);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 11px "Public Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BLO Seal with Signature Preview', w / 2, h / 2 + 4);
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      const pad = 6;
      const availW = w - pad * 2;
      const availH = h - pad * 2;
      const imgRatio = img.width / img.height;
      const availRatio = availW / availH;
      let dw = availW;
      let dh = availH;
      if (imgRatio > availRatio) {
        dh = availW / imgRatio;
      } else {
        dw = availH * imgRatio;
      }
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    img.src = common.bloSealSignDataUrl;
  }, [common.bloSealSignDataUrl]);

  const handleSealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5 MB.');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateCommon({ bloSealSignDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <FormSection
      id="common-header"
      number="00."
      title="Constituency & Official Receipt Header"
      subtitle="Shared across Form-6, Form-7, and Form-8. Maps automatically to top constituency headers, declarations, and tear-off acknowledgement receipts."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <TextField
            id="ac-no"
            label="Assembly Constituency No."
            value={common.acNo}
            onChange={(v) => updateCommon({ acNo: v })}
            placeholder="e.g. 48"
            mono
            uppercase
            required
          />
        </div>
        <div className="sm:col-span-4">
          <TextField
            id="ac-name"
            label="Assembly Constituency Name"
            value={common.acName}
            onChange={(v) => updateCommon({ acName: v })}
            placeholder="e.g. MALVIYA NAGAR"
            uppercase
            required
          />
        </div>

        <div className="sm:col-span-2">
          <TextField
            id="pc-no"
            label="Parliamentary Const. No."
            value={common.pcNo}
            onChange={(v) => updateCommon({ pcNo: v })}
            placeholder="e.g. 07"
            mono
            uppercase
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id="pc-name"
            label="Parliamentary Const. Name"
            value={common.pcName}
            onChange={(v) => updateCommon({ pcName: v })}
            placeholder="e.g. JAIPUR"
            uppercase
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id="common-state"
            label="State / Union Territory"
            value={common.stateName}
            onChange={(v) => updateCommon({ stateName: v })}
            placeholder="e.g. RAJASTHAN"
            uppercase
          />
        </div>

        <div className="sm:col-span-2">
          <TextField
            id="app-date"
            label="Date of Application"
            type="date"
            value={common.applicationDate}
            onChange={(v) => updateCommon({ applicationDate: v })}
            mono
            required
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id="app-place"
            label="Place"
            value={common.place}
            onChange={(v) => updateCommon({ place: v })}
            placeholder="e.g. JAIPUR"
            uppercase
            required
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id="ack-no"
            label="Acknowledgement / Ref. No."
            value={common.acknowledgementNo}
            onChange={(v) => updateCommon({ acknowledgementNo: v })}
            placeholder="e.g. ECI-2026-048-9024"
            mono
            uppercase
          />
        </div>

        {/* BLO Seal with Signature Upload (replaces BLO Name input) */}
        <div className="sm:col-span-6">
          <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <label htmlFor="blo-seal-sign-file" className="text-sm font-medium text-slate-800">
                BLO Seal with Signature (For Acknowledgement Receipt)
              </label>
              <span className="font-mono text-xs text-slate-500">JPG / PNG</span>
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <canvas
                ref={canvasRef}
                className="h-[76px] w-[280px] max-w-full shrink-0 rounded border border-slate-300 bg-white"
                aria-label="BLO seal with signature preview"
              />

              <div className="space-y-2.5">
                <p className="text-xs leading-relaxed text-slate-600">
                  Upload scanned BLO rubber stamp seal with signature. Stamped automatically onto the official ERO/AERO/BLO receipt area of Form-6, Form-7, and Form-8.
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <label
                    htmlFor="blo-seal-sign-file"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#162d4b] whitespace-nowrap shrink-0"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    Choose File
                  </label>
                  <input
                    id="blo-seal-sign-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSealUpload}
                    className="sr-only"
                  />

                  {common.bloSealSignDataUrl ? (
                    <button
                      type="button"
                      onClick={() => updateCommon({ bloSealSignDataUrl: null })}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">No file chosen</span>
                  )}
                </div>
                {uploadError ? (
                  <p className="text-xs font-medium text-red-600">{uploadError}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
};
