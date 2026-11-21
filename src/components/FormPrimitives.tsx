import React, { useEffect, useRef } from 'react';
import { AddressFields } from '../types/forms';

export const INPUT_CLASS =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 disabled:bg-slate-100 disabled:text-slate-500';

export const MONO_INPUT_CLASS = `${INPUT_CLASS} font-mono tabular-nums tracking-wide`;

interface FormSectionProps {
  id: string;
  number?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({
  id,
  number,
  title,
  subtitle,
  children,
}) => (
  <section id={id} className="scroll-mt-28 border-t border-slate-200 pt-7 first:border-t-0 first:pt-0">
    <div className="mb-5">
      <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
        {number ? <span className="mr-2 font-mono text-sm font-medium text-[#1E3A5F] tabular-nums">{number}</span> : null}
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

interface FieldLabelProps {
  htmlFor?: string;
  label: string;
  required?: boolean;
  hint?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({ htmlFor, label, required, hint }) => (
  <div className="mb-1.5 flex items-baseline justify-between gap-2">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-800">
      {label}
      {required ? <span className="ml-0.5 text-red-600" aria-hidden="true">*</span> : null}
    </label>
    {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
  </div>
);

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
  mono?: boolean;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number';
  maxLength?: number;
  hint?: string;
  disabled?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  uppercase = false,
  mono = false,
  type = 'text',
  maxLength,
  hint,
  disabled,
}) => (
  <div>
    <FieldLabel htmlFor={id} label={label} required={required} hint={hint} />
    <input
      id={id}
      type={type}
      value={value}
      disabled={disabled}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
      className={mono ? MONO_INPUT_CLASS : uppercase ? `${INPUT_CLASS} uppercase` : INPUT_CLASS}
    />
  </div>
);

interface RegionalTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}

/**
 * Input for Devanagari / Hindi regional language fields with an immediate
 * client-side HTML5 Canvas render preview matching the exact PNG stamp placed into the PDF.
 */
export const RegionalTextField: React.FC<RegionalTextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    const width = 260;
    const height = 28;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!value.trim()) return;

    ctx.font = '600 13px "Noto Sans Devanagari", "Nirmala UI", "Mangal", sans-serif';
    ctx.fillStyle = '#0d2152';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.trim(), 4, height / 2 + 1, width - 8);
  }, [value]);

  return (
    <div>
      <FieldLabel htmlFor={id} label={label} hint={hint || 'Devanagari / Hindi'} />
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLASS} font-devanagari`}
      />
      {value.trim() ? (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="shrink-0">PDF Canvas Preview:</span>
          <canvas
            ref={canvasRef}
            className="h-7 w-[220px] rounded border border-slate-200 bg-slate-50"
            aria-label={`Canvas preview of ${value}`}
          />
        </div>
      ) : null}
    </div>
  );
};

interface AddressFieldGroupProps {
  prefix: string;
  value: AddressFields;
  onChange: (next: AddressFields) => void;
  required?: boolean;
}

export const AddressFieldGroup: React.FC<AddressFieldGroupProps> = ({
  prefix,
  value,
  onChange,
  required = true,
}) => {
  const update = (key: keyof AddressFields, val: string) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField
        id={`${prefix}-house`}
        label="House / Building / Apartment No."
        value={value.houseNo}
        onChange={(v) => update('houseNo', v)}
        placeholder="e.g. B-42, SECTOR 5"
        uppercase
        required={required}
      />
      <TextField
        id={`${prefix}-street`}
        label="Street / Area / Locality / Mohalla / Road"
        value={value.streetArea}
        onChange={(v) => update('streetArea', v)}
        placeholder="e.g. MALVIYA NAGAR"
        uppercase
      />
      <TextField
        id={`${prefix}-town`}
        label="Town / Village"
        value={value.townVillage}
        onChange={(v) => update('townVillage', v)}
        placeholder="e.g. JAIPUR"
        uppercase
        required={required}
      />
      <TextField
        id={`${prefix}-po`}
        label="Post Office"
        value={value.postOffice}
        onChange={(v) => update('postOffice', v)}
        placeholder="e.g. MALVIYA NAGAR SO"
        uppercase
      />
      <TextField
        id={`${prefix}-pin`}
        label="PIN Code"
        value={value.pinCode}
        onChange={(v) => update('pinCode', v.replace(/\D/g, '').slice(0, 6))}
        placeholder="6-digit PIN"
        mono
        maxLength={6}
        required={required}
      />
      <TextField
        id={`${prefix}-tehsil`}
        label="Tehsil / Taluka / Mandal"
        value={value.tehsil}
        onChange={(v) => update('tehsil', v)}
        placeholder="e.g. SANGANER"
        uppercase
      />
      <TextField
        id={`${prefix}-district`}
        label="District"
        value={value.district}
        onChange={(v) => update('district', v)}
        placeholder="e.g. JAIPUR"
        uppercase
        required={required}
      />
      <TextField
        id={`${prefix}-state`}
        label="State / UT"
        value={value.state}
        onChange={(v) => update('state', v)}
        placeholder="e.g. RAJASTHAN"
        uppercase
      />
    </div>
  );
};
