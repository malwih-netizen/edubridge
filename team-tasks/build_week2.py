"""
تقارير الأسبوع الثاني لكل طالبة: حالة كل مهمة (من الكود الفعلي)، ما الذي عُدّل، وما يُرحَّل للأسبوع الثالث.
التشغيل:  python team-tasks/build_week2.py  →  team-tasks/الأسبوع الثاني/*.pdf
"""
import html
import os
import subprocess

from build_tasks import CSS, EDGE, HERE, TEAM, TASKS, WEEK_TITLES, en

OUT_DIR = os.path.join(HERE, "الأسبوع الثاني")

DONE, PART, TODO = "done", "part", "todo"
LABEL = {DONE: "منجزة", PART: "منجزة جزئياً", TODO: "لم تبدأ"}

# حالة مهام الأسبوع الثاني بنفس ترتيب TASKS[k]["weeks"][2] — (الحالة، ما تم فعلياً)
STATUS = {
    "1": [
        (DONE, "تسجيل حساب، دخول، خروج، " + en("me") + " مع " + en("bcrypt") + " و" + en("JWT") + "، وكل توكن مرتبط بجلسة يمكن إلغاؤها."),
        (DONE, "كل مسار يحدد الأدوار المسموحة (طالب / موظف / مسؤول) ويُرفض أي طلب بدون صلاحية بالرمز " + en("401/403") + "."),
        (DONE, "طلب الرمز والتحقق منه وتعيين كلمة مرور جديدة، ويُرسل الرمز على البريد عبر " + en("SMTP") + " بالعربي أو الإنجليزي حسب لغة الواجهة."),
        (DONE, en("Users API") + ": عرض وفلترة، دعوة مستخدم بكلمة مرور مؤقتة على البريد، تغيير الدور والقسم، إيقاف الحساب مع تسجيل خروجه من كل الأجهزة."),
        (DONE, "عرض المنح وتفاصيلها للجميع، والإضافة والتعديل وتسجيل النتائج للموظف والمسؤول فقط. الإغلاق بتغيير الحالة بدل الحذف."),
        (DONE, "الفلترة بالدولة والمستوى والتخصص والتمويل والحالة والاسم، وفلتر الموعد النهائي، وترقيم الصفحات عند طلبه."),
    ],
    "2": [
        (DONE, "الصفحة الرئيسية بالكامل بـ " + en("React") + ": من نحن، الخدمات، آلية العمل، الأسئلة، تواصل معنا."),
        (DONE, "تسجيل الدخول، إنشاء حساب على خطوات، واستعادة كلمة المرور — مربوطة بالـ " + en("API") + " الحقيقي."),
        (DONE, en("ProtectedRoute") + " يوجّه كل دور للوحته ويمنعه من لوحات الأدوار الأخرى."),
        (DONE, "نموذج الملف الشخصي والأكاديمي يُحفظ في قاعدة البيانات عبر " + en("PUT /students/me") + "."),
        (DONE, "الرفع بالسحب والإفلات، عرض الحالة، فتح الملف، الاستبدال، والحذف — مع رسالة واضحة إذا كان المستند مقبولاً ولا يُحذف."),
        (DONE, "صفحة المنح العامة مع البحث والفلاتر، وصفحة تفاصيل مختصرة تطلب تسجيل الدخول للتقديم."),
    ],
    "3": [
        (DONE, en("GET / PUT /students/me") + " لحفظ البيانات الشخصية والأكاديمية واللغة والدول المفضلة (جدول " + en("student_countries") + ")."),
        (DONE, "التحقق من نوع الملف الحقيقي " + en("(finfo)") + " وليس الامتداد فقط، وحد أقصى 10 ميغابايت."),
        (DONE, "الملفات خارج المجلد العام بأسماء عشوائية، وتُفتح فقط عبر مسار محمي: الطالبة لملفاتها، والموظف والمسؤول لأي ملف."),
        (DONE, "الموظف يقبل المستند أو يرفضه مع سبب إلزامي، ويصل إشعار للطالبة، ويُسجَّل الإجراء في سجل التدقيق."),
        (DONE, "ربط مستندات الطالبة بأي طلب تقديم دون رفعها من جديد، والاستبدال يحافظ على الربط."),
    ],
    "4": [
        (DONE, en("Matching.php") + " يحسب نسبة التطابق على 7 معايير بالأوزان (التخصص 25، المعدل 20، المستوى 15، الجنسية 15، اللغة 10، الدولة 10، التمويل 5)."),
        (DONE, en("GET /students/me/recommendations") + " يعيد المنح مرتبة مع النسبة والتصنيف (مؤهل / محتمل)."),
        (DONE, en("GET /students/me/readiness") + " يعيد نسبة الجاهزية وقائمة المستندات الناقصة."),
        (DONE, "الخدمات السبع مُدخلة في القاعدة، وطلب الخدمة يعمل عبر " + en("POST /service-requests") + "."),
    ],
}

