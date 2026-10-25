// AI & Automation report — Part 1: approach decision, matching algorithm, readiness, real results.
const path = require('path');
const { P, H1, H2, H3, bullets, numbered, table, figure, code, note } = require('./lib');

const DATA = require(path.join(__dirname, 'data', 'matches.json'));
const SCH_SHORT = { 1: 'Global Excellence (CA)', 2: 'DAAD (DE)', 3: 'Commonwealth (UK)', 4: 'Türkiye Burslari (TR)', 5: 'Erasmus Mundus (NL)', 6: 'Malaysia Intl. (MY)' };
const lvl = (s) => (s >= 75 ? 'E' : s >= 50 ? 'P' : 'N');

module.exports = () => {
  const sarah = DATA.students.find((s) => s.name === 'Sarah Ahmed');
  const ge = DATA.scholarships.find((s) => s.id === 1);
  const parts = sarah.matches['1'].parts;
  const W = DATA.weights;
  const LABEL = { field: 'Academic field', gpa: 'GPA', level: 'Study level', nationality: 'Nationality', language: 'Language', country: 'Preferred country', funding: 'Funding' };
  const studentVal = { field: sarah.field, gpa: sarah.gpa, level: sarah.level, nationality: sarah.nationality, language: `${sarah.language.test} ${sarah.language.score}`, country: sarah.countries.join(', '), funding: sarah.funding };
  const schVal = { field: ge.fields.join(', '), gpa: `≥ ${ge.minGpa}`, level: ge.levels.join(', '), nationality: 'all', language: `${ge.language.test} ≥ ${ge.language.score}`, country: ge.country, funding: ge.funding };

  return [
    H1('1. Introduction'),
    P('This report explains the intelligent part of EduBridge: how the system recommends scholarships, how it measures a student’s readiness, how a pre-trained language model (through the **Groq API**) is connected to explain the results, and how routine work is automated with events and scheduled jobs. It also answers the key design question of the project: **should we train our own AI model or use a ready-made one?**'),
    P('The proposal requires an AI-assisted component that evaluates document completeness, calculates a readiness score and generates scholarship compatibility scores, while acting as **decision support** and never replacing human judgement. Everything in this report follows that principle.'),
    ...table(['Goal', 'How EduBridge achieves it'], [
      ['Recommend suitable scholarships', 'Weighted rule-based matching (7 criteria) → score 0–100 and a level'],
      ['Explain each recommendation', 'Groq LLM writes a short Arabic / English explanation of the score'],
      ['Measure file completeness', 'Readiness score from weighted required documents'],
      ['Reduce manual follow-up', 'Event-driven jobs + daily scheduler send reminders and re-match students'],
      ['Keep humans in control', 'Advisor reviews every proposal; no guarantee of admission is ever claimed'],
    ], [35, 65], 'Objectives of the AI component'),

    H1('2. Approach: Train a Model or Use a Ready API?'),
    P('Three options were evaluated against the real situation of the project: a new consultancy platform with no historical admission data, a 15-week schedule, a student team and a zero budget.'),
    ...table(['Criterion', 'A. Train our own ML model', 'B. Pre-trained LLM only (API)', 'C. Hybrid: rules + LLM API (chosen)'], [
      ['Training data needed', 'Thousands of labelled student–scholarship outcomes (we have none)', 'None', 'None (rules come from scholarship criteria)'],
      ['Explainability', 'Low (black box)', 'Medium — may invent reasons', 'High — every point of the score is traceable'],
      ['Consistency', 'High after training', 'Low — same input can give different answers', 'High — score is deterministic'],
      ['Risk of wrong eligibility', 'Medium', 'High (hallucination)', 'Low — LLM never decides eligibility'],
      ['Cost', 'GPU time + data labelling', 'Per request', 'Very low (LLM only for short texts, cached)'],
      ['Time to build', 'Months', 'Days', 'Weeks — fits the plan'],
      ['Arabic + English output', 'Needs extra work', 'Yes', 'Yes'],
    ], [19, 27, 27, 27], 'Comparison of AI approaches', { size: 16 }),
    note('Decision', [
      '**We do not train a model in version 1.** We use a deterministic, weighted rule engine for the score (transparent and testable) and a **ready, pre-trained large language model through the Groq API** only to explain results and to read documents.',
      'Training a dedicated model becomes possible later, after the system has collected real admission outcomes (Section 9).',
    ]),
    H2('2.1 Why Groq'),
    ...bullets([
      '**Ready, pre-trained open models** (Llama family) — no training or GPU needed.',
      '**OpenAI-compatible REST API** — one HTTPS call from PHP with cURL; easy to replace with another provider.',
      '**Very fast inference**, so an explanation is ready in about one second.',
      '**Free developer tier** that is enough for the graduation project; usage is limited further by caching.',
      'Model name is a setting (`GROQ_MODEL` in `.env`), so the team can switch models without code changes.',
    ]),

    H1('3. System Design of the AI Component'),
    P('The engine has three layers. Only layer 3 calls the external LLM, and it never changes the score.'),
    ...figure('ai_architecture', 'Architecture of the decision-support engine', 5.2, 6.4),
    ...table(['Layer', 'Technology', 'Output'], [
      ['1. Rule-based matcher', 'PHP `Matching::score()`', 'Score 0–100, level, per-criterion parts → `match_scores`'],
      ['2. Readiness calculator', 'PHP `Matching::readiness()`', 'Readiness % and missing document list'],
      ['3. LLM layer', 'Groq API (chat completions, JSON mode)', 'Short explanation (AR/EN), gaps, document field extraction'],
    ], [26, 32, 42], 'Layers of the engine'),

    H1('4. Scholarship Matching Algorithm'),
    H2('4.1 Criteria and weights'),
    P('The weights are taken from the project proposal. Each criterion returns a value between 0 and 1 that is multiplied by its weight; the sum is the match score.'),
    ...table(['Criterion', 'Weight', 'Full credit (1)', 'Partial credit', 'No credit (0)'], [
      ['Academic field', `${W.field}%`, 'Student field is in the scholarship fields', '—', 'Different field'],
      ['GPA', `${W.gpa}%`, 'GPA ≥ minimum', '0.5 if within 0.3 below the minimum', 'Lower'],
      ['Study level', `${W.level}%`, 'Target level offered', '—', 'Not offered'],
      ['Nationality', `${W.nationality}%`, 'Open to all or to this nationality', '—', 'Not eligible'],
      ['Language', `${W.language}%`, 'Score ≥ requirement', '0.5 if within 0.5 below', 'Lower'],
      ['Preferred country', `${W.country}%`, 'Country in the student’s list', '—', 'Not preferred'],
      ['Funding', `${W.funding}%`, 'Same funding type', '0.4 otherwise', '—'],
    ], [20, 10, 28, 24, 18], 'Matching criteria'),
    H2('4.2 Formula and classification'),
    ...code([
      'score = Σ ( weight_i × part_i )          part_i ∈ {0, 0.4, 0.5, 1}',
      '',
      'level = Eligible            if score ≥ 75',
      '        Potentially suitable if 50 ≤ score < 75',
      '        Not suitable         if score < 50',
    ], 'Score formula'),
    H2('4.3 Worked example (real data)'),
    P(`**${sarah.name}** (${sarah.level}, ${sarah.field}, GPA ${sarah.gpa}, ${sarah.language.test} ${sarah.language.score}) compared with **${ge.name}** (University of Toronto, Canada):`),
    ...table(['Criterion', 'Student', 'Scholarship', 'Part', 'Weight', 'Points'],
      Object.keys(W).map((k) => [LABEL[k], String(studentVal[k]), String(schVal[k]), String(parts[k]), String(W[k]), String(Math.round(parts[k] * W[k] * 10) / 10)])
        .concat([['**Total**', '', '', '', '100', `**${sarah.matches['1'].score}**`]]),
      [18, 22, 24, 8, 10, 18], `Calculation for ${sarah.name} × ${ge.name} → ${sarah.matches['1'].level}`),
    P('The only lost points come from the language criterion: IELTS 6.5 is 0.5 below the required 7.0, so the student receives half of the 10 points. The explanation layer turns this into advice: “Improve your IELTS to 7.0 to reach a full match.”'),
    H2('4.4 Results on the demo database'),
    P('The matrix was produced by running the real `Matching` class over all students and scholarships in the MySQL database (E = Eligible, P = Potentially suitable, N = Not suitable).'),
    ...table(['Student', ...DATA.scholarships.map((s) => SCH_SHORT[s.id] || s.name)],
      DATA.students.map((st) => [st.name, ...DATA.scholarships.map((s) => { const m = st.matches[String(s.id)]; return `${m.score} ${lvl(m.score)}`; })]),
      [18, 14, 13, 14, 14, 14, 13], 'Match scores (students × scholarships)', { size: 16 }),
    H2('4.5 Implementation'),
    ...code([
      "public const WEIGHTS = ['field' => 25, 'gpa' => 20, 'level' => 15, 'nationality' => 15,",
      "                        'language' => 10, 'country' => 10, 'funding' => 5];",
      '',
      'public static function score(array $student, array $s): array {',
      '    $parts = [',
      "        'field'    => in_array($student['field'], $s['fields'], true) ? 1 : 0,",
      "        'gpa'      => $gpa >= $s['minGpa'] ? 1 : ($gpa >= $s['minGpa'] - 0.3 ? 0.5 : 0),",
      "        'level'    => in_array($student['level'], $s['levels'], true) ? 1 : 0,",
      '        // … nationality, language, country, funding',
      '    ];',
      '    $score = round(Σ WEIGHTS[k] × $parts[k]);',
      "    $level = $score >= 75 ? 'eligible' : ($score >= 50 ? 'potential' : 'notSuitable');",
      "    return ['score' => $score, 'level' => $level, 'parts' => $parts];",
      '}',
    ], 'src/Services/Matching.php (simplified)'),

    H1('5. Student Readiness Score'),
    P('Readiness measures how complete the student’s file is. Each required document type has a weight (total 100). An approved document gives its full weight, a document under review 80 % of it, and a missing or rejected document 0.'),
    ...table(['Document', 'Weight', 'Sarah’s status', 'Points'], [
      ['Passport', '15', 'Approved', '15'],
      ['Academic transcript', '20', 'Approved', '20'],
      ['Degree certificate', '15', 'Under review', '12'],
      ['CV / Résumé', '15', 'Missing', '0'],
      ['Language certificate', '15', 'Missing', '0'],
      ['Motivation letter', '10', 'Approved', '10'],
      ['Recommendation letter', '10', 'Under review', '8'],
      ['**Readiness**', '**100**', '', `**${sarah.readiness.score} %**`],
    ], [34, 14, 30, 22], 'Readiness calculation (real data)'),
    P(`The API returns \`{ "score": ${sarah.readiness.score}, "missing": ["${sarah.readiness.missing.join('", "')}"] }\`, which the dashboard shows as a ring and a list of “Upload” buttons.`),
  ];
};
