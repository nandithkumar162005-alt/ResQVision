/**
 * Server-side PDF-1.4 receipt generator bound directly to persisted SOS submission records.
 * Mandatory statement:
 * "This document confirms submission of an SOS report only. It does not confirm verification, rescue assignment or dispatch."
 */

function escapePdfText(value) {
  return String(value ?? '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text, maxChars = 76) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) current = word;
    else if ((current + ' ' + word).length <= maxChars) current += ' ' + word;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['-'];
}

export function buildServerSosReceiptPdfBuffer(record) {
  const lines = [];
  const pushLine = (text, opts = {}) => {
    lines.push({
      text: escapePdfText(text),
      font: opts.bold ? 'F2' : 'F1',
      size: opts.size || 10,
      gap: opts.gap || 15
    });
  };

  pushLine('RESQVISION - OFFICIAL SUBMISSION RECORD RECEIPT', { bold: true, size: 15, gap: 20 });
  pushLine('Disaster Intelligence. Faster Response. Safer Communities.', { size: 9, gap: 18 });
  pushLine('--------------------------------------------------------------------------------', { gap: 14 });
  pushLine('IMPORTANT SUBMISSION NOTICE:', { bold: true, size: 10, gap: 15 });
  for (const line of wrapText(
    'This document confirms submission of an SOS report only. It does not confirm verification, rescue assignment or dispatch.',
    78
  )) {
    pushLine(line, { bold: true, size: 9.5, gap: 14 });
  }
  pushLine('In immediate life-threatening danger, contact emergency services (112) directly.', {
    size: 9,
    gap: 18
  });
  pushLine('--------------------------------------------------------------------------------', { gap: 16 });

  const fields = [
    ['SOS Reference', record.reference],
    ['Submission Timestamp', record.submittedAt ? new Date(record.submittedAt).toISOString() : '—'],
    ['Recorded Status', record.statusLabel || record.status],
    ['Emergency Type', record.emergencyType],
    ['People Needing Help', String(record.peopleCount ?? 1)],
    ['Reported Location', record.locationText],
    ['Location Source', record.locationSource === 'gps' ? 'Device GPS' : 'Manual location entry'],
    [
      'Coordinates',
      record.lat != null && record.lng != null
        ? `${Number(record.lat).toFixed(5)}, ${Number(record.lng).toFixed(5)}`
        : 'Not provided'
    ],
    ['Contact Name', record.contactName || '—'],
    ['Contact Phone', record.contactPhone || '—'],
    ['Stored Attachments', `${Array.isArray(record.photos) ? record.photos.length : 0} file(s)`]
  ];

  for (const [label, value] of fields) {
    const wrapped = wrapText(`${label}: ${value}`, 78);
    wrapped.forEach((segment, idx) => {
      pushLine(segment, { bold: idx === 0, size: 10, gap: idx === wrapped.length - 1 ? 15 : 13 });
    });
  }

  pushLine('Incident Description:', { bold: true, size: 10, gap: 14 });
  for (const line of wrapText(record.description || '—', 78)) {
    pushLine(`  ${line}`, { size: 9.5, gap: 13 });
  }

  pushLine('', { gap: 12 });
  pushLine('--------------------------------------------------------------------------------', { gap: 14 });
  pushLine(`Server Receipt Issued: ${new Date().toISOString()}`, { size: 8.5, gap: 12 });

  let y = 760;
  const ops = ['BT'];
  let currentFont = '';
  let currentSize = 0;

  for (const item of lines) {
    if (y < 52) break;
    if (item.font !== currentFont || item.size !== currentSize) {
      ops.push(`/${item.font} ${item.size} Tf`);
      currentFont = item.font;
      currentSize = item.size;
    }
    ops.push(`1 0 0 1 48 ${y} Tm (${item.text}) Tj`);
    y -= item.gap;
  }
  ops.push('ET');
  const streamContent = ops.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}