# ما الذي عُدّل وأُضيف منذ الأسبوع الأول (من سجل المشروع)
CHANGES = {
    "1": [
        "إضافة مسارات الحساب: الأجهزة والجلسات، إلغاء جلسة، تعديل الملف، تغيير البريد وكلمة المرور، الأمان والإشعارات.",
        "توثيق الـ " + en("API") + " على " + en("Swagger") + " ومجموعة " + en("Postman") + " فيها 33 طلباً تُختبر تلقائياً.",
        "رفع الـ " + en("API") + " على الاستضافة على نفس دومين الموقع، مع حماية ملفات الإعدادات والكود وتمرير التوكن.",
        "رابط فحص الخادم " + en("health") + " صار يحدد سبب أي مشكلة في الاتصال بقاعدة البيانات.",
        "إكمال المتبقي: إرسال البريد، إدارة المستخدمين، فلتر الموعد وترقيم الصفحات — و43 طلباً في " + en("Postman") + " تنجح كلها.",
    ],
    "2": [
        "صفحة منح عامة مع بحث، وتفاصيل منحة مختصرة تطلب تسجيل الدخول للتقديم.",
        "إعادة تصميم الشريط العلوي والقائمة الجانبية والفوتر، وشاشة تحميل بشعار المشروع.",
        "صفحة إعدادات بستة أقسام: الملف، الأمان، الأجهزة، البريد، اللغة والمظهر الداكن، الإشعارات.",
        "تبسيط قسم «من نحن» بحذف المقدمة وكرت الفريق، ونشر نسخة من الموقع على " + en("GitHub Pages") + ".",
        "ربط صفحة مستنداتي بالحذف والفتح والاستبدال، وربط صفحة المستخدمين في لوحة المسؤول بالـ " + en("API") + ".",
    ],
    "3": [
        "قاعدة " + en("MySQL") + " كاملة: 25 جدولاً و34 علاقة و7 " + en("Views") + " للتقارير.",
        "ملف " + en("SQL") + " واحد يُستورد في " + en("phpMyAdmin") + " على الاستضافة.",
        "وثيقة تحليل النظام وقاعدة البيانات (43 صفحة) بالأبيض والأسود.",
        "21 صورة لمخططات التحليل بأسماء عربية مرتبة في مجلدات حسب النوع.",
        "إكمال المتبقي: تنزيل المستند المحمي، مراجعة الموظف، وربط المستندات بالطلبات.",
    ],
    "4": [
        "وثيقة الذكاء الاصطناعي والأتمتة (20 صفحة) بنتائج تطابق حقيقية من قاعدة البيانات.",
        "قرار استخدام " + en("Groq API") + " بدل تدريب نموذج خاص، مع خطة التقييم.",
        "ربط التوصيات ومؤشر الجاهزية بلوحة الطالب بدل البيانات التجريبية.",
        "عرض تقديمي للأسبوع الأول فيه ملخص إنجاز كل طالبة.",
    ],
}

# ما يُرحَّل للأسبوع الثالث (المهام غير المكتملة أعلاه)
CARRY = {
    "1": ["ضبط بيانات البريد " + en("(MAIL_*)") + " في ملف الإعدادات على الاستضافة حتى تصل الرسائل فعلياً."],
    "2": [],
    "3": [],
    "4": [],
}

EXTRA_CSS = """
.status { display: inline-block; border-radius: 6px; padding: 0 8px; font-size: 11pt; font-weight: bold; white-space: nowrap; }
.status.done { background: #e3f4ea; color: #1f6b43; }
.status.part { background: #fff1d6; color: #8a5a00; }
.status.todo { background: #fde7e7; color: #a12a2a; }
td.st { width: 92px; text-align: center; }
.bar { height: 14px; background: #e6ecf2; border-radius: 7px; overflow: hidden; margin-top: 6px; }
.bar span { display: block; height: 100%; background: #c9952d; }
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.kpis div { border: 1px solid #dde5ee; border-radius: 8px; padding: 6px 10px; text-align: center; }
.kpis b { display: block; font-size: 18pt; color: #0f2c55; line-height: 1.2; }
ul.list { margin: 4px 0 0; padding-right: 20px; }
ul.list li { margin: 3px 0; }
.links td { font-size: 11.5pt; padding: 4px 8px; }
"""



