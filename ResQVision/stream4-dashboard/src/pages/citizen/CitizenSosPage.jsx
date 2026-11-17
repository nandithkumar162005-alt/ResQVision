import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Crosshair,
  Download,
  MapPin,
  Navigation,
  ShieldAlert,
  Siren,
  Trash2
} from 'lucide-react';
import ResQMap from '../../components/shared/ResQMap.jsx';
import { DemoBadge } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { downloadSosReceiptPdf } from '../../utils/pdfReceipt.js';

const EMERGENCY_TYPES = [
  'Flood / Rising Water',
  'Structural Collapse / Earthquake',
  'Cyclone / High Wind Damage',
  'Landslide / Blocked Access',
  'Fire / Smoke Emergency',
  'Medical Trauma / Trapped Persons',
  'Other Urgent Assistance'
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 4;

export default function CitizenSosPage() {
  const { citizenUser, submitCitizenSos, downloadReceipt, useMockData, theme } = useAppState();
  const isDark = theme === 'dark';
  const [step, setStep] = useState('form'); // 'form' | 'review' | 'submitted'
  const [idempotencyKey, setIdempotencyKey] = useState(() => `IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const [emergencyType, setEmergencyType] = useState(EMERGENCY_TYPES[0]);
  const [locationText, setLocationText] = useState('');
  const [stateName, setStateName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [lat, setLat] = useState('17.4150');
  const [lng, setLng] = useState('78.4867');
  const [mapFocus, setMapFocus] = useState({ lat: 17.415, lng: 78.4867, zoom: 11 });
  const [locationSource, setLocationSource] = useState('manual');
  const [gpsStatus, setGpsStatus] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState(citizenUser?.name || '');
  const [contactPhone, setContactPhone] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  const requestGps = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus(
        'Device geolocation is not supported in this browser. Enter coordinates or click the map manually.'
      );
      return;
    }
    setGpsStatus('Requesting device GPS permission…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const nextLat = pos.coords.latitude.toFixed(5);
        const nextLng = pos.coords.longitude.toFixed(5);
        const acc = Math.round(pos.coords.accuracy || 0);
        setLat(nextLat);
        setLng(nextLng);
        setMapFocus({ lat: Number(nextLat), lng: Number(nextLng), zoom: 14, nonce: Date.now() });
        setLocationSource('gps');
        setGpsStatus(
          `Device GPS captured (±${acc}m accuracy). You may still correct the pin or address manually.`
        );
      },
      err => {
        setGpsStatus(
          `GPS permission unavailable (${err.message || 'denied'}). Enter coordinates or click the map manually.`
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const centerMapOnInputs = () => {
    const pLat = Number(lat);
    const pLng = Number(lng);
    if (!Number.isFinite(pLat) || !Number.isFinite(pLng) || pLat < -90 || pLat > 90 || pLng < -180 || pLng > 180) {
      setFormError('Enter valid coordinates (Latitude -90..90, Longitude -180..180) before centering.');
      return;
    }
    setFormError('');
    setMapFocus({ lat: pLat, lng: pLng, zoom: 13.5, nonce: Date.now() });
  };

  const handlePhotoUpload = e => {
    setPhotoError('');
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setPhotoError(`Maximum of ${MAX_PHOTOS} photographs allowed per SOS submission.`);
      e.target.value = '';
      return;
    }

    const accepted = [];
    const rejectedMessages = [];

    for (const file of files.slice(0, remaining)) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        rejectedMessages.push(`${file.name}: unsupported format (use JPEG, PNG, or WebP).`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        rejectedMessages.push(`${file.name}: exceeds 5 MB limit.`);
        continue;
      }
      accepted.push({
        file,
        name: file.name,
        sizeKb: Math.max(1, Math.round(file.size / 1024)),
        url: URL.createObjectURL(file),
        caption: `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`
      });
    }

    if (files.length > remaining) {
      rejectedMessages.push(`Only ${remaining} additional file(s) allowed (limit ${MAX_PHOTOS}).`);
    }

    if (rejectedMessages.length) {
      setPhotoError(rejectedMessages.join(' '));
    }
    if (accepted.length) {
      setPhotos(prev => [...prev, ...accepted]);
    }
    e.target.value = '';
  };

  const removePhoto = index => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoError('');
  };

  const validateAndReview = e => {
    e.preventDefault();
    setFormError('');
    if (!locationText.trim()) {
      setFormError('Please provide your street, locality, landmark, or area details.');
      return;
    }
    const pLat = Number(lat);
    const pLng = Number(lng);
    if (
      !Number.isFinite(pLat) ||
      !Number.isFinite(pLng) ||
      pLat < -90 ||
      pLat > 90 ||
      pLng < -180 ||
      pLng > 180
    ) {
      setFormError('Please provide valid Latitude (-90 to 90) and Longitude (-180 to 180).');
      return;
    }
    const count = Number(peopleCount);
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      setFormError('Number of people needing help must be a whole number between 1 and 500.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setFormError('Please describe the emergency situation in at least 10 characters.');
      return;
    }
    if (!contactName.trim()) {
      setFormError('Contact name is required.');
      return;
    }
    const digits = contactPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setFormError('Please enter a valid contact phone number (at least 10 digits).');
      return;
    }
    setStep('review');
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      const created = await submitCitizenSos({
        emergencyType,
        locationText: locationText.trim(),
        state: stateName.trim(),
        district: districtName.trim(),
        lat: Number(lat),
        lng: Number(lng),
        locationSource,
        peopleCount: Number(peopleCount),
        description: description.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        photos,
        idempotencyKey
      });
      setSubmittedRecord(created);
      setStep('submitted');
    } catch (err) {
      setFormError(err.message || 'Unable to submit SOS request.');
      setStep('review');
    } finally {
      setSubmitting(false);
    }
  };

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  const validCoords =
    Number.isFinite(parsedLat) &&
    Number.isFinite(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180;

  return (
    <div className={`mx-auto max-w-4xl space-y-5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-xl font-bold sm:text-2xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Emergency SOS Alert
            </h1>
            {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
          </div>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Submit structured incident details, location, and optional photographs for officer review.
          </p>
        </div>
      </div>

      {/* Mandatory safety disclaimer */}
      <div
        role="note"
        className={`flex items-start gap-3 rounded-2xl border p-4 text-xs ${
          isDark
            ? 'border-amber-500/30 bg-amber-950/30 text-amber-300'
            : 'border-amber-300 bg-amber-50 text-amber-950'
        }`}
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="leading-relaxed">
          <strong>Important notice:</strong> A citizen SOS submission is{' '}
          <strong>not a verified emergency</strong> and does{' '}
          <strong>not mean a rescue team has been dispatched</strong>. An authorized officer
          reviews incoming reports and decides operational action. For immediate life-threatening
          danger, dial <strong>112</strong> directly.
        </p>
      </div>

      {step === 'submitted' && submittedRecord ? (
        <section className={`rounded-2xl p-6 border ${isDark ? 'glass-dark border-white/10 text-white' : 'glass-light border-zinc-200 text-zinc-900'}`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {useMockData ? 'Mock Submission Recorded Locally (Not Sent to Authorities)' : 'Submission Recorded'}
              </p>
              <h2 className={`mt-0.5 font-display text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Reference: {submittedRecord.reference}
              </h2>
              <p className={`mt-1 text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Status: <strong>{submittedRecord.statusLabel}</strong>. This document confirms
                submission of an SOS report only. It does not confirm verification, rescue
                assignment or dispatch.
              </p>
              {useMockData && (
                <p className={`mt-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${
                  isDark
                    ? 'border-amber-500/30 bg-amber-950/30 text-amber-300'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}>
                  DEMO MODE: Stored in local browser session only. This mock submission did NOT
                  reach real government authorities.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => downloadReceipt(submittedRecord)}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4" />
              Download PDF Receipt
            </button>
            <Link
              to="/citizen/history"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                isDark
                  ? 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
                  : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
              }`}
            >
              View in My SOS History
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setSubmittedRecord(null);
                setDescription('');
                setPhotos([]);
                setIdempotencyKey(`IDEM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium cursor-pointer transition ${
                isDark
                  ? 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Submit Another Report
            </button>
          </div>
        </section>
      ) : step === 'review' ? (
        <section className={`space-y-4 rounded-2xl p-6 border ${isDark ? 'glass-dark border-white/10 text-white' : 'glass-light border-zinc-200 text-zinc-900'}`}>
          <div className={`border-b pb-3 ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
              Step 2 of 2 · Review Before Submission
            </p>
            <h2 className={`mt-0.5 font-display text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Confirm your SOS details
            </h2>
          </div>

          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div className={`rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <dt className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Emergency Type</dt>
              <dd className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{emergencyType}</dd>
            </div>
            <div className={`rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <dt className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>People Needing Help</dt>
              <dd className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{peopleCount}</dd>
            </div>
            <div className={`rounded-xl p-3 border sm:col-span-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <dt className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>
                Location ({locationSource === 'gps' ? 'Device GPS' : 'Manual Entry'})
              </dt>
              <dd className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {locationText} ({lat}, {lng})
              </dd>
            </div>
            <div className={`rounded-xl p-3 border sm:col-span-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <dt className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Incident Description</dt>
              <dd className={`mt-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>{description}</dd>
            </div>
            <div className={`rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <dt className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Callback Contact</dt>
              <dd className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {contactName} · {contactPhone}
              </dd>
            </div>
            <div className={`rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200/60'}`}>
              <dt className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Photograph Attachments</dt>
              <dd className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {photos.length} photo(s) attached
              </dd>
            </div>
          </dl>

          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('form')}
              className={`rounded-xl border px-4 py-2.5 text-xs font-semibold cursor-pointer transition ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10' : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              Back &amp; Edit
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 cursor-pointer shadow-sm"
            >
              <Siren className="h-4 w-4" />
              {submitting ? 'Submitting…' : 'Confirm & Submit SOS'}
            </button>
          </div>
        </section>
      ) : (
        <form
          onSubmit={validateAndReview}
          className={`space-y-5 rounded-2xl p-5 sm:p-6 border ${isDark ? 'glass-dark border-white/10 text-zinc-100' : 'glass-light border-zinc-200 text-zinc-900'}`}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sos-type" className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Emergency Type *
              </label>
              <select
                id="sos-type"
                value={emergencyType}
                onChange={e => setEmergencyType(e.target.value)}
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:border-orange-500 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-zinc-200 bg-white text-zinc-900'
                }`}
              >
                {EMERGENCY_TYPES.map(t => (
                  <option key={t} value={t} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sos-people" className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Number of People Needing Help *
              </label>
              <input
                id="sos-people"
                type="number"
                min={1}
                max={500}
                value={peopleCount}
                onChange={e => setPeopleCount(e.target.value)}
                className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm focus:border-orange-500 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-zinc-200 bg-white text-zinc-900'
                }`}
              />
            </div>
          </div>

          {/* Location & GPS + Manual Pin Correction */}
          <div className={`space-y-3 rounded-2xl border p-4 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50/70'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>
                  Location (Device GPS or Manual Correction)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={centerMapOnInputs}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <Navigation className="h-3.5 w-3.5 text-orange-500" />
                  Center Map
                </button>
                <button
                  type="button"
                  onClick={requestGps}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isDark
                      ? 'border-orange-500/40 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                      : 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
                  }`}
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Use Device GPS
                </button>
              </div>
            </div>

            {gpsStatus && <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{gpsStatus}</p>}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="sos-state" className={`block text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  State
                </label>
                <input
                  id="sos-state"
                  type="text"
                  value={stateName}
                  onChange={e => setStateName(e.target.value)}
                  placeholder="e.g., Telangana"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-xs ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                      : 'border-zinc-200 bg-white text-zinc-900'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="sos-district" className={`block text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  District / City
                </label>
                <input
                  id="sos-district"
                  type="text"
                  value={districtName}
                  onChange={e => setDistrictName(e.target.value)}
                  placeholder="e.g., Hyderabad"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-xs ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                      : 'border-zinc-200 bg-white text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="sos-address" className={`block text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Street, Locality &amp; Nearest Landmark *
              </label>
              <input
                id="sos-address"
                type="text"
                value={locationText}
                onChange={e => setLocationText(e.target.value)}
                placeholder="e.g., Bholakpur Lane 4 near Community Hall, Musheerabad"
                className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                    : 'border-zinc-200 bg-white text-zinc-900'
                }`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="sos-lat" className={`block text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Latitude (Manual Correction)
                </label>
                <input
                  id="sos-lat"
                  type="text"
                  value={lat}
                  onChange={e => {
                    setLat(e.target.value);
                    setLocationSource('manual');
                  }}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 font-mono text-xs ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-zinc-200 bg-white text-zinc-900'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="sos-lng" className={`block text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Longitude (Manual Correction)
                </label>
                <input
                  id="sos-lng"
                  type="text"
                  value={lng}
                  onChange={e => {
                    setLng(e.target.value);
                    setLocationSource('manual');
                  }}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 font-mono text-xs ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-zinc-200 bg-white text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <ResQMap
              theme={isDark ? 'dark' : 'light'}
              defaultStyle={isDark ? 'dark' : 'light'}
              heightClass="h-[220px]"
              allowFullscreen={false}
              pickMode
              pickedCoords={validCoords ? { lat: parsedLat, lng: parsedLng } : null}
              focusTarget={mapFocus}
              onPickLocation={coords => {
                setLat(String(coords.lat));
                setLng(String(coords.lng));
                setLocationSource('manual');
              }}
              titleLabel="SOS manual location pin picker"
            />
          </div>

          <div>
            <label htmlFor="sos-desc" className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Incident Description *
            </label>
            <textarea
              id="sos-desc"
              rows={3}
              maxLength={600}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe water level, structural damage, medical needs, floor level, or blocked access…"
              className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm focus:border-orange-500 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                  : 'border-zinc-200 bg-white text-zinc-900'
              }`}
            />
          </div>

          {/* Photo Attachments with validation */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="sos-photos" className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Incident Photographs (Optional · JPEG/PNG/WebP · max 5 MB each · up to 4)
              </label>
              <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Attachment storage requires backend API (validated locally in preview)
              </span>
            </div>
            <label
              htmlFor="sos-photos"
              className={`mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-xs font-medium transition ${
                isDark
                  ? 'border-white/15 bg-white/5 text-zinc-300 hover:border-orange-500 hover:bg-orange-500/10'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:border-orange-400 hover:bg-orange-50/40'
              }`}
            >
              <Camera className="h-4 w-4 text-orange-500" />
              Select photographs to attach ({photos.length}/{MAX_PHOTOS})
              <input
                id="sos-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>

            {photoError && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-500">
                {photoError}
              </p>
            )}

            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((photo, idx) => (
                  <div
                    key={`${photo.name}-${idx}`}
                    className={`relative overflow-hidden rounded-xl border ${
                      isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-100'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="h-24 w-full object-cover"
                    />
                    <div className={`truncate px-2 py-1 text-[10px] ${isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-white text-zinc-600'}`}>
                      {photo.caption}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      aria-label={`Remove ${photo.name}`}
                      className="absolute right-1.5 top-1.5 rounded-lg bg-zinc-900/80 p-1 text-white hover:bg-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sos-cname" className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Contact Name *
                </label>
                <input
                  id="sos-cname"
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-zinc-200 bg-white text-zinc-900'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="sos-cphone" className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Contact Phone Number *
                </label>
                <input
                  id="sos-cphone"
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                      : 'border-zinc-200 bg-white text-zinc-900'
                  }`}
                />
              </div>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Your mobile phone number is used for callback only and is never treated as GPS location access.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs font-medium text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className={`flex justify-end border-t pt-4 ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-700 cursor-pointer shadow-sm sm:text-sm"
            >
              Review SOS Submission →
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
