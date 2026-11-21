import { CommonHeaderData, Form6Data, Form7Data, Form8Data } from '../types/forms';

export interface ValidationIssue {
  field: string;
  message: string;
  sectionId: string;
}

export function validateCommonHeader(common: CommonHeaderData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!common.acNo.trim()) {
    issues.push({
      field: 'Assembly Constituency No.',
      message: 'Assembly Constituency Number is required.',
      sectionId: 'common-header',
    });
  }
  if (!common.acName.trim()) {
    issues.push({
      field: 'Assembly Constituency Name',
      message: 'Assembly Constituency Name is required.',
      sectionId: 'common-header',
    });
  }
  if (!common.applicationDate.trim()) {
    issues.push({
      field: 'Date of Application',
      message: 'Date of Application is required.',
      sectionId: 'common-header',
    });
  }
  if (!common.place.trim()) {
    issues.push({
      field: 'Place',
      message: 'Place of application is required.',
      sectionId: 'common-header',
    });
  }
  return issues;
}

export function validateForm6(common: CommonHeaderData, data: Form6Data): ValidationIssue[] {
  const issues = [...validateCommonHeader(common)];

  if (!data.firstNameEnglish.trim()) {
    issues.push({
      field: 'Applicant First Name (English)',
      message: 'Section 1(b): Applicant First Name in English BLOCK letters is required.',
      sectionId: 'f6-sec1',
    });
  }
  if (!data.photoDataUrl) {
    issues.push({
      field: 'Passport Size Photograph',
      message: 'Section 1: Passport size photograph (4.5 cm x 3.5 cm) is mandatory for Form-6.',
      sectionId: 'f6-sec1',
    });
  }
  if (!data.relationType) {
    issues.push({
      field: 'Relative Type',
      message: 'Section 2: Select a relation type (Father, Mother, Husband, Wife, or Legal Guardian).',
      sectionId: 'f6-sec2',
    });
  }
  if (!data.relativeNameEnglish.trim()) {
    issues.push({
      field: 'Relative Name (English)',
      message: 'Section 2(b): Relative name in English BLOCK letters is required.',
      sectionId: 'f6-sec2',
    });
  }
  if (data.aadhaarStatus === 'furnished' && data.aadhaarNumber.replace(/\D/g, '').length !== 12) {
    issues.push({
      field: 'Aadhaar Number',
      message: 'Section 5: Enter a valid 12-digit Aadhaar Number or select "Unable to furnish Aadhaar".',
      sectionId: 'f6-sec5',
    });
  }
  if (!data.gender) {
    issues.push({
      field: 'Gender',
      message: 'Section 6: Gender selection is required.',
      sectionId: 'f6-sec6',
    });
  }
  if (!data.dob) {
    issues.push({
      field: 'Date of Birth',
      message: 'Section 7(a): Date of Birth is required.',
      sectionId: 'f6-sec7',
    });
  }
  if (!data.dobProofType) {
    issues.push({
      field: 'Date of Birth Proof',
      message: 'Section 7(b): Select a Date of Birth proof document.',
      sectionId: 'f6-sec7',
    });
  }
  if (
    !data.address.houseNo.trim() ||
    !data.address.townVillage.trim() ||
    !data.address.pinCode.trim() ||
    !data.address.district.trim()
  ) {
    issues.push({
      field: 'Present Ordinary Residence',
      message: 'Section 8(a): House No., Town/Village, PIN Code, and District are required.',
      sectionId: 'f6-sec8',
    });
  }
  if (!data.addressProofType) {
    issues.push({
      field: 'Address Proof',
      message: 'Section 8(b): Select a residence proof document.',
      sectionId: 'f6-sec8',
    });
  }
  if (!data.signatureDataUrl) {
    issues.push({
      field: 'Applicant Signature / Thumb Impression',
      message: 'Declaration: Upload or draw Applicant Signature / Thumb Impression.',
      sectionId: 'f6-declaration',
    });
  }
  if (!data.declarationConfirmed) {
    issues.push({
      field: 'Declaration Confirmation',
      message: 'Declaration: Confirm the legal declaration checkbox before generating the PDF.',
      sectionId: 'f6-declaration',
    });
  }
  return issues;
}

