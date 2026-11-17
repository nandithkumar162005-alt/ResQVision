import { resolveUrl } from '../services/api.js';

/**
 * Downloads a protected or public image attachment cleanly to the user's computer.
 * Handles Bearer token authorization for RBAC protected endpoints (/api/v1/attachments/*).
 */
export async function downloadImageAttachment(photo, token) {
  if (!photo) return;
  const rawUrl = photo.downloadUrl || photo.url;
  if (!rawUrl) return;

  const fileName = photo.name || photo.caption || 'rescue-citizen-photo.jpg';

  // If already a local blob or data URL
  if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = rawUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // Target download URL with download parameter
  let targetUrl = resolveUrl(rawUrl);
  if (!targetUrl.includes('download=1')) {
    targetUrl += targetUrl.includes('?') ? '&download=1' : '?download=1';
  }

  try {
    const res = await fetch(targetUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  } catch (err) {
    console.error('Failed to download image attachment via blob:', err);
    // Fallback: open in new tab
    window.open(targetUrl, '_blank');
  }
}
