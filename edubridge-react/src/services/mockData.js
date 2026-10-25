// بيانات تجريبية تحاكي ردود الـ API إلى أن تجهز الواجهة الخلفية (PHP + SQL Server).
// الحقول التي تنتهي بـ Ar هي النسخة العربية من النص.

export const demoUsers = [
  { id: 1, role: 'student', email: 'student@edubridge.app', name: 'Sarah Ahmed', nameAr: 'سارة أحمد' },
  { id: 2, role: 'employee', email: 'advisor@edubridge.app', name: 'Maya Khalil', nameAr: 'مايا خليل', title: 'Senior Advisor', titleAr: 'مستشارة أولى' },
  { id: 3, role: 'admin', email: 'admin@edubridge.app', name: 'Admin User', nameAr: 'مسؤول النظام' },
];

export const studentProfile = {
  id: 101,
  firstName: 'Sarah', lastName: 'Ahmed', firstNameAr: 'سارة', lastNameAr: 'أحمد',
  email: 'sarah.ahmed@example.com', phone: '+970 59 123 4567',
  nationality: 'palestine', country: 'palestine', gender: 'female', birthDate: '2002-04-18',
  level: 'master', field: 'computerScience', gpa: 3.7, gpaScale: 4,
  university: 'University College of Science and Technology', universityAr: 'الكلية الجامعية للعلوم والتكنولوجيا',
  graduationYear: 2024,
  language: { test: 'IELTS', score: 6.5 },
  preferredCountries: ['canada', 'germany'],
  funding: 'full',
  intake: 'Fall 2027',
};

// المستندات المطلوبة لملف الطالب (لحساب مؤشر الجاهزية)
export const documents = [
  { id: 1, type: 'passport', file: 'Passport_Sarah.pdf', size: '1.2 MB', status: 'approved', uploadedAt: '2026-09-02' },
  { id: 2, type: 'transcript', file: 'Academic_Transcript.pdf', size: '850 KB', status: 'approved', uploadedAt: '2026-09-03' },
  { id: 3, type: 'degree', file: 'Bachelor_Certificate.pdf', size: '640 KB', status: 'underReview', uploadedAt: '2026-10-11' },
  { id: 4, type: 'motivation', file: 'Statement_of_Purpose.docx', size: '96 KB', status: 'approved', uploadedAt: '2026-10-01' },
  { id: 5, type: 'recommendation', file: 'Recommendation_Letter.pdf', size: '310 KB', status: 'underReview', uploadedAt: '2026-10-20' },
  { id: 6, type: 'cv', file: null, status: 'missing' },
  { id: 7, type: 'language', file: null, status: 'missing' },
];

