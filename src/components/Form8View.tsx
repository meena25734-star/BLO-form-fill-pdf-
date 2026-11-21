import React from 'react';
import { useFormStore } from '../context/FormContext';
import {
  AddressProofType,
  CorrectionFieldKey,
  DisabilityCategory,
  Form8Purpose,
  ReplacementReason,
} from '../types/forms';
import {
  AddressFieldGroup,
  FieldLabel,
  FormSection,
  INPUT_CLASS,
  TextField,
} from './FormPrimitives';
import { PassportPhotoUploader, SignatureUploader } from './MediaUploaders';

const PURPOSES: { id: Exclude<Form8Purpose, ''>; num: string; title: string; desc: string }[] = [
  {
    id: 'shifting',
    num: '1.',
    title: 'Shifting of Residence',
    desc: 'Transfer electoral roll entry within or outside the current Assembly Constituency.',
  },
  {
    id: 'correction',
    num: '2.',
    title: 'Correction of Entries in Existing Electoral Roll',
    desc: 'Modify up to 4 official particulars (Name, Gender, DoB, Relation, Address, Mobile, Photo).',
  },
  {
    id: 'replacement',
    num: '3.',
    title: 'Issue of Replacement EPIC without Correction',
    desc: 'Request duplicate Voter ID card if Lost, Destroyed, or Mutilated.',
  },
  {
    id: 'pwd',
    num: '4.',
    title: 'Request for Marking as Person with Disability (PwD)',
    desc: 'Flag voter record with official disability category and percentage for accessible polling.',
  },
];

const CORRECTION_ENTRIES: { key: CorrectionFieldKey; label: string; placeholder: string }[] = [
  { key: 'Name', label: 'Name', placeholder: 'Enter corrected full name in BLOCK letters' },
  { key: 'Gender', label: 'Gender', placeholder: 'MALE / FEMALE / THIRD GENDER' },
  { key: 'DoB/Age', label: 'Date of Birth / Age', placeholder: 'DD/MM/YYYY or Age' },
  { key: 'Relation Type', label: 'Relation Type', placeholder: 'FATHER / MOTHER / HUSBAND / WIFE' },
  { key: 'Relation Name', label: 'Relation Name', placeholder: 'Enter corrected relative name in BLOCK letters' },
  { key: 'Address', label: 'Address', placeholder: 'Enter corrected complete address' },
  { key: 'Mobile', label: 'Mobile Number', placeholder: 'Enter 10-digit mobile number' },
  { key: 'Photo', label: 'Photograph', placeholder: 'Upload replacement passport photo below' },
];

const ADDRESS_PROOFS: Exclude<AddressProofType, ''>[] = [
  'Water/Electricity/Gas Bill',
  'Aadhaar Card',
  'Bank/PO Passbook',
  'Indian Passport',
  'Land Record',
  'Rent/Lease Deed',
  'Sale Deed',
  'Other Document',
];

const REPLACEMENT_REASONS: { id: Exclude<ReplacementReason, ''>; label: string; detail: string }[] = [
  { id: 'Lost', label: 'Lost', detail: 'Requires copy of FIR / Police Report attached.' },
  {
    id: 'Destroyed',
    label: 'Destroyed',
    detail: 'Destroyed due to reason beyond control such as floods, fire, or natural disaster.',
  },
  { id: 'Mutilated', label: 'Mutilated', detail: 'Damaged or unreadable EPIC card returned with application.' },
];

const DISABILITY_CATEGORIES: DisabilityCategory[] = [
  'Locomotive',
  'Visual',
  'Deaf & Dumb',
  'Other',
];

