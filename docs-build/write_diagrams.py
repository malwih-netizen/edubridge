"""Writes every Mermaid source file into diagrams/. Edit here, then run render_diagrams.py."""
import pathlib

D = pathlib.Path(__file__).resolve().parent / 'diagrams'
D.mkdir(exist_ok=True)
for old in D.glob('*.mmd'):
    old.unlink()

DIAGRAMS = {}
ACTOR = '''  classDef actor fill:#000000,color:#fff,stroke:#000000
  classDef sys fill:#808080,color:#fff,stroke:#595959
'''

# =====================================================================
# SYSTEM ANALYSIS & DATABASE
# =====================================================================
DIAGRAMS['architecture'] = """%% size: 2000x2600
flowchart TB
  subgraph Clients["Users (web browser, desktop or mobile)"]
    S([Student]):::actor
    E([Advisor / Employee]):::actor
    A([Administrator]):::actor
  end
  subgraph FE["Presentation layer — React.js (Vite)"]
    UI["Bilingual UI<br/>Arabic RTL / English LTR"]
    RT["React Router<br/>role-protected routes"]
    AX["Axios API client<br/>JWT + Accept-Language"]
  end
  subgraph BE["Application layer — PHP 8 REST API"]
    R["Front controller<br/>Router + CORS"]
    MW["Auth middleware<br/>JWT + role check"]
    C["Controllers<br/>Auth · Students · Scholarships<br/>CRM · Account · Contact"]
    SV["Services<br/>Matching · Readiness · Notifications"]
  end
  subgraph DL["Data layer"]
    DB[("MySQL / MariaDB<br/>edubridge — 25 tables")]
    FS[("File storage<br/>storage/uploads")]
  end
  subgraph EXT["External services"]
    G["Groq API<br/>LLM explanations"]
    M["Email (SMTP)<br/>confirmations & reminders"]
    CR["Scheduler (cron)<br/>deadlines & re-matching"]
  end
  S & E & A --> UI
  UI --> RT --> AX
  AX -- "HTTPS / JSON" --> R
  R --> MW --> C --> SV
  C -- "PDO prepared statements" --> DB
  SV --> DB
  C --> FS
  SV -. "REST" .-> G
  SV -.-> M
  CR -.-> SV
  classDef actor fill:#000000,color:#fff,stroke:#000000
  style FE fill:#f2f2f2,stroke:#333333
  style BE fill:#f5f5f5,stroke:#808080
  style DL fill:#f5f5f5,stroke:#333333
  style EXT fill:#ffffff,stroke:#8c8c8c,stroke-dasharray: 4 3
"""

DIAGRAMS['use_case_student'] = """%% size: 2000x1800
flowchart LR
  ST(["Student"]):::actor
  subgraph SYS["EduBridge System — Student use cases"]
    direction TB
    U1(["Register & confirm email"])
    U2(["Sign in / reset password"])
    U3(["Manage profile"])
    U4(["Upload & manage documents"])
    U5(["Search & filter scholarships"])
    U6(["View recommendations & match score"])
    U7(["View readiness score"])
    U8(["Request a service"])
    U9(["Track application & message advisor"])
    U10(["Manage account settings"])
  end
  ST --- U1 & U2 & U3 & U4 & U5 & U6 & U7 & U8 & U9 & U10
""" + ACTOR + """  style SYS fill:#f5f5f5,stroke:#333333
"""

DIAGRAMS['use_case_staff'] = """%% size: 2000x1800
flowchart LR
  EM(["Advisor / Employee"]):::actor
  subgraph SYS["EduBridge System — Advisor use cases"]
    direction TB
    E1(["Sign in"])
    E2(["View assigned students (CRM 360)"])
    E3(["Review documents (approve / reject)"])
    E4(["Assign & update service requests"])
    E5(["Update application stage"])
    E6(["Log communication & notes"])
    E7(["Create & edit scholarships"])
    E8(["Track admission results"])
    E9(["Review AI recommendations"])
  end
  EM --- E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8 & E9
""" + ACTOR + """  style SYS fill:#f5f5f5,stroke:#333333
"""

