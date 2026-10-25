import {
  Award, BarChart3, Bell, Briefcase, ClipboardList, FileCheck2, FolderOpen, GraduationCap,
  LayoutDashboard, Search, Settings, ShieldCheck, Trophy, User, Users,
} from 'lucide-react';

// القائمة الجانبية لكل دور. label = مفتاح ترجمة في common.json
export const NAV = {
  student: [
    { group: 'nav.main' },
    { to: '/student', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/profile', label: 'nav.profile', icon: User },
    { to: '/student/documents', label: 'nav.documents', icon: FolderOpen },
    { to: '/student/scholarships', label: 'nav.scholarships', icon: Search },
    { to: '/student/services', label: 'nav.services', icon: Briefcase },
    { to: '/student/applications', label: 'nav.applications', icon: FileCheck2, count: 2 },
    { group: 'nav.account' },
    { to: '/student/notifications', label: 'nav.notifications', icon: Bell },
    { to: '/student/settings', label: 'nav.settings', icon: Settings },
  ],
  employee: [
    { group: 'nav.main' },
    { to: '/employee', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/employee/students', label: 'nav.students', icon: Users },
    { to: '/employee/requests', label: 'nav.requests', icon: ClipboardList, count: 7 },
    { to: '/employee/scholarships', label: 'nav.manageScholarships', icon: Award },
    { to: '/employee/admissions', label: 'nav.admissions', icon: Trophy },
    { group: 'nav.account' },
    { to: '/employee/settings', label: 'nav.settings', icon: Settings },
  ],
  admin: [
    { group: 'nav.main' },
    { to: '/admin', label: 'nav.overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'nav.users', icon: ShieldCheck },
    { to: '/admin/students', label: 'nav.students', icon: GraduationCap },
    { to: '/admin/scholarships', label: 'nav.manageScholarships', icon: Award },
    { to: '/admin/reports', label: 'nav.reports', icon: BarChart3 },
    { group: 'nav.account' },
    { to: '/admin/settings', label: 'nav.system', icon: Settings },
  ],
};
