// بيانات تجريبية إضافية خاصة بواجهة الموظف (CRM) لا توفّرها dataService بعد:
// الملاحظات، سجل التواصل، المهام، سجل الخدمات، توزيع الطلاب على المستشارين، ونتائج القبول.
// عند ربط الـ API تُستبدل هذه المصفوفات باستدعاءات crmService المقابلة.
import { REQUIRED_DOCS } from '@/services/matching';

export const CURRENT_ADVISOR = 'Maya Khalil';

export const ADVISORS = [
  { name: 'Maya Khalil', nameAr: 'مايا خليل' },
  { name: 'Omar Farouk', nameAr: 'عمر فاروق' },
  { name: 'Noor Hassan', nameAr: 'نور حسن' },
  { name: 'Yousef Karimi', nameAr: 'يوسف كريمي' },
  { name: 'Sara Al Mansoori', nameAr: 'سارة المنصوري' },
];

export const advisorAr = (name) => ADVISORS.find((a) => a.name === name)?.nameAr || name;

export const ASSIGNMENTS = { 101: 'Maya Khalil', 102: 'Maya Khalil', 103: 'Omar Farouk', 104: 'Maya Khalil', 105: 'Noor Hassan', 106: 'Maya Khalil' };

export const PHONES = { 101: '+970 59 123 4567', 102: '+962 79 555 0142', 103: '+20 100 448 9921', 104: '+970 56 210 3380', 105: '+966 55 019 2231', 106: '+971 50 774 1209' };

export const PREFERRED = { 101: ['canada', 'germany', 'uk'], 102: ['germany', 'netherlands'], 103: ['uk', 'canada'], 104: ['turkey', 'malaysia'], 105: ['uk', 'netherlands'], 106: ['canada', 'germany'] };

export const REQUEST_STATUSES = ['newRequest', 'inProgress', 'waitingStudent', 'completed'];

export const extraRequests = [
  { id: 'SR-318', service: 'scholarshipSearch', status: 'newRequest', createdAt: '2026-10-25', studentId: 104, student: 'Omar Saleh', studentAr: 'عمر صالح', assignee: '', priority: 'medium' },
  { id: 'SR-317', service: 'motivationLetter', status: 'newRequest', createdAt: '2026-10-24', studentId: 103, student: 'Noor Hassan', studentAr: 'نور حسن', assignee: '', priority: 'high' },
  { id: 'SR-315', service: 'filePreparation', status: 'inProgress', createdAt: '2026-10-21', studentId: 102, student: 'Yousef Karimi', studentAr: 'يوسف كريمي', assignee: 'Maya Khalil', assigneeAr: 'مايا خليل', priority: 'high' },
  { id: 'SR-313', service: 'applicationAssistance', status: 'waitingStudent', createdAt: '2026-10-19', studentId: 105, student: 'Layla Saeed', studentAr: 'ليلى سعيد', assignee: 'Noor Hassan', assigneeAr: 'نور حسن', priority: 'medium' },
  { id: 'SR-311', service: 'translation', status: 'waitingStudent', createdAt: '2026-10-18', studentId: 103, student: 'Noor Hassan', studentAr: 'نور حسن', assignee: 'Omar Farouk', assigneeAr: 'عمر فاروق', priority: 'low' },
  { id: 'SR-308', service: 'followUp', status: 'completed', createdAt: '2026-10-09', studentId: 106, student: 'Hadi Tamimi', studentAr: 'هادي التميمي', assignee: 'Maya Khalil', assigneeAr: 'مايا خليل', priority: 'low' },
];

const NAME_TO_ID = { 'Sarah Ahmed': 101 };
/** Normalises a service request so every row has studentId and priority. */
export const normalizeRequest = (r) => ({ priority: 'medium', studentId: NAME_TO_ID[r.student], ...r });

export const tasks = [
  { id: 1, type: 'call', time: '09:30', studentId: 103, student: 'Noor Hassan', studentAr: 'نور حسن', text: 'Follow up on missing language certificate', textAr: 'متابعة شهادة اللغة الناقصة' },
  { id: 2, type: 'review', time: '11:00', studentId: 101, student: 'Sarah Ahmed', studentAr: 'سارة أحمد', text: 'Review degree certificate and recommendation letter', textAr: 'مراجعة شهادة التخرج وخطاب التوصية' },
  { id: 3, type: 'whatsapp', time: '13:15', studentId: 105, student: 'Layla Saeed', studentAr: 'ليلى سعيد', text: 'Confirm interview slot with Manchester', textAr: 'تأكيد موعد المقابلة مع جامعة مانشستر' },
  { id: 4, type: 'email', time: '15:00', studentId: 102, student: 'Yousef Karimi', studentAr: 'يوسف كريمي', text: 'Send DAAD submission checklist', textAr: 'إرسال قائمة متطلبات التقديم لمنحة DAAD' },
  { id: 5, type: 'deadline', time: '17:00', studentId: 104, student: 'Omar Saleh', studentAr: 'عمر صالح', text: 'Schedule first advising session', textAr: 'تحديد موعد أول جلسة إرشاد', done: true },
];

