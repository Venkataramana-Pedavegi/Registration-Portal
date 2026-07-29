# College Event Registration Management System - Full Stack Application

This repository contains the complete, production-grade **College Event Registration Management System** covering:
- **Phase 1**: Authentication Module (JWT + bcryptjs)
- **Phase 2**: Event Management Module (Admin Event CRUD)
- **Phase 3**: Student Event Registration Module (Atomic SQL Transactions)
- **Phase 4**: Admin Analytics & Management Module (Attendance, Recharts, Reports & Exports)

The backend database runs on **MySQL 8.0** using **Sequelize ORM**.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + Recharts + Lucide Icons
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0 (Sequelize ORM)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs (password hashing)
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Testing**: Jest + Supertest (47 Automated Integration Tests)

---

## 📊 Database Design

### ER Diagram (Text Format)

```text
  +------------------+             +------------------+
  |     Students     |             |      Admins      |
  +------------------+             +------------------+
  | id (PK) [INT]    |<--------\   | id (PK) [INT]    |<-------\
  | fullName         |         |   | username [Unique]|        |
  | rollNumber [Uniq]|         |   | email [Unique]   |        |
  | email [Unique]   |         |   | password         |        |
  | department       |         |   | role ('Admin')   |        |
  | year             |         |   +------------------+        |
  | password         |         |            |                  |
  +------------------+         |            | hasMany          |
     |            |            |            |                  |
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
  | createdAt        |   | markedAt         |            |  |  |
  +------------------+   +------------------+            |  |  |
           ^                                             |  |  |
           \---------------------------------------------/  |  |
                                                            |  |
  Event.hasMany(Registrations) -----------------------------/  |
  Event.hasMany(Attendances) ----------------------------------/
```

---

## 📁 Project Structure

```text
/c:/Registration Portal
├── College_Event_Registration_System_Phase_4.postman_collection.json
├── README.md
├── database/
│   └── schema.sql                  # MySQL DDL script (Students, Admins, Events, Registrations, Attendances)
├── client/
│   └── src/
│       ├── components/             # StatisticsCard, AnalyticsCharts, AttendanceTable, ExportButton, StudentProfileCard
│       └── pages/                  # AnalyticsDashboard, Attendance, Reports, StudentProfile, ExportReports, AdminSettings
└── server/
    ├── server.js                   # Express server entrypoint
    ├── config/
    │   └── database.js             # Sequelize MySQL connection pool
    ├── controllers/
    │   ├── adminController.js
    │   ├── analyticsController.js  # Dashboard metrics, 5 Recharts aggregations, Reports, Profile
    │   ├── attendanceController.js # Mark, update, view event attendance
    │   ├── eventController.js      # Event CRUD & participants lookup
    │   ├── exportController.js     # Native CSV reports streaming
    │   ├── registrationController.js
    │   └── studentController.js
    ├── models/
    │   ├── index.js                # Relationships Loader
    │   ├── Admin.js
    │   ├── Attendance.js           # Attendance schema
    │   ├── Event.js
    │   ├── Registration.js
    │   └── Student.js
    └── tests/
        ├── analytics.test.js       # Phase 4 integration tests
        ├── auth.test.js
        ├── event.test.js
        └── registration.test.js
```

---

## 🔧 MySQL Setup Guide

1. Ensure MySQL server 8.0+ is running locally.
2. The server boot sequence automatically executes a self-healing script at `server/utils/initDb.js` that checks for or creates the `college_event_registration` database automatically.
3. Update environment credentials in `server/.env`:
   ```env
   PORT=5000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=college_event_registration
   DB_USER=root
   DB_PASSWORD=yourpassword
   JWT_SECRET=supersecretkeychangethisinproduction
   JWT_EXPIRES_IN=1d
   ```
4. Start backend: `npm run dev` (Sequelize will sync tables and seed the default Admin `admin@college.edu` with password `adminpassword`).

---

## 🧪 Testing

Execute Jest integration tests:
1. Navigate to `/server`.
2. Run:
   ```bash
   npm run test
   ```
   *The test suite executes 47 automated integration tests across 4 modules, passing with 100% success.*

---

## 🌐 Sample API Requests & Responses

### 1. Get Admin Dashboard Metrics (10 Cards)
* **GET `/api/admin/dashboard`**
* **Headers**: `Authorization: Bearer <Admin_Token>`
* **Response (200 OK)**:
  ```json
  {
    "totalStudents": 15,
    "totalEvents": 4,
    "totalRegistrations": 8,
    "activeRegistrations": 7,
    "cancelledRegistrations": 1,
    "completedEvents": 1,
    "upcomingEvents": 3,
    "seatsFilled": 45,
    "availableSeats": 105,
    "eventOccupancyPct": 30
  }
  ```

### 2. Mark Attendance (Admin)
* **POST `/api/attendance`**
* **Headers**: `Authorization: Bearer <Admin_Token>`
* **Body**:
  ```json
  {
    "registrationId": 1,
    "attendanceStatus": "Present"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "_id": 1,
    "registrationId": 1,
    "eventId": 1,
    "studentId": 2,
    "attendanceStatus": "Present",
    "markedAt": "2026-07-29T17:28:00.000Z"
  }
  ```
