THEATER BOOKING - FINAL

1) افتح Firebase Console للمشروع:
   theater-booking-a4304

2) Authentication:
   - Sign-in method
   - فعّل Google
   - تأكد أن حساب الإدارة هو:
     it.mekhail@gmail.com

3) Firestore Database:
   - أنشئ Firestore Database.
   - طبّق محتوى firestore.rules في تبويب Rules ثم Publish.

4) شغّل المشروع من Web Server محلي، وليس بفتح index.html مباشرة.
   مثال VS Code + Live Server.

5) افتح:
   index.html

6) لوحة الإدارة:
   admin.html

الحساب الإداري:
   it.mekhail@gmail.com

ملاحظات:
- أول مرة افتح admin.html وسجّل بحساب Google المذكور.
- من لوحة الإدارة أضف أول حفلة.
- يمكن إضافة عدد غير محدود من الحفلات.
- كل حفلة لها حجوزاتها ومقاعدها بشكل مستقل.
- poster.jpg موجود كاسم افتراضي. ضع صورتك داخل images/poster.jpg.
- لا تشارك مفاتيح Firebase الحساسة أو صلاحيات Firebase Admin SDK. إعدادات Web API الموجودة في firebase.js ليست سرية بحد ذاتها، لكن قواعد Firestore هي التي تحمي البيانات.


IMAGE HOSTING NOTE
- Event poster images are now stored as external HTTPS image URLs in Firestore.
- Firebase Cloud Storage is not used by the project, so the project can remain on the Firebase Spark plan for image hosting purposes.
- Use a direct image URL that can be opened in a browser and embedded by <img>.


V4 NOTES
- Added Super Admin / Booking Admin users.
- Booking Admin accounts use Firebase Email/Password Authentication. Enable Email/Password provider in Firebase Authentication.
- Super Admin: it.mekhail@gmail.com.
- Booking Admins can only access assigned events and their bookings.
- Public event images remain external URLs; Firebase Storage is not used.
- Event time and booking creation time are displayed in 12-hour format with صباحًا/مساءً.
- Bookings are grouped by event in the admin panel.
- Admin link is at the bottom-left of the public homepage.
- Apply firestore.rules from this package in Firebase Console.
