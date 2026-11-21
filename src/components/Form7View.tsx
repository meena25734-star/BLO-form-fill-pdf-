import React from 'react';
import { useFormStore } from '../context/FormContext';
import { Form7ObjectionType, Form7Reason } from '../types/forms';
import { AddressFieldGroup, FieldLabel, FormSection, TextField } from './FormPrimitives';
import { SignatureUploader } from './MediaUploaders';

const OBJECTION_TYPES: { id: Exclude<Form7ObjectionType, ''>; code: string; label: string; desc: string }[] = [
  {
    id: 'deleteOther',
    code: '(i)',
    label: "Delete another person's name from electoral roll",
    desc: 'Request deletion of an existing elector due to death, shifting, duplicate entry, or ineligibility.',
  },
  {
    id: 'objectInclusion',
    code: '(ii)',
    label: 'Object to proposed inclusion of name in electoral roll',
    desc: 'Raise objection against a name newly proposed in the draft electoral roll.',
  },
  {
    id: 'deleteOwn',
    code: '(iii)',
    label: 'Delete own name from electoral roll',
    desc: 'Apply for voluntary removal of your own name from the current constituency roll.',
  },
];

const REASONS: { id: Exclude<Form7Reason, ''>; label: string; allowForSelf: boolean }[] = [
  { id: 'Death', label: 'Death', allowForSelf: false },
  { id: 'Under Age', label: 'Under Age', allowForSelf: true },
  { id: 'Absent / Permanently Shifted', label: 'Absent / Permanently Shifted', allowForSelf: true },
  { id: 'Already Enrolled', label: 'Already Enrolled', allowForSelf: true },
  { id: 'Not Indian Citizen', label: 'Not Indian Citizen', allowForSelf: true },
];

