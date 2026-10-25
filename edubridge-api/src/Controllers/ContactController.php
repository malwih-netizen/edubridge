<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\{Database, HttpException, Request, Response, Validator};

final class ContactController
{
    /** POST /api/contact — public "Contact us" form. */
    public function store(Request $req): never
    {
        $d = Validator::check($req->body(), [
            'name' => 'required|min:3|max:160', 'email' => 'required|email|max:190', 'phone' => 'required|max:30',
            'subject' => 'in:general,scholarships,services,support', 'message' => 'required|min:10|max:4000',
        ]);
        if (strlen(preg_replace('/\D/', '', $d['phone'])) < 9) throw new HttpException(422, 'validation_failed', ['phone' => 'invalid']);
        Database::run(
            'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
            [trim($d['name']), strtolower(trim($d['email'])), trim($d['phone']), $d['subject'] ?? 'general', trim($d['message'])],
        );
        Response::json(['id' => Database::insertId(), 'received' => true], 201);
    }
}
