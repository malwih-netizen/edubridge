// Builds: EduBridge — تقرير الأسبوع الأول (.pptx), Arabic, right-to-left.
const path = require('path');
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const { applyTheme } = require(process.env.PPTX_SKILL + '/scripts/apply_theme.js');

const OUT = path.join(__dirname, '..', 'docs', 'EduBridge - تقرير الأسبوع الأول.pptx');
const IMG = path.join(__dirname, 'images');

const THEME = {
  name: 'EduBridge',
  headFontFace: 'Arial',
  bodyFontFace: 'Arial',
  colors: {
    dk1: '0F2C55', lt1: 'FFFFFF', dk2: '33496A', lt2: 'F3F6FA',
    accent1: 'C9952D', accent2: '0F2C55', accent3: 'E8D3A3', accent4: '6B7F98', accent5: '1F8A5B', accent6: 'B57B18',
    hlink: '24508A', folHlink: '6B7F98',
  },
};
const HEX = { navy: '0F2C55', gold: 'C9952D', white: 'FFFFFF', paleGold: 'F7EEDB', green: '1F8A5B' };

const RTL = { rtlMode: true, align: 'right' };

// pptxgenjs marks only the first paragraph of a text box right-to-left and tags every run en-US,
// so PowerPoint puts colons and dots on the wrong side of Arabic words. Mark them all RTL / Arabic.
async function makeRtl(file) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const parts = Object.keys(zip.files).filter((n) => /^ppt\/(slides|slideLayouts|slideMasters)\/[^/]+\.xml$/.test(n));
  for (const n of parts) {
    const xml = (await zip.file(n).async('string'))
      .replace(/<a:pPr(?![^>]*\brtl=)/g, '<a:pPr rtl="1"')
      .replace(/<a:p>(?!<a:pPr)/g, '<a:p><a:pPr rtl="1"/>')
      .replace(/lang="en-US"/g, 'lang="ar-SA"');
    zip.file(n, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

async function icon(Comp, color, size = 256) {
  const svg = renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

const STUDENTS = [
  {
    name: 'لمياء فتحي حمدي ماضي', id: '220217142', role: 'تطوير الواجهة الخلفية · PHP API', icon: fa.FaServer,
    tasks: [
      ['تجهيز مشروع الـ Backend', 'مستودع يعمل على جهاز كل عضو'],
      ['الاتصال بقاعدة البيانات', 'اتصال PDO ناجح مع MySQL'],
      ['وثيقة عقد الـ API', 'ملف API Contract معتمد من الفريق'],
      ['تصميم الأدوار والصلاحيات', 'جدول صلاحيات الطالب والموظف والمسؤول'],
      ['المشاركة في التحليل', 'مساهمة في وثيقة المتطلبات'],
      ['مجموعة Postman', 'مجموعة مشتركة للفريق'],
    ],
  },
  {
    name: 'ندى موسى عبد القادر الأسطل', id: '220217234', role: 'تطوير الواجهة الأمامية · React', icon: fa.FaLaptopCode,
    tasks: [
      ['تجهيز مشروع React', 'مشروع Vite يعمل محلياً'],
      ['نظام التصميم', 'مكتبة مكوّنات بالهوية البصرية'],
      ['دعم اللغتين', 'تبديل عربي / إنجليزي مع RTL'],
      ['هياكل الصفحات', '3 تخطيطات: عام، طالب، موظف'],
      ['طبقة الاتصال بالـ API', 'خدمة api.js جاهزة للربط'],
      ['المشاركة في التحليل', 'تصاميم الشاشات معتمدة'],
    ],
  },
  {
    name: 'آلاء سليمان عبد الرحمن أبو مصطفى', id: '220217287', role: 'تصميم قاعدة البيانات والتكامل', icon: fa.FaDatabase,
    tasks: [
      ['مخطط قاعدة البيانات ERD', 'مخطط ERD معتمد'],
      ['إنشاء القاعدة', 'ملف schema.sql بـ 25 جدولاً'],
      ['بيانات تجريبية', 'ملف seed.sql بحسابات تجريبية'],
      ['قاموس البيانات', 'Data Dictionary لكل الجداول'],
      ['مخططات UML', 'حالات الاستخدام والتسلسل والحالة'],
    ],
  },
  {
    name: 'جنين أسامة عطية القططي', id: '220217280', role: 'الذكاء الاصطناعي وإدارة العلاقات CRM', icon: fa.FaBrain,
    tasks: [
      ['خوارزمية التطابق', 'وثيقة منطق التوصية بالأوزان'],
      ['تصنيف النتيجة', 'مؤهل ≥75 · محتمل 50–74'],
      ['معادلة مؤشر الجاهزية', 'معادلة الجاهزية حسب المستندات'],
      ['تجهيز Groq API', 'تجربة ناجحة على Groq'],
      ['بيانات تقييم الذكاء الاصطناعي', 'ملف بيانات التقييم'],
      ['تصميم سير عمل الخدمات', 'مخطط سير العمل'],
    ],
  },
];
const TOTAL_TASKS = STUDENTS.reduce((n, s) => n + s.tasks.length, 0);

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10 × 5.625 in
  pres.rtlMode = true;
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = 'EduBridge — تقرير الأسبوع الأول';
  pres.author = 'فريق EduBridge';
  const C = pres.SchemeColor;

  const ucstLogo = path.join(IMG, 'week1', 'ucst-logo.jpg');
  const ebLogo = path.join(__dirname, '..', 'edubridge-react', 'src', 'assets', 'logo-dark.png'); // light version for the navy slide

  pres.defineSlideMaster({
    title: 'COVER',
    background: { color: HEX.navy },
    objects: [],
  });
  pres.defineSlideMaster({
    title: 'CONTENT',
    background: { color: HEX.white },
    margin: [0.4, 0.5, 0.45, 0.5],
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 28, bold: true, color: C.text1, align: 'right', rtlMode: true, valign: 'middle', margin: 0 }, text: '' } },
      { text: { text: 'EduBridge · تقرير الأسبوع الأول', options: { x: 3.5, y: 5.2, w: 6, h: 0.3, fontSize: 10, color: C.accent4, align: 'right', rtlMode: true, margin: 0 } } },
      { image: { path: ucstLogo, x: 0.5, y: 5.13, w: 0.4, h: 0.36 } },
    ],
    slideNumber: { x: 1.0, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: C.accent4 },
  });

  /* ---------- 1. Cover ---------- */
  pres.addSection({ title: 'الغلاف' });
  {
    const s = pres.addSlide({ masterName: 'COVER', sectionTitle: 'الغلاف' });
    s.addShape(pres.shapes.OVAL, { x: 4.25, y: 0.3, w: 1.5, h: 1.5, fill: { color: HEX.white }, objectName: 'UCST logo circle' });
    s.addImage({ path: ucstLogo, x: 4.38, y: 0.43, w: 1.24, h: 1.12, altText: 'شعار الكلية الجامعية للعلوم والتكنولوجيا - خان يونس', objectName: 'UCST logo' });
    s.addText('الكلية الجامعية للعلوم والتكنولوجيا – خان يونس', { x: 0.5, y: 1.9, w: 9, h: 0.4, fontSize: 18, bold: true, color: C.background1, align: 'center', rtlMode: true, isTextBox: true, margin: 0 });
    s.addText('قسم العلوم الهندسية والفنون التطبيقية · تخصص هندسة أنظمة الحاسوب', { x: 0.5, y: 2.3, w: 9, h: 0.32, fontSize: 13, color: C.accent3, align: 'center', rtlMode: true, isTextBox: true, margin: 0 });
    s.addText([
      { text: 'Edu Bridge', options: { bold: true, color: HEX.gold, fontSize: 26 } },
      { text: '  ·  تقرير الأسبوع الأول', options: { bold: true, color: HEX.white, fontSize: 26 } },
    ], { x: 0.5, y: 2.72, w: 9, h: 0.55, align: 'center', rtlMode: true, isTextBox: true, margin: 0 });

    // student cards: 4 across, right to left
    const cw = 2.1, gap = 0.2, x0 = 0.5 + (9 - (cw * 4 + gap * 3)) / 2;
    STUDENTS.forEach((st, i) => {
      const x = x0 + (3 - i) * (cw + gap);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.5, w: cw, h: 1.05, rectRadius: 0.1, fill: { color: '1A3A68' }, line: { color: '2E4F7E', width: 0.75 }, objectName: `Student card ${i + 1}` });
      s.addText([
        { text: st.name, options: { bold: true, color: HEX.white, fontSize: 12, breakLine: true } },
        { text: st.id, options: { color: HEX.gold, fontSize: 11 } },
      ], { x: x + 0.1, y: 3.55, w: cw - 0.2, h: 0.95, align: 'center', valign: 'middle', rtlMode: true, isTextBox: true, margin: 0, objectName: `Student name ${i + 1}` });
    });
    s.addText('إشراف: أ. أمينة السلوت  ·  العام الدراسي 2026/2027', { x: 0.5, y: 4.8, w: 9, h: 0.35, fontSize: 12, color: C.accent3, align: 'center', rtlMode: true, isTextBox: true, margin: 0 });
    s.addNotes('الغلاف: أسماء الطالبات الأربع وأرقامهن الجامعية، التخصص، الكلية، والمشرفة.');
  }

  /* ---------- 2. Week at a glance ---------- */
  pres.addSection({ title: 'نظرة عامة' });
  {
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'نظرة عامة' });
    s.addText('الأسبوع الأول: التحليل والتصميم وتجهيز بيئة العمل', { placeholder: 'title' });
    s.addText('هدف الأسبوع أن يبدأ الفريق من أساس واحد واضح: متطلبات مكتوبة، قاعدة بيانات مصمّمة، عقد API متفق عليه، وبيئة عمل جاهزة عند كل طالبة.', {
      x: 0.5, y: 1.1, w: 9, h: 0.7, fontSize: 15, color: C.text2, ...RTL, isTextBox: true, margin: 0,
    });
    const stats = [['4', 'طالبات في الفريق'], [String(TOTAL_TASKS), 'مهمة منجزة'], ['25', 'جدولاً في قاعدة البيانات'], ['4', 'أسابيع خطة العمل']];
    const w = 2.06, gap = 0.25;
    stats.forEach(([n, label], i) => {
      const x = 0.5 + (3 - i) * (w + gap);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.05, w, h: 1.55, rectRadius: 0.12, fill: { color: i === 1 ? HEX.navy : 'F3F6FA' }, line: { color: i === 1 ? HEX.navy : 'E3E9F1', width: 0.75 }, objectName: `Stat ${i + 1}` });
      s.addText(n, { x, y: 2.15, w, h: 0.85, fontSize: 44, bold: true, color: i === 1 ? HEX.gold : HEX.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
      s.addText(label, { x, y: 3.0, w, h: 0.45, fontSize: 13, color: i === 1 ? HEX.white : '33496A', align: 'center', rtlMode: true, isTextBox: true, margin: 0 });
    });
    const parts = [['التحليل', 'المتطلبات وحالات الاستخدام'], ['التصميم', 'ERD وواجهات وعقد API'], ['التجهيز', 'مستودع ومشاريع تعمل محلياً']];
    parts.forEach(([h, d], i) => {
      const x = 0.5 + (2 - i) * 3.08;
      s.addText([
        { text: h + '  ', options: { bold: true, color: HEX.gold, fontSize: 14 } },
        { text: d, options: { color: '33496A', fontSize: 13 } },
      ], { x, y: 3.95, w: 2.85, h: 0.5, ...RTL, valign: 'middle', isTextBox: true, margin: 0 });
    });
    s.addNotes('نظرة عامة على الأسبوع الأول وأرقامه.');
  }

  /* ---------- 3–6. One slide per student ---------- */
  pres.addSection({ title: 'إنجازات الطالبات' });
  const check = await icon(fa.FaCheckCircle, HEX.green);
  for (const st of STUDENTS) {
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'إنجازات الطالبات' });
    s.addText(st.name, { placeholder: 'title' });
    s.addShape(pres.shapes.OVAL, { x: 0.5, y: 0.3, w: 0.7, h: 0.7, fill: { color: HEX.navy }, objectName: 'Role icon circle' });
    s.addImage({ data: await icon(st.icon, HEX.gold), x: 0.68, y: 0.48, w: 0.34, h: 0.34, objectName: 'Role icon' });
    s.addText(`${st.role}  ·  الرقم الجامعي ${st.id}`, { x: 1.4, y: 0.98, w: 8.1, h: 0.35, fontSize: 14, bold: true, color: C.accent6, ...RTL, isTextBox: true, margin: 0 });

    const cols = 3, cw = 2.85, ch = 1.62, gx = 0.225, gy = 0.25, y0 = 1.6;
    st.tasks.forEach(([title, out], i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = 0.5 + (cols - 1 - col) * (cw + gx);
      const y = y0 + row * (ch + gy);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, rectRadius: 0.1, fill: { color: 'F3F6FA' }, line: { color: 'E3E9F1', width: 0.75 }, objectName: `Task card ${i + 1}` });
      s.addImage({ data: check, x: x + cw - 0.48, y: y + 0.2, w: 0.3, h: 0.3, objectName: `Task done ${i + 1}` });
      s.addText(title, { x: x + 0.15, y: y + 0.14, w: cw - 0.7, h: 0.42, fontSize: 14, bold: true, color: C.text1, ...RTL, valign: 'middle', isTextBox: true, margin: 0 });
      s.addText(out, { x: x + 0.15, y: y + 0.66, w: cw - 0.3, h: 0.8, fontSize: 12, color: C.text2, ...RTL, valign: 'top', isTextBox: true, margin: 0 });
    });
    s.addNotes(`${st.name}: ${st.tasks.map((t) => t[0]).join('، ')}.`);
  }

  /* ---------- 7. ERD ---------- */
  pres.addSection({ title: 'مخرجات الأسبوع' });
  {
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'مخرجات الأسبوع' });
    s.addText('المخطط المفاهيمي لقاعدة البيانات', { placeholder: 'title' });
    const erd = path.join(IMG, 'erd_overview.png');
    const w = 8, h = w * (1242 / 3338);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.15, w: 9, h: h + 0.3, rectRadius: 0.08, fill: { color: HEX.white }, line: { color: 'E3E9F1', width: 0.75 }, objectName: 'ERD frame' });
    s.addImage({ path: erd, x: 1.0, y: 1.3, w, h, altText: 'المخطط المفاهيمي ERD لقاعدة بيانات EduBridge', objectName: 'ERD' });
    s.addText('14 كياناً رئيسياً من أصل 25 جدولاً: المستخدمون، الطلاب، المستندات، المنح، نتائج المطابقة، الطلبات والخدمات.', {
      x: 0.5, y: 1.15 + h + 0.5, w: 9, h: 0.45, fontSize: 13, color: C.text2, ...RTL, isTextBox: true, margin: 0,
    });
    s.addNotes('المخطط من وثيقة تحليل النظام وقاعدة البيانات (آلاء).');
  }

  /* ---------- 8. Deliverables ---------- */
  {
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: 'مخرجات الأسبوع' });
    s.addText('ماذا أصبح جاهزاً بنهاية الأسبوع', { placeholder: 'title' });
    const items = [
      [fa.FaGithub, 'مستودع مشترك', 'المشروع كاملاً على GitHub'],
      [fa.FaDatabase, 'قاعدة البيانات', 'schema.sql + seed.sql + Views'],
      [fa.FaFileContract, 'عقد الـ API', 'الطلبات والردود ورسائل الخطأ'],
      [fa.FaPalette, 'الهوية والتصميم', 'مكوّنات وتخطيطات بلغتين'],
      [fa.FaProjectDiagram, 'مخططات UML', 'حالات الاستخدام والتسلسل والحالة'],
      [fa.FaBrain, 'منطق التوصية', 'أوزان التطابق ومؤشر الجاهزية'],
    ];
    const w = 2.85, h = 1.62, gx = 0.225, gy = 0.25;
    for (let i = 0; i < items.length; i++) {
      const [Ic, t, d] = items[i];
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.5 + (2 - col) * (w + gx), y = 1.25 + row * (h + gy);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: 'F3F6FA' }, line: { color: 'E3E9F1', width: 0.75 }, objectName: `Deliverable ${i + 1}` });
      s.addShape(pres.shapes.OVAL, { x: x + w - 0.72, y: y + 0.2, w: 0.52, h: 0.52, fill: { color: HEX.navy }, objectName: `Deliverable icon circle ${i + 1}` });
      s.addImage({ data: await icon(Ic, HEX.gold), x: x + w - 0.6, y: y + 0.32, w: 0.28, h: 0.28, objectName: `Deliverable icon ${i + 1}` });
      s.addText(t, { x: x + 0.15, y: y + 0.24, w: w - 1.0, h: 0.45, fontSize: 15, bold: true, color: C.text1, ...RTL, valign: 'middle', isTextBox: true, margin: 0 });
      s.addText(d, { x: x + 0.15, y: y + 0.85, w: w - 0.3, h: 0.6, fontSize: 12, color: C.text2, ...RTL, valign: 'top', isTextBox: true, margin: 0 });
    }
    s.addNotes('المخرجات الملموسة للأسبوع الأول.');
  }

  /* ---------- 9. Next week ---------- */
  pres.addSection({ title: 'الأسبوع القادم' });
  {
    const s = pres.addSlide({ masterName: 'COVER', sectionTitle: 'الأسبوع القادم' });
    s.addText('الأسبوع الثاني: بناء الوحدات الأساسية', { x: 0.5, y: 0.5, w: 9, h: 0.7, fontSize: 30, bold: true, color: HEX.white, ...RTL, isTextBox: true, margin: 0 });
    const next = [
      ['لمياء', 'المصادقة وحماية المسارات وإدارة المنح والبحث'],
      ['ندى', 'الصفحة الرئيسية وتسجيل الدخول وملف الطالب والمستندات'],
      ['آلاء', 'وحدة إدارة الطالب ورفع المستندات وتخزينها'],
      ['جنين', 'خدمة التطابق ومسار التوصيات وخدمة الجاهزية'],
    ];
    next.forEach(([who, what], i) => {
      const y = 1.5 + i * 0.85;
      s.addShape(pres.shapes.OVAL, { x: 8.85, y: y + 0.08, w: 0.5, h: 0.5, fill: { color: HEX.gold }, objectName: `Step ${i + 1}` });
      s.addText(String(i + 1), { x: 8.85, y: y + 0.08, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: HEX.navy, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
      s.addText([
        { text: who + ': ', options: { bold: true, color: HEX.gold } },
        { text: what, options: { color: HEX.white } },
      ], { x: 0.5, y, w: 8.15, h: 0.66, fontSize: 17, ...RTL, valign: 'middle', isTextBox: true, margin: 0 });
    });
    s.addImage({ path: ebLogo, x: 0.5, y: 4.83, w: 0.9, h: 0.6, altText: 'شعار EduBridge', objectName: 'EduBridge logo' });
    s.addNotes('خطة الأسبوع الثاني لكل طالبة.');
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  await makeRtl(OUT);
  console.log('✓', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