export const Form7View: React.FC = () => {
  const { form7, updateForm7, common } = useFormStore();

  const handleSelectObjectionType = (nextType: Exclude<Form7ObjectionType, ''>) => {
    const patch: Partial<typeof form7> = { objectionType: nextType };
    // Clear incompatible reason if switching to self deletion while "Death" was chosen
    if (nextType === 'deleteOwn' && form7.reason === 'Death') {
      patch.reason = '';
    }
    // Auto-copy applicant info to target when deleting own name and target is blank
    if (nextType === 'deleteOwn' && !form7.targetFirstName && form7.applicantFirstName) {
      patch.targetFirstName = form7.applicantFirstName;
      patch.targetSurname = form7.applicantSurname;
      patch.targetEpic = form7.applicantEpic;
    }
    updateForm7(patch);
  };

  const copyApplicantToTarget = () => {
    updateForm7({
      targetFirstName: form7.applicantFirstName,
      targetSurname: form7.applicantSurname,
      targetEpic: form7.applicantEpic,
    });
  };

  const availableReasons =
    form7.objectionType === 'deleteOwn'
      ? REASONS.filter((r) => r.allowForSelf)
      : REASONS;

  return (
    <div className="space-y-8">
      {/* Section 1: Applicant / Objector */}
      <FormSection
        id="f7-applicant"
        number="01."
        title="Applicant / Objector Details"
        subtitle="Details of the existing elector filing the objection or deletion application."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="f7-app-fn"
            label="Applicant First Name"
            value={form7.applicantFirstName}
            onChange={(v) => updateForm7({ applicantFirstName: v })}
            placeholder="e.g. RAJESH"
            uppercase
            required
          />
          <TextField
            id="f7-app-sn"
            label="Applicant Surname"
            value={form7.applicantSurname}
            onChange={(v) => updateForm7({ applicantSurname: v })}
            placeholder="e.g. SHARMA"
            uppercase
          />
          <TextField
            id="f7-app-epic"
            label="Applicant EPIC Number"
            value={form7.applicantEpic}
            onChange={(v) => updateForm7({ applicantEpic: v })}
            placeholder="e.g. RJF1948271"
            mono
            uppercase
            required
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">Mobile No. Row</span>
              <div className="flex items-center gap-4 text-xs">
                {(['Self', 'Relative'] as const).map((owner) => (
                  <label key={owner} className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="f7-mob-owner"
                      checked={form7.applicantMobileOwner === owner}
                      onChange={() => updateForm7({ applicantMobileOwner: owner })}
                      className="h-4 w-4 accent-[#1E3A5F]"
                    />
                    {owner}
                  </label>
                ))}
              </div>
            </div>
            <TextField
              id="f7-app-mobile"
              label="Mobile Number"
              type="tel"
              value={form7.applicantMobile}
              onChange={(v) => updateForm7({ applicantMobile: v.replace(/\D/g, '').slice(0, 10) })}
              placeholder="10-digit mobile number"
              mono
              maxLength={10}
            />
          </div>
          <div className="sm:col-span-2">
            <TextField
              id="f7-app-email"
              label="Email ID (Optional)"
              type="email"
              value={form7.applicantEmail}
              onChange={(v) => updateForm7({ applicantEmail: v })}
              placeholder="applicant@example.in"
            />
          </div>
        </div>
      </FormSection>

      {/* Section 2: Strict Single-Select Application / Objection Type */}
      <FormSection
        id="f7-type"
        number="02."
        title="Application / Objection Type"
        subtitle="Strict single-select — choose exactly one official Form-7 category."
      >
        <div className="space-y-2.5" role="radiogroup" aria-label="Application or Objection Type">
          {OBJECTION_TYPES.map((opt) => {
            const active = form7.objectionType === opt.id;
            return (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors ${
                  active
                    ? 'border-[#1E3A5F] bg-blue-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="f7-objection-type"
                  checked={active}
                  onChange={() => handleSelectObjectionType(opt.id)}
                  className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
                />
                <div>
                  <span className="block text-sm font-medium text-slate-900">
                    <span className="mr-1.5 font-mono text-xs text-[#1E3A5F]">{opt.code}</span>
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">{opt.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </FormSection>

      {/* Section 3: Specific Reasons & Conditional Death Certificate */}
      <FormSection
        id="f7-reason"
        number="03."
        title="Reason for Deletion / Objection"
        subtitle={
          form7.objectionType === 'deleteOwn'
            ? 'Showing applicable reasons for self-deletion from the electoral roll.'
            : 'Select the official reason justifying this application.'
        }
      >
        <div>
          <FieldLabel label="Specific Reason" required />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {availableReasons.map((r) => {
              const active = form7.reason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => updateForm7({ reason: r.id })}
                  aria-pressed={active}
                  className={`rounded-md border px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional Death Certificate Attachment Block */}
        {form7.reason === 'Death' ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Death Certificate Attached?</p>
                <p className="text-xs text-slate-600">
                  Attaching an official death certificate speeds up ERO verification.
                </p>
              </div>
              <div className="flex items-center gap-5 text-sm">
                {(['Yes', 'No'] as const).map((opt) => (
                  <label key={opt} className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-800">
                    <input
                      type="radio"
                      name="f7-death-cert"
                      checked={form7.deathCertAttached === opt}
                      onChange={() => updateForm7({ deathCertAttached: opt })}
                      className="h-4 w-4 accent-[#1E3A5F]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {form7.deathCertAttached === 'Yes' ? (
              <TextField
                id="f7-death-cert-no"
                label="Death Certificate Registration No. / Issuing Authority"
                value={form7.deathCertDetails}
                onChange={(v) => updateForm7({ deathCertDetails: v })}
                placeholder="e.g. MCJ/DEATH/2026/0841"
                mono
                uppercase
              />
            ) : null}
          </div>
        ) : null}
      </FormSection>

      {/* Section 4: Target Person Details */}
      <FormSection
        id="f7-target"
        number="04."
        title="Target Person Details & Residential Address"
        subtitle="Particulars of the person whose name is to be deleted or whose inclusion is objected to."
      >
        {form7.objectionType === 'deleteOwn' ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
            <span>Applying to delete your own name? Copy Applicant details below in one click.</span>
            <button
              type="button"
              onClick={copyApplicantToTarget}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              Copy Applicant Details
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="f7-tgt-fn"
            label="Target Person First Name"
            value={form7.targetFirstName}
            onChange={(v) => updateForm7({ targetFirstName: v })}
            placeholder="e.g. HARISH CHANDRA"
            uppercase
            required
          />
          <TextField
            id="f7-tgt-sn"
            label="Target Person Surname"
            value={form7.targetSurname}
            onChange={(v) => updateForm7({ targetSurname: v })}
            placeholder="e.g. SHARMA"
            uppercase
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            id="f7-tgt-epic"
            label="Target EPIC Number"
            value={form7.targetEpic}
            onChange={(v) => updateForm7({ targetEpic: v })}
            placeholder="e.g. RJF0482190"
            mono
            uppercase
          />
          <TextField
            id="f7-tgt-part"
            label="Electoral Roll Part No."
            value={form7.targetPartNo}
            onChange={(v) => updateForm7({ targetPartNo: v })}
            placeholder="e.g. 112"
            mono
          />
          <TextField
            id="f7-tgt-sl"
            label="Serial No. in Part"
            value={form7.targetSerialNo}
            onChange={(v) => updateForm7({ targetSerialNo: v })}
            placeholder="e.g. 485"
            mono
          />
        </div>

        <div className="pt-2">
          <p className="mb-3 text-sm font-medium text-slate-800">Target Person Complete Residential Address</p>
          <AddressFieldGroup
            prefix="f7-tgt-addr"
            value={form7.targetAddress}
            onChange={(next) => updateForm7({ targetAddress: next })}
            required={false}
          />
        </div>
      </FormSection>

      {/* Declaration */}
      <FormSection
        id="f7-declaration"
        number="05."
        title="Declaration & Signature"
        subtitle="Mandatory verification under Section 31 of the Representation of the People Act, 1950."
      >
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
          <p>
            I hereby declare that the facts and particulars mentioned above are true to the best of my knowledge and belief. I am aware that making a statement or declaration which is false is punishable under Section 31 of the Representation of the People Act, 1950.
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
          value={form7.signatureDataUrl}
          onChange={(dataUrl) => updateForm7({ signatureDataUrl: dataUrl })}
        />

        <label className="flex cursor-pointer items-start gap-3 pt-1">
          <input
            type="checkbox"
            checked={form7.declarationConfirmed}
            onChange={(e) => updateForm7({ declarationConfirmed: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
          />
          <span className="text-sm font-medium text-slate-800">
            I confirm the Form-7 declaration and authorize stamping my signature onto the PDF.
            <span className="ml-0.5 text-red-600">*</span>
          </span>
        </label>
      </FormSection>
    </div>
  );
};
