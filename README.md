# ระบบบริหารจัดการศูนย์วิทยาศาสตร์การกีฬาและฟิตเนส — Version 2.0

ชุดไฟล์นี้เป็นการเขียนระบบใหม่จากชุดไฟล์เดิม โดยแยก Backend และ Frontend ชัดเจน

## โครงสร้าง

```text
backend/
  Code.gs

frontend/
  index.html
  404.html
  config.js
  .nojekyll
  css/
    styles.css
  js/
    api.js
    app.js
    utils.js
```

## ปัญหาหลักที่แก้

1. Frontend เดิมบน GitHub Pages มีเพียง Dashboard/หน้าจอ placeholder หลายโมดูล จึงกดเมนูแล้วไม่ได้ทำงานจริง
2. POST เดิมมีการติดตั้ง `message` listener ซ้ำและซับซ้อนเกินจำเป็น ทำให้ timeout/รับ response ผิดจังหวะได้
3. ระบบเดิมใช้ API token แบบคงที่ใน Frontend ซึ่งผู้ใช้หน้าเว็บสามารถมองเห็นได้ จึงไม่ควรถือว่าเป็นความลับ
4. การ login เดิมส่ง token เดียวกับ API ทุกคน หลัง login จึงไม่มี session จริง
5. Dashboard เดิมนับ `checkins.length` เป็นเช็กอินวันนี้ ทั้งที่เป็นจำนวนเช็กอินทั้งหมด
6. `registerMember()` สร้างรหัสจาก `lastRow` ทำให้มีโอกาสซ้ำหลังลบ/ย้ายข้อมูล
7. ไม่มีการตรวจสอบสมาชิกก่อนบันทึก Check-in/Test/Booking
8. ไม่มีการป้องกันการสแกน QR ซ้ำในเวลาสั้น ๆ
9. มีทั้ง `index.html` ฝั่ง Apps Script และ `index.html` ฝั่ง GitHub แต่หน้าที่ไม่ชัดเจน
10. มีการเก็บรหัสผ่าน Admin แบบ plain text ใน Settings ของเวอร์ชันเดิม
11. ระบบเดิมยังไม่มี workflow CSV export ไป Google Drive ที่ใช้งานจากหน้าเว็บอย่างครบถ้วน

## สิ่งที่ Version 2.0 ทำ

- ใช้ Google Apps Script เป็น Backend และ Google Sheets เป็นฐานข้อมูล
- GitHub Pages เป็น Frontend
- GET ใช้ JSONP เพื่อไม่ต้องพึ่ง CORS จาก GitHub Pages
- POST ใช้ hidden iframe + `postMessage`
- Login สร้าง session token ฝั่ง server
- password เก็บเป็น SHA-256 hash ในชีต `Users`
- Session หมดอายุอัตโนมัติและต่ออายุเมื่อใช้งาน
- ตรวจสอบสมาชิกก่อน Check-in / Test / Booking
- QR Check-in รองรับ `MemberID` หรือค่าใน `QRCode`
- ป้องกัน Check-in ซ้ำภายใน 60 วินาที
- Dashboard แสดง Check-in ของวันปัจจุบันจริง
- ลงทะเบียนสมาชิก
- บันทึกผลทดสอบและคำนวณ BMI
- สร้าง Booking
- สร้าง Program
- แสดง Exercises / Equipment
- CSV export ไป Google Drive
- เปลี่ยนรหัสผ่าน
- Setup สร้าง/ตรวจสอบ 18 sheets รวม `Users`

## 1. เตรียม Google Sheets

เปิด Spreadsheet ที่กำหนดไว้:

`1caNBdkeLhUcI8kK7uNnCVpNwVmoN2pgi3YAocBlO4Kc`

ใน Apps Script ให้วาง `backend/Code.gs` ทั้งไฟล์

จากนั้นรัน:

```text
setupSystem
```

ครั้งแรก Google จะขอสิทธิ์ ให้กดยอมรับ

ระบบจะสร้าง/ตรวจสอบชีต:

- Members
- Packages
- Memberships
- Payments
- CheckIns
- Bookings
- Tests
- Exercises
- Programs
- ProgramDetails
- ProgramAssignments
- Equipment
- EquipmentLoans
- Events
- Norms
- Settings
- Logs
- Users

> ถ้ามีข้อมูลเดิมอยู่แล้ว `setupSystem()` จะไม่ลบข้อมูลแถวข้อมูลเดิม แต่จะตรวจสอบ/ตั้ง header และเพิ่มข้อมูลตัวอย่างเฉพาะชีตที่ว่าง

## 2. Deploy Google Apps Script

Apps Script > Deploy > New deployment

เลือก:

- Type: Web app
- Execute as: Me
- Who has access: Anyone

คัดลอก URL `/exec`

ตัวอย่างรูปแบบ:

```text
https://script.google.com/macros/s/XXXXXXXX/exec
```

นำ URL จริงไปใส่ใน:

```text
frontend/config.js
```

ที่:

```javascript
API_URL: 'YOUR_WEB_APP_URL'
```

แล้ว push ขึ้น GitHub ใหม่

## 3. GitHub Pages

นำเฉพาะโฟลเดอร์ `frontend` ไปวางใน repository เช่น:

```text
index.html
404.html
config.js
.nojekyll
css/styles.css
js/api.js
js/app.js
js/utils.js
```

จากนั้น:

GitHub > Repository > Settings > Pages

เลือก:

```text
Deploy from a branch
Branch: main
Folder: / (root)
```

แล้วเปิด URL GitHub Pages

## 4. Login ครั้งแรก

```text
Username: admin
Password: 1234
```

เมื่อเข้าสู่ระบบแล้วให้เปลี่ยนรหัสผ่านในเมนู **ตั้งค่า**

## 5. QR Code

QR ของสมาชิกสามารถเก็บค่าเป็น:

```text
MEM-0001
```

หรือใช้ค่าอื่นในช่อง `QRCode`

ระบบจะค้นหาทั้ง:

- MemberID
- QRCode

ดังนั้น QR ที่สแกนได้ต้องตรงกับข้อมูลในชีต Members

## 6. CSV

เมนู **รายงาน / CSV** สามารถส่งออก:

- Members
- CheckIns
- Tests
- Bookings
- Equipment
- EquipmentLoans
- Programs

ไฟล์จะถูกสร้างใน Google Drive Folder:

`163KVJfAe84ruqTOnbg2PDTZShYcBjnI9`

## 7. ถ้า Web App URL เปลี่ยน

ต้องแก้เพียง:

```text
frontend/config.js
```

แล้ว push GitHub ใหม่

ไม่ต้องแก้ `app.js` หรือ `api.js`

## 8. หมายเหตุสำคัญด้านความปลอดภัย

- Session token อยู่ใน browser ของผู้ใช้งาน
- API URL เป็นข้อมูลที่ต้องเปิดเผยให้ Frontend ใช้งาน
- Google Sheet และ Drive ควรให้สิทธิ์เฉพาะผู้รับผิดชอบ
- ไม่ควรนำรหัสผ่านจริงไปใส่ใน source code
- หลังติดตั้งควรเปลี่ยนรหัสผ่าน `admin / 1234`
- หากต้องใช้ข้อมูลส่วนบุคคลจริง ควรเพิ่มมาตรการสิทธิ์ผู้ใช้งานและนโยบาย PDPA ก่อนใช้งานจริง

## 9. ลำดับการทดสอบที่แนะนำ

1. Run `setupSystem()`
2. เปิด Web App URL + `?action=health`
3. ตรวจว่าได้ `status: success`
4. เปิด GitHub Pages
5. Login ด้วย admin / 1234
6. ลงทะเบียนสมาชิก 1 คน
7. ใช้ MemberID หรือ QRCode ทดลอง Check-in
8. ตรวจชีต `CheckIns`
9. ตรวจ Dashboard ว่า `เช็กอินวันนี้` เพิ่ม
10. ทดลองบันทึก Test
11. ทดลอง Booking
12. ทดลอง Export CSV
13. เปลี่ยนรหัสผ่าน
14. Logout/Login ใหม่

## 10. การแก้ปัญหา

### ขึ้น "Session ไม่ถูกต้องหรือหมดอายุ"

Logout แล้ว login ใหม่ หรือเคลียร์ site data ของ GitHub Pages

### ขึ้น "ไม่พบชีต"

เปิด Apps Script แล้วรัน:

```text
setupSystem
```

### Login ไม่ได้

ตรวจว่า `Users` มี:

```text
admin
```

และรหัสผ่านเริ่มต้นคือ:

```text
1234
```

หากแก้ Users เองโดยตรง ต้องเก็บ PasswordHash เป็น SHA-256 ไม่ใช่รหัสผ่าน plain text

### QR เปิดกล้องไม่ได้

- ต้องเปิดผ่าน HTTPS (GitHub Pages ใช้ HTTPS)
- อนุญาต Camera ใน browser
- ใช้ Chrome/Safari/Edge รุ่นปัจจุบัน
- ถ้ากล้องไม่พร้อม ใช้ช่องกรอก MemberID เป็น fallback

### CSV สร้างไม่ได้

ตรวจว่า Apps Script account ที่ Deploy เป็นผู้มีสิทธิ์เข้าถึง Google Drive Folder ที่ตั้งไว้

