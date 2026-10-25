<?php
// Exports the real match matrix (students x scholarships) for the AI report.
require 'D:/edubridge-frontend/edubridge-api/src/bootstrap.php';
use App\Core\Database; use App\Services\{Mapper, Matching};
$sch = Mapper::scholarships("status <> 'draft'");
$out = ['weights' => Matching::WEIGHTS, 'scholarships' => array_map(fn($s) => ['id'=>$s['id'],'name'=>$s['name'],'country'=>$s['country'],'minGpa'=>$s['minGpa'],'language'=>$s['language'],'levels'=>$s['levels'],'fields'=>$s['fields'],'funding'=>$s['funding']], $sch), 'students' => []];
foreach (Database::all('SELECT user_id FROM students ORDER BY user_id') as $r) {
  $st = Mapper::student((int)$r['user_id']);
  $row = ['id'=>$st['id'],'name'=>$st['firstName'].' '.$st['lastName'],'field'=>$st['field'],'level'=>$st['level'],'gpa'=>$st['gpa'],'language'=>$st['language'],'nationality'=>$st['nationality'],'countries'=>$st['preferredCountries'],'funding'=>$st['funding'],'readiness'=>Matching::readiness($st['id']),'matches'=>[]];
  foreach ($sch as $s) { $m = Matching::score($st, $s); $row['matches'][$s['id']] = $m; }
  $out['students'][] = $row;
}
file_put_contents('D:/edubridge-frontend/docs-build/data/matches.json', json_encode($out, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
echo count($out['students']), " students x ", count($sch), " scholarships exported\n";
