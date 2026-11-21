/**
 * Exact PDF Coordinate Map extracted directly from the official ECI templates:
 *  - /assets/aistudio/Form_6_English_2d89e57e.pdf (612.00 x 841.68 pt, 2 pages)
 *  - /assets/aistudio/Form_7_English_f5cc8c6b.pdf (612.00 x 841.68 pt, 1 page)
 *  - /assets/aistudio/Form_8_English_41d815f8.pdf (612.00 x 841.68 pt, 2 pages)
 *
 * Origin (0, 0) is bottom-left per PDF specification.
 */

export interface FieldBox {
  page: number; // 0-indexed
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  uppercase?: boolean;
  align?: 'left' | 'center';
  maskBackground?: boolean;
}

export interface CheckboxBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CellCoord {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CellGrid {
  page: number;
  cells: CellCoord[];
  fontSize?: number;
  maskInside?: boolean;
}

function makeCells(xsAndWs: [number, number][], y: number, h: number): CellCoord[] {
  return xsAndWs.map(([x, w]) => ({ x, y, w, h }));
}

function makeUniformCells(startX: number, step: number, w: number, count: number, y: number, h: number): CellCoord[] {
  const out: CellCoord[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ x: startX + i * step, y, w, h });
  }
  return out;
}

export const FORM6_COORDS = {
  // Page 1 (index 0)
  header: {
    acNo: { page: 0, x: 307.5, y: 699.5, width: 22.0, height: 13.0, fontSize: 8.5, uppercase: true, align: 'center' } as FieldBox,
    acName: { page: 0, x: 391.0, y: 700.0, width: 198.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
    pcNo: { page: 0, x: 307.5, y: 685.3, width: 22.0, height: 13.0, fontSize: 8.5, uppercase: true, align: 'center' } as FieldBox,
    pcName: { page: 0, x: 391.0, y: 685.8, width: 198.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
  },
  photoBox: { page: 0, x: 489.8, y: 534.9, width: 86.9, height: 97.0 } as FieldBox,
  sec1: {
    // (1)(a) Official Regional Language (Devanagari PNG via Canvas)
    firstNameRegional: { page: 0, x: 244.0, y: 618.8, width: 227.5, height: 13.0, maskBackground: true } as FieldBox,
    surnameRegional: { page: 0, x: 116.0, y: 577.0, width: 355.5, height: 13.0, maskBackground: true } as FieldBox,

    // (1)(b) English BLOCK LETTERS — 13 boxes on row 1 + 26 overflow boxes on row 2
    firstNameEnglishGrid: {
      page: 0,
      fontSize: 9.5,
      cells: [
        ...makeCells(
          [
            [243.5, 17.0], [261.0, 17.0], [278.5, 17.1], [296.0, 17.0], [313.6, 17.0],
            [331.1, 17.0], [348.6, 17.1], [366.1, 17.0], [383.9, 17.0], [401.4, 17.0],
            [418.9, 17.1], [436.5, 17.0], [454.0, 18.2],
          ],
          520.9,
          13.5
        ),
        ...makeCells(
          [
            [13.0, 17.0], [30.5, 18.5], [49.5, 18.0], [67.9, 17.0], [85.5, 17.1],
            [103.0, 17.0], [120.5, 17.0], [138.1, 17.0], [155.6, 17.1], [173.1, 17.0],
            [190.6, 17.0], [208.2, 17.3], [225.9, 17.0], [243.5, 17.0], [261.0, 17.0],
            [278.5, 17.1], [296.0, 17.0], [313.6, 17.0], [331.1, 17.0], [348.6, 17.1],
            [366.1, 17.0], [383.9, 16.8], [401.2, 17.3], [418.9, 17.1], [436.7, 16.8],
            [454.0, 18.2],
          ],
          507.0,
          13.4
        ),
      ],
    } as CellGrid,

    surnameEnglishGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [115.5, 18.2], [134.2, 18.2], [152.9, 18.3], [171.7, 18.2], [190.4, 18.2],
          [209.1, 18.3], [227.9, 18.2], [246.6, 18.2], [265.3, 18.2], [284.3, 18.0],
          [302.8, 18.5], [321.7, 18.0], [340.2, 18.5], [359.2, 18.0], [377.9, 18.2],
          [396.6, 18.2], [415.3, 18.3], [434.1, 18.2], [452.8, 19.4],
        ],
        487.8,
        13.4
      ),
    } as CellGrid,
  },
  sec2: {
    relationType: {
      Father: { page: 0, x: 33.1, y: 441.2, width: 19.9, height: 13.5 } as CheckboxBox,
      Mother: { page: 0, x: 130.6, y: 441.2, width: 18.5, height: 13.5 } as CheckboxBox,
      Husband: { page: 0, x: 246.1, y: 441.2, width: 18.7, height: 13.5 } as CheckboxBox,
      Wife: { page: 0, x: 361.6, y: 441.2, width: 18.5, height: 13.5 } as CheckboxBox,
      'Legal Guardian': { page: 0, x: 33.1, y: 418.9, width: 19.9, height: 13.4 } as CheckboxBox,
    },
    relativeNameRegional: { page: 0, x: 14.0, y: 399.8, width: 565.0, height: 13.0, maskBackground: true } as FieldBox,
    relativeNameEnglishGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [13.0, 18.3], [31.7, 19.0], [51.1, 19.4], [71.1, 18.7], [90.3, 18.7],
          [109.5, 19.2], [129.4, 18.5], [148.4, 18.7], [167.6, 18.7], [186.8, 18.7],
          [206.0, 18.7], [225.2, 18.7], [244.4, 18.7], [263.6, 18.7], [282.8, 18.7],
          [302.0, 18.7], [321.2, 19.0], [340.7, 19.0], [360.1, 18.7], [379.3, 19.0],
          [398.8, 19.0], [418.2, 18.7], [437.4, 19.0], [457.1, 18.7], [476.3, 19.0],
          [495.8, 18.7], [515.0, 19.0], [534.4, 19.0], [553.9, 26.4],
        ],
        366.6,
        13.4
      ),
    } as CellGrid,
  },
  sec3: {
    mobileSelfGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [302.0, 18.7], [321.2, 19.0], [340.7, 19.0], [360.1, 18.7], [379.3, 19.0],
          [398.8, 19.0], [418.2, 18.7], [437.4, 19.0], [457.1, 18.7], [476.3, 19.0],
        ],
        338.7,
        13.4
      ),
    } as CellGrid,
    mobileRelativeGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [302.0, 18.7], [321.2, 19.0], [340.7, 19.0], [360.1, 18.7], [379.3, 19.0],
          [398.8, 19.0], [418.2, 18.7], [437.4, 19.0], [457.1, 18.7], [476.3, 19.0],
        ],
        324.8,
        13.4
      ),
    } as CellGrid,
  },
  sec4: {
    emailSelf: { page: 0, x: 250.0, y: 311.5, width: 244.0, height: 12.5, fontSize: 8.5, uppercase: false } as FieldBox,
    emailRelative: { page: 0, x: 250.0, y: 297.5, width: 244.0, height: 12.5, fontSize: 8.5, uppercase: false } as FieldBox,
  },
  sec5: {
    hasAadhaar: { page: 0, x: 51.1, y: 269.1, width: 19.4, height: 13.4 } as CheckboxBox,
    aadhaarGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [206.0, 18.7], [225.2, 18.7], [244.4, 18.7], [263.6, 18.7],
          [282.8, 18.7], [302.0, 18.7], [321.2, 19.0], [340.7, 19.0],
          [360.1, 18.7], [379.3, 19.0], [398.8, 19.0], [418.2, 18.7],
        ],
        269.1,
        13.4
      ),
    } as CellGrid,
    noAadhaar: { page: 0, x: 51.1, y: 246.3, width: 19.4, height: 13.2 } as CheckboxBox,
  },
  sec6: {
    gender: {
      Male: { page: 0, x: 129.4, y: 223.3, width: 18.5, height: 13.4 } as CheckboxBox,
      Female: { page: 0, x: 225.2, y: 223.3, width: 18.7, height: 13.4 } as CheckboxBox,
      'Third Gender': { page: 0, x: 321.2, y: 223.3, width: 19.0, height: 13.4 } as CheckboxBox,
    },
  },
  sec7: {
    // 8 digit cells skipping the two "/" separator cells at 206.0 and 263.6
    dobDigitsGrid: {
      page: 0,
      fontSize: 9.5,
      maskInside: true,
      cells: makeCells(
        [
          [167.6, 18.7], [186.8, 18.7], // D D
          [225.2, 18.7], [244.4, 18.7], // M M
          [282.8, 18.7], [302.0, 18.7], [321.2, 19.0], [340.7, 19.0], // Y Y Y Y
        ],
        203.8,
        13.4
      ),
    } as CellGrid,
    dobProofCheckboxes: {
      'Birth Certificate': { page: 0, x: 51.1, y: 162.3, width: 19.4, height: 13.7 } as CheckboxBox,
      'Aadhaar Card': { page: 0, x: 51.1, y: 148.1, width: 19.4, height: 13.7 } as CheckboxBox,
      'PAN Card': { page: 0, x: 225.2, y: 148.1, width: 18.7, height: 13.7 } as CheckboxBox,
      'Driving License': { page: 0, x: 379.3, y: 148.1, width: 19.0, height: 13.7 } as CheckboxBox,
      'Class X/XII Marksheet': { page: 0, x: 51.1, y: 133.7, width: 19.4, height: 13.9 } as CheckboxBox,
      'Indian Passport': { page: 0, x: 379.3, y: 133.7, width: 19.0, height: 13.9 } as CheckboxBox,
    },
    dobProofOther: { page: 0, x: 500.0, y: 108.5, width: 90.0, height: 11.0, fontSize: 7.5, uppercase: true } as FieldBox,
  },
  sec8: {
    houseNo: { page: 0, x: 92.0, y: 80.5, width: 226.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    streetArea: { page: 0, x: 325.0, y: 80.5, width: 252.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    townVillage: { page: 0, x: 162.0, y: 64.5, width: 156.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    postOffice: { page: 0, x: 382.0, y: 64.5, width: 195.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    pinCode: { page: 0, x: 145.0, y: 48.5, width: 172.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
    tehsil: { page: 0, x: 428.0, y: 48.5, width: 149.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    district: { page: 0, x: 138.0, y: 32.5, width: 179.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    state: { page: 0, x: 376.0, y: 32.5, width: 201.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,

    // Page 2 (index 1) — (8)(b) Proof of residence
    addressProofCheckboxes: {
      'Water/Electricity/Gas Bill': { page: 1, x: 50.9, y: 732.0, width: 18.5, height: 15.6 } as CheckboxBox,
      'Aadhaar Card': { page: 1, x: 457.9, y: 732.0, width: 18.2, height: 15.6 } as CheckboxBox,
      'Bank/PO Passbook': { page: 1, x: 50.9, y: 715.4, width: 18.5, height: 15.6 } as CheckboxBox,
      'Indian Passport': { page: 1, x: 457.9, y: 715.4, width: 18.2, height: 15.6 } as CheckboxBox,
      'Land Record': { page: 1, x: 50.9, y: 699.1, width: 18.5, height: 15.4 } as CheckboxBox,
      'Rent/Lease Deed': { page: 1, x: 50.9, y: 682.5, width: 18.5, height: 15.6 } as CheckboxBox,
      'Sale Deed': { page: 1, x: 391.8, y: 682.5, width: 17.0, height: 15.6 } as CheckboxBox,
    },
    addressProofOther: { page: 1, x: 278.0, y: 643.0, width: 294.0, height: 12.0, fontSize: 8.5, uppercase: true } as FieldBox,
  },

  // Page 2 (index 1)
  sec9: {
    categories: {
      Locomotive: { page: 1, x: 263.4, y: 611.5, width: 18.5, height: 13.5 } as CheckboxBox,
      Visual: { page: 1, x: 391.8, y: 611.5, width: 17.0, height: 13.5 } as CheckboxBox,
      'Deaf & Dumb': { page: 1, x: 457.9, y: 611.5, width: 18.2, height: 13.5 } as CheckboxBox,
    },
    otherText: { page: 1, x: 154.0, y: 601.0, width: 300.0, height: 12.0, fontSize: 8.5, uppercase: true } as FieldBox,
    percentage: { page: 1, x: 126.0, y: 577.1, width: 17.3, height: 14.3, fontSize: 8.5, uppercase: true, align: 'center' } as FieldBox,
    certYes: { page: 1, x: 363.0, y: 577.1, width: 17.3, height: 14.3 } as CheckboxBox,
    certNo: { page: 1, x: 417.8, y: 577.1, width: 17.3, height: 14.3 } as CheckboxBox,
  },
  sec10: {
    familyName: { page: 1, x: 136.0, y: 532.0, width: 183.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    familyRelation: { page: 1, x: 456.0, y: 532.0, width: 133.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    familyEpic: { page: 1, x: 136.0, y: 513.0, width: 183.0, height: 14.0, fontSize: 9, uppercase: true } as FieldBox,
  },
  declaration: {
    birthVillage: { page: 1, x: 308.0, y: 456.0, width: 160.0, height: 11.5, fontSize: 8.5, uppercase: true } as FieldBox,
    birthDistrict: { page: 1, x: 56.0, y: 440.0, width: 202.0, height: 11.5, fontSize: 8.5, uppercase: true } as FieldBox,
    birthState: { page: 1, x: 350.0, y: 440.0, width: 136.0, height: 11.5, fontSize: 8.5, uppercase: true } as FieldBox,
    residentSince: { page: 1, x: 404.0, y: 423.0, width: 88.0, height: 11.5, fontSize: 8.5, uppercase: true } as FieldBox,
    date: { page: 1, x: 44.0, y: 293.0, width: 82.0, height: 11.5, fontSize: 8.5, uppercase: true } as FieldBox,
    place: { page: 1, x: 46.0, y: 280.0, width: 82.0, height: 11.5, fontSize: 8.5, uppercase: true } as FieldBox,
    signatureBox: { page: 1, x: 315.0, y: 289.0, width: 205.0, height: 34.0 } as FieldBox,
  },
  receipt: {
    ackNo: { page: 1, x: 150.0, y: 107.0, width: 245.0, height: 13.0, fontSize: 9, uppercase: true } as FieldBox,
    date: { page: 1, x: 434.0, y: 107.0, width: 154.0, height: 13.0, fontSize: 9, uppercase: true } as FieldBox,
    applicantName: { page: 1, x: 260.0, y: 92.5, width: 328.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
    bloSealSignBox: { page: 1, x: 388.0, y: 60.0, width: 170.0, height: 29.0 } as FieldBox,
  },
};

export const FORM7_COORDS = {
  // Page 1 (index 0)
  header: {
    acNo: { page: 0, x: 302.5, y: 678.6, width: 22.0, height: 13.0, fontSize: 8.5, uppercase: true, align: 'center' } as FieldBox,
    acName: { page: 0, x: 386.0, y: 679.0, width: 201.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
    pcNo: { page: 0, x: 302.5, y: 664.7, width: 22.0, height: 13.0, fontSize: 8.5, uppercase: true, align: 'center' } as FieldBox,
    pcName: { page: 0, x: 386.0, y: 665.0, width: 201.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
  },
  applicant: {
    nameGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [146.4, 18.5], [165.4, 18.7], [184.6, 18.7], [203.8, 18.7], [223.0, 19.0],
          [242.5, 18.7], [261.7, 18.5], [280.9, 18.5], [299.9, 18.7], [319.1, 19.0],
          [338.5, 19.0], [358.0, 18.7], [377.2, 19.0], [396.6, 19.0], [416.1, 18.7],
          [435.3, 16.8], [452.6, 19.0], [472.0, 19.5], [491.9, 19.0], [511.4, 19.0],
          [530.8, 19.0], [550.3, 19.7], [570.5, 18.7],
        ],
        620.3,
        13.5
      ),
    } as CellGrid,
    epicNo: { page: 0, x: 102.0, y: 602.0, width: 158.0, height: 12.5, fontSize: 9.5, uppercase: true } as FieldBox,
    mobileSelfGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [147.2, 18.7], [166.4, 18.5], [185.6, 18.7], [204.8, 18.7], [224.0, 18.7],
          [243.2, 18.5], [262.2, 19.0], [281.9, 18.5], [300.8, 19.0], [320.3, 19.0],
        ],
        582.2,
        13.4
      ),
    } as CellGrid,
    mobileRelativeGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [147.2, 18.7], [166.4, 18.5], [185.6, 18.7], [204.8, 18.7], [224.0, 18.7],
          [243.2, 18.5], [262.2, 19.0], [281.9, 18.5], [300.8, 19.0], [320.3, 19.0],
        ],
        562.7,
        13.4
      ),
    } as CellGrid,
  },
  objectionType: {
    deleteOther: { page: 0, x: 30.7, y: 534.9, width: 17.5, height: 13.4 } as CheckboxBox,
    objectInclusion: { page: 0, x: 30.7, y: 468.4, width: 17.5, height: 13.4 } as CheckboxBox,
    deleteOwn: { page: 0, x: 30.7, y: 401.9, width: 17.5, height: 13.4 } as CheckboxBox,
  },
  // Each option (i), (ii), (iii) has its own dedicated reason checkboxes on the official Form-7
  reasonByType: {
    deleteOther: {
      Death: { page: 0, x: 48.7, y: 507.0, width: 19.7, height: 13.4 } as CheckboxBox,
      'Under Age': { page: 0, x: 203.1, y: 507.0, width: 18.7, height: 13.4 } as CheckboxBox,
      'Absent / Permanently Shifted': { page: 0, x: 339.7, y: 507.0, width: 19.0, height: 13.4 } as CheckboxBox,
      'Already Enrolled': { page: 0, x: 48.7, y: 487.8, width: 19.7, height: 13.4 } as CheckboxBox,
      'Not Indian Citizen': { page: 0, x: 203.1, y: 487.8, width: 18.7, height: 13.4 } as CheckboxBox,
    },
    objectInclusion: {
      Death: { page: 0, x: 48.7, y: 440.5, width: 19.7, height: 13.5 } as CheckboxBox,
      'Under Age': { page: 0, x: 203.1, y: 440.5, width: 18.7, height: 13.5 } as CheckboxBox,
      'Absent / Permanently Shifted': { page: 0, x: 339.7, y: 440.5, width: 19.0, height: 13.5 } as CheckboxBox,
      'Already Enrolled': { page: 0, x: 48.7, y: 421.3, width: 19.7, height: 13.4 } as CheckboxBox,
      'Not Indian Citizen': { page: 0, x: 203.1, y: 421.3, width: 18.7, height: 13.4 } as CheckboxBox,
    },
    deleteOwn: {
      'Absent / Permanently Shifted': { page: 0, x: 48.7, y: 380.3, width: 19.7, height: 13.4 } as CheckboxBox,
      'Already Enrolled': { page: 0, x: 203.1, y: 380.3, width: 18.7, height: 13.4 } as CheckboxBox,
      'Not Indian Citizen': { page: 0, x: 339.7, y: 380.3, width: 19.0, height: 13.4 } as CheckboxBox,
    },
  },
  deathCert: {
    Yes: { page: 0, x: 290.4, y: 356.5, width: 17.3, height: 14.3 } as CheckboxBox,
    No: { page: 0, x: 344.6, y: 356.5, width: 17.3, height: 14.3 } as CheckboxBox,
    details: { page: 0, x: 392.0, y: 357.5, width: 185.0, height: 12.5, fontSize: 8, uppercase: true } as FieldBox,
  },
  target: {
    firstName: { page: 0, x: 66.0, y: 324.5, width: 106.0, height: 12.0, fontSize: 8.5, uppercase: true } as FieldBox,
    surname: { page: 0, x: 230.0, y: 324.5, width: 121.0, height: 12.0, fontSize: 8.5, uppercase: true } as FieldBox,
    epicNo: { page: 0, x: 462.0, y: 324.5, width: 102.0, height: 12.0, fontSize: 8.5, uppercase: true } as FieldBox,
    houseNo: { page: 0, x: 184.0, y: 292.0, width: 110.0, height: 22.0, fontSize: 8.5, uppercase: true } as FieldBox,
    streetArea: { page: 0, x: 427.0, y: 292.0, width: 160.0, height: 22.0, fontSize: 8.5, uppercase: true } as FieldBox,
    townVillage: { page: 0, x: 165.0, y: 277.0, width: 129.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    postOffice: { page: 0, x: 392.0, y: 277.0, width: 195.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    pinCodeGrid: {
      page: 0,
      fontSize: 9,
      cells: makeCells(
        [
          [182.9, 18.7], [202.2, 19.9], [222.6, 17.8], [241.1, 18.7], [260.3, 19.0], [279.7, 15.6],
        ],
        262.4,
        13.5
      ),
    } as CellGrid,
    tehsil: { page: 0, x: 428.0, y: 263.0, width: 159.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    district: { page: 0, x: 146.0, y: 249.0, width: 148.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    state: { page: 0, x: 392.0, y: 249.0, width: 195.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
  },
  declaration: {
    date: { page: 0, x: 46.0, y: 173.5, width: 135.0, height: 12.0, fontSize: 8.5, uppercase: true } as FieldBox,
    place: { page: 0, x: 48.0, y: 160.5, width: 155.0, height: 12.0, fontSize: 8.5, uppercase: true } as FieldBox,
    signatureBox: { page: 0, x: 310.0, y: 169.0, width: 195.0, height: 22.0 } as FieldBox,
  },
  receipt: {
    ackNo: { page: 0, x: 156.0, y: 89.0, width: 222.0, height: 13.0, fontSize: 9, uppercase: true } as FieldBox,
    date: { page: 0, x: 418.0, y: 89.0, width: 168.0, height: 13.0, fontSize: 9, uppercase: true } as FieldBox,
    applicantName: { page: 0, x: 258.0, y: 74.5, width: 326.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
    bloSealSignBox: { page: 0, x: 388.0, y: 42.0, width: 170.0, height: 29.0 } as FieldBox,
  },
};

export const FORM8_COORDS = {
  // Page 1 (index 0)
  header: {
    acNo: { page: 0, x: 303.0, y: 659.2, width: 22.0, height: 13.0, fontSize: 8.5, uppercase: true, align: 'center' } as FieldBox,
    acName: { page: 0, x: 386.0, y: 659.5, width: 203.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
    pcNo: { page: 0, x: 303.0, y: 645.3, width: 22.0, height: 13.0, fontSize: 8.5, uppercase: true, align: 'center' } as FieldBox,
    pcName: { page: 0, x: 386.0, y: 645.5, width: 203.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
  },
  applicant: {
    nameGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [146.4, 18.7], [165.7, 18.5], [184.6, 19.0], [204.1, 11.3], [215.8, 26.2],
          [242.5, 18.5], [261.5, 18.7], [280.7, 18.7], [299.9, 18.7], [319.1, 19.0],
          [338.5, 18.7], [357.7, 19.0], [377.2, 19.0], [396.6, 18.7], [416.1, 18.7],
          [435.3, 19.0], [454.7, 19.0], [474.2, 19.5], [494.1, 19.0], [513.5, 19.0],
          [533.0, 19.0], [552.5, 19.7], [572.6, 18.7],
        ],
        608.8,
        13.5
      ),
    } as CellGrid,
    epicNo: { page: 0, x: 102.0, y: 590.5, width: 158.0, height: 12.5, fontSize: 9.5, uppercase: true } as FieldBox,
    hasAadhaar: { page: 0, x: 51.1, y: 557.2, width: 19.4, height: 13.4 } as CheckboxBox,
    aadhaarGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [206.0, 18.7], [225.2, 18.7], [244.4, 18.7], [263.6, 18.7],
          [282.8, 18.7], [302.0, 18.7], [321.2, 19.0], [340.7, 19.0],
          [360.1, 18.7], [379.3, 19.0], [398.8, 19.0], [418.2, 18.7],
        ],
        557.2,
        13.4
      ),
    } as CellGrid,
    noAadhaar: { page: 0, x: 51.1, y: 538.0, width: 19.4, height: 13.2 } as CheckboxBox,
    mobileSelfGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [337.6, 18.0], [356.1, 18.2], [374.8, 18.0], [393.3, 18.0], [411.7, 18.0],
          [430.3, 18.2], [449.0, 18.0], [467.4, 18.0], [485.9, 18.0], [504.4, 18.0],
        ],
        509.9,
        13.4
      ),
    } as CellGrid,
    mobileRelativeGrid: {
      page: 0,
      fontSize: 9.5,
      cells: makeCells(
        [
          [337.6, 18.0], [356.1, 18.2], [374.8, 18.0], [393.3, 18.0], [411.7, 18.0],
          [430.3, 18.2], [449.0, 18.0], [467.4, 18.0], [485.9, 18.0], [504.4, 18.0],
        ],
        490.7,
        13.4
      ),
    } as CellGrid,
    emailSelf: { page: 0, x: 135.0, y: 472.5, width: 386.0, height: 12.5, fontSize: 8.5, uppercase: false } as FieldBox,
    emailRelative: { page: 0, x: 303.0, y: 453.5, width: 218.0, height: 12.5, fontSize: 8.5, uppercase: false } as FieldBox,
  },
  purpose: {
    shifting: { page: 0, x: 41.8, y: 413.9, width: 17.8, height: 13.4 } as CheckboxBox,
    correction: { page: 0, x: 41.8, y: 394.4, width: 17.8, height: 13.4 } as CheckboxBox,
    replacement: { page: 0, x: 41.8, y: 375.2, width: 17.8, height: 13.4 } as CheckboxBox,
    pwd: { page: 0, x: 41.8, y: 355.8, width: 17.8, height: 13.4 } as CheckboxBox,
  },
  sec1Shifting: {
    houseNo: { page: 0, x: 238.0, y: 280.0, width: 57.0, height: 12.5, fontSize: 8, uppercase: true } as FieldBox,
    streetArea: { page: 0, x: 486.0, y: 280.0, width: 104.0, height: 12.5, fontSize: 8, uppercase: true } as FieldBox,
    townVillage: { page: 0, x: 165.0, y: 266.0, width: 129.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    postOffice: { page: 0, x: 392.0, y: 266.0, width: 197.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    pinCodeGrid: {
      page: 0,
      fontSize: 9,
      cells: makeCells(
        [
          [182.9, 18.2], [201.7, 18.2], [220.4, 18.5], [239.4, 18.2], [258.1, 18.2], [276.8, 18.5],
        ],
        251.3,
        13.4
      ),
    } as CellGrid,
    tehsil: { page: 0, x: 428.0, y: 252.0, width: 161.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    district: { page: 0, x: 146.0, y: 238.0, width: 148.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    state: { page: 0, x: 392.0, y: 238.0, width: 197.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
    addressProofCheckboxes: {
      'Water/Electricity/Gas Bill': { page: 0, x: 41.8, y: 165.9, width: 17.8, height: 13.5 } as CheckboxBox,
      'Aadhaar Card': { page: 0, x: 463.6, y: 165.9, width: 19.2, height: 13.5 } as CheckboxBox,
      'Bank/PO Passbook': { page: 0, x: 41.8, y: 144.1, width: 17.8, height: 13.4 } as CheckboxBox,
      'Indian Passport': { page: 0, x: 463.6, y: 144.1, width: 19.2, height: 13.4 } as CheckboxBox,
      'Land Record': { page: 0, x: 41.8, y: 122.5, width: 17.8, height: 13.4 } as CheckboxBox,
      'Rent/Lease Deed': { page: 0, x: 41.8, y: 100.6, width: 17.8, height: 13.4 } as CheckboxBox,
      'Sale Deed': { page: 0, x: 347.9, y: 100.6, width: 18.7, height: 13.4 } as CheckboxBox,
    },
    addressProofOther: { page: 0, x: 135.0, y: 80.0, width: 442.0, height: 12.5, fontSize: 8.5, uppercase: true } as FieldBox,
  },

  // Page 2 (index 1)
  sec2Correction: {
    checkboxes: {
      Name: { page: 1, x: 42.3, y: 705.3, width: 18.0, height: 13.5 } as CheckboxBox,
      Gender: { page: 1, x: 190.6, y: 705.3, width: 18.0, height: 13.5 } as CheckboxBox,
      'DoB/Age': { page: 1, x: 339.0, y: 705.3, width: 18.0, height: 13.5 } as CheckboxBox,
      'Relation Type': { page: 1, x: 42.3, y: 677.5, width: 18.0, height: 13.4 } as CheckboxBox,
      'Relation Name': { page: 1, x: 190.6, y: 677.5, width: 18.0, height: 13.4 } as CheckboxBox,
      Address: { page: 1, x: 339.0, y: 677.5, width: 18.0, height: 13.4 } as CheckboxBox,
      Mobile: { page: 1, x: 42.3, y: 649.6, width: 18.0, height: 13.4 } as CheckboxBox,
      Photo: { page: 1, x: 190.6, y: 649.6, width: 18.0, height: 13.4 } as CheckboxBox,
    },
    photoBox: { page: 1, x: 468.9, y: 582.4, width: 110.7, height: 136.4 } as FieldBox,
    // 2 rows x 30 boxes (60 characters total)
    correctParticularsGrid: {
      page: 1,
      fontSize: 9.5,
      cells: [
        ...makeUniformCells(29.5, 14.23, 13.9, 30, 609.0, 18.7),
        ...makeUniformCells(29.5, 14.23, 13.9, 30, 586.5, 22.1),
      ],
    } as CellGrid,
    supportingDocsLine1: { page: 1, x: 33.0, y: 542.5, width: 418.0, height: 16.0, fontSize: 9, uppercase: true } as FieldBox,
    supportingDocsLine2: { page: 1, x: 33.0, y: 524.5, width: 418.0, height: 16.0, fontSize: 9, uppercase: true } as FieldBox,
  },
  sec3Replacement: {
    Lost: { page: 1, x: 24.0, y: 426.4, width: 17.8, height: 13.2 } as CheckboxBox,
    Destroyed: { page: 1, x: 153.4, y: 426.4, width: 18.0, height: 13.2 } as CheckboxBox,
    Mutilated: { page: 1, x: 24.0, y: 398.3, width: 17.8, height: 13.4 } as CheckboxBox,
  },
  sec4Pwd: {
    categories: {
      Locomotive: { page: 1, x: 24.0, y: 310.9, width: 17.8, height: 13.4 } as CheckboxBox,
      Visual: { page: 1, x: 116.2, y: 310.9, width: 18.2, height: 13.4 } as CheckboxBox,
      'Deaf & Dumb': { page: 1, x: 227.6, y: 310.9, width: 18.0, height: 13.4 } as CheckboxBox,
      Other: { page: 1, x: 339.0, y: 310.9, width: 18.0, height: 13.4 } as CheckboxBox,
    },
    otherText: { page: 1, x: 500.0, y: 311.5, width: 79.0, height: 12.5, fontSize: 7.5, uppercase: true } as FieldBox,
    percentage: { page: 1, x: 126.0, y: 291.8, width: 17.3, height: 14.3, fontSize: 8.5, uppercase: true, align: 'center' } as FieldBox,
    certYes: { page: 1, x: 362.3, y: 291.8, width: 17.3, height: 14.3 } as CheckboxBox,
    certNo: { page: 1, x: 417.0, y: 291.8, width: 17.3, height: 14.3 } as CheckboxBox,
  },
  declaration: {
    date: { page: 1, x: 44.0, y: 201.0, width: 78.0, height: 11.5, fontSize: 8.5, uppercase: true } as FieldBox,
    place: { page: 1, x: 46.0, y: 188.0, width: 78.0, height: 11.5, fontSize: 8.5, uppercase: true } as FieldBox,
    signatureBox: { page: 1, x: 300.0, y: 195.0, width: 190.0, height: 26.0 } as FieldBox,
  },
  receipt: {
    ackNo: { page: 1, x: 144.0, y: 83.5, width: 244.0, height: 13.0, fontSize: 9, uppercase: true } as FieldBox,
    date: { page: 1, x: 425.0, y: 83.5, width: 164.0, height: 13.0, fontSize: 9, uppercase: true } as FieldBox,
    applicantName: { page: 1, x: 258.0, y: 69.5, width: 330.0, height: 12.5, fontSize: 9, uppercase: true } as FieldBox,
    bloSealSignBox: { page: 1, x: 448.0, y: 41.0, width: 134.0, height: 26.0 } as FieldBox,
  },
};
