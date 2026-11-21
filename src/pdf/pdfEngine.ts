import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, LineCapStyle } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  FORM6_COORDS,
  FORM7_COORDS,
  FORM8_COORDS,
  FieldBox,
  CheckboxBox,
  CellGrid,
} from './coordinates';
import {
  CommonHeaderData,
  Form6Data,
  Form7Data,
  Form8Data,
  FormId,
} from '../types/forms';

const TEXT_COLOR = rgb(0.05, 0.13, 0.34); // Official crisp dark blue-ink stamp
const CHECK_COLOR = rgb(0.04, 0.15, 0.42);

/**
 * Formats YYYY-MM-DD HTML date input into DD/MM/YYYY official ECI format.
 */
export function formatDateForPdf(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Extracts DDMMYYYY 8-digit string from YYYY-MM-DD for Form-6 official DoB boxes.
 */
function extractDobDigits(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}${parts[1]}${parts[0]}`.replace(/\D/g, '').slice(0, 8);
  }
  return dateStr.replace(/\D/g, '').slice(0, 8);
}

/**
 * Sanitizes strings for WinAnsi standard PDF fonts.
 */
function sanitizeWinAnsi(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

/**
 * Draws single-line text strictly within a designated FieldBox, enforcing uppercase
 * for standardized fields and shrinking/truncating cleanly with zero overflow.
 */
function drawFittedText(
  page: PDFPage,
  font: PDFFont,
  rawText: string,
  box: FieldBox
) {
  if (!rawText || !rawText.trim()) return;
  const formatted = sanitizeWinAnsi(
    box.uppercase !== false ? rawText.trim().toUpperCase() : rawText.trim()
  );
  if (!formatted) return;

  if (box.maskBackground) {
    page.drawRectangle({
      x: box.x + 0.5,
      y: box.y + 0.5,
      width: box.width - 1,
      height: box.height - 1,
      color: rgb(1, 1, 1),
    });
  }

  const paddingX = box.align === 'center' ? 1 : 2.5;
  const maxWidth = Math.max(8, box.width - paddingX * 2);
  let fontSize = box.fontSize ?? 9;
  const minFontSize = 6.2;

  while (fontSize > minFontSize && font.widthOfTextAtSize(formatted, fontSize) > maxWidth) {
    fontSize -= 0.4;
  }

  let textToDraw = formatted;
  if (font.widthOfTextAtSize(textToDraw, fontSize) > maxWidth) {
    while (textToDraw.length > 1 && font.widthOfTextAtSize(textToDraw + '...', fontSize) > maxWidth) {
      textToDraw = textToDraw.slice(0, -1);
    }
    if (textToDraw.length > 1) {
      textToDraw = textToDraw.trimEnd() + '...';
    }
  }

  const textWidth = font.widthOfTextAtSize(textToDraw, fontSize);
  const drawX =
    box.align === 'center'
      ? box.x + (box.width - textWidth) / 2
      : box.x + paddingX;
  const drawY = box.y + (box.height - fontSize) / 2 + 1.2;

  page.drawText(textToDraw, {
    x: drawX,
    y: drawY,
    size: fontSize,
    font,
    color: TEXT_COLOR,
  });
}

/**
 * Stamps one uppercase character cleanly centered inside each official ECI square cell box.
 */
function drawInCells(
  page: PDFPage,
  font: PDFFont,
  rawText: string,
  grid: CellGrid
) {
  if (!rawText) return;
  const clean = sanitizeWinAnsi(rawText.trim().toUpperCase());
  if (!clean) return;

  const fontSize = grid.fontSize ?? 9.5;
  const count = Math.min(clean.length, grid.cells.length);

  for (let i = 0; i < count; i++) {
    const ch = clean[i];
    const cell = grid.cells[i];

    // Optional inner white mask to cleanly cover pre-printed grey watermark letters (d d m m y y y y)
    if (grid.maskInside) {
      page.drawRectangle({
        x: cell.x + 1.4,
        y: cell.y + 1.4,
        width: cell.w - 2.8,
        height: cell.h - 2.8,
        color: rgb(1, 1, 1),
      });
    }

    if (ch === ' ') continue;

    const charWidth = font.widthOfTextAtSize(ch, fontSize);
    const drawX = cell.x + (cell.w - charWidth) / 2;
    const drawY = cell.y + (cell.h - fontSize) / 2 + 1.6;

    page.drawText(ch, {
      x: drawX,
      y: drawY,
      size: fontSize,
      font,
      color: TEXT_COLOR,
    });
  }
}

/**
 * Draws a crisp vector checkmark centered inside an official rectangular/square checkbox.
 */
function drawVectorCheckmark(page: PDFPage, cb: CheckboxBox) {
  const cx = cb.x + cb.width / 2;
  const cy = cb.y + cb.height / 2;
  const s = Math.min(cb.width, cb.height) * 0.72;

  const p1 = { x: cx - s * 0.42, y: cy + s * 0.02 };
  const p2 = { x: cx - s * 0.1, y: cy - s * 0.34 };
  const p3 = { x: cx + s * 0.46, y: cy + s * 0.4 };

  page.drawLine({
    start: p1,
    end: p2,
    thickness: 1.6,
    color: CHECK_COLOR,
    lineCap: LineCapStyle.Round,
  });
  page.drawLine({
    start: p2,
    end: p3,
    thickness: 1.6,
    color: CHECK_COLOR,
    lineCap: LineCapStyle.Round,
  });
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Dedicated Devanagari / Regional Language Rendering Pipeline:
 * Renders Unicode Devanagari script onto an off-screen high-DPI HTML5 Canvas using
 * Noto Sans Devanagari / system fonts, exports as PNG buffer, and embeds precisely
 * into the designated coordinate box on the official ECI PDF.
 */
async function drawRegionalTextViaCanvas(
  pdfDoc: PDFDocument,
  page: PDFPage,
  text: string,
  box: FieldBox
) {
  const cleaned = text.trim();
  if (!cleaned) return;

  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed with fallback Devanagari fonts
    }
  }

  // Mask underlying vertical cell gridlines gently so Devanagari matras stay 100% crisp & legible
  if (box.maskBackground) {
    page.drawRectangle({
      x: box.x + 0.6,
      y: box.y + 0.8,
      width: box.width - 1.2,
      height: box.height - 1.6,
      color: rgb(1, 1, 1),
    });
  }

  const scale = 3.5;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(20, Math.round(box.width * scale));
  canvas.height = Math.max(12, Math.round(box.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fontStack = '"Noto Sans Devanagari", "Nirmala UI", "Mangal", "Kohinoor Devanagari", sans-serif';
  let fontPx = Math.round(box.height * 0.68 * scale);
  const minFontPx = Math.round(6.5 * scale);
  const padX = Math.round(3 * scale);
  const maxTextWidth = canvas.width - padX * 2;

  ctx.font = `600 ${fontPx}px ${fontStack}`;
  let measured = ctx.measureText(cleaned).width;

  while (fontPx > minFontPx && measured > maxTextWidth) {
    fontPx -= 1;
    ctx.font = `600 ${fontPx}px ${fontStack}`;
    measured = ctx.measureText(cleaned).width;
  }

  let drawStr = cleaned;
  if (measured > maxTextWidth) {
    while (drawStr.length > 1 && ctx.measureText(drawStr + '…').width > maxTextWidth) {
      drawStr = drawStr.slice(0, -1);
    }
    drawStr = drawStr + '…';
  }

  ctx.fillStyle = '#0d2157';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(drawStr, padX, canvas.height / 2 + 1);

  const pngDataUrl = canvas.toDataURL('image/png');
  const pngBytes = dataUrlToUint8Array(pngDataUrl);
  const embeddedPng = await pdfDoc.embedPng(pngBytes);

  page.drawImage(embeddedPng, {
    x: box.x + 0.5,
    y: box.y + 0.5,
    width: box.width - 1,
    height: box.height - 1,
  });
}

/**
 * Image Embedding Pipeline:
 * Converts uploaded photo/signature blobs via off-screen Canvas into clean white-backed
 * JPEG buffers and stamps them directly into the official photo/signature frames.
 */
async function convertImageToJpegBytes(
  dataUrl: string,
  targetWidthPt: number,
  targetHeightPt: number,
  mode: 'cover' | 'contain'
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const dpiScale = 3.2;
      const cw = Math.round(targetWidthPt * dpiScale);
      const ch = Math.round(targetHeightPt * dpiScale);
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to initialize canvas context for image processing.'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cw, ch);

      const imgRatio = img.width / img.height;
      const boxRatio = cw / ch;

      if (mode === 'cover') {
        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;
        if (imgRatio > boxRatio) {
          sw = img.height * boxRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / boxRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      } else {
        const pad = Math.round(3 * dpiScale);
        const availW = cw - pad * 2;
        const availH = ch - pad * 2;
        const availRatio = availW / availH;
        let dw = availW;
        let dh = availH;
        if (imgRatio > availRatio) {
          dh = availW / imgRatio;
        } else {
          dw = availH * imgRatio;
        }
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      const jpegUrl = canvas.toDataURL('image/jpeg', 0.92);
      resolve(dataUrlToUint8Array(jpegUrl));
    };
    img.onerror = () => reject(new Error('Failed to decode uploaded image for PDF embedding.'));
    img.src = dataUrl;
  });
}

async function embedImageInBox(
  pdfDoc: PDFDocument,
  page: PDFPage,
  dataUrl: string | null,
  box: FieldBox,
  mode: 'cover' | 'contain'
) {
  if (!dataUrl) return;
  const inset = mode === 'cover' ? 1.5 : 0.5;
  const w = box.width - inset * 2;
  const h = box.height - inset * 2;
  const jpegBytes = await convertImageToJpegBytes(dataUrl, w, h, mode);
  const embeddedJpg = await pdfDoc.embedJpg(jpegBytes);
  page.drawImage(embeddedJpg, {
    x: box.x + inset,
    y: box.y + inset,
    width: w,
    height: h,
  });
}

export async function generateFilledForm6Pdf(
  templateBytes: Uint8Array,
  common: CommonHeaderData,
  data: Form6Data
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  const p2 = pages[1];

  // Header Constituency details
  drawFittedText(p1, font, common.acNo, FORM6_COORDS.header.acNo);
  drawFittedText(p1, font, common.acName, FORM6_COORDS.header.acName);
  drawFittedText(p1, font, common.pcNo, FORM6_COORDS.header.pcNo);
  drawFittedText(p1, font, common.pcName, FORM6_COORDS.header.pcName);

  // Passport Photo (4.5 cm x 3.5 cm)
  await embedImageInBox(pdfDoc, p1, data.photoDataUrl, FORM6_COORDS.photoBox, 'cover');

  // Section (1)(a) Regional Name via Canvas PNG
  await drawRegionalTextViaCanvas(pdfDoc, p1, data.firstNameRegional, FORM6_COORDS.sec1.firstNameRegional);
  await drawRegionalTextViaCanvas(pdfDoc, p1, data.surnameRegional, FORM6_COORDS.sec1.surnameRegional);

  // Section (1)(b) English BLOCK Letters inside exact official character cells
  drawInCells(p1, font, data.firstNameEnglish, FORM6_COORDS.sec1.firstNameEnglishGrid);
  drawInCells(p1, font, data.surnameEnglish, FORM6_COORDS.sec1.surnameEnglishGrid);

  // Section (2)(a) & (2)(b) Relative Details
  if (data.relationType && FORM6_COORDS.sec2.relationType[data.relationType]) {
    drawVectorCheckmark(p1, FORM6_COORDS.sec2.relationType[data.relationType]);
  }
  await drawRegionalTextViaCanvas(pdfDoc, p1, data.relativeNameRegional, FORM6_COORDS.sec2.relativeNameRegional);
  const relativeFullEnglish = [data.relativeNameEnglish, data.relativeSurnameEnglish]
    .filter(Boolean)
    .join(' ');
  drawInCells(p1, font, relativeFullEnglish, FORM6_COORDS.sec2.relativeNameEnglishGrid);

  // Section (3) Mobile No. — stamps in Self row or Relative row
  if (data.mobileNumber.trim()) {
    const mobileGrid =
      data.mobileOwner === 'Self'
        ? FORM6_COORDS.sec3.mobileSelfGrid
        : FORM6_COORDS.sec3.mobileRelativeGrid;
    drawInCells(p1, font, data.mobileNumber.replace(/\D/g, ''), mobileGrid);
  }

  // Section (4) Email ID — stamps in Self line or Relative line
  if (data.emailId.trim()) {
    const emailBox =
      data.emailOwner === 'Self' ? FORM6_COORDS.sec4.emailSelf : FORM6_COORDS.sec4.emailRelative;
    drawFittedText(p1, font, data.emailId, emailBox);
  }

  // Section (5) Aadhaar Details
  if (data.aadhaarStatus === 'furnished') {
    drawVectorCheckmark(p1, FORM6_COORDS.sec5.hasAadhaar);
    drawInCells(p1, font, data.aadhaarNumber.replace(/\D/g, ''), FORM6_COORDS.sec5.aadhaarGrid);
  } else {
    drawVectorCheckmark(p1, FORM6_COORDS.sec5.noAadhaar);
  }

  // Section (6) Gender
  if (data.gender && FORM6_COORDS.sec6.gender[data.gender]) {
    drawVectorCheckmark(p1, FORM6_COORDS.sec6.gender[data.gender]);
  }

  // Section (7)(a) Date of Birth into d d / m m / y y y y cells
  drawInCells(p1, font, extractDobDigits(data.dob), FORM6_COORDS.sec7.dobDigitsGrid);

  // Section (7)(b) Date of Birth Proof
  if (data.dobProofType && data.dobProofType !== 'Other Document') {
    const cb = FORM6_COORDS.sec7.dobProofCheckboxes[data.dobProofType];
    if (cb) drawVectorCheckmark(p1, cb);
  } else if (data.dobProofType === 'Other Document') {
    drawFittedText(p1, font, data.dobProofOther, FORM6_COORDS.sec7.dobProofOther);
  }

  // Section (8)(a) Present Ordinary Residence (Page 1 bottom table)
  drawFittedText(p1, font, data.address.houseNo, FORM6_COORDS.sec8.houseNo);
  drawFittedText(p1, font, data.address.streetArea, FORM6_COORDS.sec8.streetArea);
  drawFittedText(p1, font, data.address.townVillage, FORM6_COORDS.sec8.townVillage);
  drawFittedText(p1, font, data.address.postOffice, FORM6_COORDS.sec8.postOffice);
  drawFittedText(p1, font, data.address.pinCode, FORM6_COORDS.sec8.pinCode);
  drawFittedText(p1, font, data.address.tehsil, FORM6_COORDS.sec8.tehsil);
  drawFittedText(p1, font, data.address.district, FORM6_COORDS.sec8.district);
  drawFittedText(p1, font, data.address.state || common.stateName, FORM6_COORDS.sec8.state);

  // PAGE 2
  // Section (8)(b) Proof of Residence
  if (data.addressProofType && data.addressProofType !== 'Other Document') {
    const cb = FORM6_COORDS.sec8.addressProofCheckboxes[data.addressProofType];
    if (cb) drawVectorCheckmark(p2, cb);
  } else if (data.addressProofType === 'Other Document') {
    drawFittedText(p2, font, data.addressProofOther, FORM6_COORDS.sec8.addressProofOther);
  }

  // Section (9) Disability
  for (const cat of data.disabilityCategories) {
    if (cat !== 'Other') {
      const cb = FORM6_COORDS.sec9.categories[cat];
      if (cb) drawVectorCheckmark(p2, cb);
    }
  }
  if (data.disabilityCategories.includes('Other')) {
    drawFittedText(p2, font, data.disabilityOtherText, FORM6_COORDS.sec9.otherText);
  }
  if (data.disabilityPercentage) {
    drawFittedText(p2, font, data.disabilityPercentage, FORM6_COORDS.sec9.percentage);
  }
  if (data.disabilityCertAttached === 'Yes') {
    drawVectorCheckmark(p2, FORM6_COORDS.sec9.certYes);
  } else if (data.disabilityCertAttached === 'No') {
    drawVectorCheckmark(p2, FORM6_COORDS.sec9.certNo);
  }

  // Section (10) Family Member
  drawFittedText(p2, font, data.familyMemberName, FORM6_COORDS.sec10.familyName);
  drawFittedText(p2, font, data.familyMemberRelation, FORM6_COORDS.sec10.familyRelation);
  drawFittedText(p2, font, data.familyMemberEpic, FORM6_COORDS.sec10.familyEpic);

  // Declaration
  drawFittedText(p2, font, data.birthVillage, FORM6_COORDS.declaration.birthVillage);
  drawFittedText(p2, font, data.birthDistrict, FORM6_COORDS.declaration.birthDistrict);
  drawFittedText(p2, font, data.birthState, FORM6_COORDS.declaration.birthState);
  drawFittedText(p2, font, data.residentSince, FORM6_COORDS.declaration.residentSince);
  drawFittedText(p2, font, formatDateForPdf(common.applicationDate), FORM6_COORDS.declaration.date);
  drawFittedText(p2, font, common.place, FORM6_COORDS.declaration.place);

  await embedImageInBox(pdfDoc, p2, data.signatureDataUrl, FORM6_COORDS.declaration.signatureBox, 'contain');

  // Acknowledgement Receipt
  const fullName = [data.firstNameEnglish, data.surnameEnglish].filter(Boolean).join(' ');
  drawFittedText(p2, font, common.acknowledgementNo, FORM6_COORDS.receipt.ackNo);
  drawFittedText(p2, font, formatDateForPdf(common.applicationDate), FORM6_COORDS.receipt.date);
  drawFittedText(p2, font, fullName, FORM6_COORDS.receipt.applicantName);
  await embedImageInBox(
    pdfDoc,
    p2,
    common.bloSealSignDataUrl,
    FORM6_COORDS.receipt.bloSealSignBox,
    'contain'
  );

  return pdfDoc.save();
}

export async function generateFilledForm7Pdf(
  templateBytes: Uint8Array,
  common: CommonHeaderData,
  data: Form7Data
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.getPages()[0];

  // Header
  drawFittedText(p1, font, common.acNo, FORM7_COORDS.header.acNo);
  drawFittedText(p1, font, common.acName, FORM7_COORDS.header.acName);
  drawFittedText(p1, font, common.pcNo, FORM7_COORDS.header.pcNo);
  drawFittedText(p1, font, common.pcName, FORM7_COORDS.header.pcName);

  // Section (1) Applicant
  const applicantFullName = [data.applicantFirstName, data.applicantSurname].filter(Boolean).join(' ');
  drawInCells(p1, font, applicantFullName, FORM7_COORDS.applicant.nameGrid);
  drawFittedText(p1, font, data.applicantEpic, FORM7_COORDS.applicant.epicNo);

  if (data.applicantMobile.trim()) {
    const mobGrid =
      data.applicantMobileOwner === 'Relative'
        ? FORM7_COORDS.applicant.mobileRelativeGrid
        : FORM7_COORDS.applicant.mobileSelfGrid;
    drawInCells(p1, font, data.applicantMobile.replace(/\D/g, ''), mobGrid);
  }

  // Section (2) Option of application/objection + nested reason checkboxes
  if (data.objectionType) {
    const mainCb = FORM7_COORDS.objectionType[data.objectionType];
    if (mainCb) drawVectorCheckmark(p1, mainCb);

    if (data.reason) {
      const reasonMap = FORM7_COORDS.reasonByType[data.objectionType] as Record<string, CheckboxBox>;
      const reasonCb = reasonMap?.[data.reason];
      if (reasonCb) drawVectorCheckmark(p1, reasonCb);
    }
  }

  // Death Certificate attached (Yes/No)
  if (data.reason === 'Death') {
    drawVectorCheckmark(p1, FORM7_COORDS.deathCert[data.deathCertAttached]);
    if (data.deathCertAttached === 'Yes' && data.deathCertDetails.trim()) {
      drawFittedText(p1, font, `(${data.deathCertDetails.trim()})`, FORM7_COORDS.deathCert.details);
    }
  }

  // Section (3) Target Person
  drawFittedText(p1, font, data.targetFirstName, FORM7_COORDS.target.firstName);
  drawFittedText(p1, font, data.targetSurname, FORM7_COORDS.target.surname);
  drawFittedText(p1, font, data.targetEpic, FORM7_COORDS.target.epicNo);
  drawFittedText(p1, font, data.targetAddress.houseNo, FORM7_COORDS.target.houseNo);
  drawFittedText(p1, font, data.targetAddress.streetArea, FORM7_COORDS.target.streetArea);
  drawFittedText(p1, font, data.targetAddress.townVillage, FORM7_COORDS.target.townVillage);
  drawFittedText(p1, font, data.targetAddress.postOffice, FORM7_COORDS.target.postOffice);
  drawInCells(p1, font, data.targetAddress.pinCode.replace(/\D/g, ''), FORM7_COORDS.target.pinCodeGrid);
  drawFittedText(p1, font, data.targetAddress.tehsil, FORM7_COORDS.target.tehsil);
  drawFittedText(p1, font, data.targetAddress.district, FORM7_COORDS.target.district);
  drawFittedText(p1, font, data.targetAddress.state || common.stateName, FORM7_COORDS.target.state);

  // Declaration
  drawFittedText(p1, font, formatDateForPdf(common.applicationDate), FORM7_COORDS.declaration.date);
  drawFittedText(p1, font, common.place, FORM7_COORDS.declaration.place);
  await embedImageInBox(pdfDoc, p1, data.signatureDataUrl, FORM7_COORDS.declaration.signatureBox, 'contain');

  // Receipt
  drawFittedText(p1, font, common.acknowledgementNo, FORM7_COORDS.receipt.ackNo);
  drawFittedText(p1, font, formatDateForPdf(common.applicationDate), FORM7_COORDS.receipt.date);
  drawFittedText(p1, font, applicantFullName, FORM7_COORDS.receipt.applicantName);
  await embedImageInBox(
    pdfDoc,
    p1,
    common.bloSealSignDataUrl,
    FORM7_COORDS.receipt.bloSealSignBox,
    'contain'
  );

  return pdfDoc.save();
}

export async function generateFilledForm8Pdf(
  templateBytes: Uint8Array,
  common: CommonHeaderData,
  data: Form8Data
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const p1 = pages[0];
  const p2 = pages[1];

  // Header
  drawFittedText(p1, font, common.acNo, FORM8_COORDS.header.acNo);
  drawFittedText(p1, font, common.acName, FORM8_COORDS.header.acName);
  drawFittedText(p1, font, common.pcNo, FORM8_COORDS.header.pcNo);
  drawFittedText(p1, font, common.pcName, FORM8_COORDS.header.pcName);

  // Section (I) Applicant
  const fullName = [data.applicantFirstName, data.applicantSurname].filter(Boolean).join(' ');
  drawInCells(p1, font, fullName, FORM8_COORDS.applicant.nameGrid);
  drawFittedText(p1, font, data.applicantEpic, FORM8_COORDS.applicant.epicNo);

  if (data.aadhaarStatus === 'furnished') {
    drawVectorCheckmark(p1, FORM8_COORDS.applicant.hasAadhaar);
    drawInCells(p1, font, data.aadhaarNumber.replace(/\D/g, ''), FORM8_COORDS.applicant.aadhaarGrid);
  } else {
    drawVectorCheckmark(p1, FORM8_COORDS.applicant.noAadhaar);
  }

  if (data.mobileNumber.trim()) {
    const mobGrid =
      data.mobileOwner === 'Relative'
        ? FORM8_COORDS.applicant.mobileRelativeGrid
        : FORM8_COORDS.applicant.mobileSelfGrid;
    drawInCells(p1, font, data.mobileNumber.replace(/\D/g, ''), mobGrid);
  }

  if (data.emailId.trim()) {
    const emailBox =
      data.emailOwner === 'Relative'
        ? FORM8_COORDS.applicant.emailRelative
        : FORM8_COORDS.applicant.emailSelf;
    drawFittedText(p1, font, data.emailId, emailBox);
  }

  // Section (II) Primary Purpose
  if (data.purpose && FORM8_COORDS.purpose[data.purpose]) {
    drawVectorCheckmark(p1, FORM8_COORDS.purpose[data.purpose]);
  }

  // 1. Shifting of Residence (Page 1)
  if (data.purpose === 'shifting') {
    drawFittedText(p1, font, data.shiftingAddress.houseNo, FORM8_COORDS.sec1Shifting.houseNo);
    drawFittedText(p1, font, data.shiftingAddress.streetArea, FORM8_COORDS.sec1Shifting.streetArea);
    drawFittedText(p1, font, data.shiftingAddress.townVillage, FORM8_COORDS.sec1Shifting.townVillage);
    drawFittedText(p1, font, data.shiftingAddress.postOffice, FORM8_COORDS.sec1Shifting.postOffice);
    drawInCells(p1, font, data.shiftingAddress.pinCode.replace(/\D/g, ''), FORM8_COORDS.sec1Shifting.pinCodeGrid);
    drawFittedText(p1, font, data.shiftingAddress.tehsil, FORM8_COORDS.sec1Shifting.tehsil);
    drawFittedText(p1, font, data.shiftingAddress.district, FORM8_COORDS.sec1Shifting.district);
    drawFittedText(p1, font, data.shiftingAddress.state || common.stateName, FORM8_COORDS.sec1Shifting.state);

    if (data.shiftingAddressProof && data.shiftingAddressProof !== 'Other Document') {
      const cb = FORM8_COORDS.sec1Shifting.addressProofCheckboxes[data.shiftingAddressProof];
      if (cb) drawVectorCheckmark(p1, cb);
    } else if (data.shiftingAddressProof === 'Other Document') {
      drawFittedText(p1, font, data.shiftingAddressProofOther, FORM8_COORDS.sec1Shifting.addressProofOther);
    }
  }

  // PAGE 2
  // 2. Correction of Entries (max 4)
  if (data.purpose === 'correction') {
    const entriesText: string[] = [];
    for (const key of data.correctionFields.slice(0, 4)) {
      const cb = FORM8_COORDS.sec2Correction.checkboxes[key];
      if (cb) drawVectorCheckmark(p2, cb);

      const val = data.correctionValues[key];
      if (key !== 'Photo' && val && val.trim()) {
        entriesText.push(val.trim());
      }
    }
    // Stamp into the 60-box official grid (2 rows x 30 boxes)
    const combinedParticulars = entriesText.join(' / ');
    drawInCells(p2, font, combinedParticulars, FORM8_COORDS.sec2Correction.correctParticularsGrid);

    // Supporting documents split cleanly across the two boxed lines
    const docs = data.correctionSupportingDocs.trim();
    if (docs.length <= 64) {
      drawFittedText(p2, font, docs, FORM8_COORDS.sec2Correction.supportingDocsLine1);
    } else {
      const splitIdx = docs.lastIndexOf(' ', 64) > 30 ? docs.lastIndexOf(' ', 64) : 64;
      drawFittedText(p2, font, docs.slice(0, splitIdx), FORM8_COORDS.sec2Correction.supportingDocsLine1);
      drawFittedText(p2, font, docs.slice(splitIdx).trim(), FORM8_COORDS.sec2Correction.supportingDocsLine2);
    }

    if (data.correctionFields.includes('Photo') && data.correctionPhotoDataUrl) {
      await embedImageInBox(pdfDoc, p2, data.correctionPhotoDataUrl, FORM8_COORDS.sec2Correction.photoBox, 'cover');
    }
  }

  // 3. Replacement EPIC without correction
  if (data.purpose === 'replacement') {
    if (data.replacementReason && FORM8_COORDS.sec3Replacement[data.replacementReason]) {
      drawVectorCheckmark(p2, FORM8_COORDS.sec3Replacement[data.replacementReason]);
    }
  }

  // 4. Marking as Person with Disability (PwD)
  if (data.purpose === 'pwd') {
    for (const cat of data.pwdCategories) {
      const cb = FORM8_COORDS.sec4Pwd.categories[cat];
      if (cb) drawVectorCheckmark(p2, cb);
    }
    if (data.pwdCategories.includes('Other')) {
      drawFittedText(p2, font, data.pwdOtherText, FORM8_COORDS.sec4Pwd.otherText);
    }
    if (data.pwdPercentage) {
      drawFittedText(p2, font, data.pwdPercentage, FORM8_COORDS.sec4Pwd.percentage);
    }
    if (data.pwdCertAttached === 'Yes') {
      drawVectorCheckmark(p2, FORM8_COORDS.sec4Pwd.certYes);
    } else if (data.pwdCertAttached === 'No') {
      drawVectorCheckmark(p2, FORM8_COORDS.sec4Pwd.certNo);
    }
  }

  // Declaration
  drawFittedText(p2, font, formatDateForPdf(common.applicationDate), FORM8_COORDS.declaration.date);
  drawFittedText(p2, font, common.place, FORM8_COORDS.declaration.place);
  await embedImageInBox(pdfDoc, p2, data.signatureDataUrl, FORM8_COORDS.declaration.signatureBox, 'contain');

  // Receipt
  drawFittedText(p2, font, common.acknowledgementNo, FORM8_COORDS.receipt.ackNo);
  drawFittedText(p2, font, formatDateForPdf(common.applicationDate), FORM8_COORDS.receipt.date);
  drawFittedText(p2, font, fullName, FORM8_COORDS.receipt.applicantName);
  await embedImageInBox(
    pdfDoc,
    p2,
    common.bloSealSignDataUrl,
    FORM8_COORDS.receipt.bloSealSignBox,
    'contain'
  );

  return pdfDoc.save();
}

export function buildDownloadFileName(formId: FormId, applicantName: string): string {
  const formNum = formId === 'form6' ? '6' : formId === 'form7' ? '7' : '8';
  const safeName =
    (applicantName || 'Applicant')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Applicant';
  return `Filled_Form_${formNum}_${safeName}.pdf`;
}

export function triggerPdfDownload(pdfBytes: Uint8Array, fileName: string): string {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return blobUrl;
}
