import { CommonHeaderData, Form6Data, Form7Data, Form8Data } from '../types/forms';

function createSamplePhotoDataUrl(): string {
  const c = document.createElement('canvas');
  c.width = 350;
  c.height = 450;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#e8eef5';
  ctx.fillRect(0, 0, 350, 450);
  ctx.fillStyle = '#1e3a5f';
  ctx.beginPath();
  ctx.ellipse(175, 430, 128, 115, 0, Math.PI, 0, false);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(145, 316);
  ctx.lineTo(175, 365);
  ctx.lineTo(205, 316);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d6a47c';
  ctx.fillRect(154, 268, 42, 58);
  ctx.beginPath();
  ctx.ellipse(175, 195, 62, 78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.ellipse(175, 152, 64, 48, 0, Math.PI, 0, false);
  ctx.fill();
  ctx.fillStyle = '#475569';
  ctx.font = '600 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE PASSPORT PHOTO', 175, 428);
  return c.toDataURL('image/jpeg', 0.9);
}

function createSampleSignatureDataUrl(name = 'R. Sharma'): string {
  const c = document.createElement('canvas');
  c.width = 420;
  c.height = 120;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 420, 120);
  ctx.strokeStyle = '#0f2557';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(45, 76);
  ctx.bezierCurveTo(90, 22, 130, 96, 175, 58);
  ctx.bezierCurveTo(215, 28, 255, 86, 325, 52);
  ctx.stroke();
  ctx.fillStyle = '#0f2557';
  ctx.font = 'italic 600 32px Georgia, serif';
  ctx.fillText(name, 78, 68);
  ctx.beginPath();
  ctx.moveTo(52, 92);
  ctx.lineTo(355, 84);
  ctx.lineWidth = 1.8;
  ctx.stroke();
  return c.toDataURL('image/png');
}

function createSampleBloSealSignDataUrl(): string {
  const c = document.createElement('canvas');
  c.width = 460;
  c.height = 120;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 460, 120);

  // Sample blue rubber stamp seal on left
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(12, 14, 210, 92);
  ctx.lineWidth = 1;
  ctx.strokeRect(17, 19, 200, 82);
  ctx.fillStyle = '#1e3a8a';
  ctx.font = '700 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BOOTH LEVEL OFFICER', 117, 46);
  ctx.font = '600 13px sans-serif';
  ctx.fillText('AC-48 MALVIYA NAGAR', 117, 68);
  ctx.font = '500 12px sans-serif';
  ctx.fillText('JAIPUR (RAJASTHAN)', 117, 88);

  // Sample BLO signature overlapping/beside seal
  ctx.strokeStyle = '#0f2557';
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(245, 78);
  ctx.bezierCurveTo(278, 22, 315, 92, 355, 56);
  ctx.bezierCurveTo(385, 28, 412, 82, 444, 50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(250, 94);
  ctx.lineTo(435, 88);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  return c.toDataURL('image/png');
}

export function getSampleCommonHeader(): CommonHeaderData {
  return {
    acNo: '48',
    acName: 'MALVIYA NAGAR',
    pcNo: '07',
    pcName: 'JAIPUR',
    stateName: 'RAJASTHAN',
    applicationDate: '2026-11-21',
    place: 'JAIPUR',
    acknowledgementNo: 'ECI-2026-RJ048-9024',
    bloSealSignDataUrl: createSampleBloSealSignDataUrl(),
  };
}