export function validateForm7(common: CommonHeaderData, data: Form7Data): ValidationIssue[] {
  const issues = [...validateCommonHeader(common)];

  if (!data.applicantFirstName.trim()) {
    issues.push({
      field: 'Applicant Name',
      message: 'Section 1: Applicant First Name is required.',
      sectionId: 'f7-applicant',
    });
  }
  if (!data.applicantEpic.trim()) {
    issues.push({
      field: 'Applicant EPIC Number',
      message: 'Section 1: Applicant EPIC Number is required.',
      sectionId: 'f7-applicant',
    });
  }
  if (!data.objectionType) {
    issues.push({
      field: 'Application / Objection Type',
      message: 'Section 2: Select one Application/Objection type.',
      sectionId: 'f7-type',
    });
  }
  if (!data.reason) {
    issues.push({
      field: 'Reason for Deletion / Objection',
      message: 'Section 3: Select the reason for deletion or objection.',
      sectionId: 'f7-reason',
    });
  }
  if (!data.targetFirstName.trim()) {
    issues.push({
      field: 'Target Person Name',
      message: 'Section 4: Target Person First Name is required.',
      sectionId: 'f7-target',
    });
  }
  if (!data.targetAddress.townVillage.trim() || !data.targetAddress.district.trim()) {
    issues.push({
      field: 'Target Person Address',
      message: 'Section 4: Target Person Town/Village and District are required.',
      sectionId: 'f7-target',
    });
  }
  if (!data.signatureDataUrl) {
    issues.push({
      field: 'Applicant Signature / Thumb Impression',
      message: 'Declaration: Upload or draw Applicant Signature / Thumb Impression.',
      sectionId: 'f7-declaration',
    });
  }
  if (!data.declarationConfirmed) {
    issues.push({
      field: 'Declaration Confirmation',
      message: 'Declaration: Confirm the legal declaration checkbox before generating the PDF.',
      sectionId: 'f7-declaration',
    });
  }
  return issues;
}

export function validateForm8(common: CommonHeaderData, data: Form8Data): ValidationIssue[] {
  const issues = [...validateCommonHeader(common)];

  if (!data.applicantFirstName.trim()) {
    issues.push({
      field: 'Applicant Name',
      message: 'Section I: Applicant First Name is required.',
      sectionId: 'f8-applicant',
    });
  }
  if (!data.applicantEpic.trim()) {
    issues.push({
      field: 'Applicant EPIC Number',
      message: 'Section I: Applicant EPIC Number is required.',
      sectionId: 'f8-applicant',
    });
  }
  if (data.aadhaarStatus === 'furnished' && data.aadhaarNumber.replace(/\D/g, '').length !== 12) {
    issues.push({
      field: 'Aadhaar Number',
      message: 'Section I: Enter a valid 12-digit Aadhaar Number or mark as unavailable.',
      sectionId: 'f8-applicant',
    });
  }
  if (!data.purpose) {
    issues.push({
      field: 'Primary Purpose',
      message: 'Section II: Select the primary purpose of your Form-8 application.',
      sectionId: 'f8-purpose',
    });
  }

  if (data.purpose === 'shifting') {
    if (
      !data.shiftingAddress.houseNo.trim() ||
      !data.shiftingAddress.townVillage.trim() ||
      !data.shiftingAddress.pinCode.trim()
    ) {
      issues.push({
        field: 'New Residence Address',
        message: 'Shifting Section: House No., Town/Village, and PIN Code are required.',
        sectionId: 'f8-details',
      });
    }
    if (!data.shiftingAddressProof) {
      issues.push({
        field: 'Address Proof',
        message: 'Shifting Section: Select a Residence Proof document.',
        sectionId: 'f8-details',
      });
    }
  } else if (data.purpose === 'correction') {
    if (data.correctionFields.length === 0) {
      issues.push({
        field: 'Correction Entries',
        message: 'Correction Section: Select at least 1 entry (maximum 4) to correct.',
        sectionId: 'f8-details',
      });
    }
    if (data.correctionFields.includes('Photo') && !data.correctionPhotoDataUrl) {
      issues.push({
        field: 'Replacement Photo',
        message: 'Correction Section: Upload a new Passport Photograph since Photo correction is selected.',
        sectionId: 'f8-details',
      });
    }
  } else if (data.purpose === 'replacement') {
    if (!data.replacementReason) {
      issues.push({
        field: 'Replacement Reason',
        message: 'Replacement EPIC Section: Select Lost, Destroyed, or Mutilated.',
        sectionId: 'f8-details',
      });
    }
  } else if (data.purpose === 'pwd') {
    if (data.pwdCategories.length === 0) {
      issues.push({
        field: 'Disability Category',
        message: 'PwD Section: Select at least one Disability Category.',
        sectionId: 'f8-details',
      });
    }
  }

  if (!data.signatureDataUrl) {
    issues.push({
      field: 'Applicant Signature / Thumb Impression',
      message: 'Declaration: Upload or draw Applicant Signature / Thumb Impression.',
      sectionId: 'f8-declaration',
    });
  }
  if (!data.declarationConfirmed) {
    issues.push({
      field: 'Declaration Confirmation',
      message: 'Declaration: Confirm the legal declaration checkbox before generating the PDF.',
      sectionId: 'f8-declaration',
    });
  }
  return issues;
}