export const scholarships = [
  {
    id: 1, name: 'Global Excellence Scholarship', nameAr: 'منحة التميّز العالمية',
    university: 'University of Toronto', universityAr: 'جامعة تورنتو', country: 'canada',
    levels: ['master', 'phd'], fields: ['computerScience', 'engineering', 'business'],
    minGpa: 3.3, language: { test: 'IELTS', score: 7.0 }, nationalities: ['all'], funding: 'full',
    opens: '2026-08-01', deadline: '2026-11-15', status: 'open', amount: 'CAD 42,000 / yr',
    tags: ['highImpact'], results: 'notStarted',
    description: 'A fully funded award for outstanding international graduate students with leadership potential.',
    descriptionAr: 'منحة ممولة بالكامل لطلاب الدراسات العليا الدوليين المتميزين ممن لديهم إمكانات قيادية.',
  },
  {
    id: 2, name: 'DAAD Graduate Scholarship', nameAr: 'منحة DAAD للدراسات العليا',
    university: 'Technical University of Munich', universityAr: 'الجامعة التقنية في ميونخ', country: 'germany',
    levels: ['master', 'phd'], fields: ['engineering', 'computerScience', 'science'],
    minGpa: 3.0, language: { test: 'IELTS', score: 6.5 }, nationalities: ['all'], funding: 'full',
    opens: '2026-07-15', deadline: '2026-12-01', status: 'open', amount: 'EUR 992 / month',
    tags: ['research'], results: 'notStarted',
    description: 'Monthly stipend, travel allowance and health insurance for development-related master programmes.',
    descriptionAr: 'راتب شهري وبدل سفر وتأمين صحي لبرامج الماجستير المرتبطة بالتنمية.',
  },
  {
    id: 3, name: 'Commonwealth Master’s Scholarship', nameAr: 'منحة الكومنولث للماجستير',
    university: 'University of Manchester', universityAr: 'جامعة مانشستر', country: 'uk',
    levels: ['master'], fields: ['business', 'publicHealth', 'computerScience'],
    minGpa: 3.4, language: { test: 'IELTS', score: 7.0 }, nationalities: ['all'], funding: 'full',
    opens: '2026-09-01', deadline: '2026-12-18', status: 'open', amount: 'Full tuition + stipend',
    tags: ['leadership'], results: 'notStarted',
    description: 'For talented students committed to making a positive impact in their home countries.',
    descriptionAr: 'للطلاب الموهوبين الملتزمين بإحداث أثر إيجابي في بلدانهم.',
  },
  {
    id: 4, name: 'Türkiye Burslari', nameAr: 'المنح التركية (Türkiye Burslari)',
    university: 'Istanbul Technical University', universityAr: 'جامعة إسطنبول التقنية', country: 'turkey',
    levels: ['bachelor', 'master', 'phd'], fields: ['engineering', 'computerScience', 'business', 'science'],
    minGpa: 2.8, language: { test: 'IELTS', score: 6.0 }, nationalities: ['all'], funding: 'full',
    opens: '2027-01-10', deadline: '2027-02-20', status: 'upcoming', amount: 'Tuition + monthly stipend',
    tags: [], results: 'notStarted',
    description: 'Government scholarship covering tuition, accommodation, health insurance and a Turkish language year.',
    descriptionAr: 'منحة حكومية تشمل الرسوم والسكن والتأمين الصحي وسنة لتعلّم اللغة التركية.',
  },
  {
    id: 5, name: 'Erasmus Mundus Joint Master', nameAr: 'منحة إيراسموس موندوس للماجستير المشترك',
    university: 'EU Consortium', universityAr: 'اتحاد جامعات أوروبي', country: 'netherlands',
    levels: ['master'], fields: ['computerScience', 'science', 'engineering'],
    minGpa: 3.5, language: { test: 'IELTS', score: 7.0 }, nationalities: ['all'], funding: 'full',
    opens: '2026-10-01', deadline: '2027-01-15', status: 'open', amount: 'EUR 1,400 / month',
    tags: ['mobility'], results: 'notStarted',
    description: 'Study in at least two European countries with a full scholarship.',
    descriptionAr: 'ادرس في دولتين أوروبيتين على الأقل بمنحة كاملة.',
  },
  {
    id: 6, name: 'Malaysia International Scholarship', nameAr: 'منحة ماليزيا الدولية',
    university: 'University of Malaya', universityAr: 'جامعة مالايا', country: 'malaysia',
    levels: ['master', 'phd'], fields: ['engineering', 'science', 'business'],
    minGpa: 3.0, language: { test: 'IELTS', score: 6.0 }, nationalities: ['all'], funding: 'partial',
    opens: '2026-06-01', deadline: '2026-10-10', status: 'closed', amount: 'Partial tuition',
    tags: [], results: 'partial',
    description: 'Partial funding for high-achieving postgraduate applicants.',
    descriptionAr: 'تمويل جزئي لمتقدمي الدراسات العليا ذوي التحصيل المرتفع.',
  },
];

export const applications = [
  { id: 'APP-2041', scholarshipId: 1, stage: 2, updatedAt: '2026-10-22', advisor: 'Maya Khalil', advisorAr: 'مايا خليل' },
  { id: 'APP-2055', scholarshipId: 2, stage: 1, updatedAt: '2026-10-19', advisor: 'Maya Khalil', advisorAr: 'مايا خليل' },
  { id: 'APP-1988', scholarshipId: 6, stage: 7, result: 'rejected', updatedAt: '2026-09-30', advisor: 'Omar Farouk', advisorAr: 'عمر فاروق' },
];

// مراحل الطلب الثمانية حسب المقترح
export const STAGES = ['newRequest', 'contacted', 'preparingDocuments', 'waitingStudent', 'readyToApply', 'submitted', 'waitingResult', 'acceptedRejected'];

export const services = [
  { id: 'scholarshipSearch', icon: 'Search' },
  { id: 'filePreparation', icon: 'FolderCheck' },
  { id: 'cv', icon: 'FileUser' },
  { id: 'motivationLetter', icon: 'PenLine' },
  { id: 'translation', icon: 'Languages' },
  { id: 'applicationAssistance', icon: 'Send' },
  { id: 'followUp', icon: 'CalendarClock' },
];

export const serviceRequests = [
  { id: 'SR-310', service: 'cv', status: 'inProgress', createdAt: '2026-10-18', student: 'Sarah Ahmed', studentAr: 'سارة أحمد', assignee: 'Maya Khalil', assigneeAr: 'مايا خليل' },
  { id: 'SR-305', service: 'translation', status: 'completed', createdAt: '2026-10-02', student: 'Sarah Ahmed', studentAr: 'سارة أحمد', assignee: 'Omar Farouk', assigneeAr: 'عمر فاروق' },
];