export function getSampleForm6(): Form6Data {
  return {
    firstNameRegional: 'आदित्य',
    surnameRegional: 'शर्मा',
    firstNameEnglish: 'ADITYA',
    surnameEnglish: 'SHARMA',
    photoDataUrl: createSamplePhotoDataUrl(),
    signatureDataUrl: createSampleSignatureDataUrl('Aditya Sharma'),
    relationType: 'Father',
    relativeNameRegional: 'राजेश शर्मा',
    relativeNameEnglish: 'RAJESH',
    relativeSurnameEnglish: 'SHARMA',
    mobileOwner: 'Self',
    mobileNumber: '9829012345',
    emailOwner: 'Self',
    emailId: 'aditya.sharma@example.in',
    aadhaarStatus: 'furnished',
    aadhaarNumber: '482910482910',
    gender: 'Male',
    dob: '2006-04-15',
    dobProofType: 'Birth Certificate',
    dobProofOther: '',
    address: {
      houseNo: 'B-42, SECTOR 5',
      streetArea: 'MALVIYA NAGAR INDUSTRIAL AREA',
      townVillage: 'JAIPUR',
      postOffice: 'MALVIYA NAGAR SO',
      pinCode: '302017',
      tehsil: 'SANGANER',
      district: 'JAIPUR',
      state: 'RAJASTHAN',
    },
    addressProofType: 'Aadhaar Card',
    addressProofOther: '',
    disabilityCategories: [],
    disabilityOtherText: '',
    disabilityPercentage: '',
    disabilityCertAttached: '',
    familyMemberName: 'RAJESH SHARMA',
    familyMemberRelation: 'FATHER',
    familyMemberEpic: 'RJF1948271',
    birthVillage: 'JAIPUR',
    birthDistrict: 'JAIPUR',
    birthState: 'RAJASTHAN',
    residentSince: '06/2018',
    declarationConfirmed: true,
  };
}

export function getSampleForm7(): Form7Data {
  return {
    applicantFirstName: 'RAJESH',
    applicantSurname: 'SHARMA',
    applicantEpic: 'RJF1948271',
    applicantMobileOwner: 'Self',
    applicantMobile: '9829054321',
    applicantEmail: 'rajesh.sharma@example.in',
    objectionType: 'deleteOther',
    reason: 'Death',
    deathCertAttached: 'Yes',
    deathCertDetails: 'MCJ/DEATH/2026/0841',
    targetFirstName: 'HARISH CHANDRA',
    targetSurname: 'SHARMA',
    targetEpic: 'RJF0482190',
    targetPartNo: '112',
    targetSerialNo: '485',
    targetAddress: {
      houseNo: 'B-42, SECTOR 5',
      streetArea: 'MALVIYA NAGAR',
      townVillage: 'JAIPUR',
      postOffice: 'MALVIYA NAGAR SO',
      pinCode: '302017',
      tehsil: 'SANGANER',
      district: 'JAIPUR',
      state: 'RAJASTHAN',
    },
    signatureDataUrl: createSampleSignatureDataUrl('Rajesh Sharma'),
    declarationConfirmed: true,
  };
}

export function getSampleForm8(): Form8Data {
  return {
    applicantFirstName: 'SUNITA',
    applicantSurname: 'VERMA',
    applicantEpic: 'RJF3829104',
    aadhaarStatus: 'furnished',
    aadhaarNumber: '629184726190',
    mobileOwner: 'Self',
    mobileNumber: '9414088776',
    emailOwner: 'Self',
    emailId: 'sunita.verma@example.in',
    purpose: 'correction',
    shiftingType: 'withinAc',
    shiftingAddress: {
      houseNo: '',
      streetArea: '',
      townVillage: '',
      postOffice: '',
      pinCode: '',
      tehsil: '',
      district: '',
      state: 'RAJASTHAN',
    },
    shiftingAddressProof: '',
    shiftingAddressProofOther: '',
    correctionFields: ['Name', 'DoB/Age', 'Mobile'],
    correctionValues: {
      Name: 'SUNITA DEVI VERMA',
      'DoB/Age': '18/08/1989',
      Mobile: '9414088776',
    },
    correctionSupportingDocs: 'AADHAAR CARD & CLASS X MARKSHEET',
    correctionPhotoDataUrl: null,
    replacementReason: '',
    firCopyAttached: false,
    pwdCategories: [],
    pwdOtherText: '',
    pwdPercentage: '',
    pwdCertAttached: '',
    signatureDataUrl: createSampleSignatureDataUrl('Sunita Verma'),
    declarationConfirmed: true,
  };
}
