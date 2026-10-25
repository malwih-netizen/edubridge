import axios from 'axios';

// عنوان الـ PHP API (من ملف .env): VITE_API_URL=http://localhost/edubridge-api/public/api
// إذا لم يُضبط، تعمل الخدمات على البيانات التجريبية في src/services/mockData.js
export const API_URL = import.meta.env.VITE_API_URL || '';
export const USE_MOCK = !API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// إرفاق التوكن ولغة الواجهة مع كل طلب
api.interceptors.request.use((config) => {
  try {
    const s = JSON.parse(localStorage.getItem('edu-session'));
    if (s?.token) config.headers.Authorization = `Bearer ${s.token}`;
    config.headers['Accept-Language'] = localStorage.getItem('edu-lang') || 'en';
  } catch { /* ignore */ }
  return config;
});

// انتهاء الجلسة → العودة لتسجيل الدخول
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      try { localStorage.removeItem('edu-session'); } catch { /* ignore */ }
      const login = `${import.meta.env.BASE_URL}login`; // BASE_URL is '/' or '/edubridge/' (GitHub Pages)
      if (!window.location.pathname.startsWith(login)) window.location.assign(login);
    }
    return Promise.reject(err.response?.data || err);
  },
);

// المسارات الجاهزة في الـ PHP API. أي مسار غير موجود هنا يبقى على البيانات التجريبية
// حتى يُبنى في الـ Backend (مثل لوحات الموظف والمسؤول)، فلا تتعطل أي صفحة أثناء العمل.
const LIVE_ROUTES = [
  /^(GET|POST|PUT) \/auth\//,
  /^GET \/scholarships(\/\d+)?$/,
  /^(POST|PUT) \/scholarships(\/\d+)?(\/results)?$/,
  /^(GET|PUT|POST) \/students\/me(\/.*)?$/,
  /^POST \/service-requests$/,
  /^(GET|POST|PUT|DELETE) \/account\//,
  /^POST \/contact$/,
];
export const isLive = (method, url) => !USE_MOCK && LIVE_ROUTES.some((re) => re.test(`${method} ${url}`));

/** Simulated network delay for mock responses. */
export const mockDelay = (data, ms = 350) => new Promise((r) => setTimeout(() => r(structuredClone(data)), ms));

export default api;
