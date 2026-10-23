import React from 'react';
import {
  Clock,
  CheckCircle2,
  Send,
  Truck,
  XCircle,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDispatchLog } from '../hooks/useDispatchLog';
import { formatTimestamp, formatUTCTimestamp } from '../utils/formatters';
import { getTimelineStatusInfo } from '../utils/severityColors';
import { LoadingState } from './LoadingState';
import { useTheme } from '../context/ThemeContext';

function getStatusIcon(status) {
  switch (status) {
    case 'confirmed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'delivered':
      return <Truck className="w-4 h-4 text-blue-500" />;
    case 'sent':
      return <Send className="w-4 h-4 text-indigo-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-[#EF4444]" />;
    default:
      return <HelpCircle className="w-4 h-4 text-slate-400" />;
  }
}

export function DispatchTimeline({ eventId }) {
  const { isDark } = useTheme();
  const { logs, isLoading, error } = useDispatchLog(eventId);
  const [expandedWave, setExpandedWave] = React.useState(null);

  if (!eventId) {
    return (
      <div className={`border rounded-2xl p-6 text-center ${
        isDark ? 'bg-[#12141A] border-[#272A36] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <p className="text-xs">Select an incident to view its dispatch timeline.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`border rounded-2xl p-6 ${
        isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
      }`}>
        <LoadingState message="Synchronizing dispatch log with Stream 3..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border border-amber-500/30 rounded-2xl p-6 text-center ${
        isDark ? 'bg-[#12141A]' : 'bg-white'
      }`}>
        <p className="text-xs text-[#F59E0B] font-mono">Failed to retrieve dispatch log for this event.</p>
        <p className="text-[11px] text-slate-400 mt-1">{error.message}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={`border rounded-2xl p-6 text-center ${
        isDark ? 'bg-[#12141A] border-[#272A36] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <p className="text-xs">No dispatch entries have been recorded for this incident yet.</p>
        <p className="text-[10px] text-slate-400 font-mono mt-1">Awaiting dispatch waves from Stream 3</p>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 shadow-xl transition-colors duration-200 ${
      isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
    }`}>
      <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
        isDark ? 'border-[#272A36]' : 'border-slate-200'
      }`}>
        <h3 className={`text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <Clock className={`w-4 h-4 ${isDark ? 'text-white' : 'text-blue-600'}`} />
          Dispatch Chronology
        </h3>
        <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {logs.length} Wave{logs.length !== 1 ? 's' : ''} Recorded
        </span>
      </div>

      <div className="relative">
        {/* Vertical timeline connector */}
        <div className={`absolute left-[17px] top-3 bottom-3 w-0.5 ${isDark ? 'bg-[#272A36]' : 'bg-slate-200'}`} />

        <div className="space-y-2">
          {logs.map((entry) => {
            const statusInfo = getTimelineStatusInfo(entry.status);
            const isExpanded = expandedWave === entry.id;

            return (
              <div key={entry.id} className="relative pl-9">
                {/* Timeline node */}
                <div className="absolute left-1.5 top-3 z-10">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-sm ${
                      isDark ? 'border-[#08090C]' : 'border-white'
                    }`}
                    style={{ backgroundColor: statusInfo.colorHex }}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#08090C]' : 'bg-white'}`} />
                  </div>
                </div>

                {/* Wave card */}
                <div
                  className={`p-3.5 rounded-xl border transition ${
                    isExpanded
                      ? isDark
                        ? 'bg-[#1C1F28] border-white/40 shadow-sm'
                        : 'bg-blue-50 border-blue-400 shadow-sm'
                      : isDark
                      ? 'bg-[#08090C] border-[#272A36] hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="flex items-center justify-between gap-2 cursor-pointer select-none"
                    onClick={() => setExpandedWave(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getStatusIcon(entry.status)}
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Wave {entry.wave_number}: {entry.team_name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${statusInfo.bgClass} ${statusInfo.textClass} ${statusInfo.borderClass}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span
                            className={`text-[11px] font-mono cursor-help ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                            title={`UTC: ${formatUTCTimestamp(entry.sent_at)}`}
                          >
                            {formatTimestamp(entry.sent_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                      aria-label={isExpanded ? 'Collapse wave details' : 'Expand wave details'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Expanded message content */}
                  {entry.message_content && (
                    <div className={`mt-2.5 pt-2.5 border-t ${
                      isDark ? 'border-[#272A36]' : 'border-slate-200'
                    } ${isExpanded ? 'block' : 'hidden sm:block'}`}>
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {entry.message_content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
