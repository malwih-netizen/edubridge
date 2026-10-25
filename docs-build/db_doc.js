// Builds: EduBridge — System Analysis & Database Design (.docx)
const fs = require('fs');
const path = require('path');
const { Document, Packer } = require('docx');
const { TEAM, P, H2, table, cover, documentOptions, toc, pageBreak, note } = require('./lib');

const OUT = path.join(__dirname, '..', 'docs', 'EduBridge - System Analysis and Database Design.docx');

const contributions = [
  new (require('docx').Paragraph)({ children: [], pageBreakBefore: true }),
  H2('Document information'),
  P('This report is a team deliverable of the graduation project. The table below shows which student prepared each part, so the supervisor can see the individual work of every team member.'),
  ...table(['Part of this document', 'Prepared by', 'Student ID'], [
    ['Database design: ERDs, normalisation, keys, data dictionary, SQL, reporting views, security, backup (§9)', TEAM.alaa.name, TEAM.alaa.id],
    ['System architecture, back-end class diagram, sequence diagrams, API mapping (§3, §5.2, §6, §10)', TEAM.lamia.name, TEAM.lamia.id],
    ['Use case modelling and activity diagrams, user flows (§4, §7)', TEAM.nada.name, TEAM.nada.id],
    ['Domain model and state diagrams of the workflow and CRM (§5.1, §8)', TEAM.janeen.name, TEAM.janeen.id],
    ['Requirements analysis (§2) and review of the whole document', 'All team members', '—'],
  ], [56, 30, 14], 'Contribution of each student'),
  ...table(['Item', 'Value'], [
    ['Project', 'Edu Bridge – Smart Scholarship and Student Services Management System'],
    ['Database', 'MySQL 8 / MariaDB 10.4 — `edubridge` (25 tables, 7 views)'],
    ['Source files', '`edubridge-api/database/schema.sql`, `seed.sql`, `views.sql`'],
    ['Diagram notation', 'UML 2.5 (use case, class, sequence, activity, state) and crow’s-foot ERD'],
  ], [25, 75], 'Document details'),
  note('How to read the diagrams', 'All diagrams were produced from text definitions (Mermaid) kept in the repository, so they can be updated together with the code.'),
];

const doc = new Document(documentOptions({
  title: 'EduBridge — System Analysis and Database Design',
  short: 'System Analysis & Database Design',
  authorShort: `Prepared by ${TEAM.alaa.name} (${TEAM.alaa.id}) with the EduBridge team`,
  sections: [
    [
      ...cover({
        docTitle: 'System Analysis & Database Design',
        subtitle: 'ERD · UML diagrams · Data dictionary · SQL · Activity & state models',
        author: TEAM.alaa,
        contributors: [TEAM.lamia, TEAM.nada, TEAM.janeen],
        version: '1.0 — October 2026',
      }),
      ...contributions,
      pageBreak(),
      ...toc(),
    ],
    [
      ...require('./db_part1')(),
      ...require('./db_part2')(),
      ...require('./db_part3')(),
    ],
  ],
}));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('✓', OUT, Math.round(buf.length / 1024), 'KB');
});
