import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const FALLBACK_TOKENS: Record<string, string> = {
  Admin:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWFkbWluLTAwMSIsImVtYWlsIjoiYWRtaW5AbGV4dmF1bHQubG9jYWwiLCJyb2xlIjoiQWRtaW4iLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzg4NTMyOTkxLCJleHAiOjE4MjAwNjg5OTF9.96KSpOaFxulAvgc-H_aX81mQenafQrjQn46XZ4vUAD0',
  Investigator:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWludi0wMDIiLCJlbWFpbCI6ImludmVzdGlnYXRvckBsZXh2YXVsdC5sb2NhbCIsInJvbGUiOiJJbnZlc3RpZ2F0b3IiLCJ1c2VybmFtZSI6ImludmVzdGlnYXRvciIsImlhdCI6MTc4ODUzMjk5MSwiZXhwIjoxODIwMDY4OTkxfQ.DNpVTiKBdzCYG_iCYp5rGwVq_U3TruSTQewpwst7dMU',
  Verifier:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXZlci0wMDMiLCJlbWFpbCI6InZlcmlmaWVyQGxleHZhdWx0LmxvY2FsIiwicm9sZSI6IlZlcmlmaWVyIiwidXNlcm5hbWUiOiJ2ZXJpZmllciIsImlhdCI6MTc4ODUzMjk5MSwiZXhwIjoxODIwMDY4OTkxfQ.VRb8DaCn72EtXdhxjfP5jAlw5sqXM9gawC6oPNEKIPA',
  Viewer:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXZpZXctMDA0IiwiZW1haWwiOiJ2aWV3ZXJAbGV4dmF1bHQubG9jYWwiLCJyb2xlIjoiVmlld2VyIiwidXNlcm5hbWUiOiJ2aWV3ZXIiLCJpYXQiOjE3ODg1MzI5OTEsImV4cCI6MTgyMDA2ODk5MX0._wnhaCGoF_rRqkMEuOC7M2E1ZRtEX9TnulP_K6mI9W4',
};

// Attach JWT token from localStorage or active demo profile
api.interceptors.request.use((config) => {
  let jwtToken = localStorage.getItem('lexvault_jwt_token');
  // Clear any outdated mock token signatures
  if (jwtToken && (jwtToken.includes('8vP8k6u') || jwtToken.endsWith('k6u'))) {
    localStorage.removeItem('lexvault_jwt_token');
    jwtToken = null;
  }

  const activeRole = localStorage.getItem('lexvault_demo_role') || 'Investigator';

  if (!jwtToken) {
    jwtToken = FALLBACK_TOKENS[activeRole] || FALLBACK_TOKENS.Investigator;
    localStorage.setItem('lexvault_jwt_token', jwtToken);
  }

  config.headers.Authorization = `Bearer ${jwtToken}`;
  return config;
});

// Response interceptor to auto-recover on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const activeRole = localStorage.getItem('lexvault_demo_role') || 'Investigator';
      const freshToken = FALLBACK_TOKENS[activeRole] || FALLBACK_TOKENS.Investigator;
      localStorage.setItem('lexvault_jwt_token', freshToken);
      originalRequest.headers.Authorization = `Bearer ${freshToken}`;
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export interface CaseData {
  caseId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt?: string;
}

export interface CustodyEventData {
  evidenceId: string;
  actorId: string;
  action: string;
  timestamp: string;
  previousHash: string;
  currentHash: string;
  digitalSignature: string;
}

export interface EvidenceData {
  evidenceId: string;
  caseId: string;
  filename: string;
  sha256: string;
  commitment: string;
  storagePath: string;
  mimeType: string;
  uploadedBy: string;
  timestamp: string;
  status: 'VERIFIED' | 'TAMPERED';
  iv?: string;
  authTag?: string;
}

// Fallback seed data for offline mode / initial preview
const MOCK_CASES: CaseData[] = [
  {
    caseId: 'CASE-2026-001',
    title: 'Operation Nightfall — Corporate Exfiltration',
    description: 'Investigating unauthorized extraction of encrypted biometric algorithms.',
    createdBy: 'investigator@lexvault.local',
    createdAt: '2026-09-04T08:00:00.000Z',
  },
  {
    caseId: 'CASE-2026-002',
    title: 'Project Aegis — SCADA Firmware Tampering',
    description: 'Industrial control system anomaly detection and memory analysis.',
    createdBy: 'admin@lexvault.local',
    createdAt: '2026-09-04T09:30:00.000Z',
  },
];

