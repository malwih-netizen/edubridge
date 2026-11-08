"""
"كيف يعمل نظام EduBridge" — شرح كامل للنظام في 10 صفحات (PDF عربي) مع المخططات.
التشغيل:  python docs-build/system_explainer.py   →   docs/EduBridge - شرح آلية عمل النظام.pdf
"""
import html
import pathlib
import subprocess

import render_diagrams as rd

HERE = pathlib.Path(__file__).resolve().parent
WORK = HERE / 'system-explainer'
OUT_PDF = HERE.parent / 'docs' / 'EduBridge - شرح آلية عمل النظام.pdf'

DIAGRAMS = {
    'sys_architecture': '''%% size: 2000x1500
%%{init: {"themeVariables": {"fontSize": "21px"}, "themeCSS": ".nodeLabel, .edgeLabel, .label, .cluster-label, foreignObject div { direction: rtl; } text.messageText, text.actor, .noteText, .actor-man text, text.state-note, g.stateGroup text, .stateLabel text, .edgeLabel text { direction: rtl; unicode-bidi: embed; }"}}%%
flowchart TB
  S["الطالبة"]:::actor
  A["المستشار / الموظف"]:::actor
  M["المسؤول"]:::actor
  subgraph FE["الواجهة React"]
    UI["صفحات الطالب والمستشار والمسؤول<br/>عربي / إنجليزي"]
  end
  subgraph BE["الخادم PHP API"]
    AUTH["1 · التحقق من الهوية والصلاحية<br/>JWT + الدور"]
    VAL["2 · التحقق من المدخلات<br/>Validator"]
    CTRL["3 · المعالجة<br/>Controllers"]
    MATCH["محرك التطابق والجاهزية<br/>Matching.php — قواعد وأوزان"]
  end
  DB[("MySQL<br/>25 جدولاً + 7 Views")]
  FILES[("ملفات المستندات<br/>خارج المجلد العام")]
  AI["Groq — نموذج لغوي جاهز<br/>يكتب شرح التوصية فقط<br/>الأسبوع الثالث"]:::planned
  S --> UI
  A --> UI
  M --> UI
  UI -- "طلب HTTPS + توكن" --> AUTH --> VAL --> CTRL
  CTRL --> DB
  CTRL --> FILES
  CTRL --> MATCH
  MATCH --> DB
  MATCH -. "الدرجات والشروط فقط" .-> AI
  classDef actor fill:#000000,color:#ffffff,stroke:#000000
  classDef planned stroke-dasharray: 6 4,fill:#ffffff
''',
    'sys_journey': '''%% size: 1500x2300
%%{init: {"themeVariables": {"fontSize": "21px"}, "themeCSS": ".nodeLabel, .edgeLabel, .label, .cluster-label, foreignObject div { direction: rtl; } text.messageText, text.actor, .noteText, .actor-man text, text.state-note, g.stateGroup text, .stateLabel text, .edgeLabel text { direction: rtl; unicode-bidi: embed; }"}}%%
flowchart TB
  R["1 · التسجيل وتأكيد البريد<br/>الطالبة"] --> PR["2 · تعبئة الملف الشخصي<br/>الطالبة"]
  PR --> DOC["3 · رفع المستندات<br/>الطالبة ← الخادم يتحقق ويحفظ"]
  DOC --> REC["4 · التوصيات ونسبة التطابق + الجاهزية<br/>محرك التطابق"]
  REC --> SRV["5 · طلب خدمة أو اختيار منحة<br/>الطالبة"]
  SRV --> ADV["6 · استلام الطلب والتواصل<br/>المستشار"]
  ADV --> REV{"7 · المستندات كاملة ومقبولة؟<br/>المستشار يراجع"}
  REV -- "لا" --> MISS["طلب النواقص<br/>إشعار للطالبة"]
  MISS --> DOC
  REV -- "نعم" --> SUB["8 · التقديم على المنحة<br/>المستشار"]
  SUB --> RES["9 · تسجيل النتيجة: قبول / رفض<br/>المستشار"]
  RES --> NT["10 · إشعار الطالبة بالنتيجة"]
''',
    'sys_upload': '''%% size: 1300x2400
%%{init: {"themeVariables": {"fontSize": "21px"}, "themeCSS": ".nodeLabel, .edgeLabel, .label, .cluster-label, foreignObject div { direction: rtl; }"}}%%
flowchart TB
  S1["1 · الطالبة<br/>تختار نوع المستند وتسحب الملف"]:::student
  S2["2 · الواجهة React<br/>فحص أولي: الحجم حتى 10MB"]:::ui
  S3["3 · الخادم PHP<br/>التوكن صالح؟ الدور طالبة؟"]:::api
  S4["4 · الخادم PHP<br/>النوع الحقيقي PDF / JPG / PNG / DOCX؟<br/>الحجم مقبول؟"]:::api
  X["رفض 401 / 403 / 422<br/>ولا يُحفظ شيء"]
  S5["5 · الخادم PHP<br/>حفظ الملف باسم عشوائي<br/>خارج المجلد العام"]:::api
  S6[("6 · MySQL — documents<br/>الحالة: قيد المراجعة")]
  S7["7 · الطالبة<br/>تم الرفع وبانتظار المراجعة<br/>الجاهزية تُحدَّث"]:::student
  S8["8 · المستشار<br/>يفتح الملف عبر مسار محمي<br/>ويقارنه بالملف الشخصي"]:::advisor
  S9["9 · المستشار<br/>القرار"]:::advisor
  OK[("مقبول<br/>documents + audit_log")]
  NO[("مرفوض + سبب<br/>documents + audit_log")]
  N["10 · notifications<br/>إشعار للطالبة"]
  NOAI["لا ذكاء اصطناعي في هذه الخطوات<br/>الخادم وحده يتعامل مع الملف"]:::note
  S1 --> S2 --> S3
  S3 -- "نعم" --> S4
  S3 -- "لا" --> X
  S4 -- "لا" --> X
  S4 -- "نعم" --> S5 --> S6 --> S7 --> S8 --> S9
  S9 -- "قبول" --> OK --> N
  S9 -- "رفض" --> NO --> N
  S5 ~~~ NOAI
  classDef student fill:#000000,color:#ffffff,stroke:#000000
  classDef advisor fill:#595959,color:#ffffff,stroke:#000000
  classDef ui fill:#ffffff,stroke:#000000
  classDef api fill:#e6e6e6,stroke:#000000
  classDef note fill:#ffffff,stroke-dasharray: 6 4
''',
    'sys_document_state': '''%% size: 1700x1100
%%{init: {"themeVariables": {"fontSize": "21px"}, "themeCSS": ".nodeLabel, .edgeLabel, .label, .cluster-label, foreignObject div { direction: rtl; } text.messageText, text.actor, .noteText, .actor-man text, text.state-note, g.stateGroup text, .stateLabel text, .edgeLabel text { direction: rtl; unicode-bidi: embed; }"}}%%
stateDiagram-v2
  state "ناقص" as missing
  state "قيد المراجعة" as review
  state "مقبول" as approved
  state "مرفوض + سبب" as rejected
  [*] --> missing
  missing --> review: الطالبة ترفع
  review --> approved: المستشار يقبل
  review --> rejected: المستشار يرفض
  rejected --> review: الطالبة تستبدل
  approved --> review: نسخة أحدث
  review --> missing: الطالبة تحذف
  rejected --> missing: الطالبة تحذف
''',
    'sys_matching': '''%% size: 1900x1700
%%{init: {"themeVariables": {"fontSize": "21px"}, "themeCSS": ".nodeLabel, .edgeLabel, .label, .cluster-label, foreignObject div { direction: rtl; } text.messageText, text.actor, .noteText, .actor-man text, text.state-note, g.stateGroup text, .stateLabel text, .edgeLabel text { direction: rtl; unicode-bidi: embed; }"}}%%
flowchart TB
  P["الملف الشخصي للطالبة<br/>التخصص · المعدل · المستوى · الجنسية<br/>درجة اللغة · الدول المفضلة · التمويل"]
  SC["شروط المنحة<br/>التخصصات · الحد الأدنى للمعدل · المستويات<br/>الجنسيات · اللغة المطلوبة · الدولة · التمويل"]
  P --> CMP
  SC --> CMP
  CMP{"مقارنة كل معيار<br/>1 يحقق · 0.5 قريب · 0 لا يحقق"}
  CMP --> W["ضرب كل نتيجة في وزنها<br/>تخصص 25 · معدل 20 · مستوى 15 · جنسية 15<br/>لغة 10 · دولة 10 · تمويل 5"]
  W --> SUM["المجموع من 100"]
  SUM --> C1["75 فأكثر: مؤهل"]
  SUM --> C2["50 – 74: محتمل"]
  SUM --> C3["أقل من 50: غير مناسب"]
  SUM --> CACHE[("match_scores<br/>الدرجة وتفاصيل كل معيار")]
''',
    'sys_ai': '''%% size: 1900x1500
%%{init: {"themeVariables": {"fontSize": "21px"}, "themeCSS": ".nodeLabel, .edgeLabel, .label, .cluster-label, foreignObject div { direction: rtl; } text.messageText, text.actor, .noteText, .actor-man text, text.state-note, g.stateGroup text, .stateLabel text, .edgeLabel text { direction: rtl; unicode-bidi: embed; }"}}%%
flowchart TB
  RULE["محرك القواعد — يعمل الآن<br/>يحسب الدرجة والتصنيف لكل منحة"]
  RULE --> IN["المدخلات للنموذج<br/>ملخص الملف بدون اسم أو بريد أو ملفات<br/>شروط المنحة + درجة كل معيار"]
  IN --> LLM["Groq — نموذج لغوي جاهز عبر API<br/>الأسبوع الثالث"]:::planned
  LLM --> OUT["المخرج<br/>2 – 3 جمل تشرح سبب الملاءمة وما ينقص<br/>بلغة الواجهة"]
  OUT --> CACHE[("match_scores.explanation<br/>تخزين الشرح وإعادة استخدامه")]
  OUT --> UI["يظهر للطالبة مع التوصية"]
  OUT --> ADV["المستشار يقرأ الشرح<br/>والقرار له وحده"]
  classDef planned stroke-dasharray: 6 4,fill:#ffffff
''',
}

