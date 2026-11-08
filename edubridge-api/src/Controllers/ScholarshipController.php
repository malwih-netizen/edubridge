<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Database, HttpException, Request, Response, Validator};
use App\Services\Mapper;

final class ScholarshipController
{
    /**
     * GET /api/scholarships?level=master&country=germany&field=&funding=&q=
     *   &deadlineWithin=30 (days from today) | &deadlineFrom=YYYY-MM-DD&deadlineTo=YYYY-MM-DD
     *   &page=1&perPage=10 → { data, page, perPage, total, pages }   (without page: the full list)
     */
    public function index(Request $req): never
    {
        $where = ["status <> 'draft'"];
        $params = [];
        $q = $req->query;
        if (!empty($q['country'])) { $where[] = 'country = ?'; $params[] = $q['country']; }
        if (!empty($q['funding'])) { $where[] = 'funding = ?'; $params[] = $q['funding']; }
        if (!empty($q['status']))  { $where[] = 'status = ?';  $params[] = $q['status']; }
        if (!empty($q['level']))   { $where[] = 'id IN (SELECT scholarship_id FROM scholarship_levels WHERE level = ?)'; $params[] = $q['level']; }
        if (!empty($q['field']))   { $where[] = 'id IN (SELECT scholarship_id FROM scholarship_fields WHERE field = ?)'; $params[] = $q['field']; }
        if (!empty($q['q'])) {
            $where[] = '(name LIKE ? OR name_ar LIKE ? OR university LIKE ? OR university_ar LIKE ?)';
            array_push($params, ...array_fill(0, 4, '%' . $q['q'] . '%'));
        }
        Validator::check($q, ['deadlineWithin' => 'numeric|between:0,3650', 'deadlineFrom' => 'date', 'deadlineTo' => 'date',
            'page' => 'numeric|between:1,100000', 'perPage' => 'numeric|between:1,100']);
        if (!empty($q['deadlineWithin'])) {
            $where[] = 'deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)';
            $params[] = (int) $q['deadlineWithin'];
        }
        if (!empty($q['deadlineFrom'])) { $where[] = 'deadline >= ?'; $params[] = $q['deadlineFrom']; }
        if (!empty($q['deadlineTo']))   { $where[] = 'deadline <= ?'; $params[] = $q['deadlineTo']; }

        $list = Mapper::scholarships(implode(' AND ', $where), $params);
        if (empty($q['page'])) Response::json($list);

        $perPage = (int) ($q['perPage'] ?? 10);
        $page = (int) $q['page'];
        Response::json([
            'data'    => array_slice($list, ($page - 1) * $perPage, $perPage),
            'page'    => $page,
            'perPage' => $perPage,
            'total'   => count($list),
            'pages'   => (int) ceil(count($list) / $perPage),
        ]);
    }

    /** GET /api/scholarships/{id} */
    public function show(Request $req, string $id): never
    {
        $list = Mapper::scholarships("id = ? AND status <> 'draft'", [(int) $id]);
        if (!$list) throw new HttpException(404, 'not_found');
        Response::json($list[0]);
    }

    /** POST /api/scholarships — employee/admin. */
    public function store(Request $req): never
    {
        $d = $this->validate($req->body());
        $id = Database::transaction(function () use ($d, $req) {
            Database::run(
                'INSERT INTO scholarships (name, name_ar, university, university_ar, country, funding, min_gpa, language_test, language_score, amount, opens_on, deadline, status, description, description_ar, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [...$this->columns($d), $req->user['id']],
            );
            $id = Database::insertId();
            $this->syncLists($id, $d);
            return $id;
        });
        Response::json(Mapper::scholarships('id = ?', [$id])[0], 201);
    }

    /** PUT /api/scholarships/{id} */
    public function update(Request $req, string $id): never
    {
        if (!Database::value('SELECT id FROM scholarships WHERE id = ?', [(int) $id])) throw new HttpException(404, 'not_found');
        $d = $this->validate($req->body());
        Database::transaction(function () use ($d, $id) {
            Database::run(
                'UPDATE scholarships SET name=?, name_ar=?, university=?, university_ar=?, country=?, funding=?, min_gpa=?, language_test=?, language_score=?, amount=?, opens_on=?, deadline=?, status=?, description=?, description_ar=? WHERE id = ?',
                [...$this->columns($d), (int) $id],
            );
            $this->syncLists((int) $id, $d);
        });
        Response::json(Mapper::scholarships('id = ?', [(int) $id])[0]);
    }

    /** PUT /api/scholarships/{id}/results — admission tracker. */
    public function results(Request $req, string $id): never
    {
        $d = Validator::check($req->body(), ['results' => 'required|in:notStarted,inProgress,partial,completed']);
        Database::run('UPDATE scholarships SET results_status = ? WHERE id = ?', [$d['results'], (int) $id]);
        Response::json(['ok' => true]);
    }

    private function validate(array $b): array
    {
        $b['minGpa'] ??= $b['min_gpa'] ?? null;
        return Validator::check($b, [
            'name' => 'required|max:190', 'university' => 'required|max:190', 'country' => 'required',
            'funding' => 'required|in:full,partial,self', 'minGpa' => 'numeric|between:0,4',
            'opens' => 'date', 'deadline' => 'required|date', 'status' => 'in:draft,upcoming,open,closed',
            'levels' => 'required', 'fields' => 'required',
        ]);
    }

    private function columns(array $d): array
    {
        return [
            $d['name'], $d['nameAr'] ?? null, $d['university'], $d['universityAr'] ?? null, $d['country'], $d['funding'],
            $d['minGpa'] ?: null, $d['language']['test'] ?? null, $d['language']['score'] ?? null, $d['amount'] ?? null,
            $d['opens'] ?: null, $d['deadline'], $d['status'] ?? 'open', $d['description'] ?? null, $d['descriptionAr'] ?? null,
        ];
    }

    private function syncLists(int $id, array $d): void
    {
        foreach (['scholarship_levels' => ['level', $d['levels']], 'scholarship_fields' => ['field', $d['fields']],
                  'scholarship_nationalities' => ['nationality', $d['nationalities'] ?? ['all']]] as $table => [$col, $values]) {
            Database::run("DELETE FROM $table WHERE scholarship_id = ?", [$id]);
            foreach (array_unique((array) $values) as $v) {
                Database::run("INSERT INTO $table (scholarship_id, $col) VALUES (?, ?)", [$id, (string) $v]);
            }
        }
    }
}
