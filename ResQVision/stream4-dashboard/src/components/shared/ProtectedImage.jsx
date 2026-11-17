import { useEffect, useState } from 'react';
import { resolveUrl } from '../../services/api.js';

/**
 * Renders images seamlessly for public/blob URLs AND RBAC-protected /api/v1/attachments/* endpoints.
 */
export default function ProtectedImage({ src, alt, token, className = '' }) {
  const [resolvedUrl, setResolvedUrl] = useState(() =>
    src && !src.startsWith('/api/v1/attachments/') ? src : ''
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) return undefined;
    if (!src.startsWith('/api/v1/attachments/')) {
      setResolvedUrl(src);
      setFailed(false);
      return undefined;
    }

    let cancelled = false;
    let objectUrl = '';
    const targetUrl = resolveUrl(src);

    fetch(targetUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedUrl(objectUrl);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, token]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-800/20 px-2 text-center text-[10px] text-zinc-500 ${className}`}
      >
        Protected photo unavailable
      </div>
    );
  }

  if (!resolvedUrl) {
    return <div className={`animate-pulse bg-zinc-200/60 ${className}`} />;
  }

  return <img src={resolvedUrl} alt={alt} className={className} />;
}
