import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Download, Eye, FileText, MapPin, Send, Siren } from 'lucide-react';
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

const STATUS_STYLES = {
  pending_review: 'border-amber-300 bg-amber-50 text-amber-800',
  info_requested: 'border-orange-300 bg-orange-50 text-orange-800',
  verified: 'border-sky-300 bg-sky-50 text-sky-800',
  operation_authorized: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  rejected: 'border-zinc-300 bg-zinc-100 text-zinc-700'
};

function buildCitizenProgressStages(report) {
  const status = report.status;
  const stages = [
    { label: 'SOS submitted', reached: true },
    { label: 'Received by system', reached: true },
    {
      label: 'Under officer review',
      reached: ['pending_review', 'info_requested', 'verified', 'operation_authorized', 'rejected'].includes(
        status
      )
    }
  ];

  if (status === 'info_requested') {
    stages.push({ label: 'Additional information requested', reached: true });
  }
  if (status === 'rejected') {
    stages.push({ label: 'Closed / rejected by officer', reached: true });
  } else {
    stages.push({
      label: 'Operation authorized',
      reached: status === 'operation_authorized'
    });
    if (String(report.statusLabel || '').toLowerCase().includes('successful')) {
      stages.push({ label: 'Operation completed', reached: true });
    }
  }
  return stages;
}

