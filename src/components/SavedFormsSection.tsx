import React, { useMemo, useState } from 'react';
import {
  FolderOpen,
  Download,
  Trash2,
  Search,
  FileSpreadsheet,
  Pencil,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { FormId, SavedFormRecord } from '../types/forms';
import { downloadSavedFormsCsv } from '../utils/offlineStorage';

interface SavedFormsSectionProps {
  records: SavedFormRecord[];
  onOpenRecord: (record: SavedFormRecord) => void;
  onDownloadRecordPdf: (record: SavedFormRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onClearAllRecords: () => Promise<void>;
  className?: string;
}

const FORM_LABEL: Record<FormId, string> = {
  form6: 'Form-6',
  form7: 'Form-7',
  form8: 'Form-8',
};

export const SavedFormsSection: React.FC<SavedFormsSectionProps> = ({
  records,
  onOpenRecord,
  onDownloadRecordPdf,
  onDeleteRecord,
  onClearAllRecords,
  className = 'mt-10',
}) => {
  const [filterForm, setFilterForm] = useState<'all' | FormId>('all');
  const [query, setQuery] = useState('');
  const [busyRecordId, setBusyRecordId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((rec) => {
      if (filterForm !== 'all' && rec.formId !== filterForm) return false;
      if (!q) return true;
      return (
        rec.applicantName.toLowerCase().includes(q) ||
        rec.relativeOrEpic.toLowerCase().includes(q) ||
        rec.mobileNumber.toLowerCase().includes(q) ||
        rec.acSummary.toLowerCase().includes(q)
      );
    });
  }, [records, filterForm, query]);

  const handleDownload = async (rec: SavedFormRecord) => {
    setBusyRecordId(rec.id);
    try {
      await onDownloadRecordPdf(rec);
    } finally {
      setBusyRecordId(null);
    }
  };

  const formatSavedDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <section
      aria-labelledby="offline-saved-forms-heading"
      className={`${className} rounded-xl border border-slate-200 bg-white p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-[#1E3A5F]" aria-hidden="true" />
            <h3
              id="offline-saved-forms-heading"
              className="text-base font-bold text-slate-900"
            >
              Offline Saved Forms Register
            </h3>
            <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
              ({records.length})
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>
              Stored 100% offline in device storage (IndexedDB) · Zero cloud upload · Open, edit,
              or re-download PDF anytime.
            </span>
          </p>
        </div>

        {records.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => downloadSavedFormsCsv(filtered.length > 0 ? filtered : records)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export Excel CSV</span>
            </button>

            {confirmClearAll ? (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1">
                <span className="text-[11px] font-medium text-red-800">Delete all?</span>
                <button
                  type="button"
                  onClick={() => {
                    void onClearAllRecords();
                    setConfirmClearAll(false);
                  }}
                  className="rounded bg-red-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-800"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        ) : null}
      </div>

      {records.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-slate-700">No forms saved offline yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Open Form-6, Form-7, or Form-8 above and click <strong>Save to Offline List</strong> or{' '}
            <strong>Generate &amp; Download Filled PDF</strong> — your entries will appear here for
            quick re-editing, re-downloading, or Excel CSV export without internet.
          </p>
        </div>
      ) : (
        <>
          {/* Filter & Search Toolbar */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 self-start">
              {(['all', 'form6', 'form7', 'form8'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterForm(tab)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                    filterForm === tab
                      ? 'bg-[#1E3A5F] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all' ? 'All Forms' : FORM_LABEL[tab]}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, EPIC, mobile, AC..."
                className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              />
            </div>
          </div>

          {/* Saved Records List */}
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No saved entries match your current filter.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              {filtered.map((rec) => {
                const isBusy = busyRecordId === rec.id;
                return (
                  <div
                    key={rec.id}
                    className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="font-mono text-xs font-bold text-[#1E3A5F]">
                          {FORM_LABEL[rec.formId]}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {rec.applicantName}
                        </span>
                        {rec.relativeOrEpic ? (
                          <>
                            <span className="hidden text-slate-300 sm:inline" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-xs text-slate-600">{rec.relativeOrEpic}</span>
                          </>
                        ) : null}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 tabular-nums">
                        <span>Saved {formatSavedDate(rec.savedAt)}</span>
                        {rec.mobileNumber ? <span>· Mob: {rec.mobileNumber}</span> : null}
                        {rec.acSummary ? <span>· AC: {rec.acSummary}</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenRecord(rec)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Open / Edit</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleDownload(rec)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#162d4b] disabled:opacity-60 whitespace-nowrap"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void onDeleteRecord(rec.id)}
                        aria-label={`Delete saved entry for ${rec.applicantName}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};