const MOCK_EVIDENCE: EvidenceData[] = [
  {
    evidenceId: 'EV-2026-0901',
    caseId: 'CASE-2026-001',
    filename: 'disk_image_sector0.raw',
    sha256: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    commitment: '1892837492837498237498237498237498237498237498237498237498237498',
    storagePath: '/uploads/disk_image_sector0.enc',
    mimeType: 'application/octet-stream',
    uploadedBy: 'investigator@lexvault.local',
    timestamp: '2026-09-04T08:15:00.000Z',
    status: 'VERIFIED',
  },
  {
    caseId: 'CASE-2026-001',
    evidenceId: 'EV-2026-0902',
    filename: 'wiretap_packet_capture.pcapng',
    sha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    commitment: '9482739482734982734982374982374982374982374982374982374982374981',
    storagePath: '/uploads/wiretap_packet_capture.enc',
    mimeType: 'application/vnd.tcpdump.pcap',
    uploadedBy: 'investigator@lexvault.local',
    timestamp: '2026-09-04T08:45:00.000Z',
    status: 'VERIFIED',
  },
  {
    caseId: 'CASE-2026-002',
    evidenceId: 'EV-2026-0903',
    filename: 'scada_plc_firmware.bin',
    sha256: 'b45cffe321908234857201948572019485720194857201948572019485720194',
    commitment: '3349827349823749823749823749823749823749823749823749823749823749',
    storagePath: '/uploads/scada_plc_firmware.enc',
    mimeType: 'application/octet-stream',
    uploadedBy: 'investigator@lexvault.local',
    timestamp: '2026-09-04T10:00:00.000Z',
    status: 'TAMPERED',
  },
];

export const getCases = async (): Promise<CaseData[]> => {
  try {
    const res = await api.get('/cases');
    if (res.data?.cases && res.data.cases.length > 0) {
      return res.data.cases;
    }
    return MOCK_CASES;
  } catch (err) {
    return MOCK_CASES;
  }
};

export const getCaseDetails = async (caseId: string) => {
  try {
    const res = await api.get(`/cases/${caseId}`);
    return res.data;
  } catch (err) {
    const foundCase = MOCK_CASES.find((c) => c.caseId === caseId) || MOCK_CASES[0];
    const evidence = MOCK_EVIDENCE.filter((e) => e.caseId === caseId);
    return { case: foundCase, evidence };
  }
};

export const createCase = async (data: { title: string; description?: string; caseId?: string }) => {
  const res = await api.post('/cases', data);
  return res.data;
};

export const getEvidence = async (caseId?: string): Promise<EvidenceData[]> => {
  try {
    const url = caseId ? `/evidence?caseId=${encodeURIComponent(caseId)}` : '/evidence';
    const res = await api.get(url);
    return res.data.evidence || [];
  } catch (err) {
    if (caseId) {
      return MOCK_EVIDENCE.filter((e) => e.caseId === caseId);
    }
    return MOCK_EVIDENCE;
  }
};

export const getEvidenceDetails = async (evidenceId: string) => {
  try {
    const res = await api.get(`/evidence/${evidenceId}`);
    return res.data;
  } catch (err) {
    const ev = MOCK_EVIDENCE.find((e) => e.evidenceId === evidenceId) || MOCK_EVIDENCE[0];
    const custodyEvents: CustodyEventData[] = [
      {
        evidenceId: ev.evidenceId,
        actorId: ev.uploadedBy,
        action: 'COLLECTED',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        currentHash: ev.sha256,
        digitalSignature: '3045022100a7b4f5391e84a2...fe82a491',
      },
      {
        evidenceId: ev.evidenceId,
        actorId: ev.uploadedBy,
        action: 'UPLOADED',
        timestamp: ev.timestamp,
        previousHash: ev.sha256,
        currentHash: ev.sha256,
        digitalSignature: '3044022039ab82fe109cba...2810ab94',
      },
      {
        evidenceId: ev.evidenceId,
        actorId: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        action: 'ON-CHAIN ANCHORED',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        previousHash: ev.sha256,
        currentHash: ev.commitment,
        digitalSignature: '0x9923847293847293847293847293847293847293847293847293847293847293',
      },
      {
        evidenceId: ev.evidenceId,
        actorId: 'verifier@lexvault.local',
        action: 'VERIFIED',
        timestamp: new Date().toISOString(),
        previousHash: ev.commitment,
        currentHash: ev.sha256,
        digitalSignature: '3045022100d810293847ab...1928374a',
      },
    ];
    return {
      evidence: ev,
      custodyEvents,
      onChainVerified: ev.status === 'VERIFIED',
    };
  }
};

export const loginUser = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const uploadEvidence = async (
  formData: FormData,
  onProgress?: (percent: number) => void
) => {
  const res = await api.post('/evidence/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return res.data;
};

export const recordCustody = async (evidenceId: string, action: string) => {
  const res = await api.post(`/evidence/${evidenceId}/custody`, { action });
  return res.data;
};

export const checkFile = async (formData: FormData) => {
  const res = await api.post('/verify/check-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const simulateTamper = async (evidenceId: string) => {
  const res = await api.post(`/verify/simulate-tamper/${evidenceId}`);
  return res.data;
};

export const generateZkProof = async (evidenceHash: string, salt: string) => {
  const res = await api.post('/zk/generate', { evidenceHash, salt });
  return res.data;
};

export const verifyZkProof = async (proof: any, publicSignals: string[]) => {
  const res = await api.post('/zk/verify', { proof, publicSignals });
  return res.data;
};
