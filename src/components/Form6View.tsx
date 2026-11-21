import React from 'react';
import { useFormStore } from '../context/FormContext';
import {
  AddressProofType,
  DisabilityCategory,
  DobProofType,
  GenderType,
  RelationType,
} from '../types/forms';
import {
  AddressFieldGroup,
  FieldLabel,
  FormSection,
  INPUT_CLASS,
  RegionalTextField,
  TextField,
} from './FormPrimitives';
import { PassportPhotoUploader, SignatureUploader } from './MediaUploaders';

const RELATION_TYPES: RelationType[] = [
  'Father',
  'Mother',
  'Husband',
  'Wife',
  'Legal Guardian',
];

const GENDERS: Exclude<GenderType, ''>[] = ['Male', 'Female', 'Third Gender'];

const DOB_PROOFS: Exclude<DobProofType, ''>[] = [
  'Birth Certificate',
  'Aadhaar Card',
  'PAN Card',
  'Driving License',
  'Class X/XII Marksheet',
  'Indian Passport',
  'Other Document',
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

const DISABILITY_CATEGORIES: DisabilityCategory[] = [
  'Locomotive',
  'Visual',
  'Deaf & Dumb',
  'Other',
];

export const Form6View: React.FC = () => {
  const { form6, updateForm6, common } = useFormStore();

  const toggleDisability = (category: DisabilityCategory) => {
    const exists = form6.disabilityCategories.includes(category);
    const next = exists
      ? form6.disabilityCategories.filter((c) => c !== category)
      : [...form6.disabilityCategories, category];
    updateForm6({ disabilityCategories: next });
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Applicant Name + Passport Photo */}
      <FormSection
        id="f6-sec1"
        number="01."
        title="Applicant Name & Passport Photograph (Sections 1a & 1b)"
        subtitle="Regional script is rasterized via high-DPI HTML5 Canvas into PNG and stamped directly onto Page 1 alongside English BLOCK letters."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RegionalTextField
            id="f6-fn-reg"
            label="1(a) First Name followed by Middle Name (Regional)"
            value={form6.firstNameRegional}
            onChange={(v) => updateForm6({ firstNameRegional: v })}
            placeholder="उदा. आदित्य"
          />
          <RegionalTextField
            id="f6-sn-reg"
            label="Surname (Regional)"
            value={form6.surnameRegional}
            onChange={(v) => updateForm6({ surnameRegional: v })}
            placeholder="उदा. शर्मा"
          />
          <TextField
            id="f6-fn-en"
            label="1(b) First Name followed by Middle Name (English BLOCK)"
            value={form6.firstNameEnglish}
            onChange={(v) => updateForm6({ firstNameEnglish: v })}
            placeholder="e.g. ADITYA"
            uppercase
            required
          />
          <TextField
            id="f6-sn-en"
            label="Surname (English BLOCK)"
            value={form6.surnameEnglish}
            onChange={(v) => updateForm6({ surnameEnglish: v })}
            placeholder="e.g. SHARMA"
            uppercase
          />
        </div>

        <PassportPhotoUploader
          value={form6.photoDataUrl}
          onChange={(dataUrl) => updateForm6({ photoDataUrl: dataUrl })}
        />
      </FormSection>

      {/* Section 2: Relative Details */}
      <FormSection
        id="f6-sec2"
        number="02."
        title="Name & Surname of Any One Relative (Sections 2a & 2b)"
        subtitle="Select relation type and enter relative's name in Regional Language and English BLOCK letters."
      >
        <div>
          <FieldLabel label="Relation Type" required />
          <div className="flex flex-wrap gap-2">
            {RELATION_TYPES.map((rel) => {
              const active = form6.relationType === rel;
              return (
                <button
                  key={rel}
                  type="button"
                  onClick={() => updateForm6({ relationType: rel })}
                  aria-pressed={active}
                  className={`rounded-md border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {rel}
                </button>
              );
            })}
          </div>
        </div>

        <RegionalTextField
          id="f6-rel-reg"
          label="2(a) Relative's Full Name (Regional Language)"
          value={form6.relativeNameRegional}
          onChange={(v) => updateForm6({ relativeNameRegional: v })}
          placeholder="उदा. राजेश शर्मा"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="f6-rel-en"
            label="2(b) Relative's First Name (English BLOCK)"
            value={form6.relativeNameEnglish}
            onChange={(v) => updateForm6({ relativeNameEnglish: v })}
            placeholder="e.g. RAJESH"
            uppercase
            required
          />
          <TextField
            id="f6-rel-sn-en"
            label="Relative's Surname (English BLOCK)"
            value={form6.relativeSurnameEnglish}
            onChange={(v) => updateForm6({ relativeSurnameEnglish: v })}
            placeholder="e.g. SHARMA"
            uppercase
          />
        </div>
      </FormSection>

      {/* Section 3 & 4: Contact Details */}
      <FormSection
        id="f6-sec3"
        number="03–04."
        title="Contact Details (Mobile Number & Email ID)"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">3. Mobile Number Owner</span>
              <div className="flex items-center gap-4 text-xs">
                {(['Self', 'Relative'] as const).map((owner) => (
                  <label key={owner} className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="f6-mobile-owner"
                      checked={form6.mobileOwner === owner}
                      onChange={() => updateForm6({ mobileOwner: owner })}
                      className="h-4 w-4 accent-[#1E3A5F]"
                    />
                    {owner}
                  </label>
                ))}
              </div>
            </div>
            <TextField
              id="f6-mobile"
              label="Mobile Number"
              type="tel"
              value={form6.mobileNumber}
              onChange={(v) => updateForm6({ mobileNumber: v.replace(/\D/g, '').slice(0, 10) })}
              placeholder="10-digit mobile number"
              mono
              maxLength={10}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">4. Email ID Owner</span>
              <div className="flex items-center gap-4 text-xs">
                {(['Self', 'Relative'] as const).map((owner) => (
                  <label key={owner} className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="f6-email-owner"
                      checked={form6.emailOwner === owner}
                      onChange={() => updateForm6({ emailOwner: owner })}
                      className="h-4 w-4 accent-[#1E3A5F]"
                    />
                    {owner}
                  </label>
                ))}
              </div>
            </div>
            <TextField
              id="f6-email"
              label="Email ID (Optional)"
              type="email"
              value={form6.emailId}
              onChange={(v) => updateForm6({ emailId: v })}
              placeholder="applicant@example.in"
            />
          </div>
        </div>
      </FormSection>

      {/* Section 5: Aadhaar */}
      <FormSection
        id="f6-sec5"
        number="05."
        title="Aadhaar Details"
        subtitle="Select option (a) to furnish 12-digit Aadhaar Number or option (b) if Aadhaar is not available."
      >
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3.5 transition-colors hover:bg-slate-50">
            <input
              type="radio"
              name="f6-aadhaar-status"
              checked={form6.aadhaarStatus === 'furnished'}
              onChange={() => updateForm6({ aadhaarStatus: 'furnished' })}
              className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
            />
            <div className="flex-1 space-y-2.5">
              <span className="block text-sm font-medium text-slate-800">
                (a) Aadhaar Number
              </span>
              {form6.aadhaarStatus === 'furnished' ? (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={form6.aadhaarNumber}
                  onChange={(e) =>
                    updateForm6({ aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
                  }
                  placeholder="Enter 12-digit Aadhaar Number"
                  className={`${INPUT_CLASS} max-w-sm font-mono tabular-nums tracking-widest`}
                />
              ) : null}
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-white p-3.5 transition-colors hover:bg-slate-50">
            <input
              type="radio"
              name="f6-aadhaar-status"
              checked={form6.aadhaarStatus === 'unavailable'}
              onChange={() => updateForm6({ aadhaarStatus: 'unavailable', aadhaarNumber: '' })}
              className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
            />
            <span className="text-sm text-slate-800">
              (b) I am not able to furnish my Aadhaar Number because I don&apos;t have Aadhaar number.
            </span>
          </label>
        </div>
      </FormSection>

      {/* Section 6: Gender */}
      <FormSection id="f6-sec6" number="06." title="Gender">
        <div className="flex flex-wrap gap-3">
          {GENDERS.map((g) => {
            const active = form6.gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => updateForm6({ gender: g })}
                aria-pressed={active}
                className={`min-w-[120px] rounded-md border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </FormSection>

      {/* Section 7: Date of Birth & Proof */}
      <FormSection
        id="f6-sec7"
        number="07."
        title="Date of Birth & Document Proof (Sections 7a & 7b)"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="f6-dob"
            label="7(a) Date of Birth"
            type="date"
            value={form6.dob}
            onChange={(v) => updateForm6({ dob: v })}
            mono
            required
          />
          <div>
            <FieldLabel htmlFor="f6-dob-proof" label="7(b) Self-Attested Proof of Date of Birth" required />
            <select
              id="f6-dob-proof"
              value={form6.dobProofType}
              onChange={(e) =>
                updateForm6({ dobProofType: e.target.value as DobProofType })
              }
              className={INPUT_CLASS}
            >
              <option value="">Select proof document...</option>
              {DOB_PROOFS.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form6.dobProofType === 'Other Document' ? (
          <TextField
            id="f6-dob-other"
            label="Specify Other Age / Date of Birth Document"
            value={form6.dobProofOther}
            onChange={(v) => updateForm6({ dobProofOther: v })}
            placeholder="e.g. MUNICIPAL REGISTER EXTRACT"
            uppercase
            required
          />
        ) : null}
      </FormSection>

      {/* Section 8: Residential Address & Proof */}
      <FormSection
        id="f6-sec8"
        number="08."
        title="Present Ordinary Residence & Address Proof (Sections 8a & 8b)"
      >
        <AddressFieldGroup
          prefix="f6-addr"
          value={form6.address}
          onChange={(next) => updateForm6({ address: next })}
        />

        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="f6-addr-proof" label="8(b) Self-Attested Proof of Residence" required />
            <select
              id="f6-addr-proof"
              value={form6.addressProofType}
              onChange={(e) =>
                updateForm6({ addressProofType: e.target.value as AddressProofType })
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

          {form6.addressProofType === 'Other Document' ? (
            <TextField
              id="f6-addr-other"
              label="Specify Other Residence Document"
              value={form6.addressProofOther}
              onChange={(v) => updateForm6({ addressProofOther: v })}
              placeholder="e.g. GAS CONNECTION RECEIPT"
              uppercase
              required
            />
          ) : null}
        </div>
      </FormSection>

      {/* Section 9: Disability (Page 2) */}
      <FormSection
        id="f6-sec9"
        number="09."
        title="Category of Disability — Page 2 (Optional)"
        subtitle="Leave unselected if not applicable."
      >
        <div className="flex flex-wrap gap-3">
          {DISABILITY_CATEGORIES.map((cat) => {
            const checked = form6.disabilityCategories.includes(cat);
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
                  onChange={() => toggleDisability(cat)}
                  className="h-4 w-4 accent-[#1E3A5F]"
                />
                {cat}
              </label>
            );
          })}
        </div>

        {form6.disabilityCategories.includes('Other') ? (
          <TextField
            id="f6-dis-other"
            label="Specify Other Disability"
            value={form6.disabilityOtherText}
            onChange={(v) => updateForm6({ disabilityOtherText: v })}
            placeholder="Describe disability"
            uppercase
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="f6-dis-pct"
            label="Percentage of Disability (%)"
            value={form6.disabilityPercentage}
            onChange={(v) =>
              updateForm6({ disabilityPercentage: v.replace(/\D/g, '').slice(0, 3) })
            }
            placeholder="e.g. 40"
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
                    name="f6-dis-cert"
                    checked={form6.disabilityCertAttached === opt}
                    onChange={() => updateForm6({ disabilityCertAttached: opt })}
                    className="h-4 w-4 accent-[#1E3A5F]"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      </FormSection>

      {/* Section 10: Family Member Details */}
      <FormSection
        id="f6-sec10"
        number="10."
        title="Details of Family Member Already in Electoral Roll"
        subtitle="Helps BLO verify polling station & part mapping at current residential address."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            id="f6-fam-name"
            label="Name of Family Member"
            value={form6.familyMemberName}
            onChange={(v) => updateForm6({ familyMemberName: v })}
            placeholder="e.g. RAJESH SHARMA"
            uppercase
          />
          <TextField
            id="f6-fam-rel"
            label="Relationship with Applicant"
            value={form6.familyMemberRelation}
            onChange={(v) => updateForm6({ familyMemberRelation: v })}
            placeholder="e.g. FATHER"
            uppercase
          />
          <TextField
            id="f6-fam-epic"
            label="Family Member EPIC No."
            value={form6.familyMemberEpic}
            onChange={(v) => updateForm6({ familyMemberEpic: v })}
            placeholder="e.g. RJF1948271"
            mono
            uppercase
          />
        </div>
      </FormSection>

      {/* Declaration Block */}
      <FormSection
        id="f6-declaration"
        number="11."
        title="Legal Declaration & Signature (Page 2)"
        subtitle="Under Section 31 of the Representation of the People Act, 1950."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <TextField
            id="f6-birth-village"
            label="Place of Birth (Village / Town)"
            value={form6.birthVillage}
            onChange={(v) => updateForm6({ birthVillage: v })}
            placeholder="e.g. JAIPUR"
            uppercase
          />
          <TextField
            id="f6-birth-district"
            label="Birth District"
            value={form6.birthDistrict}
            onChange={(v) => updateForm6({ birthDistrict: v })}
            placeholder="e.g. JAIPUR"
            uppercase
          />
          <TextField
            id="f6-birth-state"
            label="Birth State"
            value={form6.birthState}
            onChange={(v) => updateForm6({ birthState: v })}
            placeholder="e.g. RAJASTHAN"
            uppercase
          />
          <TextField
            id="f6-res-since"
            label="Resident Since (MM/YYYY)"
            value={form6.residentSince}
            onChange={(v) => updateForm6({ residentSince: v })}
            placeholder="e.g. 06/2018"
            mono
          />
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
          <p>
            I hereby declare that I am a citizen of India, ordinarily residing at the address entered in Section 8(a), applying for inclusion in the Electoral Roll for the first time, and my name is not included in any Assembly/Parliamentary Constituency. I am aware that making a false declaration is punishable under Section 31 of the Representation of the People Act, 1950.
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
          value={form6.signatureDataUrl}
          onChange={(dataUrl) => updateForm6({ signatureDataUrl: dataUrl })}
        />

        <label className="flex cursor-pointer items-start gap-3 pt-1">
          <input
            type="checkbox"
            checked={form6.declarationConfirmed}
            onChange={(e) => updateForm6({ declarationConfirmed: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-[#1E3A5F]"
          />
          <span className="text-sm font-medium text-slate-800">
            I confirm that all particulars entered in Form-6 are verified and true to the best of my knowledge and belief.
            <span className="ml-0.5 text-red-600">*</span>
          </span>
        </label>
      </FormSection>
    </div>
  );
};
