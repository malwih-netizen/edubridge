import api, { USE_MOCK, mockDelay } from './api';
import { demoUsers } from './mockData';

// حسابات العرض: student@edubridge.app / advisor@edubridge.app / admin@edubridge.app (أي كلمة مرور 6 أحرف+)
export const authService = {
  async login({ email, password }) {
    if (!USE_MOCK) return api.post('/auth/login', { email, password });
    const user = demoUsers.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user || String(password).length < 6) {
      await mockDelay(null, 450);
      throw { code: 'invalid_credentials' };
    }
    return mockDelay({ token: `demo-${user.role}-${Date.now()}`, user }, 600);
  },
  async logout() {
    if (!USE_MOCK) { try { await api.post('/auth/logout'); } catch { /* token already invalid */ } }
  },
  async register(data) {
    if (!USE_MOCK) return api.post('/auth/register', data);
    const user = { id: Date.now(), role: 'student', email: data.email, name: `${data.firstName} ${data.lastName}`, nameAr: `${data.firstName} ${data.lastName}` };
    return mockDelay({ token: `demo-student-${Date.now()}`, user }, 700);
  },
  // يرسل الـ Backend رسالة تأكيد على البريد بعد التسجيل؛ هذه لإعادة الإرسال
  async resendConfirmation(email) {
    if (!USE_MOCK) return api.post('/auth/resend-confirmation', { email });
    return mockDelay({ sent: true });
  },
  async forgotPassword(email) {
    if (!USE_MOCK) return api.post('/auth/forgot-password', { email });
    return mockDelay({ sent: true });
  },
  async verifyCode(email, code) {
    if (!USE_MOCK) return api.post('/auth/verify-code', { email, code });
    if (code.length !== 6) throw { code: 'invalid_code' };
    return mockDelay({ resetToken: 'demo-reset' });
  },
  async resetPassword(resetToken, password) {
    if (!USE_MOCK) return api.post('/auth/reset-password', { resetToken, password });
    return mockDelay({ ok: true });
  },
};
