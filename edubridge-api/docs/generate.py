"""
Generates the API documentation from ONE endpoint list:
  - public/openapi.json                          (Swagger UI at http://localhost:8000/docs)
  - docs/EduBridge.postman_collection.json        (import into Postman)
  - docs/EduBridge.local.postman_environment.json
Run after adding or changing an endpoint:   python docs/generate.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'http://localhost:8000/api'

STUDENT = {'email': 'student@edubridge.app', 'password': 'demo1234'}
ERR_401 = {'error': {'code': 'unauthenticated', 'message': 'unauthenticated'}}
ERR_403 = {'error': {'code': 'forbidden', 'message': 'forbidden'}}
ERR_422 = {'error': {'code': 'validation_failed', 'message': 'validation_failed', 'details': {'email': 'email'}}}

SCHOLARSHIP = {
    'id': 2, 'name': 'DAAD Graduate Scholarship', 'nameAr': 'منحة DAAD للدراسات العليا',
    'university': 'Technical University of Munich', 'universityAr': 'الجامعة التقنية في ميونخ', 'country': 'germany',
    'levels': ['master', 'phd'], 'fields': ['engineering', 'computerScience', 'science'], 'minGpa': 3.0,
    'language': {'test': 'IELTS', 'score': 6.5}, 'nationalities': ['all'], 'funding': 'full',
    'opens': '2026-07-15', 'deadline': '2026-12-01', 'status': 'open', 'results': 'notStarted',
    'amount': 'EUR 992 / month', 'description': 'Monthly stipend, travel allowance and health insurance…',
    'descriptionAr': 'راتب شهري وبدل سفر وتأمين صحي…', 'tags': [],
}
USER = {'id': 1, 'role': 'student', 'email': 'student@edubridge.app', 'name': 'Sarah Ahmed', 'nameAr': 'سارة أحمد', 'title': None, 'titleAr': None}
USERROW = {'id': 2, 'name': 'Maya Khalil', 'nameAr': 'مايا خليل', 'email': 'advisor@edubridge.app', 'role': 'employee', 'department': 'studentServices', 'status': 'active', 'lastActive': '2026-11-08T10:12:00'}

# auth: public | any (signed in) | student | staff (employee/admin) | admin
ENDPOINTS = [
    # ---------------- System ----------------
    dict(tag='System', method='GET', path='/health', auth='public', summary='API and database status',
         responses={200: {'status': 'ok', 'database': '10.4.32-MariaDB', 'time': '2026-10-25T17:36:20+02:00'}}),

    # ---------------- Auth ----------------
    dict(tag='Auth', method='POST', path='/auth/login', auth='public', summary='Sign in (saves the token in Postman automatically)',
         body=STUDENT, save_token=True,
         responses={200: {'token': '<JWT>', 'user': USER}, 401: {'error': {'code': 'invalid_credentials', 'message': 'invalid_credentials'}}}),
    dict(tag='Auth', method='POST', path='/auth/register', auth='public', summary='Create a student account',
         pm_body={'firstName': 'Lina', 'lastName': 'Saleh', 'email': 'lina.{{$timestamp}}@example.com', 'password': 'secret123', 'gender': 'female',
                  'nationality': 'palestine', 'currentLevel': 'bachelor', 'level': 'master', 'field': 'engineering', 'gpa': '3.5',
                  'countries': ['germany', 'canada'], 'funding': 'full', 'help': 'full'},
         pm_tests=["if (pm.response.code === 201) { pm.collectionVariables.set('newEmail', pm.response.json().user.email); }"],
         body={'firstName': 'Lina', 'lastName': 'Saleh', 'email': 'lina@example.com', 'password': 'secret123', 'gender': 'female',
               'nationality': 'palestine', 'currentLevel': 'bachelor', 'level': 'master', 'field': 'engineering', 'gpa': '3.5',
               'countries': ['germany', 'canada'], 'funding': 'full', 'help': 'full'},
         responses={201: {'token': '<JWT>', 'user': {**USER, 'id': 11, 'email': 'lina@example.com', 'name': 'Lina Saleh', 'nameAr': None}},
                    409: {'error': {'code': 'email_taken', 'message': 'email_taken', 'details': {'email': 'taken'}}}, 422: ERR_422}),
    dict(tag='Auth', method='GET', path='/auth/me', auth='any', summary='Current user', responses={200: USER, 401: ERR_401}),
    dict(tag='Auth', method='POST', path='/auth/forgot-password', auth='public', summary='Send a 6-digit reset code (returned as devCode in local mode)',
         body={'email': 'student@edubridge.app'}, pm_body={'email': '{{newEmail}}'},
         pm_tests=["const b = pm.response.json(); if (b.devCode) { pm.collectionVariables.set('resetCode', b.devCode); }"],
         responses={200: {'sent': True, 'devCode': '482913'}}),
    dict(tag='Auth', method='POST', path='/auth/verify-code', auth='public', summary='Check the reset code',
         body={'email': 'student@edubridge.app', 'code': '482913'}, pm_body={'email': '{{newEmail}}', 'code': '{{resetCode}}'},
         pm_tests=["const b = pm.response.json(); if (b.resetToken) { pm.collectionVariables.set('resetToken', b.resetToken); }"],
         responses={200: {'resetToken': '7.9f2c…'}, 422: {'error': {'code': 'invalid_code', 'message': 'invalid_code'}}}),
    dict(tag='Auth', method='POST', path='/auth/reset-password', auth='public', summary='Set a new password',
         body={'resetToken': '7.9f2c…', 'password': 'newSecret123'}, pm_body={'resetToken': '{{resetToken}}', 'password': 'newSecret123'},
         responses={200: {'ok': True}}),
    dict(tag='Auth', method='POST', path='/auth/resend-confirmation', auth='public', summary='Resend the email confirmation',
         body={'email': 'student@edubridge.app'}, responses={200: {'sent': True}}),

    # ---------------- Scholarships ----------------
    dict(tag='Scholarships', method='GET', path='/scholarships', auth='public', summary='Public scholarship directory with filters',
         query=[('level', 'bachelor | master | phd', 'master'), ('country', 'e.g. germany, canada, uk', 'germany'),
                ('field', 'e.g. engineering, computerScience', ''), ('funding', 'full | partial | self', ''),
                ('status', 'open | upcoming | closed', ''), ('q', 'search in name / university (EN or AR)', ''),
                ('deadlineWithin', 'deadline in the next N days', ''), ('deadlineFrom', 'YYYY-MM-DD', ''), ('deadlineTo', 'YYYY-MM-DD', ''),
                ('page', 'page number — when given the reply is { data, page, perPage, total, pages }', ''), ('perPage', '1–100, default 10', '')],
         responses={200: [SCHOLARSHIP]}),
    dict(tag='Scholarships', method='GET', path='/scholarships/{id}', auth='public', summary='One scholarship',
         params=[('id', 2)], responses={200: SCHOLARSHIP, 404: {'error': {'code': 'not_found', 'message': 'not_found'}}}),
    dict(tag='Scholarships', method='POST', path='/auth/login', auth='public', summary='Sign in as advisor (saves staffToken)', postman_only=True,
         body={'email': 'advisor@edubridge.app', 'password': 'demo1234'},
         pm_tests=["const b = pm.response.json(); if (b.token) { pm.collectionVariables.set('staffToken', b.token); }"],
         responses={200: {'token': '<JWT>', 'user': {**USER, 'id': 2, 'role': 'employee', 'email': 'advisor@edubridge.app', 'name': 'Maya Khalil'}}}),
    dict(tag='Scholarships', method='POST', path='/scholarships', auth='staff', summary='Create a scholarship (advisor / admin)',
         body={k: v for k, v in SCHOLARSHIP.items() if k not in ('id', 'results', 'tags')} | {'name': 'New Scholarship'},
         responses={201: SCHOLARSHIP, 403: ERR_403, 422: ERR_422}),
    dict(tag='Scholarships', method='PUT', path='/scholarships/{id}', auth='staff', summary='Update a scholarship',
         params=[('id', 2)], body={k: v for k, v in SCHOLARSHIP.items() if k not in ('id', 'results', 'tags')},
         responses={200: SCHOLARSHIP, 403: ERR_403}),
    dict(tag='Scholarships', method='PUT', path='/scholarships/{id}/results', auth='staff', summary='Admission results status',
         params=[('id', 2)], body={'results': 'partial'}, responses={200: {'ok': True}}),

    # ---------------- Student ----------------
    dict(tag='Student', method='GET', path='/students/me', auth='student', summary='My profile',
         responses={200: {'id': 1, 'firstName': 'Sarah', 'lastName': 'Ahmed', 'firstNameAr': 'سارة', 'lastNameAr': 'أحمد',
                          'email': 'student@edubridge.app', 'nationality': 'palestine', 'level': 'master', 'field': 'computerScience',
                          'gpa': 3.7, 'gpaScale': 4.0, 'language': {'test': 'IELTS', 'score': 6.5},
                          'preferredCountries': ['canada', 'germany'], 'funding': 'full', 'intake': 'Fall 2027', 'stage': 2}, 401: ERR_401, 403: ERR_403}),
    dict(tag='Student', method='PUT', path='/students/me', auth='student', summary='Update my profile',
         body={'firstName': 'Sarah', 'lastName': 'Ahmed', 'phone': '+970 59 123 4567', 'nationality': 'palestine', 'level': 'master',
               'field': 'computerScience', 'gpa': 3.7, 'language': {'test': 'IELTS', 'score': 7.0},
               'preferredCountries': ['canada', 'germany', 'uk'], 'funding': 'full', 'intake': 'Fall 2027'},
         responses={200: {'id': 1, 'firstName': 'Sarah', '…': '…'}}),
    dict(tag='Student', method='GET', path='/students/me/documents', auth='student', summary='My documents (missing ones listed too)',
         responses={200: [{'id': 1, 'type': 'passport', 'file': 'Passport_Sarah.pdf', 'size': '1.2 MB', 'status': 'approved', 'reason': None, 'uploadedAt': '2026-09-02'},
                          {'id': 'missing-cv', 'type': 'cv', 'file': None, 'status': 'missing'}]}),
    dict(tag='Student', method='POST', path='/students/me/documents', auth='student', summary='Upload a document (PDF, JPG, PNG, DOCX — max 10 MB)',
         multipart=[('type', 'cv', 'passport | transcript | degree | cv | language | motivation | recommendation | other'), ('file', None, 'the file')],
         responses={201: {'id': 6, 'type': 'cv', 'file': 'CV.pdf', 'size': '120 KB', 'status': 'underReview', 'reason': None, 'uploadedAt': '2026-10-25'},
                    422: {'error': {'code': 'validation_failed', 'message': 'validation_failed', 'details': {'file': 'type'}}}},
         pm_tests=["pm.collectionVariables.set('docId', pm.response.json().id);"]),
    dict(tag='Student', method='GET', path='/students/me/documents/{id}/file', auth='student', summary='Open / download my document', params=[('id', 6)],
         pm_params={'id': '{{docId}}'}, responses={200: '<file bytes>', 404: {'error': {'code': 'not_found', 'message': 'not_found'}}}),
    dict(tag='Student', method='GET', path='/students/me/readiness', auth='student', summary='Readiness score and missing documents',
         responses={200: {'score': 65, 'missing': ['cv', 'language']}}),
    dict(tag='Student', method='GET', path='/students/me/recommendations', auth='student', summary='Scholarships ranked by match score',
         responses={200: [{**SCHOLARSHIP, 'match': {'score': 100, 'level': 'eligible',
                                                     'parts': {'field': 1, 'gpa': 1, 'level': 1, 'nationality': 1, 'language': 1, 'country': 1, 'funding': 1}}}]}),
    dict(tag='Student', method='GET', path='/students/me/applications', auth='student', summary='My applications (8 stages)',
         responses={200: [{'id': 'APP-2041', 'scholarshipId': 1, 'stage': 2, 'result': None, 'updatedAt': '2026-10-22',
                           'advisor': 'Maya Khalil', 'advisorAr': 'مايا خليل', 'scholarship': {'id': 1, '…': '…'}, 'documentIds': [1, 2]}]},
         pm_tests=["const a = pm.response.json(); pm.collectionVariables.set('appId', a.length ? a[0].id : 'none');"]),
    dict(tag='Student', method='PUT', path='/students/me/applications/{code}/documents', auth='student',
         summary='Reuse my documents in an application (replaces the list)', params=[('code', 'APP-2041')], pm_params={'code': '{{appId}}'},
         body={'documentIds': [1, 2, 6]}, pm_body={'documentIds': ['{{docId}}']},
         responses={200: {'id': 'APP-2041', 'documentIds': [1, 2, 6]}, 422: {'error': {'code': 'validation_failed', 'message': 'validation_failed', 'details': {'documentIds': 'in'}}}}),
    dict(tag='Student', method='GET', path='/students/me/service-requests', auth='student', summary='My service requests',
         responses={200: [{'id': 'SR-1', 'service': 'cv', 'status': 'inProgress', 'priority': 'medium', 'createdAt': '2026-10-18', 'assignee': 'Maya Khalil'}]}),
    dict(tag='Student', method='POST', path='/service-requests', auth='student', summary='Request a service',
         body={'service': 'cv', 'priority': 'high', 'scholarshipId': 2, 'notes': 'I need an academic CV for DAAD.'},
         responses={201: {'id': 'SR-4', 'status': 'newRequest', 'service': 'cv'}}),

    # ---------------- Documents (advisor / admin) ----------------
    dict(tag='Documents', method='GET', path='/students/{id}/documents', auth='staff', summary="A student's documents", params=[('id', 1)],
         responses={200: [{'id': 1, 'type': 'passport', 'file': 'Passport_Sarah.pdf', 'size': '1.2 MB', 'status': 'approved', 'reason': None, 'uploadedAt': '2026-09-02'}]}),
    dict(tag='Documents', method='GET', path='/documents/{id}/file', auth='staff', summary='Open a document', params=[('id', 6)],
         pm_params={'id': '{{docId}}'}, responses={200: '<file bytes>'}),
    dict(tag='Documents', method='PUT', path='/documents/{id}/review', auth='staff', summary='Approve or reject a document (the student is notified)',
         params=[('id', 6)], pm_params={'id': '{{docId}}'}, body={'status': 'rejected', 'reason': 'Please upload the signed version.'},
         responses={200: {'id': 6, 'type': 'cv', 'file': 'CV.pdf', 'size': '120 KB', 'status': 'rejected', 'reason': 'Please upload the signed version.', 'uploadedAt': '2026-10-25'},
                    422: {'error': {'code': 'validation_failed', 'message': 'validation_failed', 'details': {'reason': 'required'}}}}),
    dict(tag='Documents', method='DELETE', path='/students/me/documents/{id}', auth='student', summary='Delete my document (approved ones are locked)',
         params=[('id', 6)], pm_params={'id': '{{docId}}'},
         responses={200: {'ok': True}, 409: {'error': {'code': 'document_approved', 'message': 'document_approved'}}}),

    # ---------------- Administration ----------------
    dict(tag='Admin', method='POST', path='/auth/login', auth='public', summary='Sign in as admin (saves adminToken)', postman_only=True,
         body={'email': 'admin@edubridge.app', 'password': 'demo1234'},
         pm_tests=["const b = pm.response.json(); if (b.token) { pm.collectionVariables.set('adminToken', b.token); }"],
         responses={200: {'token': '<JWT>', 'user': {**USER, 'id': 3, 'role': 'admin', 'email': 'admin@edubridge.app', 'name': 'Admin User'}}}),
    dict(tag='Admin', method='GET', path='/admin/users', auth='admin', summary='All users',
         query=[('role', 'student | employee | admin', ''), ('status', 'active | pending | invited | suspended', ''),
                ('department', 'studentServices | admissions | visa | scholarships | compliance', ''), ('q', 'name or email', '')],
         responses={200: [USERROW]}),
    dict(tag='Admin', method='POST', path='/admin/users', auth='admin', summary='Invite a user (temporary password sent by email)',
         body={'name': 'Omar Saleh', 'email': 'omar.saleh@edubridge.app', 'role': 'employee', 'department': 'visa'},
         pm_body={'name': 'Postman Test', 'email': 'postman.{{$timestamp}}@edubridge.app', 'role': 'employee', 'department': 'visa'},
         pm_tests=["pm.collectionVariables.set('newUserId', pm.response.json().id);"],
         responses={201: {**USERROW, 'id': 11, 'status': 'invited', 'lastActive': None, 'emailSent': True},
                    409: {'error': {'code': 'email_taken', 'message': 'email_taken'}}}),
    dict(tag='Admin', method='PUT', path='/admin/users/{id}', auth='admin', summary='Change role / department, suspend or activate',
         params=[('id', 11)], pm_params={'id': '{{newUserId}}'}, body={'status': 'suspended'},
         responses={200: {**USERROW, 'id': 11, 'status': 'suspended'}, 409: {'error': {'code': 'cannot_change_own_account', 'message': 'cannot_change_own_account'}}}),

    # ---------------- Account ----------------
    dict(tag='Account', method='GET', path='/account/sessions', auth='any', summary='Signed-in devices',
         pm_tests=["const other = pm.response.json().find(s => !s.current); pm.collectionVariables.set('otherSessionId', other ? other.id : '0');"],
         responses={200: [{'id': '12', 'type': 'laptop', 'browser': 'Chrome', 'os': 'Windows', 'city': '127.0.0.1', 'current': True, 'lastActive': '2026-10-25T17:40:00+02:00'}]}),
    dict(tag='Account', method='DELETE', path='/account/sessions/{id}', auth='any', summary='Sign out one device', params=[('id', 12)],
         pm_params={'id': '{{otherSessionId}}'}, responses={200: {'ok': True}}),
    dict(tag='Account', method='POST', path='/account/sessions/revoke-others', auth='any', summary='Sign out all other devices', responses={200: {'ok': True}}),
    dict(tag='Account', method='PUT', path='/account/profile', auth='any', summary='Update name / phone',
         body={'firstName': 'Sarah', 'lastName': 'Ahmed', 'nameAr': 'سارة أحمد', 'phone': '+970 59 123 4567'}, responses={200: {'ok': True}}),
    dict(tag='Account', method='POST', path='/account/email', auth='any', summary='Change email (needs confirmation)',
         body={'email': 'new.email@example.com', 'password': 'demo1234'}, responses={200: {'pending': True, 'email': 'new.email@example.com'}}),
    dict(tag='Account', method='POST', path='/account/password', auth='any', summary='Change password',
         body={'current': 'demo1234', 'next': 'newSecret123'}, pm_body={'current': 'demo1234', 'next': 'demo1234'},
         responses={200: {'ok': True}}),
    dict(tag='Account', method='PUT', path='/account/security', auth='any', summary='Two-step verification and sign-in alerts',
         body={'twoFa': True, 'alerts': True}, responses={200: {'ok': True}}),
    dict(tag='Account', method='PUT', path='/account/notifications', auth='any', summary='Notification settings',
         body={'requests': {'email': True, 'inApp': True}, 'deadlines': {'email': True, 'inApp': True}, 'messages': {'email': False, 'inApp': True}},
         responses={200: {'ok': True}}),

    # ---------------- Public ----------------
    dict(tag='Public', method='POST', path='/contact', auth='public', summary='Contact us form',
         body={'name': 'Visitor One', 'email': 'visitor@example.com', 'phone': '+970 59 111 2222', 'subject': 'scholarships',
               'message': 'Hello, I would like to ask about master scholarships in Germany.'},
         responses={201: {'id': 1, 'received': True}, 422: {'error': {'code': 'validation_failed', 'message': 'validation_failed', 'details': {'name': 'min'}}}}),
    dict(tag='Finish', method='POST', path='/auth/logout', auth='any', summary='Sign out this device (revokes the token)', responses={200: {'ok': True}}),
]

AUTH_NOTE = {'public': 'Public', 'any': 'Any signed-in user', 'student': 'Student only', 'staff': 'Advisor or admin', 'admin': 'Admin only'}


def openapi():
    paths = {}
    for e in ENDPOINTS:
        if e.get('postman_only'):
            continue
        tag = 'Auth' if e['tag'] == 'Finish' else e['tag']
        op = {'tags': [tag], 'summary': e['summary'], 'description': f"**Access:** {AUTH_NOTE[e['auth']]}",
              'responses': {str(code): {'description': 'Success' if code < 300 else 'Error',
                                        'content': {'application/json': {'example': ex}}} for code, ex in e['responses'].items()}}
        if e['auth'] == 'public':
            op['security'] = []
        params = [{'name': n, 'in': 'path', 'required': True, 'schema': {'type': 'integer' if isinstance(ex, int) else 'string'}, 'example': ex}
                  for n, ex in e.get('params', [])]
        params += [{'name': n, 'in': 'query', 'required': False, 'description': d, 'schema': {'type': 'string'}, **({'example': ex} if ex else {})}
                   for n, d, ex in e.get('query', [])]
        if params:
            op['parameters'] = params
        if 'body' in e:
            op['requestBody'] = {'required': True, 'content': {'application/json': {'example': e['body']}}}
        if 'multipart' in e:
            props = {n: ({'type': 'string', 'format': 'binary'} if ex is None else {'type': 'string', 'example': ex, 'description': d})
                     for n, ex, d in e['multipart']}
            op['requestBody'] = {'required': True, 'content': {'multipart/form-data': {'schema': {'type': 'object', 'properties': props, 'required': list(props)}}}}
        paths.setdefault(e['path'], {})[e['method'].lower()] = op
    return {
        'openapi': '3.0.3',
        'info': {'title': 'EduBridge API', 'version': '1.0.0',
                 'description': 'Smart Scholarship and Student Services Management System.\n\n'
                                '1. Run **POST /auth/login** with `student@edubridge.app` / `demo1234` (or advisor@ / admin@).\n'
                                '2. Copy the `token` and press **Authorize** at the top.\n\n'
                                'Errors always look like `{"error": {"code": "...", "details": {...}}}`.'},
        'servers': [{'url': '/api', 'description': 'This server (same domain)'},
                    {'url': 'https://edubridge.infinityfreeapp.com/api', 'description': 'Hosted — InfinityFree'},
                    {'url': BASE, 'description': 'Local (php -S localhost:8000)'}],
        'tags': [{'name': t} for t in dict.fromkeys(e['tag'] for e in ENDPOINTS) if t != 'Finish'],
        'components': {'securitySchemes': {'bearerAuth': {'type': 'http', 'scheme': 'bearer', 'bearerFormat': 'JWT'}}},
        'security': [{'bearerAuth': []}],
        'paths': paths,
    }


def postman():
    save_token = {'listen': 'test', 'script': {'type': 'text/javascript', 'exec': [
        "// يحفظ التوكن تلقائياً لباقي الطلبات",
        "const body = pm.response.json();",
        "if (body.token) { pm.collectionVariables.set('token', body.token); }",
        "pm.test('status is 2xx', () => pm.expect(pm.response.code).to.be.within(200, 299));",
    ]}}
    folders = {}
    for e in ENDPOINTS:
        path = e['path']
        for n, ex in e.get('params', []):
            path = path.replace('{' + n + '}', str(e.get('pm_params', {}).get(n, ex)))
        segs = [s for s in path.strip('/').split('/')]
        query = [{'key': n, 'value': ex, 'description': d, 'disabled': not ex} for n, d, ex in e.get('query', [])]
        raw = '{{baseUrl}}' + path + (('?' + '&'.join(f"{q['key']}={q['value']}" for q in query if not q['disabled'])) if any(not q['disabled'] for q in query) else '')
        req = {'method': e['method'], 'header': [{'key': 'Accept', 'value': 'application/json'}, {'key': 'Accept-Language', 'value': 'ar'}],
               'url': {'raw': raw, 'host': ['{{baseUrl}}'], 'path': segs, **({'query': query} if query else {})},
               'description': f"{e['summary']}\n\nAccess: {AUTH_NOTE[e['auth']]}"}
        if e['auth'] == 'public':
            req['auth'] = {'type': 'noauth'}
        elif e['auth'] == 'staff':
            req['auth'] = {'type': 'bearer', 'bearer': [{'key': 'token', 'value': '{{staffToken}}', 'type': 'string'}]}
        elif e['auth'] == 'admin':
            req['auth'] = {'type': 'bearer', 'bearer': [{'key': 'token', 'value': '{{adminToken}}', 'type': 'string'}]}
        if 'body' in e:
            req['header'].append({'key': 'Content-Type', 'value': 'application/json'})
            req['body'] = {'mode': 'raw', 'raw': json.dumps(e.get('pm_body', e['body']), ensure_ascii=False, indent=2), 'options': {'raw': {'language': 'json'}}}
        if 'multipart' in e:
            req['body'] = {'mode': 'formdata', 'formdata': [
                ({'key': n, 'type': 'file', 'src': 'docs/sample-cv.pdf', 'description': 'choose a PDF / JPG / PNG / DOCX'} if ex is None
                 else {'key': n, 'value': ex, 'type': 'text', 'description': d}) for n, ex, d in e['multipart']]}
        item = {'name': f"{e['method']} {e['path']} — {e['summary']}", 'request': req,
                'response': [{'name': f"{code} example", 'code': code, 'status': 'OK' if code < 300 else 'Error',
                              'header': [{'key': 'Content-Type', 'value': 'application/json'}], '_postman_previewlanguage': 'json',
                              'body': json.dumps(ex, ensure_ascii=False, indent=2), 'originalRequest': req} for code, ex in e['responses'].items()]}
        status_test = "pm.test('status is 2xx', () => pm.expect(pm.response.code).to.be.within(200, 299));"
        tests = save_token['script']['exec'][:3] if e.get('save_token') else []
        tests = tests + e.get('pm_tests', []) + [status_test]
        item['event'] = [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': tests}}]
        folders.setdefault(e['tag'], []).append(item)
    return {
        'info': {'name': 'EduBridge API', 'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
                 'description': 'Start with Auth → POST /auth/login. The token is saved automatically and used by every other request.\n'
                                'Demo accounts (password demo1234): student@edubridge.app · advisor@edubridge.app · admin@edubridge.app'},
        'auth': {'type': 'bearer', 'bearer': [{'key': 'token', 'value': '{{token}}', 'type': 'string'}]},
        'variable': [{'key': 'baseUrl', 'value': BASE}, {'key': 'token', 'value': ''}, {'key': 'staffToken', 'value': ''}, {'key': 'adminToken', 'value': ''}, {'key': 'docId', 'value': ''}, {'key': 'appId', 'value': ''}, {'key': 'newUserId', 'value': ''},
                     {'key': 'newEmail', 'value': ''}, {'key': 'resetCode', 'value': ''}, {'key': 'resetToken', 'value': ''},
                     {'key': 'otherSessionId', 'value': '0'}],
        'item': [{'name': tag, 'item': items} for tag, items in folders.items()],
    }


def environment():
    return {'name': 'EduBridge Local', 'values': [
        {'key': 'baseUrl', 'value': BASE, 'type': 'default', 'enabled': True},
        {'key': 'token', 'value': '', 'type': 'secret', 'enabled': True}]}


if __name__ == '__main__':
    out = {
        ROOT / 'public' / 'openapi.json': openapi(),
        ROOT / 'docs' / 'EduBridge.postman_collection.json': postman(),
        ROOT / 'docs' / 'EduBridge.local.postman_environment.json': environment(),
    }
    for path, data in out.items():
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        print('✓', path.relative_to(ROOT))
    print(f'{len(ENDPOINTS)} endpoints documented')
