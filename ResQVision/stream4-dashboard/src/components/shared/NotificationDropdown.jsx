import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { formatRelativeTime } from '../../utils/format.js';

export default function NotificationDropdown({
  theme = 'light',
  notifications = [],
  onMarkAllRead
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;
  const isDark = theme === 'dark';

  useEffect(() => {
    const onOutsideClick = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onOutsideClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${
          isDark
            ? 'border-charcoal-700 bg-charcoal-850 text-zinc-200 hover:border-charcoal-600 hover:bg-charcoal-800'
            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 font-mono text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notifications panel"
          className={`absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border p-3 shadow-2xl ${
            isDark
              ? 'border-charcoal-700 bg-charcoal-900 text-zinc-100'
              : 'border-zinc-200 bg-white text-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/10 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-500 hover:text-orange-400"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className={`py-6 text-center text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                No notifications yet. Live delivery requires backend notification service.
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  className={`rounded-xl border px-3 py-2.5 text-xs ${
                    item.read
                      ? isDark
                        ? 'border-charcoal-800 bg-charcoal-950/40 text-zinc-400'
                        : 'border-zinc-100 bg-zinc-50/70 text-zinc-600'
                      : isDark
                      ? 'border-orange-500/30 bg-orange-500/10 text-zinc-100'
                      : 'border-orange-200 bg-orange-50/70 text-zinc-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug">{item.title}</p>
                    {!item.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                    )}
                  </div>
                  {item.detail && <p className="mt-1 text-[11px] opacity-85">{item.detail}</p>}
                  <p className="mt-1 font-mono text-[10px] opacity-70">
                    {formatRelativeTime(item.at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
