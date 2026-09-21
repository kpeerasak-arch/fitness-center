# คู่มือการติดตั้ง: ระบบบริหารจัดการศูนย์วิทยาศาสตร์การกีฬาและฟิตเนส

## 1. การเตรียม Google Sheets & Drive
- ระบบใช้ Google Sheets ID: `1caNBdkeLhUcI8kK7uNnCVpNwVmoN2pgi3YAocBlO4Kc`
- และ Google Drive Folder ID: `163KVJfAe84ruqTOnbg2PDTZShYcBjnI9` ที่กำหนดไว้ล่วงหน้า

## 2. การติดตั้ง Google Apps Script (Backend)
1. เปิด Google Sheet ตามลิงก์ที่กำหนด ไปที่เมนู **ส่วนขยาย (Extensions) > Apps Script**
2. นำโค้ดใน `Code.gs` ไปวางทับทั้งหมด
3. รันฟังก์ชัน `setupSystem()` หนึ่งครั้งเพื่อให้ระบบสร้างโครงสร้าง 17 ชีตและข้อมูลเริ่มต้นอัตโนมัติ
4. ทำการ **Deploy** เป็น Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. คัดลอก Web App URL ที่ได้มาใส่ในตัวแปร `WEB_APP_URL` ใน `Code.gs` และไฟล์ `config.js` ของฝั่ง Frontend แล้ว Deploy ซ้ำอีกครั้ง

## 3. การติดตั้ง Frontend บน GitHub Pages
1. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์ Frontend (`index.html`, `404.html`, `config.js`, `css/`, `js/`) ขึ้น GitHub Repository
2. ไปที่การตั้งค่า Repository (Settings) > **Pages**
3. ตั้งค่า Source เป็น `Main branch` และโฟล์เดอร์ `/ (root)` แล้วบันทึก
4. เปิดเว็บไซต์ผ่าน URL ของ GitHub Pages ที่ได้รับ

## 4. เข้าสู่ระบบ
- **Username:** `admin`
- **Password:** `1234` (ใช้งานรูปแบบ Plain text โดยไม่มีการเข้ารหัส Hash)