DIAGRAMS['use_case_admin'] = """%% size: 2200x1600
flowchart LR
  AD(["Administrator"]):::actor
  subgraph SYS["EduBridge System — Admin & automated use cases"]
    direction TB
    A1(["Manage users & roles"])
    A2(["Set permissions per module"])
    A3(["Manage scholarships"])
    A4(["View reports & statistics"])
    A5(["Export reports"])
    S1(["Compute match & readiness"])
    S2(["Send notifications & reminders"])
    S3(["Close expired scholarships"])
  end
  AI(["Scheduler + matching engine"]):::sys
  AD --- A1 & A2 & A3 & A4 & A5
  S1 & S2 & S3 --- AI
""" + ACTOR + """  style SYS fill:#f5f5f5,stroke:#333333
"""

DIAGRAMS['erd_overview'] = """%% size: 3000x2600
erDiagram
  users ||--o| students : "is a"
  users ||--o{ user_sessions : "signs in"
  users ||--o{ notifications : receives
  students ||--o{ documents : uploads
  document_types ||--o{ documents : classifies
  students ||--o{ match_scores : "is scored"
  scholarships ||--o{ match_scores : "is scored"
  students ||--o{ applications : submits
  scholarships ||--o{ applications : receives
  applications ||--o{ application_stage_history : tracks
  students ||--o{ service_requests : requests
  services ||--o{ service_requests : "type of"
  students ||--o{ notes : "has"
  students ||--o{ communications : "has"
"""

DIAGRAMS['erd_users'] = """%% size: 2400x2200
erDiagram
  users {
    INT id PK
    ENUM role "student|employee|admin"
    VARCHAR first_name
    VARCHAR last_name
    VARCHAR name_ar
    VARCHAR email UK
    VARCHAR phone
    VARCHAR password_hash "bcrypt"
    ENUM status "active|pending|suspended|invited"
    ENUM department
    TINYINT two_factor
    DATETIME email_verified_at
    DATETIME last_login_at
  }
  user_sessions {
    INT id PK
    INT user_id FK
    CHAR token_id UK "JWT jti"
    ENUM device_type
    VARCHAR browser
    VARCHAR os
    VARCHAR ip_address
    DATETIME last_active_at
    DATETIME revoked_at
  }
  password_resets {
    INT id PK
    VARCHAR email
    VARCHAR code_hash
    DATETIME expires_at
    DATETIME used_at
  }
  email_verifications {
    INT id PK
    INT user_id FK
    VARCHAR email
    VARCHAR token_hash
    DATETIME expires_at
  }
  notifications {
    INT id PK
    INT user_id FK
    ENUM type
    VARCHAR title
    VARCHAR title_ar
    VARCHAR link
    DATETIME read_at
  }
  notification_settings {
    INT user_id PK,FK
    ENUM category PK
    TINYINT email
    TINYINT in_app
  }
  audit_log {
    BIGINT id PK
    INT user_id FK
    VARCHAR action
    VARCHAR entity
    INT entity_id
    JSON meta
  }
  users ||--o{ user_sessions : "has"
  users ||--o{ email_verifications : "has"
  users ||--o{ notifications : "receives"
  users ||--o{ notification_settings : "configures"
  users ||--o{ audit_log : "performs"
  password_resets }o..|| users : "matches email"
"""

