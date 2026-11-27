import { BloDefaultProfile, SavedFormRecord } from '../types/forms';
import { exportFileNatively, isNativeApp } from './nativeBridge';

const BLO_PROFILE_STORAGE_KEY = 'eci_blo_default_profile_v1';
const SAVED_FORMS_FALLBACK_KEY = 'eci_blo_saved_forms_fallback_v1';
const IDB_NAME = 'blo_form_fill_pdf_offline_db';
const IDB_VERSION = 1;
const IDB_STORE = 'saved_forms';

export const EMPTY_BLO_PROFILE: BloDefaultProfile = {
  acNo: '',
  acName: '',
  pcNo: '',
  pcName: '',
  stateName: '',
  districtName: '',
  place: '',
  partNumber: '',
  bloSealSignDataUrl: null,
  updatedAt: '',
};

export function hasBloProfileData(profile: BloDefaultProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.acNo.trim() ||
      profile.acName.trim() ||
      profile.pcNo.trim() ||
      profile.pcName.trim() ||
      profile.stateName.trim() ||
      profile.districtName.trim() ||
      profile.place.trim() ||
      profile.partNumber.trim() ||
      profile.bloSealSignDataUrl
  );
}

export function loadBloProfile(): BloDefaultProfile | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(BLO_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BloDefaultProfile>;
    if (!parsed || typeof parsed !== 'object') return null;
    const merged: BloDefaultProfile = {
      ...EMPTY_BLO_PROFILE,
      ...parsed,
    };
    return hasBloProfileData(merged) ? merged : null;
  } catch {
    return null;
  }
}

export function saveBloProfile(profile: BloDefaultProfile): { saved: boolean; error?: string } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { saved: false, error: 'Local storage is unavailable on this browser.' };
  }
  const payload: BloDefaultProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(BLO_PROFILE_STORAGE_KEY, JSON.stringify(payload));
    return { saved: true };
  } catch {
    // Fallback without seal if image exceeded localStorage quota
    try {
      window.localStorage.setItem(
        BLO_PROFILE_STORAGE_KEY,
        JSON.stringify({ ...payload, bloSealSignDataUrl: null })
      );
      return {
        saved: true,
        error: 'Profile text fields saved, but BLO seal image was too large for local storage.',
      };
    } catch {
      return { saved: false, error: 'Unable to save BLO Default Profile locally.' };
    }
  }
}

export function clearBloProfile(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(BLO_PROFILE_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

/**
 * Compresses an uploaded BLO seal image to a crisp white-backed JPEG so it stays compact
 * inside offline localStorage and IndexedDB records.
 */
export function compressSealImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected seal image.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unsupported image format.'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('Unable to decode the selected image.'));
      img.onload = () => {
        const maxW = 720;
        const maxH = 280;
        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        const scale = Math.min(1, maxW / srcW, maxH / srcH);
        const outW = Math.max(1, Math.round(srcW * scale));
        const outH = Math.max(1, Math.round(srcH * scale));
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
        ctx.drawImage(img, 0, 0, outW, outH);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// 100% Offline Saved Forms Register (IndexedDB with localStorage fallback)
// ============================================================================

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open offline database'));
  });
}

function loadFallbackRecords(): SavedFormRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(SAVED_FORMS_FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedFormRecord[]) : [];
  } catch {
    return [];
  }
}

function saveFallbackRecords(records: SavedFormRecord[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SAVED_FORMS_FALLBACK_KEY, JSON.stringify(records));
  } catch {
    // Strip heavy images on fallback quota overflow
    try {
      const stripped = records.map((r) => ({
        ...r,
        common: { ...r.common, bloSealSignDataUrl: null },
        form6: r.form6 ? { ...r.form6, photoDataUrl: null, signatureDataUrl: null } : undefined,
        form7: r.form7 ? { ...r.form7, signatureDataUrl: null } : undefined,
        form8: r.form8
          ? { ...r.form8, correctionPhotoDataUrl: null, signatureDataUrl: null }
          : undefined,
      }));
      window.localStorage.setItem(SAVED_FORMS_FALLBACK_KEY, JSON.stringify(stripped));
    } catch {
      // Ignore if storage is disabled
    }
  }
}

export async function listSavedFormsOffline(): Promise<SavedFormRecord[]> {
  try {
    const db = await openOfflineDb();
    return await new Promise<SavedFormRecord[]>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? (req.result as SavedFormRecord[]) : [];
        rows.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
        resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const rows = loadFallbackRecords();
    rows.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    return rows;
  }
}

export async function upsertSavedFormOffline(record: SavedFormRecord): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = loadFallbackRecords().filter((r) => r.id !== record.id);
    saveFallbackRecords([record, ...existing]);
  }
}

export async function deleteSavedFormOffline(id: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const remaining = loadFallbackRecords().filter((r) => r.id !== id);
    saveFallbackRecords(remaining);
  }
}

export async function clearAllSavedFormsOffline(): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(SAVED_FORMS_FALLBACK_KEY);
      } catch {
        // Ignore
      }
    }
  }
}

function escapeCsvCell(value: string): string {
  const safe = (value ?? '').replace(/\r?\n/g, ' ').trim();
  if (/[",]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Exports the offline saved forms list to a UTF-8 BOM CSV file that opens cleanly
 * in Microsoft Excel and Google Sheets (including Devanagari script).
 */
export function downloadSavedFormsCsv(records: SavedFormRecord[]): void {
  const headers = [
    'Form Type',
    'Saved Date & Time',
    'Applicant Name',
    'Relative / EPIC No.',
    'Mobile Number',
    'Assembly Constituency',
    'State / UT',
    'Place',
    'Application Date',
    'Acknowledgement No.',
  ];

  const rows = records.map((rec) => [
    rec.formId === 'form6' ? 'Form-6' : rec.formId === 'form7' ? 'Form-7' : 'Form-8',
    new Date(rec.savedAt).toLocaleString(),
    rec.applicantName,
    rec.relativeOrEpic,
    rec.mobileNumber,
    rec.acSummary,
    rec.common.stateName,
    rec.common.place,
    rec.common.applicationDate,
    rec.common.acknowledgementNo,
  ]);

  const csvBody = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  // Prepend UTF-8 BOM so Excel renders Hindi/Devanagari characters properly
  const csvWithBom = '\uFEFF' + csvBody;
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `BLO_Saved_Forms_Register_${stamp}.csv`;

  if (isNativeApp()) {
    void exportFileNatively(csvWithBom, fileName, 'Export Saved Forms Excel (CSV)');
    return;
  }

  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
