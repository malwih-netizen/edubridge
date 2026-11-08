// خدمات البيانات لكل الوحدات. كل دالة تستدعي الـ API الحقيقي إذا ضُبط VITE_API_URL،
// وإلا تُرجع بيانات تجريبية. أسماء المسارات مطابقة لوثيقة عقد الـ API.
import api, { isLive, mockDelay } from './api';
import * as mock from './mockData';
import { readiness, recommend } from './matching';

const get = (url, fallback, params) => (isLive('GET', url) ? api.get(url, { params }) : mockDelay(fallback));
const post = (url, body, fallback) => (isLive('POST', url) ? api.post(url, body) : mockDelay(fallback ?? body));
const put = (url, body, fallback) => (isLive('PUT', url) ? api.put(url, body) : mockDelay(fallback ?? body));
const del = (url, fallback) => (isLive('DELETE', url) ? api.delete(url) : mockDelay(fallback ?? { ok: true }));
const USE_MOCK_UPLOAD = !isLive('POST', '/students/me/documents');

export const studentService = {
  profile: () => get('/students/me', mock.studentProfile),
  updateProfile: (data) => put('/students/me', data),
  documents: () => get('/students/me/documents', mock.documents),
  uploadDocument(type, file) {
    if (USE_MOCK_UPLOAD) return mockDelay({ id: Date.now(), type, file: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, status: 'underReview', uploadedAt: new Date().toISOString().slice(0, 10) }, 700);
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file);
    return api.post('/students/me/documents', fd);
  },
  deleteDocument: (id) => del(`/students/me/documents/${id}`),
  /** Opens the stored file in a new tab (the API needs the token, so it is fetched as a blob). Returns false in demo mode. */
  async openDocument(id) {
    const url = `/students/me/documents/${id}/file`;
    if (!isLive('GET', url)) return false;
    const blob = await api.get(url, { responseType: 'blob' });
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
    return true;
  },
  linkDocuments: (applicationId, documentIds) => put(`/students/me/applications/${applicationId}/documents`, { documentIds }, { id: applicationId, documentIds }),
  readiness: () => (isLive('GET', '/students/me/readiness') ? api.get('/students/me/readiness') : mockDelay(readiness(mock.documents))),
  recommendations: () => (isLive('GET', '/students/me/recommendations') ? api.get('/students/me/recommendations') : mockDelay(recommend(mock.studentProfile, mock.scholarships))),
  applications: () => get('/students/me/applications', mock.applications.map((a) => ({ ...a, scholarship: mock.scholarships.find((s) => s.id === a.scholarshipId) }))),
  serviceRequests: () => get('/students/me/service-requests', mock.serviceRequests),
  requestService: (data) => post('/service-requests', data, { id: `SR-${Math.floor(Math.random() * 900 + 100)}`, status: 'newRequest', ...data }),
};

export const scholarshipService = {
  list: (filters) => get('/scholarships', mock.scholarships, filters),
  get: (id) => get(`/scholarships/${id}`, mock.scholarships.find((s) => String(s.id) === String(id))),
  create: (data) => post('/scholarships', data, { id: Date.now(), ...data }),
  update: (id, data) => put(`/scholarships/${id}`, data),
  updateResults: (id, results) => put(`/scholarships/${id}/results`, { results }),
};

export const crmService = {
  students: (filters) => get('/crm/students', mock.students, filters),
  student: (id) => get(`/crm/students/${id}`, { ...(mock.students.find((s) => String(s.id) === String(id)) || mock.students[0]), profile: mock.studentProfile, documents: mock.documents }),
  addNote: (studentId, text) => post(`/crm/students/${studentId}/notes`, { text }, { id: Date.now(), text, createdAt: new Date().toISOString() }),
  updateStage: (applicationId, stage) => put(`/applications/${applicationId}/stage`, { stage }),
  requests: () => get('/service-requests', mock.serviceRequests),
};

export const adminService = {
  stats: () => get('/reports/overview', mock.adminStats),
  users: (filters) => get('/admin/users', mock.users, filters),
  createUser: (data) => post('/admin/users', data, { id: Date.now(), status: 'invited', ...data }),
  updateUser: (id, data) => put(`/admin/users/${id}`, data),
};

export const contactService = {
  send: (data) => post('/contact', data, { id: Date.now(), received: true }),
};

// إعدادات الحساب: الملف، البريد، كلمة المرور، الأجهزة، الإشعارات
const SESSIONS = [
  { id: 's1', type: 'laptop', browser: 'Chrome', os: 'Windows 11', city: 'Khan Younis', cityAr: 'خانيونس', current: true, lastActive: new Date().toISOString() },
  { id: 's2', type: 'phone', browser: 'Safari', os: 'iPhone · iOS 18', city: 'Gaza', cityAr: 'غزة', lastActive: new Date(Date.now() - 3 * 3600e3).toISOString() },
  { id: 's3', type: 'tablet', browser: 'Chrome', os: 'Android tablet', city: 'Khan Younis', cityAr: 'خانيونس', lastActive: new Date(Date.now() - 4 * 86400e3).toISOString() },
];

export const settingsService = {
  sessions: () => get('/account/sessions', SESSIONS),
  revokeSession: (id) => (isLive('DELETE', `/account/sessions/${id}`) ? api.delete(`/account/sessions/${id}`) : mockDelay({ ok: true })),
  revokeOthers: () => post('/account/sessions/revoke-others', {}, { ok: true }),
  updateProfile: (data) => put('/account/profile', data),
  changeEmail: (email, password) => post('/account/email', { email, password }, { pending: true, email }),
  changePassword: (current, next) => post('/account/password', { current, next }, { ok: true }),
  updateSecurity: (data) => put('/account/security', data),
  updateNotifications: (data) => put('/account/notifications', data),
};
