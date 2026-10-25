import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PageLoader from '@/components/layout/PageLoader';
import PortalLayout from '@/components/layout/PortalLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';

// تحميل كل صفحة عند الحاجة فقط (Code splitting)
const Home = lazy(() => import('@/pages/public/Home'));
const PublicScholarships = lazy(() => import('@/pages/public/Scholarships'));
const ScholarshipPreview = lazy(() => import('@/pages/public/ScholarshipPreview'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Settings = lazy(() => import('@/pages/shared/Settings'));
const Notifications = lazy(() => import('@/pages/shared/Notifications'));

const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const StudentProfile = lazy(() => import('@/pages/student/Profile'));
const StudentDocuments = lazy(() => import('@/pages/student/Documents'));
const StudentScholarships = lazy(() => import('@/pages/student/Scholarships'));
const ScholarshipDetails = lazy(() => import('@/pages/student/ScholarshipDetails'));
const StudentServices = lazy(() => import('@/pages/student/Services'));
const StudentApplications = lazy(() => import('@/pages/student/Applications'));

const EmployeeDashboard = lazy(() => import('@/pages/employee/Dashboard'));
const EmployeeStudents = lazy(() => import('@/pages/employee/Students'));
const EmployeeStudentDetail = lazy(() => import('@/pages/employee/StudentDetail'));
const EmployeeRequests = lazy(() => import('@/pages/employee/Requests'));
const EmployeeScholarships = lazy(() => import('@/pages/employee/Scholarships'));
const EmployeeAdmissions = lazy(() => import('@/pages/employee/Admissions'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));
const AdminReports = lazy(() => import('@/pages/admin/Reports'));


export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scholarships" element={<PublicScholarships />} />
        <Route path="/scholarships/:id" element={<ScholarshipPreview />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/student" element={<ProtectedRoute role="student"><PortalLayout role="student" /></ProtectedRoute>}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="documents" element={<StudentDocuments />} />
          <Route path="scholarships" element={<StudentScholarships />} />
          <Route path="scholarships/:id" element={<ScholarshipDetails />} />
          <Route path="services" element={<StudentServices />} />
          <Route path="applications" element={<StudentApplications />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/employee" element={<ProtectedRoute role="employee"><PortalLayout role="employee" /></ProtectedRoute>}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="students" element={<EmployeeStudents />} />
          <Route path="students/:id" element={<EmployeeStudentDetail />} />
          <Route path="requests" element={<EmployeeRequests />} />
          <Route path="scholarships" element={<EmployeeScholarships />} />
          <Route path="admissions" element={<EmployeeAdmissions />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute role="admin"><PortalLayout role="admin" /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="students" element={<EmployeeStudents />} />
          <Route path="students/:id" element={<EmployeeStudentDetail />} />
          <Route path="scholarships" element={<EmployeeScholarships />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