def build(m):
    k = m["key"]
    esc = html.escape
    tasks = TASKS[k]["weeks"][2]
    status = STATUS[k]
    assert len(tasks) == len(status), k
    n_done = sum(1 for s, _ in status if s == DONE)
    n_part = sum(1 for s, _ in status if s == PART)
    n_todo = len(status) - n_done - n_part
    pct = round((n_done + 0.5 * n_part) / len(status) * 100)

    out = [f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>الأسبوع الثاني — {esc(m['ar'])}</title><style>{CSS}{EXTRA_CSS}</style></head><body>"""]
    out.append(f"""<div class="hero"><div class="proj">{en('Edu Bridge – Smart Scholarship and Student Services Management System')}</div>
<h1>تقرير الأسبوع الثاني — {WEEK_TITLES[2]}</h1>
<div class="sub">{m['role']}</div></div>""")
    out.append(f"""<div class="card">
<div><small>اسم الطالبة</small><b>{esc(m['ar'])}</b><div class="en-name">{en(esc(m['en']))}</div></div>
<div><small>الرقم الجامعي</small><b>{en(m['id'])}</b><small style="margin-top:4px">الكلية الجامعية للعلوم والتكنولوجيا</small></div>
<div><small>المشرفة</small><b>أ. أمينة السلوت</b><small style="margin-top:4px">العام الدراسي {en('2026/2027')}</small></div>
</div>""")

    out.append(f"""<h2>وين وصلنا</h2>
<div class="summary">نسبة إنجاز مهام الأسبوع الثاني: <b>{en(str(pct) + '%')}</b>
<div class="bar"><span style="width:{pct}%"></span></div>
<div class="kpis"><div><b>{n_done}</b>منجزة</div><div><b>{n_part}</b>منجزة جزئياً</div><div><b>{n_todo}</b>لم تبدأ</div></div></div>""")

    out.append("""<div class="week"><h2>مهام الأسبوع الثاني وحالتها</h2>
<table><tr><th style="width:26px">#</th><th>المهمة</th><th>ما تم فعلياً</th><th class="st">الحالة</th></tr>""")
    for i, ((t, _det, _res), (st, done)) in enumerate(zip(tasks, status), 1):
        out.append(f"""<tr><td class="num">{i}</td><td class="task" style="width:24%"><b>{t}</b></td><td class="task"><span>{done}</span></td><td class="st"><span class="status {st}">{LABEL[st]}</span></td></tr>""")
    out.append("</table></div>")

    out.append("<div class='week'><h2>ما الذي عدّلناه وأضفناه</h2><ul class='list'>")
    out += [f"<li>{c}</li>" for c in CHANGES[k]]
    out.append("</ul></div>")

    out.append("<div class='week'><h2>يُرحَّل للأسبوع الثالث</h2>")
    if CARRY[k]:
        out.append("<ul class='list'>" + "".join(f"<li>{c}</li>" for c in CARRY[k]) + "</ul>")
    else:
        out.append("<p class='summary'>لا يوجد — كل مهام الأسبوع الثاني اكتملت.</p>")
    out.append("<p class='legend'>إضافةً إلى مهام الأسبوع الثالث: " + WEEK_TITLES[3] + ".</p></div>")

    out.append("""<div class='week'><h2>روابط المشروع</h2><table class='links'>""")
    for name, url in [("الموقع", "https://edubridge.infinityfreeapp.com"),
                      ("توثيق الـ API (Swagger)", "https://edubridge.infinityfreeapp.com/api/docs/"),
                      ("الكود على GitHub", "https://github.com/malwih-netizen/edubridge"),
                      ("نسخة العرض (GitHub Pages)", "https://malwih-netizen.github.io/edubridge/")]:
        out.append(f"<tr><td style='width:34%'><b>{esc(name).replace('API', en('API')).replace('Swagger', en('Swagger')).replace('GitHub Pages', en('GitHub Pages')).replace('GitHub', en('GitHub'))}</b></td><td>{en(url)}</td></tr>")
    out.append("</table></div>")

    out.append("""<div class="sign"><div>توقيع الطالبة</div><div>توقيع المشرفة</div><div>التاريخ</div></div>""")
    out.append(f"<div class='foot'>{en('EduBridge')} · تقرير الأسبوع الثاني · {esc(m['ar'])}</div></body></html>")
    return "\n".join(out)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    html_dir = os.path.join(HERE, "html")
    os.makedirs(html_dir, exist_ok=True)
    for m in TEAM:
        hp = os.path.join(html_dir, f"week2-member{m['key']}.html")
        with open(hp, "w", encoding="utf-8") as f:
            f.write(build(m))
        pdf = os.path.join(OUT_DIR, f"{m['key']}- تقرير الأسبوع الثاني - {m['ar']}.pdf")
        subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        f"--user-data-dir={os.path.join(html_dir, '.edge')}",
                        f"--print-to-pdf={pdf}", "file:///" + hp.replace(os.sep, "/")],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("✓", pdf)


if __name__ == "__main__":
    main()
