import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BloDefaultProfile,
  CommonHeaderData,
  Form6Data,
  Form7Data,
  Form8Data,
  FormId,
  SavedFormRecord,
  TemplateState,
} from '../types/forms';
import {
  getSampleCommonHeader,
  getSampleForm6,
  getSampleForm7,
  getSampleForm8,
} from '../utils/sampleData';
import {
  clearAllSavedFormsOffline,
  clearBloProfile,
  deleteSavedFormOffline,
  hasBloProfileData,
  listSavedFormsOffline,
  loadBloProfile,
  saveBloProfile,
  upsertSavedFormOffline,
} from '../utils/offlineStorage';

const EMPTY_ADDRESS = {
  houseNo: '',
  streetArea: '',
  townVillage: '',
  postOffice: '',
  pinCode: '',
  tehsil: '',
  district: '',
  state: '',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export const INITIAL_COMMON: CommonHeaderData = {
  acNo: '',
  acName: '',
  pcNo: '',
  pcName: '',
  stateName: '',
  applicationDate: todayIso(),
  place: '',
  acknowledgementNo: '',
  bloSealSignDataUrl: null,
};

export const INITIAL_FORM6: Form6Data = {
  firstNameRegional: '',
  surnameRegional: '',
  firstNameEnglish: '',
  surnameEnglish: '',
  photoDataUrl: null,
  signatureDataUrl: null,
  relationType: '',
  relativeNameRegional: '',
  relativeNameEnglish: '',
  relativeSurnameEnglish: '',
  mobileOwner: 'Self',
  mobileNumber: '',
  emailOwner: 'Self',
  emailId: '',
  aadhaarStatus: 'furnished',
  aadhaarNumber: '',
  gender: '',
  dob: '',
  dobProofType: '',
  dobProofOther: '',
  address: { ...EMPTY_ADDRESS },
  addressProofType: '',
  addressProofOther: '',
  disabilityCategories: [],
  disabilityOtherText: '',
  disabilityPercentage: '',
  disabilityCertAttached: '',
  familyMemberName: '',
  familyMemberRelation: '',
  familyMemberEpic: '',
  birthVillage: '',
  birthDistrict: '',
  birthState: '',
  residentSince: '',
  declarationConfirmed: false,
};

export const INITIAL_FORM7: Form7Data = {
  applicantFirstName: '',
  applicantSurname: '',
  applicantEpic: '',
  applicantMobileOwner: 'Self',
  applicantMobile: '',
  applicantEmail: '',
  objectionType: '',
  reason: '',
  deathCertAttached: 'No',
  deathCertDetails: '',
  targetFirstName: '',
  targetSurname: '',
  targetEpic: '',
  targetPartNo: '',
  targetSerialNo: '',
  targetAddress: { ...EMPTY_ADDRESS },
  signatureDataUrl: null,
  declarationConfirmed: false,
};

export const INITIAL_FORM8: Form8Data = {
  applicantFirstName: '',
  applicantSurname: '',
  applicantEpic: '',
  aadhaarStatus: 'furnished',
  aadhaarNumber: '',
  mobileOwner: 'Self',
  mobileNumber: '',
  emailOwner: 'Self',
  emailId: '',
  purpose: '',
  shiftingType: 'withinAc',
  shiftingAddress: { ...EMPTY_ADDRESS },
  shiftingAddressProof: '',
  shiftingAddressProofOther: '',
  correctionFields: [],
  correctionValues: {},
  correctionSupportingDocs: '',
  correctionPhotoDataUrl: null,
  replacementReason: '',
  firCopyAttached: false,
  pwdCategories: [],
  pwdOtherText: '',
  pwdPercentage: '',
  pwdCertAttached: '',
  signatureDataUrl: null,
  declarationConfirmed: false,
};

function buildCommonWithProfile(profile: BloDefaultProfile | null): CommonHeaderData {
  if (!profile) {
    return { ...INITIAL_COMMON, applicationDate: todayIso() };
  }
  return {
    ...INITIAL_COMMON,
    acNo: profile.acNo,
    acName: profile.acName,
    pcNo: profile.pcNo,
    pcName: profile.pcName,
    stateName: profile.stateName,
    place: profile.place,
    bloSealSignDataUrl: profile.bloSealSignDataUrl,
    applicationDate: todayIso(),
  };
}

function buildForm6WithProfile(profile: BloDefaultProfile | null): Form6Data {
  if (!profile) return { ...INITIAL_FORM6, address: { ...EMPTY_ADDRESS } };
  return {
    ...INITIAL_FORM6,
    address: {
      ...EMPTY_ADDRESS,
      district: profile.districtName,
      state: profile.stateName,
    },
    birthDistrict: profile.districtName,
    birthState: profile.stateName,
  };
}

function buildForm7WithProfile(profile: BloDefaultProfile | null): Form7Data {
  if (!profile) return { ...INITIAL_FORM7, targetAddress: { ...EMPTY_ADDRESS } };
  return {
    ...INITIAL_FORM7,
    targetPartNo: profile.partNumber,
    targetAddress: {
      ...EMPTY_ADDRESS,
      district: profile.districtName,
      state: profile.stateName,
    },
  };
}

function buildForm8WithProfile(profile: BloDefaultProfile | null): Form8Data {
  if (!profile) return { ...INITIAL_FORM8, shiftingAddress: { ...EMPTY_ADDRESS } };
  return {
    ...INITIAL_FORM8,
    shiftingAddress: {
      ...EMPTY_ADDRESS,
      district: profile.districtName,
      state: profile.stateName,
    },
  };
}

const TEMPLATE_SOURCES: Record<FormId, { fileName: string; url: string }> = {
  form6: {
    fileName: 'Form_6_English.pdf',
    url: '/assets/aistudio/Form_6_English_2d89e57e.pdf',
  },
  form7: {
    fileName: 'Form_7_English.pdf',
    url: '/assets/aistudio/Form_7_English_f5cc8c6b.pdf',
  },
  form8: {
    fileName: 'Form_8_English.pdf',
    url: '/assets/aistudio/Form_8_English_41d815f8.pdf',
  },
};

const DRAFT_STORAGE_KEY = 'eci_blo_form_draft_v1';

interface PersistedDraftPayload {
  version: 1;
  updatedAt: string;
  activeTab: FormId;
  common: CommonHeaderData;
  form6: Form6Data;
  form7: Form7Data;
  form8: Form8Data;
}

function isValidFormId(val: unknown): val is FormId {
  return val === 'form6' || val === 'form7' || val === 'form8';
}

function loadDraftFromStorage(): PersistedDraftPayload | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedDraftPayload>;
    if (!parsed || typeof parsed !== 'object') return null;

    const mergedCommon: CommonHeaderData = {
      ...INITIAL_COMMON,
      ...(parsed.common ?? {}),
    };
    const mergedForm6: Form6Data = {
      ...INITIAL_FORM6,
      ...(parsed.form6 ?? {}),
      address: {
        ...EMPTY_ADDRESS,
        ...(parsed.form6?.address ?? {}),
      },
      disabilityCategories: Array.isArray(parsed.form6?.disabilityCategories)
        ? parsed.form6.disabilityCategories
        : [],
    };
    const mergedForm7: Form7Data = {
      ...INITIAL_FORM7,
      ...(parsed.form7 ?? {}),
      targetAddress: {
        ...EMPTY_ADDRESS,
        ...(parsed.form7?.targetAddress ?? {}),
      },
    };
    const mergedForm8: Form8Data = {
      ...INITIAL_FORM8,
      ...(parsed.form8 ?? {}),
      shiftingAddress: {
        ...EMPTY_ADDRESS,
        ...(parsed.form8?.shiftingAddress ?? {}),
      },
      correctionFields: Array.isArray(parsed.form8?.correctionFields)
        ? parsed.form8.correctionFields
        : [],
      correctionValues:
        parsed.form8?.correctionValues && typeof parsed.form8.correctionValues === 'object'
          ? parsed.form8.correctionValues
          : {},
      pwdCategories: Array.isArray(parsed.form8?.pwdCategories)
        ? parsed.form8.pwdCategories
        : [],
    };

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      activeTab: isValidFormId(parsed.activeTab) ? parsed.activeTab : 'form6',
      common: mergedCommon,
      form6: mergedForm6,
      form7: mergedForm7,
      form8: mergedForm8,
    };
  } catch {
    return null;
  }
}

