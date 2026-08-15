# College Event Registration Management System - Enterprise Edition

This repository contains the complete, production-ready, enterprise-grade **College Event Registration Management System** spanning all five development phases. The system supports 9 academic departments: Computer Science (CSE), Civil Engineering (CE), Mechanical Engineering (ME), Electrical and Electronics Engineering (EEE), Electronics and Communication Engineering (ECE), Computer Science and Artificial Intelligence (CAI), Artificial Intelligence and Machine Learning (AIML), Information Technology (IT), and Computer Science and Technology (CST):

- **Phase 1**: Authentication Module (Student/Admin JWT Auth & Password Hashing)
- **Phase 2**: Event Management Module (Admin Event CRUD & Availability Tracking)
- **Phase 3**: Student Event Registration Module (Atomic SQL Transactions & Double-Booking Protection)
- **Phase 4**: Admin Analytics & Management Module (Attendance Tracking, Recharts Graphs, Reports & CSV Exports)
- **Phase 5**: Enterprise Readiness (Nodemailer Notifications, QR Code Entry Passes, PDF Certificates, Helmet Security, Rate Limiting, Audit Logs Trail, Server-side Pagination & Lazy Loading)

---

## 🏗️ Architecture & Tech Stack

```text
[ React + Vite Client ]  <--->  [ Express Server ]  <--->  [ MySQL 8 Engine ]
 ├── TailWind CSS                ├── Helmet & Rate Limiter   ├── Students
 ├── Recharts Visualizer         ├── JWT Authentication      ├── Admins
 ├── Code Splitting & Suspense   ├── Nodemailer Service      ├── Events
 └── Lucide UI Components        ├── PDFKit & QR Generator   ├── Registrations
                                 └── Audit Logger            ├── Attendances
                                                             ├── Notifications
                                                             ├── Certificates
                                                             └── AuditLogs
```

---

## 📊 Database Design & ER Diagram

```text
  +------------------+             +------------------+
  |     Students     |             |      Admins      |
  +------------------+             +------------------+
  | id (PK) [INT]    |<--------\   | id (PK) [INT]    |<-------\
  | fullName         |         |   | username [Unique]|        |
  | rollNumber [Uniq]|         |   | email [Unique]   |        |
  | email [Unique]   |         |   | password         |        |
  | department       |         |   | role ('Admin')   |        |
  | year             |         |   | profileImage     |        |
  | profileImage     |         |   +------------------+        |
  +------------------+         |            |                  |
     |            |            |            | hasMany          |
     |            \--------\   |            v                  |
     | hasMany             |   |         +------------------+  |
     v                     v   |         |      Events      |  |
  +------------------+   +------------------+               |  |
  |   Registrations  |   |    Attendances   |               |  |
  +------------------+   +------------------+               |  |
  | id (PK) [INT]    |   | id (PK) [INT]    |               |  |
  | studentId (FK)---|---|->studentId (FK)  |               |  |
  | eventId (FK)-----|---|->eventId (FK)    |               |  |
  | registrationDate |   | registrationId---|------------\  |  |
  | status           |   | attendanceStatus |            |  |  |
  | qrCodeUrl        |   | markedAt         |            |  |  |
  +------------------+   +------------------+            |  |  |
           ^                                             |  |  |
           \---------------------------------------------/  |  |
                                                            |  |
  Event.hasMany(Registrations) -----------------------------/  |
  Event.hasMany(Attendances) ----------------------------------/
```

---

## 🔒 Security Checklist

- [x] **Helmet Headers**: Integrated `helmet()` protecting HTTP headers against clickjacking, sniffing, and XSS attacks.
- [x] **Rate Limiting**: Integrated `express-rate-limit` capping requests to 300 per 15-minute window per IP.
- [x] **SQL Injection Defense**: Built with Sequelize ORM parameterization.
- [x] **Password Protection**: Salting and hashing via `bcryptjs` (10 rounds).
- [x] **Audit Trail**: Security events recorded in `AuditLogs` database table.

---

## ⚡ Performance Optimizations

- [x] **Lazy Loading**: Route pages wrapped in `React.lazy()` and `<Suspense>`.
- [x] **Server-side Pagination**: List APIs support `page` and `limit` query parameters.
- [x] **Optimized Database Indexes**: Foreign keys and unique constraints indexed in MySQL.

---

## 🛠️ Environment Variables (.env)

Create `server/.env`:
```env
PORT=5000
NODE_ENV=production

# MySQL Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=college_event_registration
DB_USER=root
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1d

# Email Notifications (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
EMAIL_FROM_NAME=College Event Portal
EMAIL_FROM_ADDRESS=noreply@college.edu
```

---

## 🚀 Production Deployment Instructions

### 1. Database Host (MySQL Cloud)
- Import schema definition script from `database/schema.sql`.

### 2. Backend Server Deployment (Render / Railway)
- Root directory: `/server`
- Build command: `npm install`
- Start command: `node server.js`
- Set environment variables as defined above.

### 3. Frontend Client Deployment (Vercel / Netlify)
- Root directory: `/client`
- Build command: `npm run build`
- Output directory: `dist`

---

## 🧪 Automated Testing

Execute Jest integration tests:
```bash
cd server
npm test
```
*Executes **58 integration tests** across **5 test suites** (`auth.test.js`, `event.test.js`, `registration.test.js`, `analytics.test.js`, `phase5.test.js`) with 100% pass rate.*