export default function CitizenHistoryPage() {
  const {
    sosReports,
    citizenToken,
    replyCitizenSos,
    downloadReceipt,
    backendSyncError,
    useMockData,
    theme
  } = useAppState();
  const isDark = theme === 'dark';
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRef, setSelectedRef] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const [actionErr, setActionErr] = useState('');

  const selectedReport = useMemo(
    () => sosReports.find(r => r.reference === selectedRef) || null,
    [sosReports, selectedRef]
  );

  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return sosReports;
    return sosReports.filter(item => item.status === statusFilter);
  }, [sosReports, statusFilter]);

  const handleDownload = async report => {
    setActionErr('');
    try {
      await downloadReceipt(report);
    } catch (err) {
      setActionErr(err.message || 'Unable to generate PDF receipt.');
    }
  };

  const handleReplySubmit = async e => {
    e.preventDefault();
    if (!selectedReport || !replyText.trim()) return;
    setReplyBusy(true);
    setActionErr('');
    try {
      await replyCitizenSos(selectedReport.reference, replyText.trim());
      setReplyText('');
    } catch (err) {
      setActionErr(err.message || 'Unable to send additional information.');
    } finally {
      setReplyBusy(false);
    }
  };

  return (
    <div className={`mx-auto max-w-5xl space-y-5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-xl font-bold sm:text-2xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              My SOS History
            </h1>
            {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
          </div>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Track submitted SOS references, stage progression from actual records, uploaded photos,
            and PDF submission receipts.
          </p>
        </div>

        <Link
          to="/citizen/sos"
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 shadow-sm"
        >
          <Siren className="h-3.5 w-3.5" />
          New SOS Alert
        </Link>
      </div>

      {backendSyncError && (
        <ErrorState theme={isDark ? 'dark' : 'light'} title="Backend synchronization issue" message={backendSyncError} />
      )}
      {actionErr && <ErrorState theme={isDark ? 'dark' : 'light'} title="Action failed" message={actionErr} />}

      <div className={`flex items-start gap-2.5 rounded-2xl px-4 py-3 text-xs border ${
        isDark ? 'glass-dark border-white/10 text-zinc-300' : 'glass-light border-zinc-200 text-zinc-600'
      }`}>
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
        <span>
          <strong>Receipt notice:</strong> This document confirms submission of an SOS report only.
          It does not confirm verification, rescue assignment or dispatch.
          {useMockData && ' (Mock mode receipts are clearly marked DEMO.)'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Reports' },
          { id: 'pending_review', label: 'Pending Review' },
          { id: 'info_requested', label: 'Info Requested' },
          { id: 'operation_authorized', label: 'Operation Authorized' },
          { id: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              statusFilter === tab.id
                ? isDark
                  ? 'border-orange-500 bg-orange-600 text-white font-bold shadow-sm'
                  : 'border-zinc-900 bg-zinc-900 text-white'
                : isDark
                ? 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                : 'border-zinc-200 bg-white/80 text-zinc-600 hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredReports.length === 0 ? (
        <EmptyState
          theme={isDark ? 'dark' : 'light'}
          icon={Clock}
          title="No SOS reports in this view"
          description={
            useMockData
              ? 'No demo SOS reports match the current filter.'
              : 'You have not submitted any SOS reports yet under this citizen account.'
          }
          action={
            <Link
              to="/citizen/sos"
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition"
            >
              Submit Emergency SOS
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => {
            const stages = buildCitizenProgressStages(report);
            return (
              <article
                key={report.reference}
                className={`rounded-2xl p-4 transition border sm:p-5 ${
                  isDark
                    ? 'glass-dark border-white/10 hover:border-orange-500/50'
                    : 'glass-light border-zinc-200 hover:border-orange-300'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                        {report.reference}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          STATUS_STYLES[report.status] || STATUS_STYLES.pending_review
                        }`}
                      >
                        {report.statusLabel}
                      </span>
                      {report.is_demo && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
                    </div>
                    <h2 className={`mt-1.5 text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      {report.emergencyType}
                    </h2>
                    <p className={`mt-1 flex items-center gap-1.5 text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                      {report.locationText}
                    </p>
                    <p className={`mt-1 flex items-center gap-1.5 text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      Submitted {formatDateTime(report.submittedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRef(report.reference)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                        isDark
                          ? 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
                          : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(report)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-700 cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF Receipt
                    </button>
                  </div>
                </div>

                {/* Progress Timeline from actual recorded stages */}
                <div className={`mt-3 flex flex-wrap items-center gap-2 border-t pt-3 ${isDark ? 'border-white/10' : 'border-zinc-200/70'}`}>
                  {stages.map((st, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                        st.reached
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                          : isDark
                          ? 'bg-white/5 text-zinc-400'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {st.label}
                    </span>
                  ))}
                </div>

                {report.photos?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-1">
                    {report.photos.map((photo, idx) => (
                      <ProtectedImage
                        key={`${photo.id || photo.name}-${idx}`}
                        src={photo.url}
                        token={citizenToken}
                        alt={photo.caption || photo.name}
                        className="h-14 w-20 rounded-lg border border-zinc-200 object-cover"
                      />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ModalDialog
        open={Boolean(selectedReport)}
        onClose={() => setSelectedRef('')}
        title={selectedReport ? `${selectedReport.reference}: ${selectedReport.emergencyType}` : ''}
        subtitle="SOS Submission Details"
        theme={isDark ? 'dark' : 'light'}
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 font-semibold ${
                  STATUS_STYLES[selectedReport.status] || STATUS_STYLES.pending_review
                }`}
              >
                {selectedReport.statusLabel}
              </span>
              {selectedReport.is_demo && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
            </div>

            <div className={`grid gap-3 rounded-xl p-3.5 sm:grid-cols-2 border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200/60'
            }`}>
              <div>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Submitted</p>
                <p className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {formatDateTime(selectedReport.submittedAt)}
                </p>
              </div>
              <div>
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>People Needing Help</p>
                <p className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{selectedReport.peopleCount}</p>
              </div>
              <div className="sm:col-span-2">
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Location</p>
                <p className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {selectedReport.locationText} ({selectedReport.lat}, {selectedReport.lng})
                </p>
              </div>

              {Number.isFinite(Number(selectedReport.lat)) && Number.isFinite(Number(selectedReport.lng)) && (
                <div className="sm:col-span-2 space-y-1">
                  <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Dynamic Geospatial Incident Map</p>
                  <ResQMap
                    theme={isDark ? 'dark' : 'light'}
                    defaultStyle={isDark ? 'dark' : 'light'}
                    heightClass="h-[180px]"
                    allowFullscreen={false}
                    pickedCoords={{ lat: Number(selectedReport.lat), lng: Number(selectedReport.lng) }}
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Incident Description</p>
                <p className={`mt-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>{selectedReport.description}</p>
              </div>
              <div className="sm:col-span-2">
                <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Status &amp; Officer Note</p>
                <p className={`mt-0.5 font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{selectedReport.officerNote}</p>
                <p className={`mt-1 text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Team live location, route, and ETA appear only when supplied by an authorized
                  operational integration.
                </p>
              </div>
            </div>

            {selectedReport.status === 'info_requested' && (
              <form
                onSubmit={handleReplySubmit}
                className={`space-y-2 rounded-xl border p-3.5 ${
                  isDark ? 'border-orange-500/30 bg-orange-950/20' : 'border-orange-200 bg-orange-50/70'
                }`}
              >
                <label htmlFor="cit-reply" className={`block font-semibold ${isDark ? 'text-orange-300' : 'text-orange-900'}`}>
                  Respond to Officer Information Request
                </label>
                <textarea
                  id="cit-reply"
                  rows={2}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Provide clarification requested by duty officer…"
                  className={`w-full rounded-lg border px-3 py-2 text-xs ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                      : 'border-orange-200 bg-white text-zinc-900'
                  }`}
                />
                <button
                  type="submit"
                  disabled={replyBusy || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-60 cursor-pointer transition shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  {replyBusy ? 'Sending…' : 'Send Additional Details'}
                </button>
              </form>
            )}

            {selectedReport.photos?.length > 0 && (
              <div>
                <p className={`mb-2 font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Uploaded Photographs</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReport.photos.map((photo, idx) => (
                    <figure
                      key={`${photo.id || photo.name}-${idx}`}
                      className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-zinc-200'}`}
                    >
                      <ProtectedImage
                        src={photo.url}
                        token={citizenToken}
                        alt={photo.caption || photo.name}
                        className="h-36 w-full object-cover"
                      />
                      <figcaption className={`px-2.5 py-1.5 text-[11px] ${isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-50 text-zinc-600'}`}>
                        {photo.caption || photo.name}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}

            <div className={`flex justify-end gap-2 border-t pt-3 ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
              <button
                type="button"
                onClick={() => handleDownload(selectedReport)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 cursor-pointer shadow-sm transition"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF Receipt
              </button>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
}
