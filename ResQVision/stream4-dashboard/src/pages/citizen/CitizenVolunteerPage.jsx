import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  FileCheck,
  HeartHandshake,
  MapPin,
  Phone,
  ShieldCheck,
  User
} from 'lucide-react';
import { DemoBadge } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';

const SKILL_CATEGORIES = [
  'First Aid / Emergency Medical Care',
  'Search & Relief Staging Assistance',
  'Logistics / Vehicle Transport / Supplies',
  'Language Translation & Communication',
  'Community Shelter Coordination',
  'Food & Ration Distribution Support'
];

const AVAILABILITY_OPTIONS = [
  'Immediate Deployment',
  'Weekends Only',
  'Evenings & After Hours',
  'On-Call Standby (24-48 hr notice)'
];

export default function CitizenVolunteerPage() {
  const { citizenUser, useMockData, theme } = useAppState();
  const isDark = theme === 'dark';

  const [name, setName] = useState(citizenUser?.name || '');
  const [contact, setContact] = useState(citizenUser?.email || '');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [skill, setSkill] = useState(SKILL_CATEGORIES[0]);
  const [availability, setAvailability] = useState(AVAILABILITY_OPTIONS[0]);
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);

  const handleSubmit = e => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      const ref = `VOL-REG-${Date.now().toString().slice(-6)}`;
      setSubmittedRef({
        reference: ref,
        name,
        skill,
        district: district || 'Not specified',
        state: state || 'Not specified',
        submittedAt: new Date().toLocaleString()
      });
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className={`max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Volunteer With ResQVision
            </h1>
            {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} label="Demo Community Feature" />}
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Civilian disaster preparedness and relief support registration portal.
          </p>
        </div>
        <div className={`rounded-xl px-3 py-1.5 text-xs font-semibold border flex items-center gap-1.5 ${
          isDark ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-50 text-orange-700 border-orange-200'
        }`}>
          <HeartHandshake className="h-4 w-4" />
          Community Relief Support
        </div>
      </div>

      {/* Mandatory Anti-Hallucination Disclaimer Banner (§17) */}
      <div className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${
        isDark ? 'border-amber-500/30 bg-amber-950/30 text-amber-300' : 'border-amber-300 bg-amber-50/90 text-amber-900'
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1.5 text-xs">
            <h3 className={`font-bold uppercase tracking-wider text-[11px] ${isDark ? 'text-amber-200' : 'text-amber-950'}`}>
              CRITICAL OPERATIONAL NOTICE &amp; DISCLAIMER
            </h3>
            <p className="leading-relaxed">
              Submitting this registration form records your willingness and interest to volunteer during civil emergencies.
              <strong> It does NOT grant official authorization, field operational clearance, or automatic deployment.</strong>
            </p>
            <p className={`leading-relaxed ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              All civilian volunteer mobilization is strictly coordinated and vetted by the District Disaster Management Authority (DDMA), NDRF / SDRF, and civil administration. Never deploy to active disaster zones independently without official tasking.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation State if Submitted */}
      {submittedRef ? (
        <div className={`rounded-2xl border p-6 text-center space-y-4 ${
          isDark ? 'glass-dark border-emerald-500/30 bg-emerald-950/20 text-white' : 'glass-light border-emerald-300 bg-emerald-50/50'
        }`}>
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
          }`}>
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Volunteer Interest Successfully Registered
            </h2>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
              Your application reference: <span className="font-mono font-bold text-orange-500">{submittedRef.reference}</span>
            </p>
          </div>

          <div className={`max-w-md mx-auto text-left rounded-xl border p-4 text-xs space-y-2 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <div className={`flex justify-between py-1 border-b ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Applicant Name:</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-800'}`}>{submittedRef.name}</span>
            </div>
            <div className={`flex justify-between py-1 border-b ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Skill Track:</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-800'}`}>{submittedRef.skill}</span>
            </div>
            <div className={`flex justify-between py-1 border-b ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Location:</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-zinc-800'}`}>{submittedRef.district}, {submittedRef.state}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Status:</span>
              <span className="font-bold text-orange-400">Application Submitted: Pending Official Vetting</span>
            </div>
          </div>

          <p className={`text-[11px] italic max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            You will be contacted by district liaison officers only if official volunteer support is authorized for your region.
          </p>

          <button
            type="button"
            onClick={() => setSubmittedRef(null)}
            className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition cursor-pointer shadow-sm"
          >
            Submit Another Volunteer Registration
          </button>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className={`rounded-2xl border p-5 sm:p-7 space-y-5 ${
          isDark ? 'glass-dark border-white/10 text-zinc-100' : 'glass-light border-zinc-200/80 text-zinc-900'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Full Legal Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Rajesh Kumar"
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border focus:border-orange-500 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                      : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Contact Phone / Email *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="+91 98765 43210 or email"
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border focus:border-orange-500 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                      : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                District / City *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="e.g., Visakhapatnam"
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border focus:border-orange-500 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                      : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                State / UT *
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g., Andhra Pradesh"
                className={`w-full rounded-xl px-3 py-2 text-xs outline-none border focus:border-orange-500 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                    : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Skill / Primary Assistance Category *
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <select
                  value={skill}
                  onChange={e => setSkill(e.target.value)}
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border focus:border-orange-500 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-zinc-300 bg-white text-zinc-900'
                  }`}
                >
                  {SKILL_CATEGORIES.map(sk => (
                    <option key={sk} value={sk} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                      {sk}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Availability *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <select
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none border focus:border-orange-500 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-zinc-300 bg-white text-zinc-900'
                  }`}
                >
                  {AVAILABILITY_OPTIONS.map(av => (
                    <option key={av} value={av} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}>
                      {av}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Relevant Certifications / Optional Note
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g., Red Cross certified First Aid responder, valid 4x4 driver license..."
              className={`w-full rounded-xl p-3 text-xs outline-none border focus:border-orange-500 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white placeholder-zinc-500'
                  : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto rounded-xl bg-orange-600 hover:bg-orange-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Registering Application...' : 'Submit Volunteer Application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
