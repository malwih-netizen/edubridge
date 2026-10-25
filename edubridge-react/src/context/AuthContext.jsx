import { createContext, useContext, useMemo, useState } from 'react';
import { authService } from '@/services/authService';
import { demoUsers } from '@/services/mockData';

const AuthContext = createContext(null);
const KEY = 'edu-session';

function readSession() {
  // وضع التطوير فقط: ?demo=student|employee|admin يفتح البوابة مباشرة (للمعاينة والاختبار)
  if (import.meta.env.DEV) {
    const role = new URLSearchParams(window.location.search).get('demo');
    const user = demoUsers.find((u) => u.role === role);
    if (user) {
      const s = { token: `demo-${role}`, user };
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
      return s;
    }
  }
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: !!session?.token,
    async login(credentials) {
      const s = await authService.login(credentials);
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
      setSession(s);
      return s.user;
    },
    async register(data) {
      const s = await authService.register(data);
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
      setSession(s);
      return s.user;
    },
    logout() {
      authService.logout();
      try { localStorage.removeItem(KEY); } catch { /* ignore */ }
      setSession(null);
    },
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Home route for each role after sign-in. */
export const homeFor = (role) => ({ student: '/student', employee: '/employee', admin: '/admin' }[role] || '/');
