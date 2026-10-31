"""
Copies the database-analysis diagrams (images/*.png) into one folder with Arabic names,
grouped by diagram type, for the report and the presentation.

  python export_db_images.py
"""
import pathlib
import shutil

HERE = pathlib.Path(__file__).resolve().parent
OUT_NAME = 'صور تحليل قاعدة البيانات - EduBridge'
TARGETS = [
    HERE.parent / 'docs' / OUT_NAME,
    pathlib.Path(r'D:\Family\Studentes\Projects Web Gradutions\Edu Bridge – Smart Scholarship and Student Services Management System') / OUT_NAME,
]

GROUPS = [
    ('1- معمارية النظام', [
        ('architecture', 'معمارية النظام ثلاثية الطبقات'),
    ]),
    ('2- مخططات حالات الاستخدام', [
        ('use_case_student', 'حالات الاستخدام - الطالب'),
        ('use_case_staff', 'حالات الاستخدام - المرشد والموظف'),
        ('use_case_admin', 'حالات الاستخدام - المسؤول والنظام الآلي'),
    ]),
    ('3- مخططات الفئات', [
        ('class_domain', 'مخطط فئات المجال'),
        ('class_backend', 'مخطط فئات الواجهة الخلفية PHP API'),
    ]),
    ('4- مخططات التسلسل', [
        ('seq_login', 'تسلسل تسجيل الدخول'),
        ('seq_upload', 'تسلسل رفع المستندات ومراجعتها'),
        ('seq_service', 'تسلسل طلب خدمة'),
    ]),
    ('5- مخططات النشاط', [
        ('activity_register', 'نشاط تسجيل الطالب'),
        ('activity_journey', 'نشاط رحلة التقديم على المنحة كاملة'),
    ]),
    ('6- مخططات الحالة', [
        ('state_application', 'حالات طلب التقديم'),
        ('state_document', 'حالات مراجعة المستند'),
        ('state_request', 'حالات طلب الخدمة'),
        ('state_scholarship', 'حالات المنحة والنتائج'),
        ('state_account', 'حالات حساب المستخدم'),
    ]),
    ('7- مخططات قاعدة البيانات ERD', [
        ('erd_overview', 'المخطط المفاهيمي - الكيانات الرئيسية'),
        ('erd_users', 'المستخدمون والمصادقة والإشعارات'),
        ('erd_students', 'الطلاب والمستندات'),
        ('erd_scholarships', 'المنح ونتائج المطابقة'),
        ('erd_crm', 'الخدمات والطلبات وإدارة العلاقات CRM'),
    ]),
]

if __name__ == '__main__':
    for out in TARGETS:
        if out.exists():
            shutil.rmtree(out)
        n = 0
        for folder, items in GROUPS:
            (out / folder).mkdir(parents=True)
            for i, (src, name) in enumerate(items, 1):
                shutil.copy2(HERE / 'images' / f'{src}.png', out / folder / f'{folder[0]}.{i} {name}.png')
                n += 1
        print(f'✓ {n} images → {out}')
