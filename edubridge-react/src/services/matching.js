// منطق التطابق ومؤشر الجاهزية — نسخة قواعد (Rule-based) حسب أوزان المقترح.
// ستنتقل لاحقاً إلى الـ Backend (MatchingService) مع شرح من Groq API.

export const WEIGHTS = { field: 25, gpa: 20, level: 15, nationality: 15, language: 10, country: 10, funding: 5 };

export function matchScore(student, s) {
  const parts = {
    field: s.fields.includes(student.field) ? 1 : 0,
    gpa: student.gpa >= s.minGpa ? 1 : student.gpa >= s.minGpa - 0.3 ? 0.5 : 0,
    level: s.levels.includes(student.level) ? 1 : 0,
    nationality: s.nationalities.includes('all') || s.nationalities.includes(student.nationality) ? 1 : 0,
    language: student.language?.score >= s.language.score ? 1 : student.language?.score >= s.language.score - 0.5 ? 0.5 : 0,
    country: student.preferredCountries.includes(s.country) ? 1 : 0,
    funding: student.funding === s.funding ? 1 : 0.4,
  };
  const score = Math.round(Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * parts[k], 0));
  const level = score >= 75 ? 'eligible' : score >= 50 ? 'potential' : 'notSuitable';
  return { score, level, parts };
}

/** Scholarships ranked by match score for a student. */
export function recommend(student, list) {
  return list
    .map((s) => ({ ...s, match: matchScore(student, s) }))
    .sort((a, b) => b.match.score - a.match.score);
}

// المستندات الأساسية ووزن كل منها في مؤشر الجاهزية
export const REQUIRED_DOCS = { passport: 15, transcript: 20, degree: 15, cv: 15, language: 15, motivation: 10, recommendation: 10 };

export function readiness(docs) {
  let score = 0;
  const missing = [];
  for (const [type, w] of Object.entries(REQUIRED_DOCS)) {
    const d = docs.find((x) => x.type === type);
    if (!d || d.status === 'missing' || d.status === 'rejected') missing.push(type);
    else score += d.status === 'approved' ? w : w * 0.8;
  }
  return { score: Math.round(score), missing };
}
