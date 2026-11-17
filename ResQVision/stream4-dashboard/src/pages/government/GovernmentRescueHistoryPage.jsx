import { useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Edit3,
  FileWarning,
  XCircle
} from 'lucide-react';
import ProtectedImage from '../../components/shared/ProtectedImage.jsx';
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  ModalDialog
} from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { formatDateTime, formatNumber } from '../../utils/format.js';
import { downloadImageAttachment } from '../../utils/download.js';

const OP_STATUS_BADGE = {
  successful: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  ongoing: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  unsuccessful: 'border-red-500/40 bg-red-500/15 text-red-300'
};

export default function GovernmentRescueHistoryPage() {
  const {
    rescueOperations,
    casualtyRecord,
    governmentToken,
    updateRescueOperation,
    saveCasualtyRecord,
    backendSyncError,
    useMockData
  } = useAppState();
  const [statusFilter, setStatusFilter] = useState('all');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [editOp, setEditOp] = useState(null);
  const [opStatus, setOpStatus] = useState('ongoing');
  const [opOutcome, setOpOutcome] = useState('');
  const [opCaption, setOpCaption] = useState('');
  const [opFiles, setOpFiles] = useState([]);
  const [opBusy, setOpBusy] = useState(false);
  const [opErr, setOpErr] = useState('');

  const [casualtyModalOpen, setCasualtyModalOpen] = useState(false);
  const [casCount, setCasCount] = useState('');
  const [casStatus, setCasStatus] = useState('authority_verified');
  const [casSource, setCasSource] = useState('');
  const [casBusy, setCasBusy] = useState(false);
  const [casErr, setCasErr] = useState('');

  const evidenceTarget = useMemo(
    () => rescueOperations.find(o => o.operation_ref === evidenceRef) || null,
    [rescueOperations, evidenceRef]
  );

  const counts = useMemo(() => {
    return rescueOperations.reduce(
      (acc, op) => {
        acc.total += 1;
        if (op.status === 'successful') acc.successful += 1;
        else if (op.status === 'ongoing') acc.ongoing += 1;
        else if (op.status === 'unsuccessful') acc.unsuccessful += 1;
        return acc;
      },
      { total: 0, successful: 0, ongoing: 0, unsuccessful: 0 }
    );
  }, [rescueOperations]);

  const filteredOps = useMemo(() => {
    if (statusFilter === 'all') return rescueOperations;
    return rescueOperations.filter(op => op.status === statusFilter);
  }, [rescueOperations, statusFilter]);

  const hasBackendData = useMockData || !backendSyncError;

  const openEditModal = op => {
    setEditOp(op);
    setOpStatus(op.status);
    setOpOutcome(op.outcome || '');
    setOpCaption('');
    setOpFiles([]);
    setOpErr('');
  };

  const handleSaveOperation = async e => {
    e.preventDefault();
    if (!editOp) return;
    setOpBusy(true);
    setOpErr('');
    try {
      await updateRescueOperation(editOp.operation_ref, {
        status: opStatus,
        outcome: opOutcome.trim(),
        caption: opCaption.trim(),
        files: opFiles
      });
      setEditOp(null);
    } catch (err) {
      setOpErr(err.message || 'Unable to update operation.');
    } finally {
      setOpBusy(false);
    }
  };

  const openCasualtyModal = () => {
    setCasCount(
      casualtyRecord?.recorded_casualties_or_deaths != null
        ? String(casualtyRecord.recorded_casualties_or_deaths)
        : ''
    );
    setCasStatus(
      casualtyRecord?.verification_status === 'unverified_field_report'
        ? 'unverified_field_report'
        : 'authority_verified'
    );
    setCasSource(casualtyRecord?.source || '');
    setCasErr('');
    setCasualtyModalOpen(true);
  };

  const handleSaveCasualties = async e => {
    e.preventDefault();
    setCasErr('');
    if (!casSource.trim()) {
      setCasErr('Source attribution is required.');
      return;
    }
    setCasBusy(true);
    try {
      await saveCasualtyRecord({
        recorded_casualties_or_deaths: casCount === '' ? null : Number(casCount),
        verification_status: casStatus,
        source: casSource.trim()
      });
      setCasualtyModalOpen(false);
    } catch (err) {
      setCasErr(err.message || 'Unable to update casualty record.');
    } finally {
      setCasBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
              Rescue History
            </h1>
            {useMockData && <DemoBadge theme="dark" />}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            Operation counts, outcomes, and field evidence. Recorded casualties are maintained as a
            separate medical/civil figure.
          </p>
        </div>
      </div>

      {backendSyncError && (
        <ErrorState theme="dark" title="Operations backend unavailable" message={backendSyncError} />
      )}

      {/* Operation Counts (Strictly separated from casualty count) */}
      <section aria-label="Operation counts" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="glass-dark rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Rescue Operations</span>
            <ClipboardCheck className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            {hasBackendData ? formatNumber(counts.total) : '—'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {useMockData ? 'Demo operation records' : 'Stored operation records'}
          </div>
        </div>

        <div className="glass-dark rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Successful Operations</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-300">
            {hasBackendData ? formatNumber(counts.successful) : '—'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Confirmed outcome recorded</div>
        </div>

        <div className="glass-dark rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Ongoing Operations</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-300">
            {hasBackendData ? formatNumber(counts.ongoing) : '—'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Authorized &amp; in progress</div>
        </div>

        <div className="glass-dark rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Unsuccessful Operations</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-red-300">
            {hasBackendData ? formatNumber(counts.unsuccessful) : '—'}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Aborted / handed over</div>
        </div>
      </section>

      {/* Separate Recorded Casualties / Deaths Figure */}
      <section
        aria-label="Recorded casualties separate figure"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-500/35 bg-red-950/25 p-4"
      >
        <div className="flex items-start gap-3">
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                Recorded Casualties / Deaths (Separate Official Figure)
              </h2>
              {casualtyRecord?.is_demo && <DemoBadge theme="dark" />}
              {casualtyRecord?.verification_status && (
                <span className="rounded-full border border-red-400/30 bg-red-500/15 px-2 py-0.5 font-mono text-[10px] text-red-200">
                  {casualtyRecord.verification_status}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-300">
              {casualtyRecord?.source ||
                casualtyRecord?.note ||
                'Casualty figures are kept strictly separate from operation totals and require verified civil/medical authority reporting.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCasualtyModal}
            className="rounded-xl border border-charcoal-700 bg-charcoal-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-orange-500/50"
          >
            Update Figure
          </button>
          <div className="rounded-xl border border-red-500/30 bg-charcoal-950 px-5 py-2.5 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Recorded Fatalities
            </div>
            <div className="font-mono text-2xl font-bold text-red-300">
              {casualtyRecord?.recorded_casualties_or_deaths != null
                ? formatNumber(casualtyRecord.recorded_casualties_or_deaths)
                : '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Operations' },
          { id: 'ongoing', label: 'Ongoing' },
          { id: 'successful', label: 'Successful' },
          { id: 'unsuccessful', label: 'Unsuccessful' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === tab.id
                ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                : 'border-charcoal-700 bg-charcoal-900 text-zinc-400 hover:bg-charcoal-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Individual Operation Records */}
      {filteredOps.length === 0 ? (
        <EmptyState
          theme="dark"
          icon={ClipboardCheck}
          title="No rescue operations recorded"
          description={
            useMockData
              ? 'No demo operations match the selected filter.'
              : 'Authorize an SOS operation under SOS Alerts to record an operation here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredOps.map(op => (
            <article
              key={op.operation_ref}
              className="glass-dark rounded-2xl p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {op.operation_ref}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                        OP_STATUS_BADGE[op.status] || OP_STATUS_BADGE.ongoing
                      }`}
                    >
                      {op.status}
                    </span>
                    {op.is_demo && <DemoBadge theme="dark" />}
                  </div>
                  <h3 className="mt-1.5 text-sm font-bold text-white">{op.team}</h3>
                  <p className="mt-0.5 text-xs text-zinc-400">{op.location}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(op)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-orange-500/50 hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-orange-400" />
                    Update Status / Evidence
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvidenceRef(op.operation_ref)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-orange-500/50 hover:text-white"
                  >
                    <Camera className="h-3.5 w-3.5 text-orange-400" />
                    Evidence ({op.evidence?.length || 0})
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-zinc-200">{op.outcome}</p>

              <div className="mt-3 grid gap-2 border-t border-charcoal-800 pt-3 text-[11px] text-zinc-400 sm:grid-cols-3">
                <div>
                  Authorized:{' '}
                  <span className="font-mono text-zinc-200">{formatDateTime(op.authorized_at)}</span>
                </div>
                <div>
                  Started:{' '}
                  <span className="font-mono text-zinc-200">{formatDateTime(op.started_at)}</span>
                </div>
                <div>
                  Completed:{' '}
                  <span className="font-mono text-zinc-200">
                    {op.completed_at ? formatDateTime(op.completed_at) : 'In progress'}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Operation Evidence Modal */}
      <ModalDialog
        open={Boolean(evidenceTarget)}
        onClose={() => setEvidenceRef('')}
        theme="dark"
        subtitle={evidenceTarget ? `Operation Evidence · ${evidenceTarget.operation_ref}` : ''}
        title={evidenceTarget?.team || 'Operation Evidence'}
      >
        {evidenceTarget && (
          <div className="space-y-4 text-xs">
            <p className="text-zinc-300">{evidenceTarget.outcome}</p>
            {evidenceTarget.evidence?.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {evidenceTarget.evidence.map(ev => (
                  <figure
                    key={ev.id}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-charcoal-700 bg-charcoal-950"
                  >
                    <ProtectedImage
                      src={ev.url}
                      token={governmentToken}
                      alt={ev.caption}
                      className="h-44 w-full object-cover"
                    />
                    <figcaption className="space-y-1.5 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-zinc-100">{ev.caption}</p>
                        <button
                          type="button"
                          onClick={() => downloadImageAttachment({ url: ev.url, name: `${(ev.caption || 'evidence').replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg` }, governmentToken)}
                          className="inline-flex items-center gap-1 rounded-md border border-charcoal-700 bg-charcoal-850 px-2 py-1 text-[10px] font-medium text-zinc-200 transition hover:bg-orange-500 hover:text-white cursor-pointer"
                          title="Download photo"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {ev.uploaded_by} · {formatDateTime(ev.captured_at)}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <EmptyState
                theme="dark"
                icon={Camera}
                title="No photographs uploaded yet"
                description="Use Update Status / Evidence to attach field verification photographs."
              />
            )}
          </div>
        )}
      </ModalDialog>

      {/* Update Operation Status & Evidence Modal */}
      <ModalDialog
        open={Boolean(editOp)}
        onClose={() => setEditOp(null)}
        theme="dark"
        subtitle={`Update Operation · ${editOp?.operation_ref || ''}`}
        title={editOp?.team || 'Update Rescue Operation'}
      >
        <form onSubmit={handleSaveOperation} className="space-y-4 text-xs">
          <div>
            <label htmlFor="op-status" className="block font-semibold text-zinc-200">
              Operation Status
            </label>
            <select
              id="op-status"
              value={opStatus}
              onChange={e => setOpStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
            >
              <option value="ongoing">Ongoing</option>
              <option value="successful">Successful</option>
              <option value="unsuccessful">Unsuccessful</option>
            </select>
          </div>
          <div>
            <label htmlFor="op-outcome" className="block font-semibold text-zinc-200">
              Outcome Summary
            </label>
            <textarea
              id="op-outcome"
              rows={3}
              value={opOutcome}
              onChange={e => setOpOutcome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
            />
          </div>
          {!useMockData && (
            <>
              <div>
                <label htmlFor="op-caption" className="block font-semibold text-zinc-200">
                  Evidence Caption (Optional)
                </label>
                <input
                  id="op-caption"
                  type="text"
                  value={opCaption}
                  onChange={e => setOpCaption(e.target.value)}
                  placeholder="e.g., Shelter arrival confirmation photo"
                  className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="op-files" className="block font-semibold text-zinc-200">
                  Upload Evidence Photographs (JPEG/PNG/WebP)
                </label>
                <input
                  id="op-files"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={e => setOpFiles(Array.from(e.target.files || []))}
                  className="mt-1 block w-full text-xs text-zinc-300"
                />
              </div>
            </>
          )}
          {opErr && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-red-200">
              {opErr}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditOp(null)}
              className="rounded-xl border border-charcoal-700 px-4 py-2 font-semibold text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={opBusy}
              className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {opBusy ? 'Saving…' : 'Save Operation Record'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Separate Casualty Figure Modal */}
      <ModalDialog
        open={casualtyModalOpen}
        onClose={() => setCasualtyModalOpen(false)}
        theme="dark"
        subtitle="Separate Medical / Civil Record"
        title="Update Recorded Casualties / Deaths"
      >
        <form onSubmit={handleSaveCasualties} className="space-y-4 text-xs">
          <div>
            <label htmlFor="cas-count" className="block font-semibold text-zinc-200">
              Recorded Count (Leave blank if unknown)
            </label>
            <input
              id="cas-count"
              type="number"
              min={0}
              value={casCount}
              onChange={e => setCasCount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="cas-status" className="block font-semibold text-zinc-200">
              Verification Status
            </label>
            <select
              id="cas-status"
              value={casStatus}
              onChange={e => setCasStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
            >
              <option value="authority_verified">authority_verified</option>
              <option value="unverified_field_report">unverified_field_report</option>
            </select>
          </div>
          <div>
            <label htmlFor="cas-source" className="block font-semibold text-zinc-200">
              Authoritative Source Attribution *
            </label>
            <input
              id="cas-source"
              type="text"
              value={casSource}
              onChange={e => setCasSource(e.target.value)}
              placeholder="e.g., District Medical & Health Reconciliation Bulletin"
              className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
            />
          </div>
          {casErr && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-red-200">
              {casErr}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCasualtyModalOpen(false)}
              className="rounded-xl border border-charcoal-700 px-4 py-2 font-semibold text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={casBusy}
              className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {casBusy ? 'Saving…' : 'Save Casualty Record'}
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