export const activity = [
  { id: 1, type: 'document', studentId: 101, student: 'Sarah Ahmed', studentAr: 'سارة أحمد', at: '2026-10-25T09:42:00', text: 'Uploaded a recommendation letter', textAr: 'رفعت خطاب توصية' },
  { id: 2, type: 'call', studentId: 104, student: 'Omar Saleh', studentAr: 'عمر صالح', at: '2026-10-25T08:15:00', text: 'First contact call completed', textAr: 'تمت مكالمة التواصل الأولى' },
  { id: 3, type: 'application', studentId: 102, student: 'Yousef Karimi', studentAr: 'يوسف كريمي', at: '2026-10-24T16:20:00', text: 'Marked ready to apply for DAAD', textAr: 'أصبح جاهزاً للتقديم على منحة DAAD' },
  { id: 4, type: 'service', studentId: 103, student: 'Noor Hassan', studentAr: 'نور حسن', at: '2026-10-24T11:05:00', text: 'Requested motivation letter support', textAr: 'طلبت المساعدة في خطاب الدافع' },
  { id: 5, type: 'note', studentId: 105, student: 'Layla Saeed', studentAr: 'ليلى سعيد', at: '2026-10-23T14:40:00', text: 'Advisor note added after mock interview', textAr: 'أُضيفت ملاحظة بعد المقابلة التجريبية' },
];

export const notes = {
  101: [
    { id: 1, author: 'Maya Khalil', authorAr: 'مايا خليل', createdAt: '2026-10-22T10:20:00', text: 'Strong profile for Canadian programmes. Needs IELTS certificate uploaded before 1 Nov.', textAr: 'ملف قوي للبرامج الكندية. يجب رفع شهادة IELTS قبل 1 نوفمبر.' },
    { id: 2, author: 'Omar Farouk', authorAr: 'عمر فاروق', createdAt: '2026-10-12T15:05:00', text: 'Translation of transcript delivered and verified.', textAr: 'تم تسليم ترجمة كشف الدرجات والتحقق منها.' },
  ],
};

export const communications = {
  101: [
    { id: 1, channel: 'call', direction: 'outbound', at: '2026-10-22T10:00:00', author: 'Maya Khalil', authorAr: 'مايا خليل', duration: 18, summary: 'Reviewed shortlist and agreed on three priority scholarships.', summaryAr: 'راجعنا القائمة المختصرة واتفقنا على ثلاث منح ذات أولوية.' },
    { id: 2, channel: 'whatsapp', direction: 'inbound', at: '2026-10-20T19:30:00', author: 'Maya Khalil', authorAr: 'مايا خليل', summary: 'Student shared the recommendation letter draft from her professor.', summaryAr: 'أرسلت الطالبة مسودة خطاب التوصية من أستاذها.' },
    { id: 3, channel: 'email', direction: 'outbound', at: '2026-10-15T09:10:00', author: 'Maya Khalil', authorAr: 'مايا خليل', summary: 'Sent the CV template and document checklist.', summaryAr: 'أُرسل نموذج السيرة الذاتية وقائمة المستندات المطلوبة.' },
  ],
};

export const serviceHistory = {
  101: [
    { id: 'SR-310', service: 'cv', status: 'inProgress', createdAt: '2026-10-18', assignee: 'Maya Khalil' },
    { id: 'SR-305', service: 'translation', status: 'completed', createdAt: '2026-10-02', completedAt: '2026-10-12', assignee: 'Omar Farouk' },
    { id: 'SR-290', service: 'scholarshipSearch', status: 'completed', createdAt: '2026-09-04', completedAt: '2026-09-10', assignee: 'Maya Khalil' },
  ],
  102: [{ id: 'SR-315', service: 'filePreparation', status: 'inProgress', createdAt: '2026-10-21', assignee: 'Maya Khalil' }],
  103: [
    { id: 'SR-317', service: 'motivationLetter', status: 'newRequest', createdAt: '2026-10-24', assignee: '' },
    { id: 'SR-311', service: 'translation', status: 'waitingStudent', createdAt: '2026-10-18', assignee: 'Omar Farouk' },
  ],
  104: [{ id: 'SR-318', service: 'scholarshipSearch', status: 'newRequest', createdAt: '2026-10-25', assignee: '' }],
  105: [{ id: 'SR-313', service: 'applicationAssistance', status: 'waitingStudent', createdAt: '2026-10-19', assignee: 'Noor Hassan' }],
  106: [{ id: 'SR-308', service: 'followUp', status: 'completed', createdAt: '2026-10-09', completedAt: '2026-10-12', assignee: 'Maya Khalil' }],
};

