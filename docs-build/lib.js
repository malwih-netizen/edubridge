// Shared helpers for the EduBridge Word reports (docx-js).
const fs = require('fs');
const path = require('path');
const {
  AlignmentType, BorderStyle, Footer, Header, HeadingLevel, ImageRun, LevelFormat, PageBreak, PageNumber,
  Paragraph, ShadingType, Table, TableCell, TableOfContents, TableRow, TextRun, VerticalAlign, WidthType,
  TabStopType, TabStopPosition,
} = require('docx');

const BLACK = '000000';
const GRAY = '808080';
const INK = '262626';
const MUTED = '595959';
const LIGHT = 'F2F2F2';
const IMG = path.join(__dirname, 'images');

const CONTENT_W = 9026; // A4 width 11906 - 2 × 1440 margins (DXA)

const TEAM = {
  lamia: { name: 'Lamia Fathi Hamdi Madi', id: '220217142', role: 'Backend development (PHP API)' },
  nada: { name: 'Nada Musa Abdul Qader Al-Asital', id: '220217234', role: 'Frontend development (React.js)' },
  alaa: { name: 'Alaa Suleiman Abdulrahman Abu Mustafa', id: '220217287', role: 'Database design & integration' },
  janeen: { name: 'Janeen Osama Atiya Al-Qutati', id: '220217280', role: 'AI recommendation, CRM & evaluation' },
};

/* ---------- inline text: **bold**, `code` ---------- */
function runs(text, base = {}) {
  const out = [];
  String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith('**')) out.push(new TextRun({ ...base, text: part.slice(2, -2), bold: true }));
    else if (part.startsWith('`')) out.push(new TextRun({ ...base, text: part.slice(1, -1), font: 'Consolas', size: 19, color: '333333' }));
    else out.push(new TextRun({ ...base, text: part }));
  });
  return out;
}

const P = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run || {}), spacing: { after: 120, line: 300 }, alignment: opts.align || AlignmentType.JUSTIFIED, ...opts.para });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)], pageBreakBefore: true });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const bullets = (items, level = 0) => items.map((t) => new Paragraph({ numbering: { reference: 'bullets', level }, children: runs(t), spacing: { after: 60, line: 280 } }));
const numbered = (items, ref = 'steps') => items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60, line: 280 } }));
const spacer = (after = 120) => new Paragraph({ children: [], spacing: { after } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

/* ---------- callout box (one-cell table with gray side border) ---------- */
function note(title, text) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: 'F5F5F5', color: 'auto' },
      borders: { top: border, bottom: border, right: border, left: { style: BorderStyle.SINGLE, size: 24, color: GRAY } },
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children: [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, color: BLACK })], spacing: { after: 60 } }),
        ...(Array.isArray(text) ? text : [text]).map((t) => new Paragraph({ children: runs(t, { color: INK }), spacing: { after: 40, line: 280 } })),
      ],
    })] })],
  });
}

