# رفع EduBridge على InfinityFree

الموقع: **https://edubridge.infinityfreeapp.com**
الموقع والـ API على نفس الدومين: الموقع على `/` والـ API على `/api` (حماية InfinityFree بتمنع الطلبات بين دومينات مختلفة).

## الملفات الجاهزة (داخل مجلد `deploy`)

| الملف | شو هو |
|---|---|
| `htdocs/` | كل ملفات الموقع والـ API. ارفع **محتواه** داخل مجلد `htdocs` على الاستضافة |
| `edubridge-htdocs.zip` | نفس محتوى `htdocs/` مضغوط |
| `edubridge-database.sql` | قاعدة البيانات كاملة: 25 جدول، بيانات تجريبية، 7 Views |
| `upload_ftp.py` | سكربت رفع تلقائي، بيطلب كلمة سر FTP وقت التشغيل وما بيحفظها |
| `build_deploy.py` | يعيد بناء الحزمة بعد أي تعديل على الموقع أو الـ API |

## الخطوة 1: قاعدة البيانات

1. من لوحة InfinityFree افتحي **MySQL Databases** واضغطي **phpMyAdmin** جنب `if0_43270586_edubridge`.
2. من فوق اختاري **Import**، ثم **Choose File** واختاري `edubridge-database.sql`.
3. اضغطي **Import** (أو Go). لازم تطلع 25 جدول و7 Views.

## الخطوة 2: كلمة سر قاعدة البيانات

افتحي `deploy/htdocs/api/.env` بأي محرر (Notepad) وبدّلي السطر:

```
DB_PASS=PASTE_YOUR_MYSQL_PASSWORD_HERE
```

بكلمة سر MySQL من صفحة MySQL Databases في اللوحة. باقي القيم (السيرفر `sql306.infinityfree.com`، اسم القاعدة، اسم المستخدم) معبّأة جاهزة.

> كلمة السر ما انكتبت في أي ملف من عندي، لازم تحطيها إنتِ.

## الخطوة 3: رفع الملفات (اختاري طريقة)

**الطريقة أ: السكربت**

```bash
python deploy/upload_ftp.py
```

بيطلب كلمة سر FTP وبيرفع كل الملفات على `/htdocs`.

**الطريقة ب: FileZilla**

- Host: `ftpupload.net` · Port: `21` · Username: `if0_43270586` · Password: كلمة سر الاستضافة
- افتحي مجلد `htdocs` على اليمين، واسحبي **محتوى** `deploy/htdocs` (مش المجلد نفسه) لجوّاه.
- فعّلي إظهار الملفات المخفية (Server ▸ Force showing hidden files) وتأكدي إنو `.htaccess` و `api/.env` انرفعوا.

**الطريقة ج: File Manager** من اللوحة: ارفعي الملفات يدويًا بنفس الترتيب.

بعد الرفع احذفي ملف InfinityFree الافتراضي `index2.html` من `htdocs` إذا كان موجود.

## الخطوة 4: الفحص

| الرابط | المتوقع |
|---|---|
| `https://edubridge.infinityfreeapp.com` | الصفحة الرئيسية |
| `.../api/health` | `{"status":"ok", ...}` |
| `.../api/scholarships` | قائمة المنح JSON |
| `.../api/docs/` | صفحة Swagger |
| `.../api/.env` | **403 ممنوع** (هيك صح، الملف محمي) |

حسابات التجربة (كلمة السر `demo1234`): `student@edubridge.app`، `advisor@edubridge.app`، `admin@edubridge.app`.

> الدومين الجديد ممكن ياخذ لحد 72 ساعة ليشتغل، والـ SSL المجاني بينفعّل من **SSL Certificates** في اللوحة.

## ملاحظات مهمة

- **غيّري كلمة سر الاستضافة وكلمة سر MySQL**، لأنهن ظهرن في صور الشاشة. بعد التغيير حدّثي `DB_PASS` في `api/.env` على الاستضافة.
- `APP_ENV=production`: رمز استرجاع كلمة السر ما بيظهر في الرد، وإرسال الإيميل لسا مش مربوط. يعني "نسيت كلمة السر" ما بيكمل على الاستضافة لحد ما نربط SMTP.
- حسابات التجربة كلمة سرها معروفة. قبل التسليم غيّريها أو احذفيها.
- **ما في Cron** على InfinityFree، فالمهام التلقائية (التذكيرات) لازم تنعمل يدويًا أو بخدمة cron خارجية.
- بعد أي تعديل على الموقع شغّلي `python deploy/build_deploy.py`. ملف `api/.env` الموجود بيضل زي ما هو مع كلمة السر.
