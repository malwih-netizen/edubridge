<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Small rule-based validator.
 *   Validator::check($data, ['email' => 'required|email', 'password' => 'required|min:8']);
 * Throws HttpException(422) with field → message codes.
 */
final class Validator
{
    public static function check(array $data, array $rules): array
    {
        $errors = [];
        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            $str = is_string($value) ? trim($value) : $value;
            foreach (explode('|', $ruleString) as $rule) {
                [$name, $arg] = array_pad(explode(':', $rule, 2), 2, null);
                $fail = match ($name) {
                    'required' => $str === null || $str === '' || $str === [],
                    'email'    => $str !== null && $str !== '' && !filter_var($str, FILTER_VALIDATE_EMAIL),
                    'min'      => is_string($str) && mb_strlen($str) < (int) $arg,
                    'max'      => is_string($str) && mb_strlen($str) > (int) $arg,
                    'numeric'  => $str !== null && $str !== '' && !is_numeric($str),
                    'between'  => $str !== null && $str !== '' && (!is_numeric($str) || $str < explode(',', $arg)[0] || $str > explode(',', $arg)[1]),
                    'in'       => $str !== null && $str !== '' && !in_array($str, explode(',', $arg), true),
                    'date'     => $str !== null && $str !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $str),
                    default    => false,
                };
                if ($fail) { $errors[$field] = $name; break; }
            }
        }
        if ($errors) throw new HttpException(422, 'validation_failed', $errors);
        return $data;
    }
}