/* ---------- tables ---------- */
let tableNo = 0;
function table(headers, rows, widths, caption, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const scale = CONTENT_W / total;
  const w = widths.map((x) => Math.round(x * scale));
  w[w.length - 1] += CONTENT_W - w.reduce((a, b) => a + b, 0);
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
  const borders = { top: border, bottom: border, left: border, right: border };
  const size = opts.size || 18;
  const cell = (text, i, head, zebra) => new TableCell({
    width: { size: w[i], type: WidthType.DXA },
    borders,
    verticalAlign: VerticalAlign.CENTER,
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: head ? 'D9D9D9' : zebra ? 'F5F5F5' : 'FFFFFF' },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(text).split('\n').map((line) => new Paragraph({
      children: head
        ? [new TextRun({ text: line.replace(/`/g, ''), size, color: '000000', bold: true })]
        : runs(line, { size, color: '000000' }),
      spacing: { after: 0, line: 252 },
    })),
  });
  const out = [];
  if (caption) {
    tableNo += 1;
    out.push(new Paragraph({ children: [new TextRun({ text: `Table ${tableNo}: `, bold: true, color: BLACK, size: 19 }), new TextRun({ text: caption, italics: true, color: MUTED, size: 19 })], spacing: { before: 120, after: 80 }, keepNext: true }));
  }
  out.push(new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: w,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false, ri % 2 === 1)) })),
    ],
  }));
  out.push(spacer(160));
  return out;
}

/* ---------- code block ---------- */
// Arabic segments use a font that joins Arabic letters and are marked right-to-left.
const AR = /([؀-ۿ][؀-ۿ\s،.:0-9]*[؀-ۿ.])/;
function codeRuns(line) {
  if (!line.length) return [new TextRun({ text: ' ', font: 'Consolas', size: 16 })];
  return line.split(AR).filter(Boolean).map((seg) => (AR.test(seg) && /^[؀-ۿ]/.test(seg)
    ? new TextRun({ text: seg, font: 'Arial', size: 17, color: '000000', rightToLeft: true })
    : new TextRun({ text: seg, font: 'Consolas', size: 16, color: '000000' })));
}
function code(lines, title) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
  const arr = Array.isArray(lines) ? lines : String(lines).replace(/\r/g, '').split('\n');
  const out = [];
  if (title) out.push(new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 18, color: MUTED })], spacing: { before: 80, after: 40 }, keepNext: true }));
  out.push(new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: 'F5F5F5', color: 'auto' },
      borders: { top: border, bottom: border, right: border, left: { style: BorderStyle.SINGLE, size: 18, color: BLACK } },
      margins: { top: 100, bottom: 100, left: 160, right: 120 },
      children: arr.map((l) => new Paragraph({ children: codeRuns(l), spacing: { after: 0, line: 230 } })),
    })] })],
  }));
  out.push(spacer(160));
  return out;
}

/* ---------- figures ---------- */
let figNo = 0;
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function figure(name, caption, maxW = 6.27, maxH = 8.3) {
  const file = path.join(IMG, `${name}.png`);
  const { w, h } = pngSize(file);
  // images are rendered at 2x device pixels; aim for ~144 px per inch on paper
  let width = Math.min(maxW, w / 2 / 96 * 1.0 * 1.25);
  width = Math.max(width, Math.min(maxW, 3.2));
  let height = width * (h / w);
  if (height > maxH) { height = maxH; width = height * (w / h); }
  figNo += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: 'png', data: fs.readFileSync(file), transformation: { width: Math.round(width * 96), height: Math.round(height * 96) },
        altText: { title: caption, description: caption, name } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: `Figure ${figNo}: `, bold: true, color: BLACK, size: 19 }), new TextRun({ text: caption, italics: true, color: MUTED, size: 19 })] }),
  ];
}

/* ---------- cover page ---------- */
function cover({ docTitle, subtitle, author, contributors, version }) {
  const logo = fs.readFileSync(path.join(IMG, 'logo-gray.png'));
  const center = (children, after = 120) => new Paragraph({ alignment: AlignmentType.CENTER, children, spacing: { after } });
  const kv = (k, v, bold = false) => new TableRow({ children: [
    new TableCell({ width: { size: 2600, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: LIGHT, color: 'auto' }, margins: { top: 80, bottom: 80, left: 140, right: 140 },
      borders: noBorders(), children: [new Paragraph({ children: [new TextRun({ text: k, bold: true, color: BLACK, size: 20 })] })] }),
    new TableCell({ width: { size: 6426, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 140, right: 140 }, borders: noBorders(),
      children: String(v).split('\n').map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 20, bold, color: '000000' })] })) }),
  ] });
  return [
    center([new TextRun({ text: 'UNIVERSITY COLLEGE OF SCIENCE AND TECHNOLOGY', bold: true, color: BLACK, size: 22 })], 40),
    center([new TextRun({ text: 'Department of Engineering Sciences and Applied Arts · Bachelor of Computer Systems Engineering', color: MUTED, size: 18 })], 360),
    center([new ImageRun({ type: 'png', data: logo, transformation: { width: 210, height: 135 }, altText: { title: 'EduBridge logo', description: 'EduBridge logo', name: 'logo' } })], 240),
    center([new TextRun({ text: 'Edu Bridge – Smart Scholarship and Student Services Management System', color: GRAY, bold: true, size: 24 })], 200),
    center([new TextRun({ text: docTitle, bold: true, color: BLACK, size: 44, font: 'Cambria' })], 120),
    center([new TextRun({ text: subtitle, color: INK, size: 22 })], 480),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [2600, 6426],
      rows: [
        kv('Prepared by', `${author.name}  ·  ${author.id}\n${author.role}`, true),
        kv('With contributions from', contributors.map((c) => `${c.name} (${c.id}) — ${c.role}`).join('\n')),
        kv('Course supervisor', 'Ms. Amina Al-Salout'),
        kv('Academic year', '2026/2027'),
        kv('Document version', version),
      ],
    }),
  ];
}
function noBorders() {
  const n = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: n, bottom: n, left: n, right: n };
}

/* ---------- document shell ---------- */
function documentOptions({ title, short, authorShort, sections }) {
  const header = new Header({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [new TextRun({ text: 'EduBridge', bold: true, color: BLACK, size: 18 }), new TextRun({ text: `  ·  ${short}`, color: MUTED, size: 18 }),
      new TextRun({ text: '\tUCST · Computer Systems Engineering', color: MUTED, size: 16 })],
  })] });
  const footer = new Footer({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [new TextRun({ text: authorShort, color: MUTED, size: 16 }),
      new TextRun({ children: ['\tPage ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], color: MUTED, size: 16 })],
  })] });
  return {
    creator: authorShort,
    title,
    description: title,
    styles: {
      default: { document: { run: { font: 'Calibri', size: 21, color: '000000' } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 34, bold: true, color: BLACK, font: 'Cambria' }, paragraph: { spacing: { before: 120, after: 220 }, outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GRAY, space: 6 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 27, bold: true, color: BLACK, font: 'Cambria' }, paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 1, keepNext: true } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 23, bold: true, color: '333333' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2, keepNext: true } },
      ],
    },
    numbering: { config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } }, run: { color: GRAY } } },
        { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } },
      ] },
      { reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
      { reference: 'steps2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
      { reference: 'steps3', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ] },
    features: { updateFields: true },
    sections: sections.map((s, i) => ({
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1200, left: 1440, right: 1440, header: 600, footer: 600 } }, titlePage: i === 0 },
      headers: { default: header, first: new Header({ children: [] }) },
      footers: { default: footer, first: new Footer({ children: [] }) },
      children: s,
    })),
  };
}

function toc() {
  return [
    new Paragraph({ children: [new TextRun({ text: 'Table of Contents', bold: true, size: 34, color: BLACK, font: 'Cambria' })], spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GRAY, space: 6 } } }),
    new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' }),
    new Paragraph({ children: [new TextRun({ text: 'If page numbers do not appear, right-click the table and choose “Update Field”.', italics: true, color: MUTED, size: 17 })], spacing: { before: 120 } }),
  ];
}

module.exports = {
  TEAM, BLACK, GRAY, P, H1, H2, H3, bullets, numbered, spacer, pageBreak, note, table, code, figure, cover, documentOptions, toc, runs,
};
