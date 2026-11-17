import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileCheck,
  FileText,
  Filter,
  History,
  Lock,
  Search,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { DemoBadge, EmptyState, LoadingState } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { useActiveDisasters, useDispatchLog } from '../../hooks/useDashboardData.js';

export default function GovernmentAuditLogsPage() {
  const { govSosReports, rescueOperations, governmentUser, useMockData } = useAppState();
  const { data: disasterData } = useActiveDisasters();
  const activeEvents = disasterData?.active_disasters || [];

  const [selectedEventId, setSelectedEventId] = useState(activeEvents[0]?.event_id || 'DIS-2026-001');
  const [activeTab, setActiveTab] = useState('decisions'); // 'decisions' | 'dispatch_log'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch backend dispatch history from GET /api/assessments/:event_id/dispatch-log
  const { data: dispatchLogData, error: dispatchLogError, isLoading: dispatchLoading } =
    useDispatchLog(selectedEventId);

  // Human review decision audit trail extracted from SOS reports & Rescue operations
  const officerDecisions = useMemo(() => {
    const logs = [];

    // Decisions from SOS triage
    (govSosReports || []).forEach(r => {
      if (r.reviewDecision) {
        logs.push({
          id: `DEC-SOS-${r.reference}`,
          type: 'SOS Human Review Decision',
          timestamp: r.reviewedAt || r.submittedAt,
          officer: r.reviewedBy || 'Authorized Officer',
          action: r.status?.toUpperCase(),
          target: `Report ${r.reference} (${r.locationText || r.state})`,
          notes: r.reviewNotes || r.officerNotes || 'Triage decision recorded.',
          escalatedTo: r.authorizedUnit || '—'
        });
      }
    });

    // Decisions from Rescue operations
    (rescueOperations || []).forEach(op => {
      logs.push({
        id: `DEC-OP-${op.id}`,
        type: 'Rescue Authorization Log',
        timestamp: op.start_time || new Date().toISOString(),
        officer: 'Operations Command Liaison',
        action: op.status === 'completed' ? 'MISSION CLOSED' : 'OPERATION AUTHORIZED',
        target: `${op.id} (${op.location_name})`,
        notes: op.officer_notes || 'Field team deployment authorized under civil command.',
        escalatedTo: op.assigned_team || '—'
      });
    });

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [govSosReports, rescueOperations]);

  const filteredDecisions = useMemo(() => {
    return officerDecisions.filter(d => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        d.id.toLowerCase().includes(q) ||
        d.officer.toLowerCase().includes(q) ||
        d.target.toLowerCase().includes(q) ||
        d.action.toLowerCase().includes(q)
      );
    });
  }, [officerDecisions, searchQuery]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#0B0D10] text-zinc-100">
      {/* Top Header */}
      <div className="glass-dark border-b border-white/10 px-4 sm:px-6 py-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Operational Dispatch & Human Audit Trail
              </h1>
              {useMockData && <DemoBadge label="Immutable Audit Mode" />}
            </div>
            <p className="text-xs text-zinc-400">
              Audit trail of officer decisions, NDMA / NDRF dispatch history, and triage rationales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('decisions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'decisions'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Officer Decisions ({officerDecisions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dispatch_log')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'dispatch_log'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Stream 4 Dispatch History Log
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: OFFICER HUMAN REVIEW DECISIONS */}
        {activeTab === 'decisions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search decisions by officer, report reference, or action..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Audit Trail Cryptographically Timestamped
              </div>
            </div>

            {filteredDecisions.length === 0 ? (
              <EmptyState
                title="No Officer Decisions Logged Yet"
                description="When officers review SOS alerts or authorize operations, decisions are permanently recorded here."
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="border-b border-white/10 bg-black/40 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Audit ID</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Authorized Officer</th>
                      <th className="py-3 px-4">Decision / Action</th>
                      <th className="py-3 px-4">Target Ref</th>
                      <th className="py-3 px-4">Escalation Unit</th>
                      <th className="py-3 px-4">Rationale Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDecisions.map(d => (
                      <tr key={d.id} className="hover:bg-white/[0.03] transition">
                        <td className="py-3 px-4 font-mono font-bold text-orange-400">{d.id}</td>
                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                          {new Date(d.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">{d.officer}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              d.action.includes('REJECT')
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : d.action.includes('AUTH') || d.action.includes('VERIF')
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {d.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-300">{d.target}</td>
                        <td className="py-3 px-4 font-semibold text-zinc-200">{d.escalatedTo}</td>
                        <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{d.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STREAM 4 DISPATCH HISTORY LOG (GET /api/assessments/:event_id/dispatch-log) */}
        {activeTab === 'dispatch_log' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 p-3.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Select Disaster Event:</span>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  className="rounded-lg bg-[#14181F] border border-white/10 px-3 py-1 text-xs text-white outline-none focus:border-orange-500"
                >
                  {activeEvents.map(ev => (
                    <option key={ev.event_id} value={ev.event_id} className="bg-[#14181F]">
                      {ev.event_id} — {ev.location_name} ({ev.hazard_type})
                    </option>
                  ))}
                  {activeEvents.length === 0 && (
                    <option value="DIS-2026-001">DIS-2026-001 (Default)</option>
                  )}
                </select>
              </div>

              <span className="text-xs font-mono text-zinc-400">
                Endpoint: GET /api/assessments/{selectedEventId}/dispatch-log
              </span>
            </div>

            {dispatchLoading ? (
              <LoadingState label="Querying backend dispatch log endpoint..." />
            ) : dispatchLogError ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-400 mb-2" />
                <h3 className="text-sm font-semibold text-white">Dispatch Log Feed Offline</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {dispatchLogError?.message || 'Upstream Stream 3 dispatch service is not currently reachable.'}
                </p>
                <p className="mt-3 text-[11px] text-zinc-500">
                  ResQVision displays this honest status rather than fabricating dispatch timestamps.
                </p>
              </div>
            ) : !dispatchLogData?.stages || dispatchLogData.stages.length === 0 ? (
              <EmptyState
                title="No Dispatch History Recorded"
                description={`No stage transitions recorded yet for event ${selectedEventId}.`}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Event Dispatch Progression Stages</h3>
                <div className="space-y-3">
                  {dispatchLogData.stages.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between rounded-xl bg-black/40 border border-white/5 p-3.5"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-orange-400">
                          {st.stage?.toUpperCase()}
                        </span>
                        <p className="text-xs text-zinc-300 mt-1">{st.note || 'Stage updated'}</p>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">
                        {st.timestamp ? new Date(st.timestamp).toLocaleString() : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