DIAGRAMS['erd_students'] = """%% size: 2400x2200
erDiagram
  users ||--o| students : "1 : 0..1"
  students {
    INT user_id PK,FK
    VARCHAR first_name_ar
    ENUM gender
    DATE birth_date
    VARCHAR nationality
    ENUM current_level
    ENUM target_level
    VARCHAR field
    DECIMAL gpa
    DECIMAL gpa_scale
    VARCHAR institution
    VARCHAR language_test
    DECIMAL language_score
    ENUM funding_pref
    INT assigned_to FK "advisor"
    ENUM priority
    TINYINT stage "0..7"
  }
  student_countries {
    INT student_id PK,FK
    VARCHAR country PK
  }
  document_types {
    VARCHAR code PK
    VARCHAR name_en
    VARCHAR name_ar
    TINYINT readiness_weight
    TINYINT is_required
  }
  documents {
    INT id PK
    INT student_id FK
    VARCHAR type_code FK
    VARCHAR file_name
    VARCHAR stored_path
    VARCHAR mime_type
    INT size_bytes
    ENUM status "underReview|approved|rejected"
    VARCHAR reject_reason
    INT reviewed_by FK
    DATETIME uploaded_at
  }
  application_documents {
    INT application_id PK,FK
    INT document_id PK,FK
  }
  students ||--o{ student_countries : "prefers (max 3)"
  students ||--o{ documents : "uploads"
  document_types ||--o{ documents : "classifies"
  documents ||--o{ application_documents : "reused in"
"""

DIAGRAMS['erd_scholarships'] = """%% size: 2400x2200
erDiagram
  scholarships {
    INT id PK
    VARCHAR name
    VARCHAR name_ar
    VARCHAR university
    VARCHAR country
    ENUM funding "full|partial|self"
    DECIMAL min_gpa
    VARCHAR language_test
    DECIMAL language_score
    VARCHAR amount
    DATE opens_on
    DATE deadline
    ENUM status "draft|upcoming|open|closed"
    ENUM results_status "notStarted..completed"
    INT created_by FK
  }
  scholarship_levels {
    INT scholarship_id PK,FK
    ENUM level PK
  }
  scholarship_fields {
    INT scholarship_id PK,FK
    VARCHAR field PK
  }
  scholarship_nationalities {
    INT scholarship_id PK,FK
    VARCHAR nationality PK "all = open"
  }
  scholarship_documents {
    INT scholarship_id PK,FK
    VARCHAR type_code PK,FK
  }
  match_scores {
    INT student_id PK,FK
    INT scholarship_id PK,FK
    TINYINT score "0..100"
    ENUM level "eligible|potential|notSuitable"
    JSON details "per-criterion parts"
    TEXT explanation "LLM text"
    DATETIME computed_at
  }
  scholarships ||--|{ scholarship_levels : "offers"
  scholarships ||--|{ scholarship_fields : "covers"
  scholarships ||--|{ scholarship_nationalities : "open to"
  scholarships ||--o{ scholarship_documents : "requires"
  scholarships ||--o{ match_scores : "scored for"
"""

DIAGRAMS['erd_crm'] = """%% size: 2400x2300
erDiagram
  services {
    VARCHAR code PK
    VARCHAR name_en
    VARCHAR name_ar
    TINYINT active
  }
  service_requests {
    INT id PK
    INT student_id FK
    VARCHAR service_code FK
    INT scholarship_id FK
    ENUM priority
    TEXT notes
    ENUM status "newRequest..completed"
    INT assigned_to FK
  }
  applications {
    INT id PK
    VARCHAR code UK "APP-2041"
    INT student_id FK
    INT scholarship_id FK
    INT advisor_id FK
    TINYINT stage "0..7"
    ENUM result "accepted|rejected"
  }
  application_stage_history {
    INT id PK
    INT application_id FK
    TINYINT from_stage
    TINYINT to_stage
    INT changed_by FK
    VARCHAR note
  }
  notes {
    INT id PK
    INT student_id FK
    INT author_id FK
    TEXT body
  }
  communications {
    INT id PK
    INT student_id FK
    INT employee_id FK
    ENUM channel "call|whatsapp|email|meeting"
    ENUM direction
    TEXT summary
    DATE follow_up_on
  }
  contact_messages {
    INT id PK
    VARCHAR name
    VARCHAR email
    VARCHAR phone
    ENUM subject
    TEXT message
  }
  services ||--o{ service_requests : "type of"
  applications ||--o{ application_stage_history : "history"
  applications }o--|| scholarships_ref : "for"
  service_requests }o--|| students_ref : "by"
  applications }o--|| students_ref : "by"
  notes }o--|| students_ref : "about"
  communications }o--|| students_ref : "about"
  students_ref { INT user_id PK "students" }
  scholarships_ref { INT id PK "scholarships" }
"""

