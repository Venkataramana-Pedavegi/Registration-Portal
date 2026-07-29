# College Event Registration Management System - Database Refactored to MySQL

This repository contains the complete, production-grade **Authentication Module (Phase 1)** and **Event Management Module (Phase 2)** of the College Event Registration Management System. The database backend has been fully migrated from MongoDB to MySQL using the Sequelize ORM.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0 (Sequelize ORM)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs (password hashing)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS v3
- **State Management**: React Context API
- **Testing**: Jest + Supertest (using database test runs with tables drops/recreation)

---

## 📊 Database Design

### ER Diagram (Text Format)

```text
  +------------------+             +------------------+
  |     Students     |             |      Admins      |
  +------------------+             +------------------+
  | id (PK) [INT]    |             | id (PK) [INT]    |
  | fullName         |             | username [Unique]|
  | rollNumber [Uniq]|             | email [Unique]   |
  | email [Unique]   |             | password         |
  | department       |             | role ('Admin')   |
  | year             |             +------------------+
  | password         |                      |
  +------------------+                      | 1
                                            |
                                            | hasMany
                                            |
                                            | N
                                   +------------------+
                                   |      Events      |
                                   +------------------+
                                   | id (PK) [INT]    |
                                   | title            |
                                   | description      |
                                   | category         |
                                   | venue            |
                                   | eventDate        |
                                   | startTime        |
                                   | endTime          |
                                   | regDeadline      |
                                   | organizer        |
                                   | capacity         |
                                   | availableSeats   |
                                   | image            |
                                   | status           |
                                   | createdBy (FK)---|---> Admins.id
                                   +------------------+
                                   * Unique constraint on (title, venue, eventDate)
```

---

## 📁 Project Structure

```text
/c:/Registration Portal
├── College_Event_Registration_System_Phase_2.postman_collection.json
├── README.md
├── database/
│   └── schema.sql                  # MySQL raw DDL script
├── client/
│   └── src/
│       ├── components/             # Reusable UI Elements (Modals, Tables, Cards)
│       └── pages/                  # React Router Views (Dashboards, Details)
└── server/
    ├── server.js                   # Entrypoint with Sequelize sync & Admin seed
    ├── config/
    │   └── database.js             # MySQL/Sequelize DB config pooling
    ├── controllers/
    │   ├── adminController.js
    │   ├── eventController.js      # Sequelize CRUD & populated serializers
    │   └── studentController.js
    ├── middleware/
    │   ├── adminMiddleware.js
    │   ├── authMiddleware.js
    │   └── validation.js
    ├── models/
    │   ├── index.js                # Relationships Loader
    │   ├── Admin.js
    │   ├── Event.js
    │   └── Student.js
    └── tests/
        ├── auth.test.js
        └── event.test.js
```

---

## 🔧 MySQL Setup Guide

1. Ensure MySQL server 8.0+ is running locally.
2. Log into MySQL client and verify the database is initialized:
   ```sql
   CREATE DATABASE IF NOT EXISTS `college_event_registration`;
   ```
   *(Note: The server includes a self-healing script at `server/utils/initDb.js` that automatically runs on startup to create the database if it is not present.)*
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
   *The test suite connects to the MySQL test instance, drops/recreates tables for each run using `sync({ force: true })`, and executes all 28 API validations.*

---

## 📝 Sample SQL Queries

### 1. Retrieve all Events with Admin details (Inner Join)
```sql
SELECT e.*, a.username, a.email 
FROM Events e 
INNER JOIN Admins a ON e.createdBy = a.id
ORDER BY e.eventDate ASC;
```

### 2. Verify Duplicate Constraints
```sql
SELECT id FROM Events 
WHERE title = 'Campus Hackathon 2026' AND venue = 'Hall A' AND eventDate = '2026-10-15';
```

---

## 🌐 Sample API Requests & Responses

### Create Event (Admin)
* **POST `/api/events`**
* **Headers**: `Authorization: Bearer <Admin_Token>`
* **Body**:
  ```json
  {
    "title": "Campus Hackathon 2026",
    "description": "A 24-hour programming challenge.",
    "category": "Technical",
    "venue": "Main Hall",
    "eventDate": "2026-10-15",
    "startTime": "09:00",
    "endTime": "17:00",
    "registrationDeadline": "2026-10-10",
    "organizer": "CSE Dept",
    "capacity": 100
  }
  ```
* **Response (210 Created)**:
  ```json
  {
    "_id": 1,
    "title": "Campus Hackathon 2026",
    "description": "A 24-hour programming challenge.",
    "category": "Technical",
    "venue": "Main Hall",
    "eventDate": "2026-10-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "registrationDeadline": "2026-10-10T00:00:00.000Z",
    "organizer": "CSE Dept",
    "capacity": 100,
    "availableSeats": 100,
    "image": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4...",
    "status": "Upcoming",
    "createdBy": {
      "_id": 1,
      "username": "admin",
      "email": "admin@college.edu"
    },
    "createdAt": "2026-07-29T17:09:00.000Z",
    "updatedAt": "2026-07-29T17:09:00.000Z"
  }
  ```

---

## ✅ Migration Checklist

- [x] **ORM Transition**: Mongoose connection logic and MongoDB libraries fully replaced with Sequelize + MySQL2 driver.
- [x] **Self-Healing Schema**: Automatic schema creations via `sequelize.sync()` and database creations via raw `mysql2` connections if database is missing.
- [x] **No Frontend Changes**: Ensured complete payload schema backwards compatibility. SQL `id` mappings and populated `createdBy` associations formatted as nested MongoDB-style JSON elements.
- [x] **Functional Integrity**: Re-verified roll number checks, time conflicts, capacity boundaries, and duplicate rules.
- [x] **100% Passing Tests**: Updated the database test runner environment, with all 28 API test validations passing perfectly.
