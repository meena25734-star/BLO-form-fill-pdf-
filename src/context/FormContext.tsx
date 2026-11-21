import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CommonHeaderData,
  Form6Data,
  Form7Data,
  Form8Data,
  FormId,
  TemplateState,
} from '../types/forms';
import {
  getSampleCommonHeader,
  getSampleForm6,
  getSampleForm7,
  getSampleForm8,
} from '../utils/sampleData';

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
  clearAllDrafts: () => void;
  lastSavedAt: string | null;
  draftRestored: boolean;
  draftStorageWarning: string | null;
}

const FormContext = createContext<FormContextValue | null>(null);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialDraftRef = React.useRef<PersistedDraftPayload | null | undefined>(undefined);
  if (initialDraftRef.current === undefined) {
    initialDraftRef.current = loadDraftFromStorage();
  }
  const initialDraft = initialDraftRef.current;

  const [activeTab, setActiveTabState] = useState<FormId>(initialDraft?.activeTab ?? 'form6');
  const [common, setCommon] = useState<CommonHeaderData>(initialDraft?.common ?? INITIAL_COMMON);
  const [form6, setForm6] = useState<Form6Data>(initialDraft?.form6 ?? INITIAL_FORM6);
  const [form7, setForm7] = useState<Form7Data>(initialDraft?.form7 ?? INITIAL_FORM7);
  const [form8, setForm8] = useState<Form8Data>(initialDraft?.form8 ?? INITIAL_FORM8);

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialDraft?.updatedAt ?? null);
  const [draftRestored, setDraftRestored] = useState<boolean>(Boolean(initialDraft));
  const [draftStorageWarning, setDraftStorageWarning] = useState<string | null>(null);
  const hasUserEditedRef = React.useRef<boolean>(Boolean(initialDraft));

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

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while loading ${fileName}`);
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

  const loadSampleData = useCallback((formId: FormId) => {
    hasUserEditedRef.current = true;
    setDraftRestored(false);
    setCommon(getSampleCommonHeader());
    if (formId === 'form6') setForm6(getSampleForm6());
    if (formId === 'form7') setForm7(getSampleForm7());
    if (formId === 'form8') setForm8(getSampleForm8());
  }, []);

  const resetActiveForm = useCallback((formId: FormId) => {
    hasUserEditedRef.current = true;
    setDraftRestored(false);
    if (formId === 'form6') setForm6(INITIAL_FORM6);
    if (formId === 'form7') setForm7(INITIAL_FORM7);
    if (formId === 'form8') setForm8(INITIAL_FORM8);
  }, []);

  const clearAllDrafts = useCallback(() => {
    hasUserEditedRef.current = false;
    setDraftRestored(false);
    setLastSavedAt(null);
    setDraftStorageWarning(null);
    setCommon({ ...INITIAL_COMMON, applicationDate: todayIso() });
    setForm6(INITIAL_FORM6);
    setForm7(INITIAL_FORM7);
    setForm8(INITIAL_FORM8);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore storage removal errors
      }
    }
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
        clearAllDrafts,
        lastSavedAt,
        draftRestored,
        draftStorageWarning,
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
