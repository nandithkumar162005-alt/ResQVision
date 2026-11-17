import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  apiDownloadServerReceiptPdf,
  apiFetchCitizenNotifications,
  apiFetchCitizenSos,
  apiFetchGovernmentCasualties,
  apiFetchGovernmentNotifications,
  apiFetchGovernmentOperations,
  apiFetchGovernmentSos,
  apiLoginCitizen,
  apiLoginGovernment,
  apiMarkCitizenNotificationsRead,
  apiMarkGovernmentNotificationsRead,
  apiRegisterCitizen,
  apiReplyCitizenSos,
  apiReviewGovernmentSos,
  apiSaveGovernmentCasualties,
  apiSubmitSos,
  apiUpdateGovernmentOperation,
  getInitialLayer1Data,
  USE_MOCK_DATA
} from '../services/api.js';
import { downloadSosReceiptPdf } from '../utils/pdfReceipt.js';

const AppContext = createContext(null);

function readSession(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    if (value == null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export function AppProvider({ children }) {
  const initial = useMemo(() => getInitialLayer1Data(), []);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('resqvision_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('resqvision_theme', theme);
    } catch {}
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#0B0D10';
      document.body.style.color = '#F4F4F5';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#0F172A';
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const [citizenSession, setCitizenSession] = useState(() => readSession('rv_citizen_session'));
  const [governmentSession, setGovernmentSession] = useState(() => readSession('rv_gov_session'));

  const [sosReports, setSosReports] = useState(initial.sosReports);
  const [govSosReports, setGovSosReports] = useState(initial.sosReports);
  const [rescueOperations, setRescueOperations] = useState(initial.rescueOperations);
  const [casualtyRecord, setCasualtyRecord] = useState(initial.casualtyRecord);
  const [backendSyncError, setBackendSyncError] = useState('');

  const [citizenNotifications, setCitizenNotifications] = useState(() => [
    {
      id: 'CNOT-1',
      title: 'SOS-2026-103: Additional information requested',
      detail: 'Officer requested injury status and nearest landmark clarification.',
      at: '2026-11-13T01:05:00Z',
      read: false
    },
    {
      id: 'CNOT-2',
      title: 'SOS-2026-102: Operation authorized by NDRF Command',
      detail: 'Motorized boat rescue team tasked to Sector 4.',
      at: '2026-11-12T22:55:00Z',
      read: true
    }
  ]);

  const [governmentNotifications, setGovernmentNotifications] = useState(() => [
    {
      id: 'GNOT-1',
      title: 'Critical Alert: Rising Water in Musi River Basin',
      detail: 'Musi river gauge reached danger mark 17.4m at Puranapul.',
      at: '2026-11-13T02:10:00Z',
      read: false
    },
    {
      id: 'GNOT-2',
      title: 'SOS-2026-104: High Priority Distress Report',
      detail: 'Musheerabad, Hyderabad · 4 people needing urgent evacuation.',
      at: '2026-11-13T01:45:00Z',
      read: false
    },
    {
      id: 'GNOT-3',
      title: 'SOS-2026-103 awaiting citizen verification update',
      detail: 'Kamakshya Hill Foothills, Guwahati sector.',
      at: '2026-11-13T01:30:00Z',
      read: false
    }
  ]);

  const citizenUser = citizenSession?.user || null;
  const citizenToken = citizenSession?.token || '';
  const governmentUser = governmentSession?.user || null;
  const governmentToken = governmentSession?.token || '';

  const refreshCitizenData = useCallback(async () => {
    if (USE_MOCK_DATA || !citizenToken) return;
    try {
      const [sosRes, notifRes] = await Promise.all([
        apiFetchCitizenSos(citizenToken),
        apiFetchCitizenNotifications(citizenToken)
      ]);
      setSosReports(sosRes.reports || []);
      setCitizenNotifications(notifRes.notifications || []);
      setBackendSyncError('');
    } catch (err) {
      setBackendSyncError(err.message || 'Unable to sync citizen SOS records.');
    }
  }, [citizenToken]);

  const refreshGovernmentData = useCallback(async () => {
    if (USE_MOCK_DATA || !governmentToken) return;
    try {
      const [sosRes, notifRes, opsRes, casRes] = await Promise.all([
        apiFetchGovernmentSos(governmentToken),
        apiFetchGovernmentNotifications(governmentToken),
        apiFetchGovernmentOperations(governmentToken),
        apiFetchGovernmentCasualties(governmentToken)
      ]);
      setGovSosReports(sosRes.reports || []);
      setGovernmentNotifications(notifRes.notifications || []);
      setRescueOperations(opsRes.operations || []);
      setCasualtyRecord(casRes.casualtyRecord || null);
      setBackendSyncError('');
    } catch (err) {
      setBackendSyncError(err.message || 'Unable to sync government command data.');
    }
  }, [governmentToken]);

  // Poll live backend data every 10s when signed in (non-mock mode)
  useEffect(() => {
    if (USE_MOCK_DATA || !citizenToken) return undefined;
    refreshCitizenData();
    const timer = window.setInterval(refreshCitizenData, 10_000);
    return () => window.clearInterval(timer);
  }, [citizenToken, refreshCitizenData]);

  useEffect(() => {
    if (USE_MOCK_DATA || !governmentToken) return undefined;
    refreshGovernmentData();
    const timer = window.setInterval(refreshGovernmentData, 10_000);
    return () => window.clearInterval(timer);
  }, [governmentToken, refreshGovernmentData]);

  const loginCitizen = useCallback(async credentials => {
    if (USE_MOCK_DATA) {
      const session = {
        token: 'demo-citizen-token',
        user: {
          id: 'DEMO-CITIZEN',
          role: 'citizen',
          name: credentials.name || 'Ananya Verma',
          email: credentials.email || credentials.contact || 'citizen@demo',
          isDemoAuth: true
        }
      };
      setCitizenSession(session);
      writeSession('rv_citizen_session', session);
      return session.user;
    }

    const res = await apiLoginCitizen({
      email: credentials.email,
      password: credentials.password
    });
    const session = { token: res.token, user: res.user };
    setCitizenSession(session);
    writeSession('rv_citizen_session', session);
    return res.user;
  }, []);

  const registerCitizen = useCallback(async ({ name, email, password }) => {
    if (USE_MOCK_DATA) {
      return loginCitizen({ name, email, password });
    }
    const res = await apiRegisterCitizen({ name, email, password });
    const session = { token: res.token, user: res.user };
    setCitizenSession(session);
    writeSession('rv_citizen_session', session);
    return res.user;
  }, [loginCitizen]);

  const logoutCitizen = useCallback(() => {
    setCitizenSession(null);
    writeSession('rv_citizen_session', null);
    if (!USE_MOCK_DATA) {
      setSosReports([]);
      setCitizenNotifications([]);
    }
  }, []);

  const loginGovernment = useCallback(async credentials => {
    if (USE_MOCK_DATA) {
      const session = {
        token: 'demo-gov-token',
        user: {
          id: 'DEMO-OFFICER',
          role: 'government',
          name: credentials.name || 'Commander Vikram Rao',
          email: credentials.email || 'officer@demo',
          agency: credentials.agency,
          isDemoAuth: true
        }
      };
      setGovernmentSession(session);
      writeSession('rv_gov_session', session);
      return session.user;
    }

    const res = await apiLoginGovernment({
      email: credentials.email,
      password: credentials.password,
      agency: credentials.agency
    });
    const session = { token: res.token, user: res.user };
    setGovernmentSession(session);
    writeSession('rv_gov_session', session);
    return res.user;
  }, []);

  const logoutGovernment = useCallback(() => {
    setGovernmentSession(null);
    writeSession('rv_gov_session', null);
    if (!USE_MOCK_DATA) {
      setGovSosReports([]);
      setGovernmentNotifications([]);
      setRescueOperations([]);
      setCasualtyRecord(null);
    }
  }, []);

  const submitCitizenSos = useCallback(
    async payload => {
      if (!USE_MOCK_DATA) {
        const res = await apiSubmitSos(payload, citizenToken);
        await refreshCitizenData();
        return res.report;
      }

      await new Promise(resolve => window.setTimeout(resolve, 250));
      const now = new Date().toISOString();
      const refNumber = `SOS-2026-${Math.floor(200 + Math.random() * 799)}`;
      const newReport = {
        reference: refNumber,
        submittedAt: now,
        emergencyType: payload.emergencyType,
        locationText: payload.locationText,
        state: payload.state || '',
        district: payload.district || '',
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        locationSource: payload.locationSource || 'manual',
        peopleCount: Number(payload.peopleCount || 1),
        description: payload.description,
        contactName: payload.contactName,
        contactPhone: payload.contactPhone,
        photos: payload.photos || [],
        status: 'pending_review',
        statusLabel: 'Pending Officer Review',
        officerNote:
          'Submission logged in incident tracking queue. Authorized officer review required prior to dispatch allocation.',
        reviewedBy: null,
        reviewedAt: null,
        authorizedUnit: null,
        imageAssessment: payload.photos?.length > 0 ? {
          available: true,
          verdict: 'LIKELY_REAL',
          label: 'Likely a real photograph',
          ai_probability: 14,
          confidence: 'medium',
          cautionLabel: 'AI Image: Likely real photograph (14% AI Probability)',
          summary: 'Camera metadata consistent; natural sensor noise pattern observed.',
          confidenceCaveat: 'Automated AI assessment is advisory; NDRF ground confirmation required.',
          reasons: ['No AI generation markers detected in pixel frequency spectrum.', 'Natural sensor noise pattern found.']
        } : {
          available: false,
          cautionLabel: 'No photographs attached',
          summary: 'No photographs attached to this report.',
          confidenceCaveat: 'Human officer authorization required for all dispatches.'
        },
        messageVerification: {
          available: true,
          verdict: 'GENUINE_EMERGENCY',
          authenticity_score: 94,
          urgency: 'HIGH',
          is_genuine: true,
          label: 'Verified High-Urgency Distress',
          summary: 'Distress message contains specific physical location markers, emergency intent, and matches environmental records.',
          reasons: ['High linguistic sincerity and situational detail.', 'No synthetic AI text markers detected.'],
          disclaimer: 'Cross-referenced against live Open-Meteo weather and USGS earthquake feeds.'
        },
        verificationPipeline: {
          passed: true,
          status: 'COMPLETED',
          overallRisk: 'VERIFIED_AUTHENTIC',
          imageVerified: Boolean(payload.photos?.length > 0),
          textVerified: true,
          processedAt: now
        },
        auditTrail: [
          {
            at: now,
            actor: payload.contactName || 'Citizen Report',
            action: `Submission ${refNumber} recorded (${payload.locationSource === 'gps' ? 'GPS' : 'Manual location'}).`
          }
        ],
        is_demo: false
      };

      setSosReports(prev => [newReport, ...prev]);
      setGovSosReports(prev => [newReport, ...prev]);
      setGovernmentNotifications(prev => [
        {
          id: `GNOT-${Date.now()}`,
          title: `DEMO submission ${refNumber} added to local preview queue`,
          detail: `${payload.emergencyType} · ${payload.locationText} (DEMO DATA)`,
          at: now,
          read: false
        },
        ...prev
      ]);
      setCitizenNotifications(prev => [
        {
          id: `CNOT-${Date.now()}`,
          title: `${refNumber} recorded locally (DEMO)`,
          detail: 'Mock mode only — NOT sent to government authorities.',
          at: now,
          read: false
        },
        ...prev
      ]);
      return newReport;
    },
    [citizenToken, refreshCitizenData]
  );

  const replyCitizenSos = useCallback(
    async (reference, replyText) => {
      if (!USE_MOCK_DATA) {
        const res = await apiReplyCitizenSos(reference, replyText, citizenToken);
        await refreshCitizenData();
        return res.report;
      }
      const now = new Date().toISOString();
      setSosReports(prev =>
        prev.map(r =>
          r.reference === reference
            ? {
                ...r,
                status: 'pending_review',
                statusLabel: 'Additional Info Provided (DEMO)',
                citizenUpdates: [...(r.citizenUpdates || []), { at: now, message: replyText }]
              }
            : r
        )
      );
      return null;
    },
    [citizenToken, refreshCitizenData]
  );

  const reviewSosAlert = useCallback(
    async (reference, decision) => {
      if (!USE_MOCK_DATA) {
        const res = await apiReviewGovernmentSos(reference, decision, governmentToken);
        await refreshGovernmentData();
        return res.report;
      }

      const { action, reason, infoRequest, unit, notes, actor } = decision;
      const now = new Date().toISOString();
      const reviewer = actor || governmentUser?.name || 'Duty Officer (DEMO)';

      const applyUpdate = list =>
        list.map(item => {
          if (item.reference !== reference) return item;
          let status = item.status;
          let statusLabel = item.statusLabel;
          let officerNote = item.officerNote;
          let authorizedUnit = item.authorizedUnit;
          let auditAction = '';

          if (action === 'verify') {
            status = 'verified';
            statusLabel = 'Verified by Officer (DEMO)';
            officerNote = notes || 'Incident details reviewed and verified in demo session.';
            auditAction = `Accepted / verified by ${reviewer} (DEMO).`;
          } else if (action === 'reject') {
            status = 'rejected';
            statusLabel = 'Rejected by Officer (DEMO)';
            officerNote = `Rejected: ${reason}${notes ? ` — ${notes}` : ''}`;
            auditAction = `Rejected by ${reviewer} (DEMO). Reason: ${reason}`;
          } else if (action === 'request_info') {
            status = 'info_requested';
            statusLabel = 'Additional Information Requested (DEMO)';
            officerNote = infoRequest;
            auditAction = `Requested additional info (DEMO): ${infoRequest}`;
          } else if (action === 'authorize') {
            status = 'operation_authorized';
            statusLabel = 'Verified — Operation Authorized (DEMO)';
            authorizedUnit = unit;
            officerNote = notes || `Authorized demo operation via ${unit}.`;
            auditAction = `Authorized demo operation via ${unit}.`;
          }

          return {
            ...item,
            status,
            statusLabel,
            officerNote,
            authorizedUnit,
            reviewedBy: reviewer,
            reviewedAt: now,
            auditTrail: [
              ...(item.auditTrail || []),
              { at: now, actor: reviewer, action: auditAction }
            ]
          };
        });

      setSosReports(applyUpdate);
      setGovSosReports(applyUpdate);

      if (action === 'authorize' && unit) {
        const target = govSosReports.find(r => r.reference === reference);
        const opRef = `OP-DEMO-2026-${Math.floor(100 + Math.random() * 899)}`;
        setRescueOperations(prev => [
          {
            operation_ref: opRef,
            sos_ref: reference,
            location: target?.locationText || 'Reported sector (DEMO)',
            team: `${unit} (DEMO)`,
            authorized_at: now,
            started_at: now,
            completed_at: null,
            status: 'ongoing',
            outcome: notes || `Demo operation authorized by ${reviewer}.`,
            evidence: [],
            is_demo: true
          },
          ...prev
        ]);
      }

      if (action === 'request_info' || action === 'authorize' || action === 'reject') {
        const msgMap = {
          request_info: `Additional info requested: ${infoRequest}`,
          authorize: `Demo operation authorized (${unit})`,
          reject: `Report rejected: ${reason}`
        };
        setCitizenNotifications(prev => [
          {
            id: `CNOT-${Date.now()}`,
            title: `${reference} status updated (DEMO)`,
            detail: msgMap[action],
            at: now,
            read: false
          },
          ...prev
        ]);
      }
      return null;
    },
    [governmentToken, governmentUser?.name, govSosReports, refreshGovernmentData]
  );

  const updateRescueOperation = useCallback(
    async (operationRef, payload) => {
      if (!USE_MOCK_DATA) {
        const res = await apiUpdateGovernmentOperation(operationRef, payload, governmentToken);
        await refreshGovernmentData();
        return res.operation;
      }
      const now = new Date().toISOString();
      setRescueOperations(prev =>
        prev.map(op =>
          op.operation_ref === operationRef
            ? {
                ...op,
                status: payload.status || op.status,
                outcome: payload.outcome || op.outcome,
                completed_at:
                  payload.status === 'successful' || payload.status === 'unsuccessful'
                    ? op.completed_at || now
                    : op.completed_at
              }
            : op
        )
      );
      return null;
    },
    [governmentToken, refreshGovernmentData]
  );

  const saveCasualtyRecord = useCallback(
    async body => {
      if (!USE_MOCK_DATA) {
        const res = await apiSaveGovernmentCasualties(body, governmentToken);
        setCasualtyRecord(res.casualtyRecord);
        return res.casualtyRecord;
      }
      const next = {
        ...body,
        updated_at: new Date().toISOString(),
        is_demo: true
      };
      setCasualtyRecord(next);
      return next;
    },
    [governmentToken]
  );

  const downloadReceipt = useCallback(
    async record => {
      if (USE_MOCK_DATA) {
        downloadSosReceiptPdf(record, { isDemo: true });
        return;
      }
      await apiDownloadServerReceiptPdf(record.reference, citizenToken);
    },
    [citizenToken]
  );

  const markAllNotificationsRead = useCallback(
    async portal => {
      if (portal === 'citizen') {
        setCitizenNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (!USE_MOCK_DATA && citizenToken) {
          await apiMarkCitizenNotificationsRead(citizenToken).catch(() => {});
        }
      } else {
        setGovernmentNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (!USE_MOCK_DATA && governmentToken) {
          await apiMarkGovernmentNotificationsRead(governmentToken).catch(() => {});
        }
      }
    },
    [citizenToken, governmentToken]
  );

  const value = {
    theme,
    setTheme,
    toggleTheme,
    useMockData: USE_MOCK_DATA,
    citizenUser,
    citizenToken,
    governmentUser,
    governmentToken,
    backendSyncError,
    loginCitizen,
    registerCitizen,
    logoutCitizen,
    loginGovernment,
    logoutGovernment,
    sosReports,
    govSosReports: USE_MOCK_DATA ? sosReports : govSosReports,
    rescueOperations,
    casualtyRecord,
    submitCitizenSos,
    replyCitizenSos,
    reviewSosAlert,
    updateRescueOperation,
    saveCasualtyRecord,
    downloadReceipt,
    citizenNotifications,
    governmentNotifications,
    markAllNotificationsRead
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used inside AppProvider');
  return ctx;
}