export const students = [
  { id: 101, name: 'Sarah Ahmed', nameAr: 'سارة أحمد', email: 'sarah.ahmed@example.com', country: 'palestine', level: 'master', field: 'computerScience', gpa: 3.7, readiness: 65, stage: 2, lastContact: '2026-10-22', priority: 'high' },
  { id: 102, name: 'Yousef Karimi', nameAr: 'يوسف كريمي', email: 'yousef.k@example.com', country: 'jordan', level: 'phd', field: 'engineering', gpa: 3.9, readiness: 92, stage: 5, lastContact: '2026-10-24', priority: 'medium' },
  { id: 103, name: 'Noor Hassan', nameAr: 'نور حسن', email: 'noor.h@example.com', country: 'egypt', level: 'master', field: 'business', gpa: 3.4, readiness: 54, stage: 3, lastContact: '2026-10-15', priority: 'high' },
  { id: 104, name: 'Omar Saleh', nameAr: 'عمر صالح', email: 'omar.s@example.com', country: 'palestine', level: 'bachelor', field: 'science', gpa: 3.1, readiness: 38, stage: 0, lastContact: '2026-10-25', priority: 'low' },
  { id: 105, name: 'Layla Saeed', nameAr: 'ليلى سعيد', email: 'layla.s@example.com', country: 'saudi', level: 'master', field: 'publicHealth', gpa: 3.6, readiness: 83, stage: 6, lastContact: '2026-10-20', priority: 'medium' },
  { id: 106, name: 'Hadi Tamimi', nameAr: 'هادي التميمي', email: 'hadi.t@example.com', country: 'uae', level: 'master', field: 'computerScience', gpa: 3.8, readiness: 100, stage: 7, result: 'accepted', lastContact: '2026-10-12', priority: 'low' },
];

export const users = [
  { id: 1, name: 'Sara Al Mansoori', nameAr: 'سارة المنصوري', email: 'sara.almansoori@edubridge.app', role: 'employee', department: 'studentServices', status: 'active', lastActive: '2026-10-25T09:12:00' },
  { id: 2, name: 'Yousef Karimi', nameAr: 'يوسف كريمي', email: 'yousef.karimi@edubridge.app', role: 'employee', department: 'admissions', status: 'active', lastActive: '2026-10-25T07:40:00' },
  { id: 3, name: 'Noor Hassan', nameAr: 'نور حسن', email: 'noor.hassan@edubridge.app', role: 'employee', department: 'visa', status: 'active', lastActive: '2026-10-24T16:05:00' },
  { id: 4, name: 'Omar Farouk', nameAr: 'عمر فاروق', email: 'omar.farouk@edubridge.app', role: 'employee', department: 'scholarships', status: 'pending', lastActive: '2026-10-23T11:30:00' },
  { id: 5, name: 'Layla Saeed', nameAr: 'ليلى سعيد', email: 'layla.saeed@edubridge.app', role: 'admin', department: 'compliance', status: 'active', lastActive: '2026-10-22T13:00:00' },
  { id: 6, name: 'Sarah Ahmed', nameAr: 'سارة أحمد', email: 'sarah.ahmed@example.com', role: 'student', department: null, status: 'active', lastActive: '2026-10-25T10:02:00' },
  { id: 7, name: 'Kareem Abbas', nameAr: 'كريم عباس', email: 'kareem.a@example.com', role: 'student', department: null, status: 'suspended', lastActive: '2026-08-11T10:02:00' },
];

export const adminStats = {
  totals: { students: 1284, requests: 342, applications: 517, acceptance: 38 },
  monthly: [
    { month: 'May', monthAr: 'مايو', students: 64, applications: 31 },
    { month: 'Jun', monthAr: 'يونيو', students: 78, applications: 42 },
    { month: 'Jul', monthAr: 'يوليو', students: 92, applications: 55 },
    { month: 'Aug', monthAr: 'أغسطس', students: 120, applications: 71 },
    { month: 'Sep', monthAr: 'سبتمبر', students: 141, applications: 88 },
    { month: 'Oct', monthAr: 'أكتوبر', students: 156, applications: 97 },
  ],
  countries: [
    { key: 'germany', value: 31 }, { key: 'canada', value: 24 }, { key: 'uk', value: 19 }, { key: 'turkey', value: 15 }, { key: 'malaysia', value: 11 },
  ],
  services: [
    { key: 'scholarshipSearch', value: 120 }, { key: 'cv', value: 86 }, { key: 'motivationLetter', value: 71 }, { key: 'translation', value: 44 }, { key: 'applicationAssistance', value: 21 },
  ],
  statuses: [
    { key: 'newRequest', value: 42 }, { key: 'preparingDocuments', value: 96 }, { key: 'submitted', value: 133 }, { key: 'waitingResult', value: 151 }, { key: 'accepted', value: 61 }, { key: 'rejected', value: 34 },
  ],
  workload: [
    { name: 'Maya Khalil', nameAr: 'مايا خليل', active: 38, done: 112 },
    { name: 'Omar Farouk', nameAr: 'عمر فاروق', active: 31, done: 96 },
    { name: 'Noor Hassan', nameAr: 'نور حسن', active: 24, done: 71 },
    { name: 'Yousef Karimi', nameAr: 'يوسف كريمي', active: 19, done: 64 },
  ],
};