CSS = """
@page { size: A4; margin: 13mm 14mm 12mm; }
* { box-sizing: border-box; }
html { direction: rtl; }
body { font-family: "Simplified Arabic", "Segoe UI", serif; color: #111; font-size: 12.5pt; line-height: 1.55; margin: 0; }
bdi[dir=ltr] { font-family: "Segoe UI", Arial, sans-serif; font-size: .9em; }
.page { break-after: page; }
.page:last-child { break-after: auto; }
.top { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #bbb; padding-bottom: 3px; margin-bottom: 10px; color: #555; font-size: 10pt; }
h1 { font-size: 24pt; margin: 0 0 4px; line-height: 1.25; }
h2 { font-size: 18pt; margin: 0 0 6px; line-height: 1.3; }
h2 .n { display: inline-block; min-width: 30px; height: 30px; line-height: 30px; text-align: center; border-radius: 50%; background: #111; color: #fff; font-size: 14pt; margin-left: 8px; }
h3 { font-size: 13.5pt; margin: 10px 0 4px; }
p { margin: 4px 0 6px; }
.lead { font-size: 13pt; color: #222; }
.fig { text-align: center; margin: 6px 0 2px; }
.fig img { max-width: 100%; max-height: 150mm; }
.fig.small img { max-height: 112mm; }
.fig.tall img { max-height: 205mm; }
.cap { text-align: center; color: #555; font-size: 10pt; margin-bottom: 6px; }
table { width: 100%; border-collapse: collapse; font-size: 11pt; margin: 4px 0 6px; }
th { background: #111; color: #fff; padding: 4px 6px; text-align: right; font-weight: bold; }
td { border-bottom: 1px solid #d5d5d5; padding: 4px 6px; vertical-align: top; text-align: right; }
tr:nth-child(even) td { background: #f5f5f5; }
.key { border: 2px solid #111; border-radius: 8px; padding: 8px 12px; margin: 8px 0; background: #f2f2f2; }
.key b.q { display: block; font-size: 13pt; margin-bottom: 2px; }
.box { border: 1px solid #bbb; border-radius: 8px; padding: 6px 12px; margin: 6px 0; }
ul { margin: 2px 0 6px; padding-right: 20px; }
li { margin: 2px 0; }
.tag { display: inline-block; border-radius: 5px; padding: 0 6px; font-size: 9.5pt; font-weight: bold; white-space: nowrap; }
.tag.done { background: #111; color: #fff; }
.tag.next { border: 1px dashed #111; }
.cover { text-align: center; padding-top: 18mm; }
.cover .uni { font-size: 14pt; font-weight: bold; }
.cover .dep { color: #444; }
.cover h1 { font-size: 30pt; margin-top: 16mm; }
.cover .sub { font-size: 14pt; color: #333; }
.cover table { width: 80%; margin: 12mm auto 0; font-size: 12pt; }
.cover td { border: 0; padding: 3px 8px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.formula { font-family: "Segoe UI", Arial, sans-serif; direction: ltr; text-align: center; background: #f2f2f2; border-radius: 6px; padding: 6px; margin: 6px 0; font-size: 11.5pt; }
"""


