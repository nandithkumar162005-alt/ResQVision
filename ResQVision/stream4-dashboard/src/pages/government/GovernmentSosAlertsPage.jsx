import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
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
import { downloadImageAttachment } from '../../utils/download.js';

const RESPONSE_UNITS = [
  'NDRF Battalion Rapid Response Team',
  'SDRF State Rescue Squad',
  'District Fire & Emergency Services',
  'Medical & Trauma Mobile Unit',
  'Municipal Flood & Engineering Wing'
];

export default function GovernmentSosAlertsPage() {
  const { govSosReports, governmentToken, reviewSosAlert, backendSyncError, useMockData, theme } =
    useAppState();
  const isDark = theme === 'dark';
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
    <div className={`mx-auto max-w-7xl space-y-5 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-xl font-bold sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              SOS Alerts
            </h1>
            {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
          </div>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Human officer review and operational authorization workflow. Citizen reports are not
            automatically verified or dispatched.
          </p>
        </div>
      </div>

      {backendSyncError && (
        <ErrorState theme={isDark ? 'dark' : 'light'} title="Unable to fetch SOS queue" message={backendSyncError} />
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
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              filter === tab.id
                ? isDark
                  ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                  : 'border-orange-500 bg-orange-100 text-orange-900 font-semibold'
                : isDark
                ? 'border-charcoal-700 bg-charcoal-900 text-zinc-400 hover:bg-charcoal-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          theme={isDark ? 'dark' : 'light'}
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
                  className={`w-full rounded-2xl border p-4 text-left transition cursor-pointer ${
                    chosen
                      ? isDark
                        ? 'glass-dark border-orange-500 ring-1 ring-orange-500/40'
                        : 'bg-orange-50/70 border-orange-500 ring-1 ring-orange-500/40 shadow-sm'
                      : isDark
                      ? 'glass-dark-subtle border-white/10 hover:border-white/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.reference}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isDark ? 'bg-charcoal-800 text-orange-300' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className={`mt-1.5 text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    {item.emergencyType}
                  </p>
                  <p className={`mt-1 truncate text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{item.locationText}</p>
                  <p className={`mt-1.5 flex items-center gap-1.5 font-mono text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    <Clock className="h-3 w-3" />
                    {formatDateTime(item.submittedAt)}
                  </p>
                </button>
              );
            })}
          </aside>

          {/* Right Review Workspace */}
          {current && (
            <section className={`space-y-5 rounded-2xl p-5 lg:col-span-8 ${isDark ? 'glass-dark' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <div className={`flex flex-wrap items-start justify-between gap-3 border-b pb-4 ${isDark ? 'border-charcoal-800' : 'border-slate-200'}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {current.reference}
                    </span>
                    {current.is_demo && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
                  </div>
                  <h2 className={`mt-1 font-display text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {current.emergencyType}
                  </h2>
                  <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Submitted {formatDateTime(current.submittedAt)} · {current.peopleCount}{' '}
                    person(s) needing help · Contact: {current.contactName} ({current.contactPhone})
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  isDark ? 'border-orange-500/40 bg-orange-500/15 text-orange-300' : 'border-orange-300 bg-orange-50 text-orange-800'
                }`}>
                  {current.statusLabel}
                </span>
              </div>

              {/* Location & Description */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={`rounded-xl border p-3.5 text-xs ${isDark ? 'border-charcoal-800 bg-charcoal-950/60' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    <MapPin className="h-3.5 w-3.5 text-orange-500" />
                    Reported Location (
                    {current.locationSource === 'gps' ? 'Device GPS' : 'Manual Correction'})
                  </div>
                  <p className={`mt-1.5 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{current.locationText}</p>
                  <p className={`mt-1 font-mono text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {current.lat != null && current.lng != null
                      ? `${Number(current.lat).toFixed(5)}, ${Number(current.lng).toFixed(5)}`
                      : 'Coordinates unavailable'}
                  </p>
                </div>

                <div className={`rounded-xl border p-3.5 text-xs ${isDark ? 'border-charcoal-800 bg-charcoal-950/60' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Incident Description</div>
                  <p className={`mt-1.5 leading-relaxed ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{current.description}</p>
                </div>
              </div>

              {current.lat != null && current.lng != null && (
                <div>
                  <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Reported Coordinates Inspection
                  </p>
                  <ResQMap
                    theme={theme}
                    defaultStyle={isDark ? 'dark' : 'light'}
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
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Citizen Photographs ({current.photos?.length || 0})
                  </h3>
                  {current.photos?.length > 0 && (
                    <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Click to inspect or download full image
                    </span>
                  )}
                </div>
                {current.photos?.length ? (
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {current.photos.map((photo, idx) => (
                      <div
                        key={`${photo.id || photo.name}-${idx}`}
                        className={`group flex flex-col justify-between overflow-hidden rounded-xl border text-left transition hover:border-orange-500/50 ${
                          isDark ? 'border-charcoal-700 bg-charcoal-950' : 'border-slate-200 bg-white shadow-sm'
                        }`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setPreviewPhoto(photo)}
                          onKeyDown={e => e.key === 'Enter' && setPreviewPhoto(photo)}
                          className="cursor-pointer overflow-hidden"
                          title="Click to preview"
                        >
                          <ProtectedImage
                            src={photo.url}
                            token={governmentToken}
                            alt={photo.caption || photo.name}
                            className="h-32 w-full object-cover transition group-hover:scale-105"
                          />
                        </div>
                        <div className={`flex items-center justify-between gap-1 p-2 text-[11px] ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          <span className="truncate" title={photo.caption || photo.name}>
                            {photo.caption || photo.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => downloadImageAttachment(photo, governmentToken)}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition hover:bg-orange-500 hover:text-white cursor-pointer ${
                              isDark ? 'border-charcoal-700 bg-charcoal-850 text-zinc-200' : 'border-slate-200 bg-slate-100 text-slate-700'
                            }`}
                            title="Download original photo"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`mt-2 rounded-xl border px-3 py-3 text-xs ${isDark ? 'border-charcoal-800 bg-charcoal-950/50 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                    No photographs attached to this report.
                  </p>
                )}
              </div>

              {/* AI Image & Message Authenticity Section */}
              <div className="space-y-3">
                {/* Pre-Rescue AI Intake Verification Summary Banner */}
                <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-xs ${
                  isDark ? 'border-charcoal-700 bg-charcoal-950/80' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Pre-Rescue AI Intake Verification</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {current.photos?.length > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                          current.imageAssessment?.verdict === 'AI_GENERATED' || current.imageAssessment?.verdict === 'LIKELY_AI'
                            ? isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-800 border border-red-300'
                            : current.imageAssessment?.available
                            ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        Image: {current.imageAssessment?.available ? (current.imageAssessment.verdict || 'VERIFIED') : 'Pending'}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                        current.messageVerification?.verdict === 'PROBABLE_HOAX' || current.messageVerification?.verdict === 'AI_GENERATED'
                          ? isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-800 border border-red-300'
                          : current.messageVerification?.available
                          ? isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                          : isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      Text: {current.messageVerification?.available ? (current.messageVerification.verdict || 'VERIFIED') : 'Pending'}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      Verified prior to rescue queue display
                    </span>
                  </div>
                </div>

                {/* 1. AI Image Authenticity Card */}
                {(() => {
                  const img = current.imageAssessment;
                  const isReal = img?.verdict === 'LIKELY_REAL';
                  const isAi = img?.verdict === 'AI_GENERATED' || img?.verdict === 'LIKELY_AI';
                  const borderCls = isReal
                    ? isDark ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : isAi
                    ? isDark ? 'border-red-500/40 bg-red-950/20 text-red-300' : 'border-red-300 bg-red-50 text-red-900'
                    : isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-900';

                  return (
                    <div className={`rounded-xl border p-3.5 text-xs ${borderCls}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          {img?.cautionLabel || 'AI Image Authenticity Assessment'}
                        </span>
                        {img?.ai_probability !== undefined && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-bold ${
                            isAi
                              ? isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-200 text-red-900'
                              : isReal
                              ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-200 text-emerald-900'
                              : isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-200 text-amber-900'
                          }`}>
                            {img.ai_probability}% AI Probability
                          </span>
                        )}
                        {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
                      </div>
                      <p className={`mt-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                        {img?.summary || 'No photograph submitted or verification service pending.'}
                      </p>
                      {Array.isArray(img?.reasons) && img.reasons.length > 0 && (
                        <ul className={`mt-1.5 list-disc list-inside space-y-0.5 text-[11px] opacity-90 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {img.reasons.slice(0, 3).map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      )}
                      <p className={`mt-1.5 text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
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
                    ? isDark ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : isHoax
                    ? isDark ? 'border-red-500/40 bg-red-950/20 text-red-300' : 'border-red-300 bg-red-50 text-red-900'
                    : isDark ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300' : 'border-sky-300 bg-sky-50 text-sky-900';

                  return (
                    <div className={`rounded-xl border p-3.5 text-xs ${borderCls}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          {mv?.label || 'AI Message & Distress Veracity Analysis'}
                        </span>
                        {mv?.authenticity_score !== undefined && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-bold ${
                            isHoax
                              ? isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-200 text-red-900'
                              : isGenuine
                              ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-200 text-emerald-900'
                              : isDark ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-sky-200 text-sky-900'
                          }`}>
                            {mv.authenticity_score}% Authenticity Score
                          </span>
                        )}
                        {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
                      </div>
                      <p className={`mt-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                        {mv?.summary || 'Message veracity evaluated against linguistic sincerity markers and real-time environmental data.'}
                      </p>
                      {Array.isArray(mv?.reasons) && mv.reasons.length > 0 && (
                        <ul className={`mt-1.5 list-disc list-inside space-y-0.5 text-[11px] opacity-90 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                          {mv.reasons.slice(0, 3).map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      )}
                      <p className={`mt-1.5 text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {mv?.disclaimer || 'Cross-referenced against live Open-Meteo weather and USGS earthquake feeds.'}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Human Officer Review Actions */}
              <div className={`space-y-3 rounded-xl border p-4 ${isDark ? 'border-charcoal-700 bg-charcoal-850' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`flex items-center gap-2 text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <UserCheck className="h-4 w-4 text-orange-500" />
                  Officer Human Review Actions
                </div>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  A submitted SOS never automatically dispatches a real rescue team. Operational
                  decisions require an authorized human officer.{' '}
                  {useMockData && '(Demo mode updates local preview only.)'}
                </p>
                {actionError && !modalAction && (
                  <p className="text-xs text-red-500">{actionError}</p>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleVerify}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 text-xs font-semibold text-sky-700 dark:text-sky-200 transition hover:bg-sky-500/25 disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accept / Verify
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal('request_info')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-60 cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    Request Additional Info
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal('reject')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/15 px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-red-200 transition hover:bg-red-500/25 disabled:opacity-60 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject with Reason
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal('authorize')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60 cursor-pointer shadow-sm"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Authorize Appropriate Operation
                  </button>
                </div>
              </div>

              {/* Officer Audit Log */}
              <div>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Review &amp; Decision Audit Log
                </h3>
                <div className="mt-2 space-y-2">
                  {(current.auditTrail || []).map((entry, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                        isDark ? 'border-charcoal-800 bg-charcoal-950/50' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{entry.actor}: </span>
                        <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>{entry.action}</span>
                      </div>
                      <span className={`font-mono text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
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
        theme={isDark ? 'dark' : 'light'}
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
              <label htmlFor="rej-reason" className={`block font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                Rejection Reason *
              </label>
              <input
                id="rej-reason"
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Duplicate report for already-evacuated sector"
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${
                  isDark ? 'border-charcoal-700 bg-charcoal-850 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
            </div>
          )}

          {modalAction === 'request_info' && (
            <div>
              <label htmlFor="req-info" className={`block font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                Information Needed from Citizen *
              </label>
              <textarea
                id="req-info"
                rows={3}
                value={infoPrompt}
                onChange={e => setInfoPrompt(e.target.value)}
                placeholder="e.g., Please confirm nearest street intersection and whether anyone requires urgent medical transport."
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${
                  isDark ? 'border-charcoal-700 bg-charcoal-850 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
            </div>
          )}

          {modalAction === 'authorize' && (
            <>
              <div>
                <label htmlFor="auth-unit" className={`block font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                  Assign Authorized Response Team *
                </label>
                <select
                  id="auth-unit"
                  value={selectedUnit}
                  onChange={e => setSelectedUnit(e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${
                    isDark ? 'border-charcoal-700 bg-charcoal-850 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  {RESPONSE_UNITS.map(u => (
                    <option key={u} value={u} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="auth-notes" className={`block font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                  Operational Authorization Note
                </label>
                <textarea
                  id="auth-notes"
                  rows={2}
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="Optional instructions or staging notes…"
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm ${
                    isDark ? 'border-charcoal-700 bg-charcoal-850 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>
              <p className={`rounded-lg border p-2.5 text-[11px] ${
                isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-900'
              }`}>
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
              className={`rounded-xl border px-4 py-2 font-semibold cursor-pointer ${
                isDark ? 'border-charcoal-700 text-zinc-300 hover:bg-charcoal-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-60 cursor-pointer shadow-sm"
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
        theme={isDark ? 'dark' : 'light'}
        subtitle="Citizen Attachment"
        title={previewPhoto?.caption || previewPhoto?.name || 'Photograph'}
      >
        {previewPhoto && (
          <div className="space-y-4">
            <ProtectedImage
              src={previewPhoto.url}
              token={governmentToken}
              alt={previewPhoto.caption || previewPhoto.name}
              className="max-h-[60vh] w-full rounded-xl object-contain bg-black/40"
            />
            <div className={`flex flex-wrap items-center justify-between gap-3 border-t pt-3 ${isDark ? 'border-charcoal-800' : 'border-slate-200'}`}>
              <div className="text-xs">
                <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                  {previewPhoto.caption || previewPhoto.name}
                </span>
                {previewPhoto.sizeBytes && (
                  <span className={`ml-2 font-mono text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    ({Math.max(1, Math.round(previewPhoto.sizeBytes / 1024))} KB)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => downloadImageAttachment(previewPhoto, governmentToken)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-orange-600 cursor-pointer shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download Original Image
              </button>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
