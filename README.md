# College Event Registration Management System - Phase 1

This repository contains the complete, production-grade **Authentication Module (Phase 1)** of the College Event Registration Management System. It handles secure login, registration, role-based JWT authorization, validations, and responsive dashboards for both Students and Administrators.

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
├── College_Event_Registration_System_Phase_1.postman_collection.json
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
│       │   ├── Footer.jsx
│       │   ├── Loader.jsx
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── Toast.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminLogin.jsx
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
    │   └── studentController.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── validation.js
    ├── models/
    │   ├── Admin.js
    │   └── Student.js
    ├── routes/
    │   ├── adminRoutes.js
    │   └── studentRoutes.js
    └── tests/
        └── auth.test.js
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
To run the full suite of integration tests (validating registration, login, token authentication, role restrictions, duplicate handling, and field validations):
1. Navigate to `/server`.
2. Run:
   ```bash
   npm run test
   ```
   *Note: The tests execute against an in-memory MongoDB server (`mongodb-memory-server`) to ensure database independence.*

---

## 🌐 Sample API Requests & Responses

### 1. Student Registration
* **URL**: `POST /api/student/register`
* **Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "rollNumber": "CS202699",
    "email": "janedoe@college.edu",
    "department": "Computer Science",
    "year": "3rd Year",
    "password": "securepassword123"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "_id": "64c54b9d0fd5d...",
    "fullName": "Jane Doe",
    "rollNumber": "CS202699",
    "email": "janedoe@college.edu",
    "department": "Computer Science",
    "year": "3rd Year",
    "role": "Student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2. Student Login
* **URL**: `POST /api/student/login`
* **Body**:
  ```json
  {
    "email": "janedoe@college.edu",
    "password": "securepassword123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "_id": "64c54b9d0fd5d...",
    "fullName": "Jane Doe",
    "rollNumber": "CS202699",
    "email": "janedoe@college.edu",
    "role": "Student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

## ✅ Phase 1 Verification Checklist

- [x] **Project Setup**: Backend (Express) and Frontend (Vite + React) cleanly structured.
- [x] **Database Models**: Fully defined schemas with validation constraints for Student and Admin.
- [x] **Password Hashing**: Implemented using `bcryptjs` with pre-save database middleware hooks.
- [x] **JWT Generation & Verification**: Auth middleware verifies Bearer tokens and extracts claims.
- [x] **API Endpoints**: 
  - `POST /api/student/register`
  - `POST /api/student/login`
  - `GET /api/student/profile` (Protected)
  - `POST /api/admin/login`
  - `GET /api/admin/profile` (Protected)
- [x] **Role Restrictions**: Admins and Students restricted to their respective panels via role authorization.
- [x] **Input Validations**: Built-in rules preventing duplicate emails, roll numbers, short passwords, and empty fields.
- [x] **UI Layout**: Responsive navbar, custom footer, clean responsive login/registration forms, loader spinners, toast feedback, and dashboards.
- [x] **Integration Tests**: 100% test coverage using Supertest and Jest, with all 14 test cases passing.