DIAGRAMS['class_domain'] = """%% size: 2400x2400
classDiagram
  direction TB
  class User {
    +int id
    +Role role
    +string firstName
    +string lastName
    +string email
    -string passwordHash
    +Status status
    +login(email, password) Token
    +logout()
    +changePassword(current, next)
  }
  class Student {
    +string nationality
    +Level targetLevel
    +string field
    +float gpa
    +LanguageScore language
    +string[] preferredCountries
    +Funding fundingPref
    +int stage
    +uploadDocument(type, file) Document
    +requestService(service) ServiceRequest
    +readiness() Readiness
  }
  class Employee {
    +Department department
    +string title
    +reviewDocument(doc, decision)
    +assignRequest(request)
    +updateStage(application, stage)
    +logCommunication(student, entry)
  }
  class Administrator {
    +manageUsers()
    +manageRoles()
    +viewReports() Report
  }
  class Scholarship {
    +int id
    +string name
    +string country
    +Level[] levels
    +string[] fields
    +float minGpa
    +LanguageScore language
    +Funding funding
    +Date deadline
    +ScholarshipStatus status
    +ResultsStatus results
  }
  class Document {
    +int id
    +DocType type
    +string fileName
    +DocStatus status
    +string rejectReason
  }
  class Application {
    +string code
    +int stage
    +Result result
    +moveTo(stage)
  }
  class ServiceRequest {
    +int id
    +ServiceType service
    +Priority priority
    +RequestStatus status
  }
  class MatchResult {
    +int score
    +MatchLevel level
    +map parts
    +string explanation
  }
  class Notification {
    +NotificationType type
    +string title
    +Date readAt
  }
  User <|-- Student
  User <|-- Employee
  User <|-- Administrator
  Student "1" --> "0..*" Document : uploads
  Student "1" --> "0..*" Application : submits
  Student "1" --> "0..*" ServiceRequest : requests
  Scholarship "1" --> "0..*" Application : receives
  Student "1" --> "0..*" MatchResult : scored
  Scholarship "1" --> "0..*" MatchResult : scored
  Employee "1" --> "0..*" ServiceRequest : handles
  Employee "1" --> "0..*" Application : advises
  Application "0..*" o-- "0..*" Document : attaches
  User "1" --> "0..*" Notification : receives
"""