// طلبات التقديم لكل طالب (scholarshipId + المرحلة من STAGES)
export const studentApplications = {
  101: [
    { id: 'APP-2041', scholarshipId: 1, stage: 2, updatedAt: '2026-10-22' },
    { id: 'APP-2055', scholarshipId: 2, stage: 1, updatedAt: '2026-10-19' },
    { id: 'APP-1988', scholarshipId: 6, stage: 7, result: 'rejected', updatedAt: '2026-09-30' },
  ],
  102: [{ id: 'APP-2060', scholarshipId: 2, stage: 4, updatedAt: '2026-10-24' }, { id: 'APP-2061', scholarshipId: 5, stage: 5, updatedAt: '2026-10-21' }],
  103: [{ id: 'APP-2070', scholarshipId: 3, stage: 3, updatedAt: '2026-10-15' }],
  104: [],
  105: [{ id: 'APP-2033', scholarshipId: 3, stage: 6, updatedAt: '2026-10-20' }],
  106: [{ id: 'APP-1990', scholarshipId: 1, stage: 7, result: 'accepted', updatedAt: '2026-10-12' }],
};

/** Synthesises a document checklist for students that the mock API doesn't cover. */
export function buildDocuments(student, baseDocs) {
  if (String(student.id) === '101' && baseDocs?.length) return baseDocs;
  const types = Object.keys(REQUIRED_DOCS);
  const approved = Math.floor((student.readiness / 100) * types.length);
  const last = (student.name || '').split(' ').pop();
  return types.map((type, i) => {
    const status = i < approved ? 'approved' : i === approved ? 'underReview' : 'missing';
    return {
      id: i + 1, type, status,
      file: status === 'missing' ? null : `${type}_${last}.pdf`,
      size: status === 'missing' ? undefined : `${300 + i * 85} KB`,
      uploadedAt: status === 'missing' ? undefined : `2026-10-${String(10 + i).padStart(2, '0')}`,
    };
  });
}

// متطلبات التقديم الافتراضية للمنح التي لا تحتوي على الحقل
export const DEFAULT_REQUIREMENTS = ['passport', 'transcript', 'degree', 'cv', 'language', 'motivation'];

export const RESULT_STATUSES = ['notStarted', 'inProgress', 'partial', 'completed'];

// المتقدّمون لكل منحة ونتيجتهم (لمتتبع القبول)
export const admissionApplicants = {
  1: [
    { studentId: 101, name: 'Sarah Ahmed', nameAr: 'سارة أحمد', outcome: 'waitingResult' },
    { studentId: 106, name: 'Hadi Tamimi', nameAr: 'هادي التميمي', outcome: 'accepted' },
  ],
  2: [
    { studentId: 101, name: 'Sarah Ahmed', nameAr: 'سارة أحمد', outcome: 'waitingResult' },
    { studentId: 102, name: 'Yousef Karimi', nameAr: 'يوسف كريمي', outcome: 'waitingResult' },
  ],
  3: [
    { studentId: 103, name: 'Noor Hassan', nameAr: 'نور حسن', outcome: 'waitingResult' },
    { studentId: 105, name: 'Layla Saeed', nameAr: 'ليلى سعيد', outcome: 'waitingResult' },
  ],
  4: [],
  5: [{ studentId: 102, name: 'Yousef Karimi', nameAr: 'يوسف كريمي', outcome: 'waitingResult' }],
  6: [
    { studentId: 101, name: 'Sarah Ahmed', nameAr: 'سارة أحمد', outcome: 'rejected' },
    { studentId: 103, name: 'Noor Hassan', nameAr: 'نور حسن', outcome: 'accepted' },
    { studentId: 105, name: 'Layla Saeed', nameAr: 'ليلى سعيد', outcome: 'waitingResult' },
  ],
};
