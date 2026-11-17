import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle
} from 'lucide-react';
import ProtectedImage from '../../components/shared/ProtectedImage.jsx';
import ResQMap from '../../components/shared/ResQMap.jsx';
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  ModalDialog
} from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { formatDateTime } from '../../utils/format.js';

const RESPONSE_UNITS = [
  'NDRF Battalion Rapid Response Team',
  'SDRF State Rescue Squad',
  'District Fire & Emergency Services',
  'Medical & Trauma Mobile Unit',
  'Municipal Flood & Engineering Wing'
];

export default function GovernmentSosAlertsPage() {
  const { govSosReports, governmentToken, reviewSosAlert, backendSyncError, useMockData } =
    useAppState();
  const [filter, setFilter] = useState('all');
  const [selectedRef, setSelectedRef] = useState(govSosReports[0]?.reference || '');
  const [modalAction, setModalAction] = useState(null); // 'reject' | 'request_info' | 'authorize'
  const [reason, setReason] = useState('');
  const [infoPrompt, setInfoPrompt] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(RESPONSE_UNITS[0]);
  const [actionNotes, setActionNotes] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return govSosReports;
    return govSosReports.filter(item => item.status === filter);
  }, [govSosReports, filter]);

  const current = useMemo(
    () => filtered.find(r => r.reference === selectedRef) || filtered[0] || null,
    [filtered, selectedRef]
  );

  const openModal = type => {
    setActionError('');
    setReason('');
    setInfoPrompt('');
    setActionNotes('');
    setModalAction(type);
  };

  const handleVerify = async () => {
    if (!current) return;
    setActionError('');
    setBusy(true);
    try {
      await reviewSosAlert(current.reference, {
        action: 'verify',
        notes: 'Officer reviewed description, location, and attachments.'
      });
    } catch (err) {
      setActionError(err.message || 'Unable to record verification.');
    } finally {
      setBusy(false);
    }
  };

  const submitDecisionModal = async e => {
    e.preventDefault();
    if (!current) return;
    setActionError('');

    if (modalAction === 'reject' && !reason.trim()) {
      setActionError('Please provide a reason for rejecting this SOS report.');
      return;
    }
    if (modalAction === 'request_info' && !infoPrompt.trim()) {
      setActionError('Specify what additional information the citizen should provide.');
      return;
    }

    setBusy(true);
    try {
      if (modalAction === 'reject') {
        await reviewSosAlert(current.reference, {
          action: 'reject',
          reason: reason.trim(),
          notes: actionNotes.trim()
        });
      } else if (modalAction === 'request_info') {
        await reviewSosAlert(current.reference, {
          action: 'request_info',
          infoRequest: infoPrompt.trim()
        });
      } else if (modalAction === 'authorize') {
        await reviewSosAlert(current.reference, {
          action: 'authorize',
          unit: selectedUnit,
          notes: actionNotes.trim()
        });
      }
      setModalAction(null);
    } catch (err) {
      setActionError(err.message || 'Unable to save officer decision.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-white sm:text-2xl">SOS Alerts</h1>
            {useMockData && <DemoBadge theme="dark" />}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            Human officer review and operational authorization workflow. Citizen reports are not
            automatically verified or dispatched.
          </p>
        </div>
      </div>

      {backendSyncError && (
        <ErrorState theme="dark" title="Unable to fetch SOS queue" message={backendSyncError} />
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'pending_review', label: 'Pending Review' },
          { id: 'info_requested', label: 'Info Requested' },
          { id: 'verified', label: 'Verified' },
          { id: 'operation_authorized', label: 'Operation Authorized' },
          { id: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filter === tab.id
                ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                : 'border-charcoal-700 bg-charcoal-900 text-zinc-400 hover:bg-charcoal-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          theme="dark"
          icon={AlertTriangle}
          title="No SOS reports in this queue"
          description={
            useMockData
              ? 'No demo alerts match this status filter.'
              : 'No citizen SOS reports have been submitted to the backend yet.'
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Left Queue */}
          <aside className="space-y-2.5 lg:col-span-4">
            {filtered.map(item => {
              const chosen = current?.reference === item.reference;
              return (
                <button
                  key={item.reference}
                  type="button"
                  onClick={() => setSelectedRef(item.reference)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    chosen
                      ? 'glass-dark border-orange-500 ring-1 ring-orange-500/40'
                      : 'glass-dark-subtle border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {item.reference}
                    </span>
                    <span className="rounded-full bg-charcoal-800 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-zinc-100">
                    {item.emergencyType}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-400">{item.locationText}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(item.submittedAt)}
                  </p>
                </button>
              );
            })}
          </aside>

          {/* Right Review Workspace */}
          {current && (
            <section className="glass-dark space-y-5 rounded-2xl p-5 lg:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-charcoal-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">
                      {current.reference}
                    </span>
                    {current.is_demo && <DemoBadge theme="dark" />}
                  </div>
                  <h2 className="mt-1 font-display text-lg font-bold text-white">
                    {current.emergencyType}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    Submitted {formatDateTime(current.submittedAt)} · {current.peopleCount}{' '}
                    person(s) needing help · Contact: {current.contactName} ({current.contactPhone})
                  </p>
                </div>
                <span className="rounded-full border border-orange-500/40 bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-300">
                  {current.statusLabel}
                </span>
              </div>

              {/* Location & Description */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-charcoal-800 bg-charcoal-950/60 p-3.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                    <MapPin className="h-3.5 w-3.5 text-orange-400" />
                    Reported Location (
                    {current.locationSource === 'gps' ? 'Device GPS' : 'Manual Correction'})
                  </div>
                  <p className="mt-1.5 text-zinc-100">{current.locationText}</p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-400">
                    {current.lat != null && current.lng != null
                      ? `${Number(current.lat).toFixed(5)}, ${Number(current.lng).toFixed(5)}`
                      : 'Coordinates unavailable'}
                  </p>
                </div>

                <div className="rounded-xl border border-charcoal-800 bg-charcoal-950/60 p-3.5 text-xs">
                  <div className="font-semibold text-zinc-300">Incident Description</div>
                  <p className="mt-1.5 leading-relaxed text-zinc-200">{current.description}</p>
                </div>
              </div>

              {current.lat != null && current.lng != null && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Reported Coordinates Inspection
                  </p>
                  <ResQMap
                    theme="dark"
                    defaultStyle="dark"
                    heightClass="h-[200px]"
                    allowFullscreen={false}
                    pickedCoords={{ lat: Number(current.lat), lng: Number(current.lng) }}
                    focusTarget={{ lat: Number(current.lat), lng: Number(current.lng), zoom: 13 }}
                    titleLabel={`Location preview for ${current.reference}`}
                  />
                </div>
              )}

              {/* Citizen Photographs */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Citizen Photographs ({current.photos?.length || 0})
                </h3>
                {current.photos?.length ? (
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {current.photos.map((photo, idx) => (
                      <button
                        key={`${photo.id || photo.name}-${idx}`}
                        type="button"
                        onClick={() => setPreviewPhoto(photo)}
                        className="group overflow-hidden rounded-xl border border-charcoal-700 bg-charcoal-950 text-left"
                      >
                        <ProtectedImage
                          src={photo.url}
                          token={governmentToken}
                          alt={photo.caption || photo.name}
                          className="h-32 w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="px-2.5 py-1.5 text-[11px] text-zinc-300">
                          {photo.caption || photo.name}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl border border-charcoal-800 bg-charcoal-950/50 px-3 py-3 text-xs text-zinc-400">
                    No photographs attached to this report.
                  </p>
                )}
              </div>

              {/* AI Image & Message Authenticity Section */}
              <div className="space-y-3">
                {/* 1. AI Image Authenticity Card */}
                {(() => {
                  const img = current.imageAssessment;
                  const isReal = img?.verdict === 'LIKELY_REAL';
                  const isAi = img?.verdict === 'AI_GENERATED' || img?.verdict === 'LIKELY_AI';
                  const borderCls = isReal
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                    : isAi
                    ? 'border-red-500/40 bg-red-950/20 text-red-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300';

                  return (
                    <div className={`rounded-xl border p-3.5 text-xs ${borderCls}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          {img?.cautionLabel || 'AI Image Authenticity Assessment'}
                        </span>
                        {img?.ai_probability !== undefined && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-bold ${isAi ? 'bg-red-500/20 text-red-300 border border-red-500/30' : isReal ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                            {img.ai_probability}% AI Probability
                          </span>
                        )}
                        {useMockData && <DemoBadge theme="dark" />}
                      </div>
                      <p className="mt-1.5 text-zinc-200">
                        {img?.summary || 'No photograph submitted or verification service pending.'}
                      </p>
                      {Array.isArray(img?.reasons) && img.reasons.length > 0 && (
                        <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-[11px] text-zinc-300 opacity-90">
                          {img.reasons.slice(0, 3).map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-1.5 text-[10px] text-zinc-400">
                        {img?.confidenceCaveat || 'Automated AI image assessment is advisory; NDRF ground confirmation is required.'}
                      </p>
                    </div>
                  );
                })()}

                {/* 2. AI Distress Message Veracity Card */}
                {(() => {
                  const mv = current.messageVerification;
                  const isGenuine = mv?.verdict === 'GENUINE_EMERGENCY' || mv?.is_genuine === true;
                  const isHoax = mv?.verdict === 'PROBABLE_HOAX' || mv?.verdict === 'AI_GENERATED';
                  const borderCls = isGenuine
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                    : isHoax
                    ? 'border-red-500/40 bg-red-950/20 text-red-300'
                    : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300';

                  return (
                    <div className={`rounded-xl border p-3.5 text-xs ${borderCls}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          {mv?.label || 'AI Message & Distress Veracity Analysis'}
                        </span>
                        {mv?.authenticity_score !== undefined && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-bold ${isHoax ? 'bg-red-500/20 text-red-300 border border-red-500/30' : isGenuine ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                            {mv.authenticity_score}% Authenticity Score
                          </span>
                        )}
                        {useMockData && <DemoBadge theme="dark" />}
                      </div>
                      <p className="mt-1.5 text-zinc-200">
                        {mv?.summary || 'Message veracity evaluated against linguistic sincerity markers and real-time environmental data.'}
                      </p>
                      {Array.isArray(mv?.reasons) && mv.reasons.length > 0 && (
                        <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-[11px] text-zinc-300 opacity-90">
                          {mv.reasons.slice(0, 3).map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-1.5 text-[10px] text-zinc-400">
                        {mv?.disclaimer || 'Cross-referenced against live Open-Meteo weather and USGS earthquake feeds.'}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Human Officer Review Actions */}
              <div className="space-y-3 rounded-xl border border-charcoal-700 bg-charcoal-850 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <UserCheck className="h-4 w-4 text-orange-400" />
                  Officer Human Review Actions
                </div>
                <p className="text-[11px] text-zinc-400">
                  A submitted SOS never automatically dispatches a real rescue team. Operational
                  decisions require an authorized human officer.{' '}
                  {useMockData && '(Demo mode updates local preview only.)'}
                </p>
                {actionError && !modalAction && (
                  <p className="text-xs text-red-300">{actionError}</p>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleVerify}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/25 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accept / Verify
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal('request_info')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-60"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    Request Additional Info
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal('reject')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3.5 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/25 disabled:opacity-60"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject with Reason
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal('authorize')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Authorize Appropriate Operation
                  </button>
                </div>
              </div>

              {/* Officer Audit Log */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Review &amp; Decision Audit Log
                </h3>
                <div className="mt-2 space-y-2">
                  {(current.auditTrail || []).map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-charcoal-800 bg-charcoal-950/50 px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-zinc-200">{entry.actor}: </span>
                        <span className="text-zinc-300">{entry.action}</span>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Officer Action Modal */}
      <ModalDialog
        open={Boolean(modalAction)}
        onClose={() => setModalAction(null)}
        theme="dark"
        subtitle={`Officer Review · ${current?.reference || ''}`}
        title={
          modalAction === 'reject'
            ? 'Reject SOS Report with Reason'
            : modalAction === 'request_info'
            ? 'Request Additional Information from Citizen'
            : 'Authorize Appropriate Rescue Operation'
        }
      >
        <form onSubmit={submitDecisionModal} className="space-y-4 text-xs">
          {modalAction === 'reject' && (
            <div>
              <label htmlFor="rej-reason" className="block font-semibold text-zinc-200">
                Rejection Reason *
              </label>
              <input
                id="rej-reason"
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Duplicate report for already-evacuated sector"
                className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
              />
            </div>
          )}

          {modalAction === 'request_info' && (
            <div>
              <label htmlFor="req-info" className="block font-semibold text-zinc-200">
                Information Needed from Citizen *
              </label>
              <textarea
                id="req-info"
                rows={3}
                value={infoPrompt}
                onChange={e => setInfoPrompt(e.target.value)}
                placeholder="e.g., Please confirm nearest street intersection and whether anyone requires urgent medical transport."
                className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
              />
            </div>
          )}

          {modalAction === 'authorize' && (
            <>
              <div>
                <label htmlFor="auth-unit" className="block font-semibold text-zinc-200">
                  Assign Authorized Response Team *
                </label>
                <select
                  id="auth-unit"
                  value={selectedUnit}
                  onChange={e => setSelectedUnit(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
                >
                  {RESPONSE_UNITS.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="auth-notes" className="block font-semibold text-zinc-200">
                  Operational Authorization Note
                </label>
                <textarea
                  id="auth-notes"
                  rows={2}
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="Optional instructions or staging notes…"
                  className="mt-1 w-full rounded-xl border border-charcoal-700 bg-charcoal-850 px-3 py-2.5 text-sm text-white"
                />
              </div>
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-200">
                Human decision recorded in ResQVision. Real-world team dispatch requires external
                agency CAD integration.
              </p>
            </>
          )}

          {actionError && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-red-200">
              {actionError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalAction(null)}
              className="rounded-xl border border-charcoal-700 px-4 py-2 font-semibold text-zinc-300 hover:bg-charcoal-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Record Officer Decision'}
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Photo Preview Modal */}
      <ModalDialog
        open={Boolean(previewPhoto)}
        onClose={() => setPreviewPhoto(null)}
        theme="dark"
        subtitle="Citizen Attachment"
        title={previewPhoto?.caption || previewPhoto?.name || 'Photograph'}
      >
        {previewPhoto && (
          <ProtectedImage
            src={previewPhoto.url}
            token={governmentToken}
            alt={previewPhoto.caption || previewPhoto.name}
            className="max-h-[65vh] w-full rounded-xl object-contain"
          />
        )}
      </ModalDialog>
    </div>
  );
}