function saveDraftToStorage(payload: PersistedDraftPayload): { saved: boolean; warning: string | null } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { saved: false, warning: 'Browser localStorage is unavailable.' };
  }
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    return { saved: true, warning: null };
  } catch {
    // Fallback if uploaded base64 photo/signature exceeds localStorage ~5MB quota:
    // strip media data URLs so all form text, checkboxes, and addresses still persist.
    try {
      const textOnlyPayload: PersistedDraftPayload = {
        ...payload,
        common: { ...payload.common, bloSealSignDataUrl: null },
        form6: { ...payload.form6, photoDataUrl: null, signatureDataUrl: null },
        form7: { ...payload.form7, signatureDataUrl: null },
        form8: { ...payload.form8, correctionPhotoDataUrl: null, signatureDataUrl: null },
      };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(textOnlyPayload));
      return {
        saved: true,
        warning: 'Text fields saved to draft; uploaded photo/signature exceeded browser storage limit.',
      };
    } catch {
      return {
        saved: false,
        warning: 'Unable to save draft: browser storage quota exceeded or disabled.',
      };
    }
  }
}

function generateRecordId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface FormContextValue {
  activeTab: FormId;
  setActiveTab: (tab: FormId) => void;
  templates: Record<FormId, TemplateState>;
  reloadTemplate: (formId: FormId) => Promise<void>;
  common: CommonHeaderData;
  updateCommon: (patch: Partial<CommonHeaderData>) => void;
  form6: Form6Data;
  updateForm6: (patch: Partial<Form6Data>) => void;
  form7: Form7Data;
  updateForm7: (patch: Partial<Form7Data>) => void;
  form8: Form8Data;
  updateForm8: (patch: Partial<Form8Data>) => void;
  loadSampleData: (formId: FormId) => void;
  resetActiveForm: (formId: FormId) => void;
  startNewEntry: (formId: FormId) => void;
  clearAllDrafts: () => void;
  lastSavedAt: string | null;
  draftRestored: boolean;
  draftStorageWarning: string | null;
  // 100% Offline BLO Default Profile (No Login)
  bloProfile: BloDefaultProfile | null;
  saveBloDefaultProfile: (profile: BloDefaultProfile) => { saved: boolean; error?: string };
  saveCurrentHeaderAsBloProfile: () => { saved: boolean; error?: string };
  applyBloProfileToCurrentForm: () => void;
  clearBloDefaultProfile: () => void;
  // 100% Offline Saved Forms Register (IndexedDB)
  savedForms: SavedFormRecord[];
  activeRecordId: string | null;
  saveCurrentFormToOfflineList: (formId: FormId) => Promise<SavedFormRecord>;
  loadSavedFormRecord: (record: SavedFormRecord) => void;
  deleteSavedFormRecord: (id: string) => Promise<void>;
  clearAllSavedFormRecords: () => Promise<void>;
}