DIAGRAMS['class_backend'] = """%% size: 2400x2300
classDiagram
  direction LR
  class Router {
    -routes array
    +get(path, handler, roles)
    +post(path, handler, roles)
    +dispatch(Request) never
  }
  class Request {
    +method string
    +path string
    +user array
    +body() array
    +bearerToken() string
    +lang() string
  }
  class Response {
    +json(data, status)$
    +error(status, code, details)$
    +cors()$
  }
  class Auth {
    +issueToken(user, req)$ string
    +authenticate(req)$
    +publicUser(user)$ array
  }
  class Jwt {
    +encode(payload)$ string
    +decode(token)$ array
  }
  class Database {
    -pdo PDO
    +all(sql, params)$ array
    +one(sql, params)$ array
    +run(sql, params)$ int
    +transaction(fn)$
  }
  class Validator {
    +check(data, rules)$ array
  }
  class Matching {
    +WEIGHTS$
    +score(student, scholarship)$ array
    +recommend(id, student, list)$ array
    +readiness(studentId)$ array
  }
  class Mapper {
    +scholarships(where, params)$ array
    +student(userId)$ array
    +document(row)$ array
  }
  class AuthController {
    +register(req)
    +login(req)
    +me(req)
    +logout(req)
    +forgot(req)
    +resetPassword(req)
  }
  class StudentController {
    +profile(req)
    +documents(req)
    +upload(req)
    +readiness(req)
    +recommendations(req)
    +applications(req)
  }
  class ScholarshipController {
    +index(req)
    +show(req, id)
    +store(req)
    +update(req, id)
    +results(req, id)
  }
  class AccountController {
    +sessions(req)
    +revokeSession(req, id)
    +changeEmail(req)
    +changePassword(req)
  }
  Router --> Request
  Router ..> Auth : protected routes
  Auth ..> Jwt
  Auth ..> Database
  AuthController ..> Validator
  AuthController ..> Auth
  StudentController ..> Matching
  StudentController ..> Mapper
  ScholarshipController ..> Mapper
  Matching ..> Database
  Mapper ..> Database
  AccountController ..> Database
  AuthController ..> Response
"""

DIAGRAMS['seq_login'] = """%% size: 2200x1600
sequenceDiagram
  autonumber
  actor U as User
  participant FE as React app
  participant API as PHP API
  participant DB as MySQL
  U->>FE: Enter email + password
  FE->>FE: Validate form (format, required)
  FE->>API: POST /api/auth/login
  API->>DB: SELECT user WHERE email = ?
  DB-->>API: user row (password_hash)
  alt password_verify() fails
    API-->>FE: 401 invalid_credentials
    FE-->>U: "Email or password is incorrect"
  else valid
    API->>DB: INSERT user_sessions (jti, device, browser)
    API->>API: Sign JWT (sub, role, jti, exp)
    API-->>FE: 200 { token, user }
    FE->>FE: Save session, route by role
    FE-->>U: Student / Advisor / Admin dashboard
  end
"""

DIAGRAMS['seq_upload'] = """%% size: 2200x1800
sequenceDiagram
  autonumber
  actor S as Student
  participant FE as React app
  participant API as PHP API
  participant FS as File storage
  participant DB as MySQL
  actor E as Advisor
  S->>FE: Choose document type + file
  FE->>FE: Check type & size (≤ 10 MB)
  FE->>API: POST /students/me/documents (multipart)
  API->>API: Verify JWT + role = student
  API->>API: Detect MIME from content (finfo)
  alt not PDF/JPG/PNG/DOCX or too large
    API-->>FE: 422 validation_failed
  else accepted
    API->>FS: Save as random name outside public/
    API->>DB: INSERT documents (status = underReview)
    API-->>FE: 201 document
    FE->>API: GET /students/me/readiness
    API->>DB: Weighted sum of required documents
    API-->>FE: { score, missing[] }
    FE-->>S: Updated readiness ring
  end
  E->>API: Review document (approve / reject + reason)
  API->>DB: UPDATE documents SET status, reviewed_by
  API->>DB: INSERT notifications (student)
"""

DIAGRAMS['seq_service'] = """%% size: 2200x1700
sequenceDiagram
  autonumber
  actor S as Student
  participant API as PHP API
  participant DB as MySQL
  actor E as Advisor
  S->>API: POST /service-requests {service, priority, notes}
  API->>DB: INSERT service_requests (newRequest)
  API-->>S: 201 SR-ID
  E->>API: GET /service-requests (board)
  API->>DB: SELECT unassigned / mine
  E->>API: Assign to me
  API->>DB: UPDATE assigned_to, status = inProgress
  API->>DB: INSERT notifications (student)
  E->>API: Log call / WhatsApp summary
  API->>DB: INSERT communications
  E->>API: Mark completed
  API->>DB: UPDATE status = completed
  API-->>S: Notification "Service completed"
"""

