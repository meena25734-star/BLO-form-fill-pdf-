export type FormId = 'form6' | 'form7' | 'form8';

export type TemplateLoadStatus = 'loading' | 'loaded' | 'error';

export interface TemplateState {
  status: TemplateLoadStatus;
  bytes: Uint8Array | null;
  fileName: string;
  byteSize?: number;
  error?: string;
}

export interface CommonHeaderData {
  acNo: string;
  acName: string;
  pcNo: string;
  pcName: string;
  stateName: string;
  applicationDate: string; // YYYY-MM-DD in UI, formatted DD/MM/YYYY on PDF
  place: string;
  acknowledgementNo: string;
  bloSealSignDataUrl: string | null;
}

export interface BloDefaultProfile {
  acNo: string;
  acName: string;
  pcNo: string;
  pcName: string;
  stateName: string;
  districtName: string;
  place: string;
  partNumber: string;
  bloSealSignDataUrl: string | null;
  updatedAt: string;
}

export interface SavedFormRecord {
  id: string;
  formId: FormId;
  savedAt: string;
  applicantName: string;
  relativeOrEpic: string;
  mobileNumber: string;
  acSummary: string;
  common: CommonHeaderData;
  form6?: Form6Data;
  form7?: Form7Data;
  form8?: Form8Data;
}

export type RelationType = 'Father' | 'Mother' | 'Husband' | 'Wife' | 'Legal Guardian';
export type ContactOwner = 'Self' | 'Relative';
export type GenderType = 'Male' | 'Female' | 'Third Gender' | '';

export type DobProofType =
  | 'Birth Certificate'
  | 'Aadhaar Card'
  | 'PAN Card'
  | 'Driving License'
  | 'Class X/XII Marksheet'
  | 'Indian Passport'
  | 'Other Document'
  | '';

export type AddressProofType =
  | 'Water/Electricity/Gas Bill'
  | 'Aadhaar Card'
  | 'Bank/PO Passbook'
  | 'Indian Passport'
  | 'Land Record'
  | 'Rent/Lease Deed'
  | 'Sale Deed'
  | 'Other Document'
  | '';

export type DisabilityCategory = 'Locomotive' | 'Visual' | 'Deaf & Dumb' | 'Other';

export interface AddressFields {
  houseNo: string;
  streetArea: string;
  townVillage: string;
  postOffice: string;
  pinCode: string;
  tehsil: string;
  district: string;
  state: string;
}

export interface Form6Data {
  firstNameRegional: string;
  surnameRegional: string;
  firstNameEnglish: string;
  surnameEnglish: string;
  photoDataUrl: string | null;
  signatureDataUrl: string | null;
  relationType: RelationType | '';
  relativeNameRegional: string;
  relativeNameEnglish: string;
  relativeSurnameEnglish: string;
  mobileOwner: ContactOwner;
  mobileNumber: string;
  emailOwner: ContactOwner;
  emailId: string;
  aadhaarStatus: 'furnished' | 'unavailable';
  aadhaarNumber: string;
  gender: GenderType;
  dob: string; // YYYY-MM-DD
  dobProofType: DobProofType;
  dobProofOther: string;
  address: AddressFields;
  addressProofType: AddressProofType;
  addressProofOther: string;
  disabilityCategories: DisabilityCategory[];
  disabilityOtherText: string;
  disabilityPercentage: string;
  disabilityCertAttached: 'Yes' | 'No' | '';
  familyMemberName: string;
  familyMemberRelation: string;
  familyMemberEpic: string;
  birthVillage: string;
  birthDistrict: string;
  birthState: string;
  residentSince: string; // MM/YYYY
  declarationConfirmed: boolean;
}

export type Form7ObjectionType = 'deleteOther' | 'objectInclusion' | 'deleteOwn' | '';
export type Form7Reason =
  | 'Death'
  | 'Under Age'
  | 'Absent / Permanently Shifted'
  | 'Already Enrolled'
  | 'Not Indian Citizen'
  | '';

export interface Form7Data {
  applicantFirstName: string;
  applicantSurname: string;
  applicantEpic: string;
  applicantMobileOwner: ContactOwner;
  applicantMobile: string;
  applicantEmail: string;
  objectionType: Form7ObjectionType;
  reason: Form7Reason;
  deathCertAttached: 'Yes' | 'No';
  deathCertDetails: string;
  targetFirstName: string;
  targetSurname: string;
  targetEpic: string;
  targetPartNo: string;
  targetSerialNo: string;
  targetAddress: AddressFields;
  signatureDataUrl: string | null;
  declarationConfirmed: boolean;
}

export type Form8Purpose = 'shifting' | 'correction' | 'replacement' | 'pwd' | '';
export type CorrectionFieldKey =
  | 'Name'
  | 'Gender'
  | 'DoB/Age'
  | 'Relation Type'
  | 'Relation Name'
  | 'Address'
  | 'Mobile'
  | 'Photo';

export type ReplacementReason = 'Lost' | 'Destroyed' | 'Mutilated' | '';

export interface Form8Data {
  applicantFirstName: string;
  applicantSurname: string;
  applicantEpic: string;
  aadhaarStatus: 'furnished' | 'unavailable';
  aadhaarNumber: string;
  mobileOwner: ContactOwner;
  mobileNumber: string;
  emailOwner: ContactOwner;
  emailId: string;
  purpose: Form8Purpose;
  // Purpose 1: Shifting
  shiftingType: 'withinAc' | 'outsideAc';
  shiftingAddress: AddressFields;
  shiftingAddressProof: AddressProofType;
  shiftingAddressProofOther: string;
  // Purpose 2: Correction (max 4)
  correctionFields: CorrectionFieldKey[];
  correctionValues: Partial<Record<CorrectionFieldKey, string>>;
  correctionSupportingDocs: string;
  correctionPhotoDataUrl: string | null;
  // Purpose 3: Replacement
  replacementReason: ReplacementReason;
  firCopyAttached: boolean;
  // Purpose 4: PwD
  pwdCategories: DisabilityCategory[];
  pwdOtherText: string;
  pwdPercentage: string;
  pwdCertAttached: 'Yes' | 'No' | '';
  // Declaration
  signatureDataUrl: string | null;
  declarationConfirmed: boolean;
}
