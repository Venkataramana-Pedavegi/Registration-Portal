# College Event Registration Management System - MySQL Backend & Registration Module

This repository contains the complete, production-grade **Authentication Module (Phase 1)**, **Event Management Module (Phase 2)**, and **Student Event Registration Module (Phase 3)**. The database backend has been fully migrated from MongoDB to MySQL using the Sequelize ORM.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + Lucide Icons + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0 (Sequelize ORM)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs (password hashing)
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Testing**: Jest + Supertest

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
           |                   |            |                  |
           | hasMany           |            v                  |
           |                   |         +------------------+  |
           v                   |         |      Events      |  |
  +------------------+         |         +------------------+  |
  |   Registrations  |         |         | id (PK) [INT]    |  |
  +------------------+         |         | title            |  |
  | id (PK) [INT]    |         |         | description      |  |
  | studentId (FK)---|---------/         | category         |  |
  | eventId (FK)-----|------------------>| venue            |  |
  | registrationDate |                   | eventDate        |  |
  | status           |                   | startTime        |  |
  | createdAt        |                   | endTime          |  |
  | updatedAt        |                   | regDeadline      |  |
  +------------------+                   | organizer        |  |
  * Unique constraint on                 | capacity         |  |
    (studentId, eventId)                 | availableSeats   |  |
    where status = 'Registered'          | image            |  |
                                         | status           |  |
                                         | createdBy (FK)---|--/
                                         +------------------+
                                         * Unique constraint on (title, venue, eventDate)
```

---

## 📁 Project Structure

```text
/c:/Registration Portal
├── College_Event_Registration_System_Phase_3.postman_collection.json
├── README.md
├── database/
│   └── schema.sql                  # MySQL DDL script (Students, Admins, Events, Registrations)
├── client/
│   └── src/
│       ├── components/             # Reusable UI Elements (Badges, ProgressBars, EmptyState)
│       └── pages/                  # Student & Admin Dashboards, Event Details, Registrations history
└── server/
    ├── server.js                   # Entrypoint with Sequelize sync & Admin seed
    ├── config/
    │   └── database.js             # MySQL/Sequelize DB connection pool config
    ├── controllers/
    │   ├── adminController.js
    │   ├── eventController.js      # Event CRUD & participants lookup list
    │   ├── registrationController.js # Registrations logic (atomic transactions)
    │   └── studentController.js
    ├── middleware/
    │   ├── adminMiddleware.js
    │   ├── authMiddleware.js
    │   └── validation.js
    ├── models/
    │   ├── index.js                # Relationships Loader & Export definitions
    │   ├── Admin.js
    │   ├── Event.js
    │   ├── Registration.js         # Event registration schema
    │   └── Student.js
    └── tests/
        ├── auth.test.js
        ├── event.test.js
        └── registration.test.js    # 12 Integration tests covering registrations validations
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
   *The test suite connects to the MySQL test database, drops/recreates tables for each run using `sync({ force: true })`, and executes all 37 API validations.*

---

## 📝 Sample SQL Queries

### 1. View all participants of a specific Event
```sql
SELECT r.id, r.status, r.registrationDate, s.fullName, s.rollNumber, s.email, s.department, s.year 
FROM Registrations r
INNER JOIN Students s ON r.studentId = s.id
WHERE r.eventId = 1 AND r.status = 'Registered'
ORDER BY r.registrationDate DESC;
```

### 2. Calculate Admin Registration Stats
```sql
-- Total seats filled
SELECT COUNT(*) FROM Registrations WHERE status = 'Registered';

-- Today's signups
SELECT COUNT(*) FROM Registrations 
WHERE registrationDate >= CURDATE() AND status != 'Cancelled';
```

---

## 🌐 Sample API Requests & Responses

### 1. Register for Event (Student)
* **POST `/api/registrations`**
* **Headers**: `Authorization: Bearer <Student_Token>`
* **Body**:
  ```json
  {
    "eventId": 1
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "_id": 1,
    "studentId": 2,
    "eventId": 1,
    "registrationDate": "2026-07-29T17:18:00.000Z",
    "status": "Registered",
    "createdAt": "2026-07-29T17:18:00.000Z",
    "updatedAt": "2026-07-29T17:18:00.000Z"
  }
  ```

### 2. Cancel Registration (Student)
* **DELETE `/api/registrations/1`**
* **Headers**: `Authorization: Bearer <Student_Token>`
* **Response (200 OK)**:
  ```json
  {
    "message": "Registration cancelled successfully"
  }
  ```

### 3. Get Student Registered Events (Student)
* **GET `/api/registrations/my-events`**
* **Headers**: `Authorization: Bearer <Student_Token>`
* **Response (200 OK)**:
  ```json
  [
    {
      "_id": 1,
      "studentId": 2,
      "eventId": 1,
      "registrationDate": "2026-07-29T17:18:00.000Z",
      "status": "Registered",
      "Event": {
        "_id": 1,
        "title": "Campus Hackathon 2026",
        "venue": "Auditorium Hall A",
        "eventDate": "2026-10-15T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "17:00",
        "organizer": "ACM Student Chapter",
        "image": "https://images.unsplash.com/..."
      }
    }
  ]
  ```

### 4. Admin View Participants (Admin)
* **GET `/api/events/1/participants?search=Jane&status=Registered`**
* **Headers**: `Authorization: Bearer <Admin_Token>`
* **Response (200 OK)**:
  ```json
  [
    {
      "_id": 1,
      "studentId": 2,
      "eventId": 1,
      "registrationDate": "2026-07-29T17:18:00.000Z",
      "status": "Registered",
      "Student": {
        "_id": 2,
        "fullName": "Jane Doe",
        "rollNumber": "CS202699",
        "email": "janedoe@college.edu",
        "department": "Computer Science",
        "year": "3rd Year"
      }
    }
  ]
  ```