export const Form8View: React.FC = () => {
  const { form8, updateForm8, common } = useFormStore();

  const toggleCorrectionField = (field: CorrectionFieldKey) => {
    const exists = form8.correctionFields.includes(field);
    if (exists) {
      updateForm8({
        correctionFields: form8.correctionFields.filter((f) => f !== field),
      });
      return;
    }
    if (form8.correctionFields.length >= 4) {
      return; // Strictly enforce maximum 4 official fields
    }
    updateForm8({
      correctionFields: [...form8.correctionFields, field],
    });
  };

  const updateCorrectionValue = (field: CorrectionFieldKey, val: string) => {
    updateForm8({
      correctionValues: {
        ...form8.correctionValues,
        [field]: val,
      },
    });
  };

  const togglePwdCategory = (cat: DisabilityCategory) => {
    const exists = form8.pwdCategories.includes(cat);
    updateForm8({
      pwdCategories: exists
        ? form8.pwdCategories.filter((c) => c !== cat)
        : [...form8.pwdCategories, cat],
    });
  };

  const maxCorrectionsReached = form8.correctionFields.length >= 4;

  return (
    <div className="space-y-8">
      {/* Section I: Applicant Identity & Aadhaar */}
      <FormSection
        id="f8-applicant"
        number="01."
        title="Applicant Details, EPIC & Aadhaar Status"
        subtitle="Existing elector particulars mapped to Page 1 of Form-8."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            id="f8-fn"
            label="Applicant First Name"
            value={form8.applicantFirstName}
            onChange={(v) => updateForm8({ applicantFirstName: v })}
            placeholder="e.g. SUNITA"
            uppercase
            required
          />
          <TextField
            id="f8-sn"
            label="Applicant Surname"
            value={form8.applicantSurname}
            onChange={(v) => updateForm8({ applicantSurname: v })}
            placeholder="e.g. VERMA"
            uppercase
          />
          <TextField
            id="f8-epic"
            label="EPIC Number"
            value={form8.applicantEpic}
            onChange={(v) => updateForm8({ applicantEpic: v })}
            placeholder="e.g. RJF3829104"
            mono
            uppercase
            required
          />
        </div>

        {/* Aadhaar Radio Logic */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3.5 hover:bg-slate-50">
            <input
              type="radio"
              name="f8-aadhaar"
              checked={form8.aadhaarStatus === 'furnished'}
              onChange={() => updateForm8({ aadhaarStatus: 'furnished' })}
              className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
            />
            <div className="flex-1 space-y-2">
              <span className="block text-sm font-medium text-slate-800">Aadhaar Number</span>
              {form8.aadhaarStatus === 'furnished' ? (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={form8.aadhaarNumber}
                  onChange={(e) =>
                    updateForm8({ aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
                  }
                  placeholder="12-digit Aadhaar No."
                  className={`${INPUT_CLASS} font-mono tabular-nums tracking-widest`}
                />
              ) : null}
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3.5 hover:bg-slate-50">
            <input
              type="radio"
              name="f8-aadhaar"
              checked={form8.aadhaarStatus === 'unavailable'}
              onChange={() => updateForm8({ aadhaarStatus: 'unavailable', aadhaarNumber: '' })}
              className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
            />
            <span className="text-sm text-slate-800">
              I am not able to furnish my Aadhaar Number because I don&apos;t have Aadhaar number.
            </span>
          </label>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">Mobile Owner</span>
              <div className="flex items-center gap-4 text-xs">
                {(['Self', 'Relative'] as const).map((owner) => (
                  <label key={owner} className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="f8-mob-owner"
                      checked={form8.mobileOwner === owner}
                      onChange={() => updateForm8({ mobileOwner: owner })}
                      className="h-4 w-4 accent-[#1E3A5F]"
                    />
                    {owner}
                  </label>
                ))}
              </div>
            </div>
            <TextField
              id="f8-mobile"
              label="Mobile Number"
              type="tel"
              value={form8.mobileNumber}
              onChange={(v) => updateForm8({ mobileNumber: v.replace(/\D/g, '').slice(0, 10) })}
              placeholder="10-digit mobile number"
              mono
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">Email ID Row</span>
              <div className="flex items-center gap-4 text-xs">
                {(['Self', 'Relative'] as const).map((owner) => (
                  <label key={owner} className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="f8-email-owner"
                      checked={form8.emailOwner === owner}
                      onChange={() => updateForm8({ emailOwner: owner })}
                      className="h-4 w-4 accent-[#1E3A5F]"
                    />
                    {owner}
                  </label>
                ))}
              </div>
            </div>
            <TextField
              id="f8-email"
              label="Email ID (Optional)"
              type="email"
              value={form8.emailId}
              onChange={(v) => updateForm8({ emailId: v })}
              placeholder="applicant@example.in"
            />
          </div>
        </div>
      </FormSection>

      {/* Section II: Primary Purpose Selector */}
      <FormSection
        id="f8-purpose"
        number="02."
        title="Primary Purpose of Application"
        subtitle="Select ONE purpose to dynamically display its required ECI Form-8 input section."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Form-8 Purpose">
          {PURPOSES.map((p) => {
            const active = form8.purpose === p.id;
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors ${
                  active
                    ? 'border-[#1E3A5F] bg-blue-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="f8-purpose-radio"
                  checked={active}
                  onChange={() => updateForm8({ purpose: p.id })}
                  className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
                />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">
                    <span className="mr-1.5 font-mono text-xs text-[#1E3A5F]">{p.num}</span>
                    {p.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
                    {p.desc}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </FormSection>

      {/* Section III: Conditional Purpose Section */}
      {form8.purpose ? (
        <FormSection
          id="f8-details"
          number="03."
          title={
            form8.purpose === 'shifting'
              ? 'Shifting of Residence Details'
              : form8.purpose === 'correction'
              ? 'Correction of Entries (Maximum 4 Selections)'
              : form8.purpose === 'replacement'
              ? 'Issue of Replacement EPIC without Correction'
              : 'Request for Marking as Person with Disability (PwD)'
          }
          subtitle={
            form8.purpose === 'correction'
              ? `Selected ${form8.correctionFields.length} of 4 maximum allowed fields.`
              : undefined
          }
        >
          {/* 1. Shifting of Residence */}
          {form8.purpose === 'shifting' ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'withinAc' as const, label: 'Within Assembly Constituency' },
                  { id: 'outsideAc' as const, label: 'Outside Assembly Constituency' },
                ].map((st) => {
                  const active = form8.shiftingType === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updateForm8({ shiftingType: st.id })}
                      aria-pressed={active}
                      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>

              <AddressFieldGroup
                prefix="f8-shift"
                value={form8.shiftingAddress}
                onChange={(next) => updateForm8({ shiftingAddress: next })}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="f8-shift-proof" label="Self-Attested Residence Proof" required />
                  <select
                    id="f8-shift-proof"
                    value={form8.shiftingAddressProof}
                    onChange={(e) =>
                      updateForm8({ shiftingAddressProof: e.target.value as AddressProofType })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="">Select residence proof...</option>
                    {ADDRESS_PROOFS.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>

                {form8.shiftingAddressProof === 'Other Document' ? (
                  <TextField
                    id="f8-shift-proof-other"
                    label="Specify Other Residence Proof"
                    value={form8.shiftingAddressProofOther}
                    onChange={(v) => updateForm8({ shiftingAddressProofOther: v })}
                    placeholder="Document name"
                    uppercase
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {/* 2. Correction of Entries (Max 4 checkboxes) */}
          {form8.purpose === 'correction' ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Check up to 4 entries requiring correction in the existing electoral roll.</span>
                <span className="font-mono font-semibold text-[#1E3A5F] tabular-nums">
                  {form8.correctionFields.length} / 4 selected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {CORRECTION_ENTRIES.map((item) => {
                  const checked = form8.correctionFields.includes(item.key);
                  const disabled = !checked && maxCorrectionsReached;
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                        checked
                          ? 'border-[#1E3A5F] bg-blue-50/70 font-medium text-[#1E3A5F]'
                          : disabled
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'cursor-pointer border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleCorrectionField(item.key)}
                        className="h-4 w-4 accent-[#1E3A5F]"
                      />
                      <span className="truncate">{item.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Dynamic Inputs for Correct Particulars */}
              {form8.correctionFields.length > 0 ? (
                <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Correct Particulars to Be Entered
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {form8.correctionFields
                      .filter((k) => k !== 'Photo')
                      .map((fieldKey) => {
                        const meta = CORRECTION_ENTRIES.find((c) => c.key === fieldKey)!;
                        return (
                          <TextField
                            key={fieldKey}
                            id={`f8-corr-${fieldKey}`}
                            label={`Corrected ${meta.label}`}
                            value={form8.correctionValues[fieldKey] || ''}
                            onChange={(v) => updateCorrectionValue(fieldKey, v)}
                            placeholder={meta.placeholder}
                            uppercase={fieldKey !== 'Mobile'}
                            mono={fieldKey === 'Mobile' || fieldKey === 'DoB/Age'}
                            required
                          />
                        );
                      })}
                  </div>

                  {form8.correctionFields.includes('Photo') ? (
                    <PassportPhotoUploader
                      label="New Replacement Passport Photograph (4.5 cm × 3.5 cm)"
                      value={form8.correctionPhotoDataUrl}
                      onChange={(dataUrl) => updateForm8({ correctionPhotoDataUrl: dataUrl })}
                    />
                  ) : null}

                  <TextField
                    id="f8-corr-docs"
                    label="Supporting Document(s) Attached"
                    value={form8.correctionSupportingDocs}
                    onChange={(v) => updateForm8({ correctionSupportingDocs: v })}
                    placeholder="e.g. AADHAAR CARD, BIRTH CERTIFICATE, GAZETTE NOTIFICATION"
                    uppercase
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* 3. Replacement EPIC without Correction */}
          {form8.purpose === 'replacement' ? (
            <div className="space-y-3">
              {REPLACEMENT_REASONS.map((reason) => {
                const active = form8.replacementReason === reason.id;
                return (
                  <label
                    key={reason.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors ${
                      active
                        ? 'border-[#1E3A5F] bg-blue-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="f8-rep-reason"
                      checked={active}
                      onChange={() => updateForm8({ replacementReason: reason.id })}
                      className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
                    />
                    <div>
                      <span className="block text-sm font-medium text-slate-900">{reason.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-600">{reason.detail}</span>
                    </div>
                  </label>
                );
              })}

              {form8.replacementReason === 'Lost' ? (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={form8.firCopyAttached}
                    onChange={(e) => updateForm8({ firCopyAttached: e.target.checked })}
                    className="h-4 w-4 accent-[#1E3A5F]"
                  />
                  Copy of FIR / Police Report attached with application
                </label>
              ) : null}
            </div>
          ) : null}

          {/* 4. Marking as PwD */}
          {form8.purpose === 'pwd' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {DISABILITY_CATEGORIES.map((cat) => {
                  const checked = form8.pwdCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3.5 py-2 text-sm transition-colors ${
                        checked
                          ? 'border-[#1E3A5F] bg-blue-50/70 text-[#1E3A5F]'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePwdCategory(cat)}
                        className="h-4 w-4 accent-[#1E3A5F]"
                      />
                      {cat}
                    </label>
                  );
                })}
              </div>

              {form8.pwdCategories.includes('Other') ? (
                <TextField
                  id="f8-pwd-other"
                  label="Specify Other Disability Category"
                  value={form8.pwdOtherText}
                  onChange={(v) => updateForm8({ pwdOtherText: v })}
                  placeholder="Describe disability category"
                  uppercase
                />
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  id="f8-pwd-pct"
                  label="Percentage of Disability (%)"
                  value={form8.pwdPercentage}
                  onChange={(v) =>
                    updateForm8({ pwdPercentage: v.replace(/\D/g, '').slice(0, 3) })
                  }
                  placeholder="e.g. 50"
                  mono
                  maxLength={3}
                />
                <div>
                  <FieldLabel label="Disability Certificate Attached" />
                  <div className="flex items-center gap-5 pt-2 text-sm">
                    {(['Yes', 'No'] as const).map((opt) => (
                      <label key={opt} className="inline-flex cursor-pointer items-center gap-2 text-slate-700">
                        <input
                          type="radio"
                          name="f8-pwd-cert"
                          checked={form8.pwdCertAttached === opt}
                          onChange={() => updateForm8({ pwdCertAttached: opt })}
                          className="h-4 w-4 accent-[#1E3A5F]"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </FormSection>
      ) : null}

      {/* Declaration */}
      <FormSection
        id="f8-declaration"
        number={form8.purpose ? '04.' : '03.'}
        title="Declaration & Signature (Page 2)"
        subtitle="Mandatory verification under Section 31 of the Representation of the People Act, 1950."
      >
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
          <p>
            I hereby declare that to the best of my knowledge and belief the information given above is true and correct. I am aware that making a statement or declaration which is false is punishable under Section 31 of the Representation of the People Act, 1950.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-slate-200 pt-2.5 text-slate-600">
            <span>
              Date: <strong className="font-mono text-slate-900 tabular-nums">{common.applicationDate || '—'}</strong>
            </span>
            <span>
              Place: <strong className="text-slate-900">{common.place || '—'}</strong>
            </span>
          </div>
        </div>

        <SignatureUploader
          value={form8.signatureDataUrl}
          onChange={(dataUrl) => updateForm8({ signatureDataUrl: dataUrl })}
        />

        <label className="flex cursor-pointer items-start gap-3 pt-1">
          <input
            type="checkbox"
            checked={form8.declarationConfirmed}
            onChange={(e) => updateForm8({ declarationConfirmed: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
          />
          <span className="text-sm font-medium text-slate-800">
            I confirm the Form-8 declaration and authorize stamping my signature onto Page 2 of the PDF.
            <span className="ml-0.5 text-red-600">*</span>
          </span>
        </label>
      </FormSection>
    </div>
  );
};
