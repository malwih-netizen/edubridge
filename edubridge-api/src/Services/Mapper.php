<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/** Converts database rows (snake_case) to the JSON shapes the React app uses (camelCase). */
final class Mapper
{
    public static function scholarship(array $r, array $levels, array $fields, array $nats): array
    {
        return [
            'id'            => (int) $r['id'],
            'name'          => $r['name'],
            'nameAr'        => $r['name_ar'],
            'university'    => $r['university'],
            'universityAr'  => $r['university_ar'],
            'country'       => $r['country'],
            'levels'        => $levels,
            'fields'        => $fields,
            'minGpa'        => $r['min_gpa'] !== null ? (float) $r['min_gpa'] : null,
            'language'      => ['test' => $r['language_test'], 'score' => $r['language_score'] !== null ? (float) $r['language_score'] : null],
            'nationalities' => $nats ?: ['all'],
            'funding'       => $r['funding'],
            'opens'         => $r['opens_on'],
            'deadline'      => $r['deadline'],
            'status'        => $r['status'],
            'results'       => $r['results_status'],
            'amount'        => $r['amount'],
            'description'   => $r['description'],
            'descriptionAr' => $r['description_ar'],
            'tags'          => [],
        ];
    }

    /** Loads scholarships with their levels/fields/nationalities in 4 queries. */
    public static function scholarships(string $where = '1=1', array $params = []): array
    {
        $rows = Database::all("SELECT * FROM scholarships WHERE $where ORDER BY FIELD(status,'open','upcoming','closed','draft'), deadline", $params);
        if (!$rows) return [];
        $ids = array_column($rows, 'id');
        $in = implode(',', array_fill(0, count($ids), '?'));
        $group = function (string $table, string $col) use ($in, $ids): array {
            $g = [];
            foreach (Database::all("SELECT scholarship_id, $col AS v FROM $table WHERE scholarship_id IN ($in)", $ids) as $x) {
                $g[$x['scholarship_id']][] = $x['v'];
            }
            return $g;
        };
        $levels = $group('scholarship_levels', 'level');
        $fields = $group('scholarship_fields', 'field');
        $nats = $group('scholarship_nationalities', 'nationality');
        return array_map(fn ($r) => self::scholarship($r, $levels[$r['id']] ?? [], $fields[$r['id']] ?? [], $nats[$r['id']] ?? []), $rows);
    }

    public static function student(int $userId): ?array
    {
        $r = Database::one('SELECT u.*, s.* FROM users u JOIN students s ON s.user_id = u.id WHERE u.id = ?', [$userId]);
        if (!$r) return null;
        $countries = array_column(Database::all('SELECT country FROM student_countries WHERE student_id = ?', [$userId]), 'country');
        return [
            'id'                 => (int) $r['user_id'],
            'firstName'          => $r['first_name'],
            'lastName'           => $r['last_name'],
            'firstNameAr'        => $r['first_name_ar'],
            'lastNameAr'         => $r['last_name_ar'],
            'email'              => $r['email'],
            'phone'              => $r['phone'],
            'nationality'        => $r['nationality'],
            'country'            => $r['country'],
            'city'               => $r['city'],
            'gender'             => $r['gender'],
            'birthDate'          => $r['birth_date'],
            'currentLevel'       => $r['current_level'],
            'level'              => $r['target_level'],
            'field'              => $r['field'],
            'gpa'                => $r['gpa'] !== null ? (float) $r['gpa'] : null,
            'gpaScale'           => (float) $r['gpa_scale'],
            'university'         => $r['institution'],
            'universityAr'       => $r['institution_ar'],
            'graduationYear'     => $r['graduation_year'] !== null ? (int) $r['graduation_year'] : null,
            'language'           => ['test' => $r['language_test'], 'score' => $r['language_score'] !== null ? (float) $r['language_score'] : null],
            'preferredCountries' => $countries,
            'funding'            => $r['funding_pref'],
            'intake'             => $r['intake'],
            'stage'              => (int) $r['stage'],
            'priority'           => $r['priority'],
        ];
    }

    public static function document(array $d): array
    {
        $kb = (int) round($d['size_bytes'] / 1024);
        return [
            'id'         => (int) $d['id'],
            'type'       => $d['type_code'],
            'file'       => $d['file_name'],
            'size'       => $kb >= 1024 ? round($kb / 1024, 1) . ' MB' : $kb . ' KB',
            'status'     => $d['status'],
            'reason'     => $d['reject_reason'],
            'uploadedAt' => substr($d['uploaded_at'], 0, 10),
        ];
    }
}
