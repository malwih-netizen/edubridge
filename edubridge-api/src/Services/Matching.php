<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Rule-based scholarship matching and student readiness (weights from the project proposal).
 * Field 25 · GPA 20 · Level 15 · Nationality 15 · Language 10 · Country 10 · Funding 5
 * Result: eligible ≥ 75 · potential 50–74 · notSuitable < 50 — decision support only, never a guarantee.
 */
final class Matching
{
    public const WEIGHTS = ['field' => 25, 'gpa' => 20, 'level' => 15, 'nationality' => 15, 'language' => 10, 'country' => 10, 'funding' => 5];

    /** @param array $student  mapped student profile   @param array $s  mapped scholarship */
    public static function score(array $student, array $s): array
    {
        $gpa = (float) ($student['gpa'] ?? 0);
        $lang = (float) ($student['language']['score'] ?? 0);
        $parts = [
            'field'       => in_array($student['field'], $s['fields'], true) ? 1 : 0,
            'gpa'         => $gpa >= (float) $s['minGpa'] ? 1 : ($gpa >= (float) $s['minGpa'] - 0.3 ? 0.5 : 0),
            'level'       => in_array($student['level'], $s['levels'], true) ? 1 : 0,
            'nationality' => in_array('all', $s['nationalities'], true) || in_array($student['nationality'], $s['nationalities'], true) ? 1 : 0,
            'language'    => $lang >= (float) $s['language']['score'] ? 1 : ($lang >= (float) $s['language']['score'] - 0.5 ? 0.5 : 0),
            'country'     => in_array($s['country'], $student['preferredCountries'], true) ? 1 : 0,
            'funding'     => $student['funding'] === $s['funding'] ? 1 : 0.4,
        ];
        $score = (int) round(array_sum(array_map(fn ($k) => self::WEIGHTS[$k] * $parts[$k], array_keys(self::WEIGHTS))));
        $level = $score >= 75 ? 'eligible' : ($score >= 50 ? 'potential' : 'notSuitable');
        return ['score' => $score, 'level' => $level, 'parts' => $parts];
    }

    /** Scholarships ranked by score; results are cached in match_scores. */
    public static function recommend(int $studentId, array $student, array $scholarships): array
    {
        $out = [];
        foreach ($scholarships as $s) {
            $m = self::score($student, $s);
            Database::run(
                'INSERT INTO match_scores (student_id, scholarship_id, score, level, details) VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE score = VALUES(score), level = VALUES(level), details = VALUES(details), computed_at = NOW()',
                [$studentId, $s['id'], $m['score'], $m['level'], json_encode($m['parts'])],
            );
            $out[] = $s + ['match' => $m];
        }
        usort($out, fn ($a, $b) => $b['match']['score'] <=> $a['match']['score']);
        return $out;
    }

    /** Readiness = weighted share of required documents; under-review counts 80 %. */
    public static function readiness(int $studentId): array
    {
        $types = Database::all('SELECT code, readiness_weight FROM document_types WHERE is_required = 1 ORDER BY sort_order');
        $docs = Database::all(
            'SELECT type_code, status FROM documents WHERE student_id = ? ORDER BY uploaded_at DESC',
            [$studentId],
        );
        $latest = [];
        foreach ($docs as $d) $latest[$d['type_code']] ??= $d['status'];

        $score = 0.0;
        $missing = [];
        foreach ($types as $t) {
            $status = $latest[$t['code']] ?? null;
            if ($status === null || $status === 'rejected') { $missing[] = $t['code']; continue; }
            $score += $status === 'approved' ? $t['readiness_weight'] : $t['readiness_weight'] * 0.8;
        }
        return ['score' => (int) round($score), 'missing' => $missing];
    }
}
