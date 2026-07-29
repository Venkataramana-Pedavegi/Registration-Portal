# College Event Registration Management System - Phase 2

This repository contains the complete, production-grade **Event Management Module (Phase 2)** of the College Event Registration Management System. It builds on top of the Phase 1 Authentication Module, providing administrative controls for managing college activities while offering search, filter, and detail exploratory views for students.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs (password hashing)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS v3
- **State Management**: React Context API
- **Testing**: Jest + Supertest + MongoDB Memory Server

---

## 📁 Project Structure

```text
/c:/Registration Portal
├── College_Event_Registration_System_Phase_2.postman_collection.json
├── README.md
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── ConfirmationDialog.jsx
│       │   ├── EventCard.jsx
│       │   ├── EventModal.jsx
│       │   ├── EventTable.jsx
│       │   ├── FilterDropdown.jsx
│       │   ├── Footer.jsx
│       │   ├── Loader.jsx
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── SearchBar.jsx
│       │   └── Toast.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminLogin.jsx
│       │   ├── EventDetails.jsx
│       │   ├── Home.jsx
│       │   ├── NotFound.jsx
│       │   ├── StudentDashboard.jsx
│       │   └── StudentRegister.jsx
│       └── services/
│           └── api.js
└── server/
    ├── .env
    ├── .env.example
    ├── package.json
    ├── server.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── adminController.js
    │   ├── eventController.js
    │   └── studentController.js
    ├── middleware/
    │   ├── adminMiddleware.js
    │   ├── authMiddleware.js
    │   └── validation.js
    ├── models/
    │   ├── Admin.js
    │   ├── Event.js
    │   └── Student.js
    ├── routes/
    │   ├── adminRoutes.js
    │   ├── eventRoutes.js
    │   └── studentRoutes.js
    └── tests/
        ├── auth.test.js
        └── event.test.js
```

---

## 🔧 Installation and Setup

### Prerequisites
- Node.js installed on your local machine.
- A running MongoDB instance (or it will connect to a local fallback: `mongodb://127.0.0.1:27017/college-event-reg`).

### 1. Backend Setup
1. Open a terminal in the `/server` directory.
2. The environment file `.env` is configured automatically. Modify it if you wish to configure a customized MongoDB Atlas URI:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/college-event-reg
   JWT_SECRET=supersecretkeychangethisinproduction
   JWT_EXPIRES_IN=1d
   ```
3. Run `npm run dev` to start the local Express development server with nodemon.
   *Note: On system startup, if the database has zero admin accounts, a default admin is seeded automatically:*
   * **Admin Email**: `admin@college.edu`
   * **Admin Password**: `adminpassword`

### 2. Frontend Setup
1. Open a terminal in the `/client` directory.
2. Start the Vite dev server with `npm run dev`.
3. The frontend is accessible at the address printed in the console (usually `http://localhost:5173`).

---

## 🧪 Testing

### Automated API Tests
To run the full suite of integration tests (validating registration, login, token authentication, role restrictions, duplicate handling, field validations, and Event CRUD APIs):
1. Navigate to `/server`.
2. Run:
   ```bash
   npm run test
   ```
   *Note: The tests execute against an in-memory MongoDB server (`mongodb-memory-server`) to ensure database independence.*

---

## 🌐 Sample API Requests & Responses

### 1. Create Event (Admin Only)
* **URL**: `POST /api/events`
* **Headers**: `Authorization: Bearer <Admin_Token>`
* **Body**:
  ```json
  {
    "title": "Campus Hackathon 2026",
    "description": "A 24-hour coding sprint to build software solutions for campus challenges.",
    "category": "Technical",
    "venue": "Auditorium Hall A",
    "eventDate": "2026-10-15",
    "startTime": "09:00",
    "endTime": "17:00",
    "registrationDeadline": "2026-10-10",
    "organizer": "ACM Student Chapter",
    "capacity": 120
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "_id": "64c55da0...",
    "title": "Campus Hackathon 2026",
    "description": "A 24-hour coding sprint to build software solutions for campus challenges.",
    "category": "Technical",
    "venue": "Auditorium Hall A",
    "eventDate": "2026-10-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "17:00",
    "registrationDeadline": "2026-10-10T00:00:00.000Z",
    "organizer": "ACM Student Chapter",
    "capacity": 120,
    "availableSeats": 120,
    "image": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4...",
    "status": "Upcoming",
    "createdBy": "64c54b9d0fd5d...",
    "createdAt": "2026-07-29T16:55:00.000Z",
    "updatedAt": "2026-07-29T16:55:00.000Z"
  }
  ```

### 2. Get All Events (Student/Admin)
* **URL**: `GET /api/events?category=Technical&status=Upcoming&search=Hackathon`
* **Headers**: `Authorization: Bearer <Token>`
* **Response (200 OK)**:
  ```json
  [
    {
      "_id": "64c55da0...",
      "title": "Campus Hackathon 2026",
      "description": "A 24-hour coding sprint to build software solutions for campus challenges.",
      "category": "Technical",
      "venue": "Auditorium Hall A",
      "eventDate": "2026-10-15T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "17:00",
      "registrationDeadline": "2026-10-10T00:00:00.000Z",
      "organizer": "ACM Student Chapter",
      "capacity": 120,
      "availableSeats": 120,
      "status": "Upcoming"
    }
  ]
  ```

### 3. Update Event (Admin Only)
* **URL**: `PUT /api/events/:id`
* **Headers**: `Authorization: Bearer <Admin_Token>`
* **Body**:
  ```json
  {
    "title": "Campus Hackathon 2026 (Updated)",
    "description": "A 24-hour coding sprint.",
    "category": "Technical",
    "venue": "Auditorium Hall A",
    "eventDate": "2026-10-15",
    "startTime": "09:00",
    "endTime": "18:00",
    "registrationDeadline": "2026-10-10",
    "organizer": "ACM Student Chapter",
    "capacity": 150,
    "status": "Upcoming"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "_id": "64c55da0...",
    "title": "Campus Hackathon 2026 (Updated)",
    "capacity": 150,
    "availableSeats": 150,
    "status": "Upcoming"
  }
  ```

### 4. Delete Event (Admin Only)
* **URL**: `DELETE /api/events/:id`
* **Headers**: `Authorization: Bearer <Admin_Token>`
* **Response (200 OK)**:
  ```json
  {
    "message": "Event removed successfully"
  }
  ```

---

## ✅ Phase 2 Verification Checklist

- [x] **Event Database Model**: Full Event schema structure with proper indexes and default cover photos.
- [x] **Admin Authorization Guard**: Standalone `adminProtect` middleware securing write paths.
- [x] **Validation Controls**: Implemented time validation (`startTime < endTime`), deadline boundary checks (`registrationDeadline <= eventDate`), and capacity requirements.
- [x] **API Route Mapping**: Added REST resources under `/api/events` with security middleware mapping.
- [x] **MVC Architecture**: Fully separated controllers, schemas, validations, and express routers.
- [x] **Admin Management UI**: Fully functional Event Table with actions to Create (via Modal), Update (via Modal), Delete (via Confirmation popup), and View Details.
- [x] **Student Exploration Dashboard**: Modern grid layouts of event cards with robust Category, Status, and Search filtering.
- [x] **Details Explorer Views**: Dedicated Single Event page displaying full stats, including a locked register action: `"Registration will be available in Phase 3."`
- [x] **Integration Testing**: Added `event.test.js` validating CRUD endpoints, authorization restrictions, and duplicate rules. 28/28 tests passing.