def en(s):
    return f'<bdi dir="ltr">{s}</bdi>'


def tag(done):
    return '<span class="tag done">منفّذ</span>' if done else '<span class="tag next">الأسبوع الثالث</span>'


def fig(name, caption, cls=''):
    uri = (WORK / 'images' / f'{name}.png').as_uri()
    return f'<div class="fig {cls}"><img src="{uri}" alt="{html.escape(caption)}"></div><div class="cap">{caption}</div>'


def page(n, title, body):
    return (f'<section class="page"><div class="top"><span>{en("EduBridge")} · شرح آلية عمل النظام</span><span>صفحة {n}</span></div>'
            f'<h2><span class="n">{n}</span>{title}</h2>{body}</section>')


def rows(head, data):
    out = '<table><tr>' + ''.join(f'<th>{h}</th>' for h in head) + '</tr>'
    for r in data:
        out += '<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>'
    return out + '</table>'


def build_html():
    p = []

    # 1 — cover + the answers in short
    p.append(f'''<section class="page"><div class="cover">
<div class="uni">الكلية الجامعية للعلوم والتكنولوجيا – خان يونس</div>
<div class="dep">قسم العلوم الهندسية والفنون التطبيقية · تخصص هندسة أنظمة الحاسوب</div>
<h1>كيف يعمل نظام {en("Edu Bridge")}</h1>
<div class="sub">من أول إدخال للطالبة حتى نتيجة المنحة — من يعالج كل خطوة، وما المدخلات والمخرجات، ومتى يدخل الذكاء الاصطناعي</div>
<table>
<tr><td><b>لمياء فتحي حمدي ماضي</b></td><td>{en("220217142")}</td><td>الخادم {en("PHP API")}</td></tr>
<tr><td><b>ندى موسى عبد القادر الأسطل</b></td><td>{en("220217234")}</td><td>الواجهة {en("React")}</td></tr>
<tr><td><b>آلاء سليمان عبد الرحمن أبو مصطفى</b></td><td>{en("220217287")}</td><td>قاعدة البيانات والتكامل</td></tr>
<tr><td><b>جنين أسامة عطية القططي</b></td><td>{en("220217280")}</td><td>الذكاء الاصطناعي و{en("CRM")}</td></tr>
</table>
<p style="margin-top:8mm">إشراف: أ. أمينة السلوت · العام الدراسي {en("2026/2027")}</p>
</div>
<div class="key" style="margin-top:10mm"><b class="q">الخلاصة في خمس نقاط</b>
<ul>
<li><b>كل ما تُدخله الطالبة يمر أولاً على الخادم</b> ({en("PHP API")}): يتأكد من هويتها وصلاحيتها، يفحص البيانات، ثم يحفظها في {en("MySQL")}.</li>
<li><b>رفع الملف يتعامل معه الخادم فقط:</b> يفحص النوع الحقيقي والحجم ويخزنه بأمان. الذكاء الاصطناعي لا يلمس الملفات، والنظام لا يقرأ محتواها.</li>
<li><b>نسبة التطابق تُحسب من بيانات الملف الشخصي مقابل شروط المنحة</b> بسبعة معايير موزونة مجموعها 100 نقطة — بقواعد ثابتة قابلة للتفسير.</li>
<li><b>المستندات تحدد «مؤشر الجاهزية»،</b> والمستشار هو من يراجعها ويتأكد أنها تطابق البيانات المدخلة (مثل المعدل في كشف الدرجات).</li>
<li><b>النموذج اللغوي ({en("Groq")}) يكتب شرحاً لسبب التوصية فقط</b> — لا يقرر ولا يقبل ولا يرفض. القرار دائماً للمستشار.</li>
</ul></div></section>''')

    # 2 — components
    p.append(page(2, 'مكوّنات النظام ومن يفعل ماذا', fig('sys_architecture', 'شكل 1: طبقات النظام — كل طلب يمر بالتحقق من الهوية ثم المدخلات ثم المعالجة') + rows(
        ['المكوّن', 'وظيفته', 'لا يفعل'],
        [['الواجهة ' + en('React'), 'تعرض الصفحات بلغتين، تجمع المدخلات، تفحص فحصاً أولياً لراحة المستخدم', 'لا تحفظ شيئاً ولا تثق بها الخادم — كل فحص يُعاد في الخادم'],
         ['الخادم ' + en('PHP API'), 'يتحقق من التوكن والدور، يفحص المدخلات، يطبق قواعد العمل، يقرأ ويكتب في القاعدة', 'لا يُظهر كلمات المرور ولا مسارات الملفات'],
         ['قاعدة ' + en('MySQL'), 'تخزن كل البيانات في 25 جدولاً مترابطاً و7 تقارير ' + en('Views'), 'لا يصلها المتصفح مباشرة أبداً'],
         ['محرك التطابق', 'يحسب نسبة تطابق كل منحة ومؤشر الجاهزية', 'لا يقرأ محتوى الملفات'],
         ['المستشار', 'يراجع المستندات، يتابع الطلبات، يقدّم ويسجل النتائج', '—'],
         ['المسؤول', 'يدير الحسابات والأدوار والمنح ويرى التقارير', '—']])))

    # 3 — the journey
    p.append(page(3, 'رحلة الطالبة كاملة ومن يعالج كل خطوة', '<div class="grid2"><div>' + fig('sys_journey', 'شكل 2: تسلسل العمل من التسجيل إلى النتيجة', 'tall') + '</div><div>' + rows(
        ['#', 'من يعمل', 'ماذا يحدث'],
        [['1', 'الطالبة', 'تنشئ حساباً على خطوات وتؤكد بريدها'],
         ['2', 'الطالبة', 'تُكمل التخصص والمعدل والمستوى واللغة والدول والتمويل'],
         ['3', 'الخادم', 'يستقبل الملفات ويفحصها ويخزنها بحالة «قيد المراجعة»'],
         ['4', 'محرك التطابق', 'يرتب المنح بنسبة التطابق ويحسب الجاهزية والنواقص'],
         ['5', 'الطالبة', 'تختار منحة أو تطلب خدمة (سيرة ذاتية، رسالة دافع…)'],
         ['6', 'المستشار', 'يستلم الطلب ويتواصل مع الطالبة'],
         ['7', 'المستشار', 'يقبل المستندات أو يرفضها مع سبب — تصل الطالبة إشعارات'],
         ['8', 'المستشار', 'يقدّم الطلب على المنحة عندما يكتمل الملف'],
         ['9', 'المستشار', 'يسجل النتيجة: قبول أو رفض'],
         ['10', 'النظام', 'يرسل الإشعار ويحدّث التقارير']]) +
        '<div class="box"><b>مراحل طلب التقديم الثماني</b> (جدول ' + en('applications') + '):<br/>طلب جديد ← تم التواصل ← تجهيز المستندات ← بانتظار الطالبة ← جاهز للتقديم ← تم التقديم ← بانتظار النتيجة ← مقبول / مرفوض. كل انتقال يُسجَّل في ' + en('application_stage_history') + '.</div></div></div>'))

    # 4 — everything the student enters
    p.append(page(4, 'كل ما يدخل النظام من الطالبة', '<p class="lead">كل مدخل له مسار في الخادم، وقواعد فحص، وجدول يُحفظ فيه. لا شيء يُحفظ من المتصفح مباشرة.</p>' + rows(
        ['المُدخل', 'المسار في الخادم', 'ماذا يفحص الخادم', 'أين يُحفظ', 'المُخرج'],
        [['إنشاء حساب', en('POST /auth/register'), 'بريد صحيح وغير مكرر، كلمة مرور 8+ أحرف تُشفَّر ' + en('bcrypt'), en('users, students'), 'حساب + توكن دخول'],
         ['تسجيل الدخول', en('POST /auth/login'), 'كلمة المرور، الحساب غير موقوف', en('user_sessions'), 'توكن ' + en('JWT') + ' لكل جهاز'],
         ['الملف الشخصي', en('PUT /students/me'), 'الحقول الإلزامية، المعدل رقم، المستوى والتمويل من قائمة', en('students, student_countries'), 'الملف المحدَّث'],
         ['رفع مستند', en('POST /students/me/documents'), 'نوع المستند، النوع الحقيقي للملف، الحجم ≤ 10MB', en('documents') + ' + مجلد الملفات', 'المستند بحالة قيد المراجعة'],
         ['استبدال / حذف', en('POST / DELETE …/documents'), 'الملكية، المقبول لا يُحذف', en('documents'), 'حالة جديدة أو «ناقص»'],
         ['ربط مستند بطلب', en('PUT …/applications/{code}/documents'), 'المستندات ملك الطالبة', en('application_documents'), 'قائمة المستندات المرتبطة'],
         ['طلب خدمة', en('POST /service-requests'), 'نوع الخدمة موجود، الأولوية', en('service_requests'), 'رقم الطلب ' + en('SR-…')],
         ['نسيت كلمة المرور', en('POST /auth/forgot-password'), 'رمز من 6 أرقام صالح 10 دقائق', en('password_resets'), 'رمز على البريد'],
         ['الإعدادات', en('/account/…'), 'كلمة المرور الحالية عند التغيير', en('users, user_sessions, notification_settings'), 'إعدادات محدَّثة'],
         ['نموذج تواصل', en('POST /contact'), 'الاسم والبريد والرسالة', en('contact_messages'), 'تأكيد الاستلام']]) +
        '<div class="box"><b>مخرجات تُحسب ولا تُدخل:</b> نسبة التطابق ← ' + en('match_scores') + ' · مؤشر الجاهزية والنواقص ← من ' + en('documents') + ' و' + en('document_types') + ' · الإشعارات ← ' + en('notifications') + ' · التقارير ← 7 ' + en('Views') + '.</div>'))

    # 5 — upload: who handles it
    p.append(page(5, 'سيناريو: الطالبة رفعت ملفاً — من يتعامل معه؟', '''<div class="key"><b class="q">الجواب: الخادم ({0}) وحده، ثم المستشار. الذكاء الاصطناعي لا يدخل هذه الخطوة.</b>
الخادم يفحص ويخزن، والمستشار (إنسان) يقرأ الملف ويحكم عليه. النظام لا يستخرج نصاً من الملف ولا يرسله لأي نموذج.</div>'''.format(en('PHP')) +
        '<div class="grid2"><div>' +
        fig('sys_upload', 'شكل 3: رفع مستند ومراجعته — الأسود الطالبة، الرمادي الغامق المستشار، الفاتح الخادم', 'tall') + '</div><div>' + rows(
        ['خطوة الخادم', 'السبب'],
        [['يتحقق من التوكن ودور «طالبة»', 'لا يرفع أحد ملفاً باسم غيره'],
         ['يقرأ النوع الحقيقي للملف ' + en('finfo') + ' لا الامتداد', 'ملف ضار بامتداد ' + en('.pdf') + ' يُرفض'],
         ['يحفظ الملف باسم عشوائي خارج المجلد العام', 'لا يُفتح برابط مباشر؛ يُفتح فقط عبر مسار يتحقق من الصلاحية'],
         ['إذا كان للنوع نفسه ملف سابق يستبدله في مكانه', 'يبقى المستند مربوطاً بطلبات التقديم، وتعود حالته لـ«قيد المراجعة»']]) +
        '<h3>ماذا يفعل المستشار بالملف؟</h3><ul>'
        '<li>يتأكد أن الملف واضح وصالح وغير منتهٍ.</li>'
        '<li>يقارن ما فيه ببيانات الملف الشخصي: المعدل، التخصص، درجة اللغة.</li>'
        '<li>إذا وافق يصبح «مقبولاً» ويُحسب وزنه كاملاً في الجاهزية.</li>'
        '<li>إذا رفض يكتب السبب إلزامياً، فيصل للطالبة إشعار بما يجب تعديله.</li></ul>'
        '<div class="box">كل قرار يُسجَّل في ' + en('audit_log') + ': من راجع، ومتى، وما القرار.</div></div></div>'))

    # 6 — document state + readiness
    ready_rows = [['جواز السفر', '15'], ['كشف الدرجات', '20'], ['شهادة التخرج', '15'], ['السيرة الذاتية', '15'], ['شهادة اللغة', '15'], ['رسالة الدافع', '10'], ['رسالة توصية', '10']]
    p.append(page(6, 'حالة المستند ومؤشر الجاهزية', fig('sys_document_state', 'شكل 4: دورة حياة المستند — المستند المقبول لا يُحذف، ويمكن استبداله بنسخة أحدث', 'small') +
        '<div class="grid2"><div>' + rows(['المستند المطلوب', 'الوزن'], ready_rows) + '<p>المجموع 100 (من جدول ' + en('document_types') + ').</p></div><div>' +
        '<h3>كيف تُحسب الجاهزية</h3><ul><li>مستند <b>مقبول</b>: يأخذ وزنه كاملاً.</li><li>مستند <b>قيد المراجعة</b>: 80% من وزنه.</li><li><b>مرفوض أو غير مرفوع</b>: صفر، ويظهر في قائمة النواقص.</li></ul>' +
        '<div class="formula">readiness = Σ weight × (approved 1 · under review 0.8 · missing / rejected 0)</div>' +
        '<div class="box"><b>مثال حقيقي من البيانات التجريبية:</b> سارة رفعت الجواز وكشف الدرجات ورسالة الدافع (مقبولة) وشهادة التخرج ورسالة التوصية (قيد المراجعة)، ولم ترفع السيرة الذاتية وشهادة اللغة:<br/>' +
        en('15 + 20 + 10 + 0.8 × (15 + 10) = 65') + ' ← <b>جاهزية 65%</b>، النواقص: السيرة الذاتية وشهادة اللغة.</div></div></div>'))

    # 7 — matching
    p.append(page(7, 'كيف تُقاس نسبة التطابق بين الطالبة والمنحة', '''<div class="key"><b class="q">التطابق يقارن «الملف الشخصي» بشروط المنحة — لا يقارن محتوى الملفات المرفوعة.</b>
البيانات تُدخلها الطالبة في ملفها، والمستشار يتأكد من صحتها عند مراجعة المستندات (مثلاً: المعدل المكتوب = المعدل في كشف الدرجات).</div>''' +
        '<div class="grid2"><div>' + fig('sys_matching', 'شكل 5: خطوات حساب نسبة التطابق') + '</div><div>' + rows(
        ['المعيار', 'الوزن', '1 كامل', '0.5 جزئي'],
        [['التخصص', '25', 'ضمن تخصصات المنحة', '—'],
         ['المعدل', '20', '≥ الحد الأدنى', 'أقل بـ 0.3 أو أقل'],
         ['المستوى', '15', 'ضمن المستويات', '—'],
         ['الجنسية', '15', 'مقبولة أو «الكل»', '—'],
         ['اللغة', '10', '≥ المطلوب', 'أقل بـ 0.5 أو أقل'],
         ['الدولة', '10', 'ضمن الدول المفضلة', '—'],
         ['التمويل', '5', 'نفس النوع', '0.4 لنوع مختلف']]) +
        '<div class="box"><b>مثال محسوب:</b> سارة (علوم حاسوب، ماجستير، معدل 3.7، ' + en('IELTS 6.5') + '، كندا وألمانيا، تمويل كامل) مقابل <b>' + en('Global Excellence Scholarship') + '</b> في كندا (حد أدنى 3.3، ' + en('IELTS 7') + '):<br/>' +
        en('25 + 20 + 15 + 15 + 10×0.5 + 10 + 5 = 95') + ' ← <b>مؤهلة</b>. خسرت 5 نقاط لأن درجة اللغة أقل بـ 0.5.<br/>ومقابل منحة ' + en('DAAD') + ' في ألمانيا (' + en('IELTS 6.5') + '): <b>100</b>.</div>' +
        '<p>متى يُحسب؟ عند فتح الطالبة صفحة التوصيات عبر ' + en('GET /students/me/recommendations') + '، وتُحفظ النتيجة وتفاصيل كل معيار في ' + en('match_scores') + '. لماذا قواعد وليس نموذجاً مدرَّباً؟ لأنها قابلة للشرح والتحقق، ولا توجد بيانات تاريخية كافية للتدريب.</p></div></div>'))

    # 8 — AI
    p.append(page(8, 'متى يدخل الذكاء الاصطناعي، وماذا يرى، وماذا يُخرج', '<div class="grid2"><div>' + fig('sys_ai', 'شكل 6: موقع النموذج اللغوي في النظام', '') + '</div><div>' + rows(
        ['المهمة', 'من ينفذها', 'الحالة'],
        [['حساب نسبة التطابق والتصنيف', 'محرك قواعد في ' + en('PHP'), tag(True)],
         ['مؤشر الجاهزية والنواقص', 'محرك قواعد في ' + en('PHP'), tag(True)],
         ['شرح سبب ملاءمة المنحة بجمل مفهومة', 'نموذج لغوي جاهز ' + en('Groq'), tag(False)],
         ['اقتراح منح بديلة عند الرفض', 'نسبة التطابق + الشرح', tag(False)],
         ['قبول أو رفض مستند / طلب', 'المستشار فقط', tag(True)]]) +
        '<h3>ضوابط استخدام النموذج</h3><ul>'
        '<li>يأخذ الدرجات والشروط وملخصاً مجهول الهوية فقط — لا اسم ولا بريد ولا ملفات.</li>'
        '<li>يُخزَّن الشرح في ' + en('match_scores.explanation') + ' ويُعاد استخدامه، فلا يُستدعى في كل مرة.</li>'
        '<li>إذا تعطل النموذج يعمل النظام كاملاً، وتظهر الدرجة بدون شرح.</li>'
        '<li>لا يَعِد الطالبة بالقبول، والقرار للمستشار.</li></ul>'
        '<div class="box"><b>لماذا نموذج جاهز عبر ' + en('API') + ' وليس تدريب نموذج خاص؟</b> لا توجد بيانات قبول ورفض كافية للتدريب، والمطلوب صياغة نص لا تنبؤ؛ والنموذج الجاهز أرخص وأسرع ويمكن تقييمه بمقارنة توصياته بقرار المستشار.</div></div></div>'))

    # 9 — the advisor and the admin
    p.append(page(9, 'دور المستشار والمسؤول ومتى يعملان', rows(
        ['متى', 'ماذا يفعل المستشار', 'ماذا يتغير في النظام', 'الحالة'],
        [['وصول طلب خدمة جديد', 'يستلمه ويُسنَد له ويتواصل مع الطالبة', en('service_requests') + ' (الحالة، المسؤول) · ' + en('communications'), tag(False)],
         ['رفع مستند', 'يفتح الملف ويقارنه ببيانات الملف الشخصي', 'فتح عبر مسار محمي ' + en('GET /documents/{id}/file'), tag(True)],
         ['بعد المراجعة', 'يقبل، أو يرفض مع سبب إلزامي', en('documents') + ' · ' + en('notifications') + ' · ' + en('audit_log'), tag(True)],
         ['ملف ناقص', 'يطلب النواقص ويضع الطلب «بانتظار الطالبة»', en('applications.stage') + ' · ' + en('application_stage_history'), tag(False)],
         ['اكتمال الملف', 'يقدّم الطلب على المنحة', 'المرحلة ← تم التقديم', tag(False)],
         ['صدور النتيجة', 'يسجل القبول أو الرفض', en('applications.result') + ' عبر المسار ' + en('PUT /scholarships/{id}/results'), tag(True)],
         ['أثناء المتابعة', 'يكتب ملاحظات ويسجل المكالمات والرسائل', en('notes') + ' · ' + en('communications'), tag(False)],
         ['إضافة منحة', 'يضيف أو يعدّل منحة وشروطها', en('scholarships') + ' + جداول الشروط', tag(True)]]) +
        '<h3>المسؤول</h3>' + rows(
        ['ماذا يفعل', 'أين', 'الحالة'],
        [['يدعو موظفاً أو مسؤولاً بكلمة مرور مؤقتة على البريد', en('POST /admin/users') + ' ← ' + en('users'), tag(True)],
         ['يغيّر الدور والقسم، يوقف حساباً فيُسجَّل خروجه من كل الأجهزة', en('PUT /admin/users/{id}') + ' ← ' + en('users, user_sessions'), tag(True)],
         ['يرى التقارير: الطلب على الدول والخدمات، نسبة القبول، ضغط العمل', 'الـ ' + en('Views') + ' السبعة جاهزة في القاعدة، وربط صفحة التقارير بها', tag(False)]]) +
        '<p><b>منفّذ</b> = يعمل الآن عبر الـ ' + en('API') + ' ومُختبر. <b>الأسبوع الثالث</b> = الواجهة جاهزة ببيانات تجريبية، والربط بالخادم ضمن وحدة ' + en('CRM') + '.</p>'))

    # 10 — the tables
    tables = [
        ('الحسابات', [('users', 'كل مستخدم: الدور، الحالة، القسم، كلمة المرور المشفرة', '1، 9'),
                      ('user_sessions', 'جلسة لكل جهاز؛ تسجيل الخروج عن بُعد وإيقاف الحساب', 'الدخول'),
                      ('password_resets', 'رموز الاستعادة مشفرة وصالحة 10 دقائق', 'نسيت كلمة المرور'),
                      ('email_verifications', 'تأكيد البريد عند التسجيل وتغييره', '1')]),
        ('الطالبة', [('students', 'الملف الأكاديمي: التخصص، المعدل، المستوى، اللغة، التمويل', '2، 4'),
                     ('student_countries', 'الدول المفضلة (حتى 3) — معيار الدولة في التطابق', '2، 4')]),
        ('المستندات', [('document_types', 'أنواع المستندات، الإلزامي منها، ووزن كل نوع في الجاهزية', '3، 4'),
                       ('documents', 'كل ملف: النوع، المسار المخفي، الحالة، سبب الرفض، من راجعه', '3، 7')]),
        ('المنح', [('scholarships', 'المنحة: الدولة، الجامعة، المعدل، اللغة، التمويل، المواعيد، الحالة', '4، 9'),
                   ('scholarship_levels', 'المستويات المقبولة لكل منحة', '4'),
                   ('scholarship_fields', 'التخصصات المقبولة لكل منحة', '4'),
                   ('scholarship_nationalities', 'الجنسيات المقبولة («all» = الكل)', '4'),
                   ('scholarship_documents', 'المستندات التي تطلبها كل منحة', '7'),
                   ('match_scores', 'نتيجة التطابق وتفاصيل كل معيار وشرح النموذج', '4')]),
        ('الخدمات والتقديم', [('services', 'الخدمات السبع التي يقدمها المكتب', '5'),
                              ('service_requests', 'طلبات الخدمة: الأولوية، الحالة، المستشار المسؤول', '5، 6'),
                              ('applications', 'طلب التقديم على منحة: المرحلة (0–7) والنتيجة', '6–9'),
                              ('application_documents', 'ربط المستند بأكثر من طلب دون رفعه مجدداً', '7'),
                              ('application_stage_history', 'سجل كل تغيير مرحلة: متى ومن', '6–9')]),
        ('المتابعة', [('notes', 'ملاحظات المستشار الداخلية عن الطالبة', '6–9'),
                      ('communications', 'المكالمات والرسائل وموعد المتابعة القادم', '6'),
                      ('notifications', 'إشعارات الطالبة داخل النظام', '7، 10'),
                      ('notification_settings', 'تفضيل البريد / داخل النظام لكل نوع', 'الإعدادات')]),
        ('عام وأمان', [('contact_messages', 'رسائل نموذج «تواصل معنا»', '—'),
                       ('audit_log', 'من فعل ماذا ومتى (مراجعة مستند، تعديل حساب)', '7، 9')]),
    ]
    trs = ''
    for group, items in tables:
        for i, (name, why, step) in enumerate(items):
            g = f'<td rowspan="{len(items)}"><b>{group}</b></td>' if i == 0 else ''
            trs += f'<tr>{g}<td>{en(name)}</td><td>{why}</td><td>{step}</td></tr>'
    p.append(page(10, 'جداول قاعدة البيانات: لماذا كل جدول ومتى يُستخدم',
        '<p class="lead">25 جدولاً مرتبطة بـ 34 مفتاحاً أجنبياً. عمود «الخطوة» يشير إلى خطوات رحلة الطالبة في الصفحة 3.</p>'
        f'<table style="font-size:10.5pt"><tr><th>المجموعة</th><th>الجدول</th><th>لماذا</th><th>الخطوة</th></tr>{trs}</table>'
        '<div class="box"><b>7 تقارير ' + en('Views') + ' للمسؤول:</b> ' + en('v_totals · v_countries_demand · v_services_demand · v_application_stages · v_acceptance_rate · v_employee_workload · v_student_readiness') + '</div>'))

    return f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>كيف يعمل نظام EduBridge</title><style>{CSS}</style></head><body>{"".join(p)}</body></html>'


def main():
    src = WORK / 'diagrams'
    src.mkdir(parents=True, exist_ok=True)
    for name, code in DIAGRAMS.items():
        (src / f'{name}.mmd').write_text(code, encoding='utf-8')
    rd.SRC, rd.OUT, rd.TMP = src, WORK / 'images', WORK / '.render'
    for name, code in DIAGRAMS.items():
        w, h = map(int, code.splitlines()[0].split(':')[1].strip().split('x'))
        rd.render(name, w, h)

    page_html = WORK / 'system-explainer.html'
    page_html.write_text(build_html(), encoding='utf-8')
    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([rd.EDGE, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files',
                    f'--user-data-dir={WORK / ".render" / "edge-pdf"}', f'--print-to-pdf={OUT_PDF}', page_html.as_uri()],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print('✓', OUT_PDF)


if __name__ == '__main__':
    main()