DIAGRAMS['activity_register'] = """%% size: 1800x2800
flowchart TD
  A((Start)) --> B["Open sign-up page"]
  B --> C["Step 1 · Account<br/>name, email, password"]
  C --> D{"Valid & email<br/>not taken?"}
  D -- No --> C
  D -- Yes --> E["Step 2 · Personal<br/>gender, nationality, phone"]
  E --> F["Step 3 · Academic<br/>level, field, GPA, language"]
  F --> G["Step 4 · Goals<br/>countries, intake, funding"]
  G --> H["Step 5 · Review"]
  H --> I{"Confirm?"}
  I -- Edit --> C
  I -- Yes --> J["API creates user + student<br/>(one transaction)"]
  J --> K["Send confirmation email"]
  K --> L["Show 'Confirm your email'"]
  L --> M["Compute first recommendations"]
  M --> N["Student dashboard"]
  N --> O((End))
"""

DIAGRAMS['activity_journey'] = """%% size: 1800x3600
flowchart TD
  A((Start)):::st --> B["Student browses scholarships"]:::st
  B --> C["Student signs in & completes profile"]:::st
  C --> D["Student uploads documents"]:::st
  D --> E["System computes readiness & match scores"]:::sy
  E --> F["Student requests application assistance"]:::st
  F --> G["System notifies the advisor"]:::sy
  G --> H["Advisor reviews request & documents"]:::ad
  H --> I{"Documents complete?"}
  I -- No --> J["Advisor requests missing items<br/>(stage: waiting for student)"]:::ad
  J --> K["System sends reminders"]:::sy
  K --> L["Student uploads missing items"]:::st
  L --> E
  I -- Yes --> M["Advisor marks ready to apply"]:::ad
  M --> N["Advisor submits the application"]:::ad
  N --> O["Waiting for result"]:::ad
  O --> P{"Result?"}
  P -- Accepted --> Q["Advisor records acceptance"]:::ad
  P -- Rejected --> R["Advisor records rejection<br/>& suggests alternatives"]:::ad
  Q & R --> S["Student is notified"]:::sy
  S --> T((End)):::st
  classDef st fill:#f2f2f2,stroke:#333333,color:#000000
  classDef ad fill:#e6e6e6,stroke:#808080,color:#000000
  classDef sy fill:#ececec,stroke:#4d4d4d,color:#000000
"""

DIAGRAMS['state_application'] = """%% size: 2000x2600
stateDiagram-v2
  direction TB
  [*] --> NewRequest: student applies
  NewRequest --> Contacted: advisor calls
  Contacted --> PreparingDocuments
  PreparingDocuments --> WaitingForStudent: items missing
  WaitingForStudent --> PreparingDocuments: student uploads
  PreparingDocuments --> ReadyToApply: file complete
  ReadyToApply --> Submitted: application sent
  Submitted --> WaitingForResult
  WaitingForResult --> Accepted: offer received
  WaitingForResult --> Rejected
  Accepted --> [*]
  Rejected --> [*]
  note right of WaitingForResult
    Admission tracker updates
    results_status of the scholarship
  end note
"""

DIAGRAMS['state_document'] = """%% size: 1600x1400
stateDiagram-v2
  [*] --> Missing
  Missing --> UnderReview: student uploads
  UnderReview --> Approved: advisor approves
  UnderReview --> Rejected: advisor rejects (reason)
  Rejected --> UnderReview: student re-uploads
  Approved --> UnderReview: student replaces file
  Approved --> [*]
"""

DIAGRAMS['state_request'] = """%% size: 1600x1400
stateDiagram-v2
  [*] --> NewRequest
  NewRequest --> InProgress: assigned to advisor
  InProgress --> WaitingForStudent: info needed
  WaitingForStudent --> InProgress: student replies
  InProgress --> Completed
  Completed --> [*]
"""

