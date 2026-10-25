// Builds: EduBridge — AI Integration and Automation (.docx)
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph } = require('docx');
const { TEAM, P, H2, table, cover, documentOptions, toc, pageBreak, note } = require('./lib');

const OUT = path.join(__dirname, '..', 'docs', 'EduBridge - AI Integration and Automation.docx');

const contributions = [
  new Paragraph({ children: [], pageBreakBefore: true }),
  H2('Document information'),
  P('This report is a team deliverable of the graduation project. The table below shows which student prepared each part.'),
  ...table(['Part of this document', 'Prepared by', 'Student ID'], [
    ['AI approach decision, matching algorithm, readiness score, prompt design, guardrails, evaluation plan (§2–§7, §9, §10)', TEAM.janeen.name, TEAM.janeen.id],
    ['API integration of the Groq client, automation jobs and scheduler (§6.5, §8)', TEAM.lamia.name, TEAM.lamia.id],
    ['Data for matching and evaluation, match cache and readiness data (§4.4, §5, §9.2)', TEAM.alaa.name, TEAM.alaa.id],
    ['Display of recommendations, explanations and readiness in the interface (§3, §11)', TEAM.nada.name, TEAM.nada.id],
  ], [58, 28, 14], 'Contribution of each student'),
  ...table(['Item', 'Value'], [
    ['Project', 'Edu Bridge – Smart Scholarship and Student Services Management System'],
    ['AI approach', 'Hybrid: weighted rule engine + pre-trained LLM via Groq API (no custom training in v1)'],
    ['Code', '`edubridge-api/src/Services/Matching.php` (implemented), `GroqClient.php` (planned)'],
    ['Data source', 'Real results exported from the MySQL demo database'],
  ], [25, 75], 'Document details'),
  note('Key principle', 'The AI component is decision support. It ranks and explains; advisors decide. It never promises admission.'),
];

const doc = new Document(documentOptions({
  title: 'EduBridge — AI Integration and Automation',
  short: 'AI Integration & Automation',
  authorShort: `Prepared by ${TEAM.janeen.name} (${TEAM.janeen.id}) with the EduBridge team`,
  sections: [
    [
      ...cover({
        docTitle: 'AI Integration & Automation',
        subtitle: 'Matching engine · Groq API · Readiness score · Automation · Evaluation',
        author: TEAM.janeen,
        contributors: [TEAM.lamia, TEAM.alaa, TEAM.nada],
        version: '1.0 — October 2026',
      }),
      ...contributions,
      pageBreak(),
      ...toc(),
    ],
    [...require('./ai_part1')(), ...require('./ai_part2')()],
  ],
}));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('✓', OUT, Math.round(buf.length / 1024), 'KB');
});