const FormContext = createContext<FormContextValue | null>(null);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialProfileRef = React.useRef<BloDefaultProfile | null | undefined>(undefined);
  if (initialProfileRef.current === undefined) {
    initialProfileRef.current = loadBloProfile();
  }
  const initialProfile = initialProfileRef.current;

  const initialDraftRef = React.useRef<PersistedDraftPayload | null | undefined>(undefined);
  if (initialDraftRef.current === undefined) {
    initialDraftRef.current = loadDraftFromStorage();
  }
  const initialDraft = initialDraftRef.current;

  const [bloProfile, setBloProfile] = useState<BloDefaultProfile | null>(initialProfile);
  const [activeTab, setActiveTabState] = useState<FormId>(initialDraft?.activeTab ?? 'form6');
  const [common, setCommon] = useState<CommonHeaderData>(
    initialDraft?.common ?? buildCommonWithProfile(initialProfile)
  );
  const [form6, setForm6] = useState<Form6Data>(
    initialDraft?.form6 ?? buildForm6WithProfile(initialProfile)
  );
  const [form7, setForm7] = useState<Form7Data>(
    initialDraft?.form7 ?? buildForm7WithProfile(initialProfile)
  );
  const [form8, setForm8] = useState<Form8Data>(
    initialDraft?.form8 ?? buildForm8WithProfile(initialProfile)
  );

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialDraft?.updatedAt ?? null);
  const [draftRestored, setDraftRestored] = useState<boolean>(Boolean(initialDraft));
  const [draftStorageWarning, setDraftStorageWarning] = useState<string | null>(null);
  const [savedForms, setSavedForms] = useState<SavedFormRecord[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const hasUserEditedRef = React.useRef<boolean>(Boolean(initialDraft));

  // Load 100% offline Saved Forms Register from IndexedDB on mount
  useEffect(() => {
    let active = true;
    void listSavedFormsOffline().then((records) => {
      if (active) {
        setSavedForms(records);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const latestPayloadRef = React.useRef<PersistedDraftPayload>({
    version: 1,
    updatedAt: initialDraft?.updatedAt ?? new Date().toISOString(),
    activeTab,
    common,
    form6,
    form7,
    form8,
  });

  useEffect(() => {
    latestPayloadRef.current = {
      version: 1,
      updatedAt: new Date().toISOString(),
      activeTab,
      common,
      form6,
      form7,
      form8,
    };

    if (!hasUserEditedRef.current) return;

    const timer = window.setTimeout(() => {
      const payload = { ...latestPayloadRef.current, updatedAt: new Date().toISOString() };
      const result = saveDraftToStorage(payload);
      if (result.saved) {
        setLastSavedAt(payload.updatedAt);
      }
      setDraftStorageWarning(result.warning);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [activeTab, common, form6, form7, form8]);

  // Flush any pending unsaved edit synchronously right before page refresh/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasUserEditedRef.current) return;
      saveDraftToStorage({
        ...latestPayloadRef.current,
        updatedAt: new Date().toISOString(),
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const [templates, setTemplates] = useState<Record<FormId, TemplateState>>({
    form6: { status: 'loading', bytes: null, fileName: TEMPLATE_SOURCES.form6.fileName },
    form7: { status: 'loading', bytes: null, fileName: TEMPLATE_SOURCES.form7.fileName },
    form8: { status: 'loading', bytes: null, fileName: TEMPLATE_SOURCES.form8.fileName },
  });

  const loadSingleTemplate = useCallback(async (formId: FormId) => {
    const { fileName, url } = TEMPLATE_SOURCES[formId];
    setTemplates((prev) => ({
      ...prev,
      [formId]: { status: 'loading', bytes: null, fileName },
    }));

    const CACHE_NAME = 'blo-form-fill-pdf-templates-v1';

    try {
      let response: Response | undefined;

      // 1. Check CacheStorage first for instant offline availability
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await window.caches.open(CACHE_NAME);
          const cached = await cache.match(url);
          if (cached && cached.ok) {
            response = cached;
          }
        } catch {
          // Proceed to network/SW fetch
        }
      }

      // 2. Otherwise fetch normally (allows Service Worker precache & offline interception)
      if (!response) {
        const fetched = await fetch(url);
        if (!fetched.ok) {
          throw new Error(`HTTP ${fetched.status} while loading ${fileName}`);
        }
        response = fetched;

        // Store clone in CacheStorage for guaranteed offline access on future launches
        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cache = await window.caches.open(CACHE_NAME);
            await cache.put(url, fetched.clone());
          } catch {
            // Non-fatal if cache quota is restricted
          }
        }
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const header = String.fromCharCode(...bytes.slice(0, 5));
      if (header !== '%PDF-') {
        throw new Error(`Invalid PDF file received for ${fileName}`);
      }
      setTemplates((prev) => ({
        ...prev,
        [formId]: {
          status: 'loaded',
          bytes,
          fileName,
          byteSize: bytes.byteLength,
        },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch PDF template';
      setTemplates((prev) => ({
        ...prev,
        [formId]: {
          status: 'error',
          bytes: null,
          fileName,
          error: message,
        },
      }));
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      loadSingleTemplate('form6'),
      loadSingleTemplate('form7'),
      loadSingleTemplate('form8'),
    ]);
  }, [loadSingleTemplate]);

  const setActiveTab = useCallback((tab: FormId) => {
    setActiveTabState(tab);
  }, []);

  const updateCommon = useCallback((patch: Partial<CommonHeaderData>) => {
    hasUserEditedRef.current = true;
    setDraftRestored(false);
    setCommon((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateForm6 = useCallback((patch: Partial<Form6Data>) => {
    hasUserEditedRef.current = true;
    setDraftRestored(false);
    setForm6((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateForm7 = useCallback((patch: Partial<Form7Data>) => {
    hasUserEditedRef.current = true;
    setDraftRestored(false);
    setForm7((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateForm8 = useCallback((patch: Partial<Form8Data>) => {
    hasUserEditedRef.current = true;
    setDraftRestored(false);
    setForm8((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyProfileFields = useCallback((profile: BloDefaultProfile) => {
    setCommon((prev) => ({
      ...prev,
      acNo: profile.acNo || prev.acNo,
      acName: profile.acName || prev.acName,
      pcNo: profile.pcNo || prev.pcNo,
      pcName: profile.pcName || prev.pcName,
      stateName: profile.stateName || prev.stateName,
      place: profile.place || prev.place,
      bloSealSignDataUrl: profile.bloSealSignDataUrl ?? prev.bloSealSignDataUrl,
    }));
    setForm6((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        district: prev.address.district || profile.districtName,
        state: prev.address.state || profile.stateName,
      },
      birthDistrict: prev.birthDistrict || profile.districtName,
      birthState: prev.birthState || profile.stateName,
    }));
    setForm7((prev) => ({
      ...prev,
      targetPartNo: prev.targetPartNo || profile.partNumber,
      targetAddress: {
        ...prev.targetAddress,
        district: prev.targetAddress.district || profile.districtName,
        state: prev.targetAddress.state || profile.stateName,
      },
    }));
    setForm8((prev) => ({
      ...prev,
      shiftingAddress: {
        ...prev.shiftingAddress,
        district: prev.shiftingAddress.district || profile.districtName,
        state: prev.shiftingAddress.state || profile.stateName,
      },
    }));
  }, []);

  const saveBloDefaultProfile = useCallback(
    (profile: BloDefaultProfile) => {
      const normalized: BloDefaultProfile = {
        acNo: profile.acNo.trim(),
        acName: profile.acName.trim(),
        pcNo: profile.pcNo.trim(),
        pcName: profile.pcName.trim(),
        stateName: profile.stateName.trim(),
        districtName: profile.districtName.trim(),
        place: profile.place.trim(),
        partNumber: profile.partNumber.trim(),
        bloSealSignDataUrl: profile.bloSealSignDataUrl,
        updatedAt: new Date().toISOString(),
      };
      const result = saveBloProfile(normalized);
      if (result.saved) {
        const stored = hasBloProfileData(normalized) ? normalized : null;
        setBloProfile(stored);
        if (stored) {
          applyProfileFields(stored);
        }
      }
      return result;
    },
    [applyProfileFields]
  );

  const saveCurrentHeaderAsBloProfile = useCallback(() => {
    const inferredDistrict =
      form6.address.district ||
      form7.targetAddress.district ||
      form8.shiftingAddress.district ||
      bloProfile?.districtName ||
      '';
    const inferredPart = form7.targetPartNo || bloProfile?.partNumber || '';

    return saveBloDefaultProfile({
      acNo: common.acNo,
      acName: common.acName,
      pcNo: common.pcNo,
      pcName: common.pcName,
      stateName: common.stateName,
      districtName: inferredDistrict,
      place: common.place,
      partNumber: inferredPart,
      bloSealSignDataUrl: common.bloSealSignDataUrl,
      updatedAt: new Date().toISOString(),
    });
  }, [bloProfile, common, form6.address.district, form7.targetAddress.district, form7.targetPartNo, form8.shiftingAddress.district, saveBloDefaultProfile]);

  const applyBloProfileToCurrentForm = useCallback(() => {
    if (!bloProfile) return;
    hasUserEditedRef.current = true;
    applyProfileFields(bloProfile);
  }, [bloProfile, applyProfileFields]);

  const clearBloDefaultProfile = useCallback(() => {
    clearBloProfile();
    setBloProfile(null);
  }, []);

  const loadSampleData = useCallback((formId: FormId) => {
    hasUserEditedRef.current = true;
    setDraftRestored(false);
    setActiveRecordId(null);
    setCommon(getSampleCommonHeader());
    if (formId === 'form6') setForm6(getSampleForm6());
    if (formId === 'form7') setForm7(getSampleForm7());
    if (formId === 'form8') setForm8(getSampleForm8());
  }, []);

  const resetActiveForm = useCallback(
    (formId: FormId) => {
      hasUserEditedRef.current = true;
      setDraftRestored(false);
      setActiveRecordId(null);
      setCommon(buildCommonWithProfile(bloProfile));
      if (formId === 'form6') setForm6(buildForm6WithProfile(bloProfile));
      if (formId === 'form7') setForm7(buildForm7WithProfile(bloProfile));
      if (formId === 'form8') setForm8(buildForm8WithProfile(bloProfile));
    },
    [bloProfile]
  );

  const startNewEntry = useCallback(
    (formId: FormId) => {
      resetActiveForm(formId);
    },
    [resetActiveForm]
  );

  const clearAllDrafts = useCallback(() => {
    hasUserEditedRef.current = false;
    setDraftRestored(false);
    setActiveRecordId(null);
    setLastSavedAt(null);
    setDraftStorageWarning(null);
    setCommon(buildCommonWithProfile(bloProfile));
    setForm6(buildForm6WithProfile(bloProfile));
    setForm7(buildForm7WithProfile(bloProfile));
    setForm8(buildForm8WithProfile(bloProfile));
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore storage removal errors
      }
    }
  }, [bloProfile]);

  const saveCurrentFormToOfflineList = useCallback(
    async (formId: FormId): Promise<SavedFormRecord> => {
      const id = activeRecordId ?? generateRecordId();
      const savedAt = new Date().toISOString();

      let applicantName = 'Untitled Applicant';
      let relativeOrEpic = '';
      let mobileNumber = '';

      if (formId === 'form6') {
        applicantName =
          [form6.firstNameEnglish, form6.surnameEnglish].filter(Boolean).join(' ').trim() ||
          [form6.firstNameRegional, form6.surnameRegional].filter(Boolean).join(' ').trim() ||
          'Form-6 Applicant';
        const relName = [form6.relativeNameEnglish, form6.relativeSurnameEnglish]
          .filter(Boolean)
          .join(' ')
          .trim();
        relativeOrEpic = relName
          ? `${form6.relationType ? `${form6.relationType}: ` : ''}${relName}`
          : '';
        mobileNumber = form6.mobileNumber;
      } else if (formId === 'form7') {
        applicantName =
          [form7.applicantFirstName, form7.applicantSurname].filter(Boolean).join(' ').trim() ||
          [form7.targetFirstName, form7.targetSurname].filter(Boolean).join(' ').trim() ||
          'Form-7 Applicant';
        relativeOrEpic = form7.targetEpic
          ? `Target EPIC: ${form7.targetEpic}`
          : form7.applicantEpic
          ? `EPIC: ${form7.applicantEpic}`
          : '';
        mobileNumber = form7.applicantMobile;
      } else {
        applicantName =
          [form8.applicantFirstName, form8.applicantSurname].filter(Boolean).join(' ').trim() ||
          'Form-8 Applicant';
        relativeOrEpic = form8.applicantEpic ? `EPIC: ${form8.applicantEpic}` : '';
        mobileNumber = form8.mobileNumber;
      }

      const acSummary = [common.acNo, common.acName].filter(Boolean).join(' - ').trim();

      const record: SavedFormRecord = {
        id,
        formId,
        savedAt,
        applicantName,
        relativeOrEpic,
        mobileNumber,
        acSummary,
        common: { ...common },
        form6: formId === 'form6' ? { ...form6, address: { ...form6.address } } : undefined,
        form7: formId === 'form7' ? { ...form7, targetAddress: { ...form7.targetAddress } } : undefined,
        form8:
          formId === 'form8'
            ? {
                ...form8,
                shiftingAddress: { ...form8.shiftingAddress },
                correctionFields: [...form8.correctionFields],
                correctionValues: { ...form8.correctionValues },
                pwdCategories: [...form8.pwdCategories],
              }
            : undefined,
      };

      await upsertSavedFormOffline(record);
      setActiveRecordId(id);
      setSavedForms((prev) => {
        const next = [record, ...prev.filter((r) => r.id !== id)];
        next.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
        return next;
      });
      return record;
    },
    [activeRecordId, common, form6, form7, form8]
  );

  const loadSavedFormRecord = useCallback((record: SavedFormRecord) => {
    hasUserEditedRef.current = true;
    setDraftRestored(false);
    setActiveRecordId(record.id);
    setActiveTabState(record.formId);
    setCommon({ ...INITIAL_COMMON, ...record.common });
    if (record.formId === 'form6' && record.form6) {
      setForm6({
        ...INITIAL_FORM6,
        ...record.form6,
        address: { ...EMPTY_ADDRESS, ...(record.form6.address ?? {}) },
      });
    } else if (record.formId === 'form7' && record.form7) {
      setForm7({
        ...INITIAL_FORM7,
        ...record.form7,
        targetAddress: { ...EMPTY_ADDRESS, ...(record.form7.targetAddress ?? {}) },
      });
    } else if (record.formId === 'form8' && record.form8) {
      setForm8({
        ...INITIAL_FORM8,
        ...record.form8,
        shiftingAddress: { ...EMPTY_ADDRESS, ...(record.form8.shiftingAddress ?? {}) },
      });
    }
  }, []);

  const deleteSavedFormRecord = useCallback(async (id: string) => {
    await deleteSavedFormOffline(id);
    setSavedForms((prev) => prev.filter((r) => r.id !== id));
    setActiveRecordId((curr) => (curr === id ? null : curr));
  }, []);

  const clearAllSavedFormRecords = useCallback(async () => {
    await clearAllSavedFormsOffline();
    setSavedForms([]);
    setActiveRecordId(null);
  }, []);

  return (
    <FormContext.Provider
      value={{
        activeTab,
        setActiveTab,
        templates,
        reloadTemplate: loadSingleTemplate,
        common,
        updateCommon,
        form6,
        updateForm6,
        form7,
        updateForm7,
        form8,
        updateForm8,
        loadSampleData,
        resetActiveForm,
        startNewEntry,
        clearAllDrafts,
        lastSavedAt,
        draftRestored,
        draftStorageWarning,
        bloProfile,
        saveBloDefaultProfile,
        saveCurrentHeaderAsBloProfile,
        applyBloProfileToCurrentForm,
        clearBloDefaultProfile,
        savedForms,
        activeRecordId,
        saveCurrentFormToOfflineList,
        loadSavedFormRecord,
        deleteSavedFormRecord,
        clearAllSavedFormRecords,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export function useFormStore(): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useFormStore must be used inside FormProvider');
  return ctx;
}