DIAGRAMS['state_scholarship'] = """%% size: 2000x1600
stateDiagram-v2
  [*] --> Draft: created by staff
  Draft --> Upcoming: published before opening date
  Draft --> Open: published, window open
  Upcoming --> Open: opens_on reached
  Open --> Closed: deadline passed
  state Closed {
    [*] --> NotStarted
    NotStarted --> InProgress: results start
    InProgress --> PartiallyAnnounced
    PartiallyAnnounced --> Completed
    InProgress --> Completed
  }
  Closed --> [*]
"""

DIAGRAMS['state_account'] = """%% size: 1600x1400
stateDiagram-v2
  [*] --> Invited: admin invites staff
  [*] --> Pending: student registers
  Invited --> Active: accepts invitation
  Pending --> Active: email confirmed
  Active --> Suspended: admin suspends
  Suspended --> Active: admin re-activates
  Active --> [*]: deactivated
"""

# =====================================================================
# AI & AUTOMATION
# =====================================================================
DIAGRAMS['ai_architecture'] = """%% size: 2000x2600
flowchart TB
  subgraph IN["Inputs (MySQL)"]
    P["Student profile<br/>field · GPA · level · nationality<br/>language · countries · funding"]
    D["Documents + status"]
    SC["Scholarship criteria<br/>levels · fields · min GPA<br/>language · nationality · funding"]
  end
  subgraph CORE["EduBridge decision-support engine (PHP)"]
    M["1 · Rule-based matcher<br/>weighted score 0–100<br/>Field 25 · GPA 20 · Level 15<br/>Nationality 15 · Language 10<br/>Country 10 · Funding 5"]
    R["2 · Readiness calculator<br/>weighted required documents"]
    C[("match_scores<br/>cache")]
    L["3 · LLM layer (Groq API)<br/>explain match in AR/EN<br/>check document completeness"]
    GU["Guardrails<br/>no guarantee wording<br/>JSON schema · PII minimised"]
  end
  subgraph OUT["Outputs"]
    O1["Ranked recommendations<br/>Eligible / Potential / Not suitable"]
    O2["Readiness % + missing list"]
    O3["Advisor review<br/>(human in the loop)"]
  end
  P & SC --> M --> C
  D --> R
  C --> L --> GU --> O1
  R --> O2
  O1 --> O3
  style CORE fill:#f5f5f5,stroke:#808080
  style IN fill:#f2f2f2,stroke:#333333
  style OUT fill:#f5f5f5,stroke:#333333
"""

DIAGRAMS['ai_seq_recommend'] = """%% size: 2400x2200
sequenceDiagram
  autonumber
  actor S as Student
  participant API as PHP API
  participant M as Matching service
  participant DB as MySQL
  participant G as Groq API (LLM)
  S->>API: GET /students/me/recommendations
  API->>DB: Load profile + open scholarships
  API->>M: score(student, scholarship) × N
  M-->>API: score, level, parts per criterion
  API->>DB: UPSERT match_scores
  loop top 3 without explanation
    API->>DB: explanation cached?
    alt not cached
      API->>G: chat.completions (system prompt + criteria JSON)
      alt Groq OK (≤ 8 s)
        G-->>API: { summary_ar, summary_en, gaps[] }
        API->>API: Validate JSON + guardrails
        API->>DB: UPDATE match_scores.explanation
      else timeout / rate limit
        API->>API: Fallback template explanation
      end
    end
  end
  API-->>S: Ranked list + scores + explanations
  Note over S,G: The score always comes from the rule engine.<br/>The LLM only explains it. It never changes the score.
"""

DIAGRAMS['ai_seq_documents'] = """%% size: 2400x1800
sequenceDiagram
  autonumber
  actor S as Student
  participant API as PHP API
  participant X as Text extraction
  participant G as Groq API
  participant DB as MySQL
  actor E as Advisor
  S->>API: Upload "Language certificate"
  API->>DB: INSERT documents (underReview)
  API->>X: Extract text (PDF text layer)
  X-->>API: plain text (first pages)
  API->>G: "Is this an IELTS/TOEFL result? Return test, score, date, name"
  G-->>API: { type: "IELTS", score: 6.5, date: "2025-11", confidence: 0.92 }
  API->>DB: Save suggestion (pre-filled review)
  API->>E: Notification "Document ready for review"
  E->>API: Approve (or correct the values)
  API->>DB: UPDATE documents + student language score
  API->>API: Re-compute readiness & match scores
"""

DIAGRAMS['ai_automation'] = """%% size: 2600x2000
flowchart LR
  subgraph EV["Events (triggers)"]
    e1["Profile updated"]
    e2["Document uploaded /<br/>reviewed"]
    e3["Scholarship created /<br/>edited"]
    e4["Daily schedule<br/>06:00 (cron)"]
    e5["Application stage<br/>changed"]
  end
  subgraph JOB["Automation jobs (PHP)"]
    j1["Re-match this student<br/>(all open scholarships)"]
    j2["Re-compute readiness"]
    j3["Match all students<br/>to the new scholarship"]
    j4["Deadline scanner<br/>(7, 3, 1 days left)"]
    j5["Close expired scholarships<br/>open → closed"]
    j6["Stage history + timeline"]
  end
  subgraph AC["Actions"]
    a1["Notify student<br/>new eligible match ≥ 75"]
    a2["Notify student<br/>missing documents"]
    a3["Notify advisor<br/>file ready to apply"]
    a4["Email + in-app reminder"]
    a5["Update dashboards & reports"]
  end
  e1 --> j1 --> a1
  e2 --> j2 --> a2
  j2 --> a3
  e3 --> j3 --> a1
  e4 --> j4 --> a4
  e4 --> j5 --> a5
  e5 --> j6 --> a5
  style EV fill:#f2f2f2,stroke:#333333
  style JOB fill:#f5f5f5,stroke:#808080
  style AC fill:#f5f5f5,stroke:#333333
"""

DIAGRAMS['ai_state_match'] = """%% size: 2000x1600
stateDiagram-v2
  [*] --> Computed: rule engine scores
  Computed --> Explained: Groq explanation stored
  Computed --> Explained: fallback template
  Explained --> ReviewedByAdvisor: advisor opens Student 360
  ReviewedByAdvisor --> ProposedToStudent: advisor proposes
  ReviewedByAdvisor --> Dismissed: not suitable in practice
  ProposedToStudent --> Applied: application created
  Computed --> Stale: profile or scholarship changed
  Explained --> Stale: profile or scholarship changed
  Stale --> Computed: automatic re-match
  Applied --> [*]
  Dismissed --> [*]
"""

DIAGRAMS['ai_activity_eval'] = """%% size: 1800x2600
flowchart TD
  A((Start)) --> B["Build evaluation set<br/>20 student profiles × 10 scholarships = 200 pairs"]
  B --> C["Advisors label each pair<br/>Eligible / Potential / Not suitable"]
  C --> D["Run rule engine on all pairs"]
  D --> E["Compare with labels<br/>confusion matrix"]
  E --> F["Compute accuracy, precision,<br/>recall, F1 for 'Eligible'"]
  F --> G{"Precision ≥ 0.85 and<br/>recall ≥ 0.80?"}
  G -- No --> H["Analyse errors<br/>adjust weights / thresholds"]
  H --> D
  G -- Yes --> I["Evaluate LLM explanations<br/>(50 samples, 1–5 rubric)"]
  I --> J{"Mean ≥ 4 and<br/>0 guarantee claims?"}
  J -- No --> K["Refine prompt & guardrails"]
  K --> I
  J -- Yes --> L["Freeze version · write report"]
  L --> M((End))
"""

for name, code in DIAGRAMS.items():
    (D / f'{name}.mmd').write_text(code.strip() + '\n', encoding='utf-8')
print(len(DIAGRAMS), 'diagrams written')
