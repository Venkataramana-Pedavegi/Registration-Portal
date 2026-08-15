# College Event Registration Management System — Developer Onboarding & Setup Guide

Welcome to the **Developer Onboarding & Setup Guide** for the College Event Registration Management System. This guide provides comprehensive, step-by-step technical documentation to help developers set up, run, test, debug, and deploy the application. The system supports students from multiple academic departments, including Computer Science and Artificial Intelligence (CAI), Artificial Intelligence and Machine Learning (AIML), Information Technology (IT), and Computer Science and Technology (CST).

---

## 🛠️ 1. Prerequisites & System Requirements

Before getting started, ensure your local development environment meets the following specifications:

| Requirement | Recommended Version | Minimum Version | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.x` LTS | `v18.0.0` | Runtime environment for backend and frontend tooling |
| **npm** | `v10.x` | `v9.x` | Node Package Manager |
| **MySQL Server** | `v8.0+` | `v8.0` | Relational Database Management System |
| **Git** | `v2.x+` | `v2.0` | Version Control System |
| **OS** | Windows 10/11, macOS, Linux | Any standard OS | Cross-platform compatibility |

---

## 📂 2. Repository Architecture & Layout

The project follows a decoupled client-server monorepo structure:

```text
Registration Portal/
├── database/
│   └── schema.sql                        # SQL Schema DDL creation script
├── server/                               # Node.js + Express Backend API
│   ├── config/
│   │   ├── database.js                   # Sequelize MySQL connection configuration
│   │   └── mailConfig.js                 # SMTP transport settings
│   ├── controllers/                      # Business logic handlers
│   │   ├── adminController.js            # Admin authentication, lockouts & approvals
│   │   ├── aiController.js               # Gemini LLM & Intent Classifier handlers
│   │   ├── authController.js             # Student auth & registration flow
│   │   ├── eventController.js            # Event CRUD & availability management
│   │   ├── registrationController.js     # Ticket issuance & SQL atomic transactions
│   │   └── ...                           # Other module controllers
│   ├── middleware/                       # Request processing interceptors
│   │   ├── auditLogger.js                # System event audit tracking
│   │   ├── authMiddleware.js             # JWT bearer verification & role authorization
│   │   └── security.js                   # Express Rate Limiting & Helmet headers
│   ├── models/                           # Sequelize ORM schema definitions
│   │   ├── Student.js, Event.js, ...     # Individual table models
│   │   └── index.js                      # Table relations & associations
│   ├── routes/                           # Express route declarations
│   ├── services/                         # Core background & business services
│   │   ├── AIService.js                  # Google Gemini API & fallback engine
│   │   ├── GamificationService.js        # Badge unlock & point logic
│   │   └── reminderService.js            # 24h/1h event notification scheduler
│   ├── tests/                            # Jest Integration & E2E Test Suite (19 files)
│   ├── utils/                            # Helper utilities (QR generator, PDFKit, email templates)
│   ├── .env.example                      # Environment template file
│   ├── Dockerfile                        # Server container configuration
│   ├── package.json                      # Backend dependencies & test scripts
│   └── server.js                         # Application entrypoint & HTTP server
├── client/                               # React + Vite Frontend SPA
│   ├── src/
│   │   ├── components/                   # Reusable UI components & modals
│   │   ├── context/                      # React Context providers (Auth, Theme)
│   │   ├── pages/                        # Page views (Dashboard, Events, AIAssistant, etc.)
│   │   ├── services/                     # Axios API client & endpoints
│   │   ├── App.jsx                       # Client-side router configuration
│   │   └── main.jsx                      # React DOM root entrypoint
│   ├── package.json                      # Frontend dependencies & Vite scripts
│   └── vite.config.js                    # Vite bundler configuration
├── DEVELOPER_GUIDE.md                    # Developer Onboarding & Setup Guide (This file)
├── KNOWLEDGE_TRANSFER_KIT.md             # System Knowledge Transfer Kit
├── README.md                             # High-level system overview
└── package.json                          # Workspace root script launcher
```

---

## ⚡ 3. Step-by-Step Environment Setup

Follow these steps sequentially to set up the development environment on your local machine.

### Step 3.1: Clone & Navigate to Repository
```bash
git clone <repository-url>
cd "Registration Portal"
```

### Step 3.2: Database Setup (MySQL)
1. Open your MySQL client (Command Line, MySQL Workbench, or DBeaver).
2. Create the target database:
   ```sql
   CREATE DATABASE college_event_registration CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the initial database schema:
   ```bash
   # From project root directory:
   mysql -u root -p college_event_registration < database/schema.sql
   ```

### Step 3.3: Backend Setup (`/server`)
1. Change directory to `/server`:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration:
   ```bash
   # Copy example template or create .env file
   cp .env.example .env
   ```
   *(Refer to [Section 4](#-4-environment-configuration-reference-env) for details on `.env` variables).*

### Step 3.4: Frontend Setup (`/client`)
1. In a new terminal window, navigate to `/client`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🔑 4. Environment Configuration Reference (`.env`)

Create `server/.env` with the following variables:

```env
# ------------------------------------
# SERVER & APP CONFIGURATION
# ------------------------------------
PORT=5000
NODE_ENV=development

# ------------------------------------
# MYSQL DATABASE CONFIGURATION
# ------------------------------------
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=college_event_registration
DB_USER=root
DB_PASSWORD=your_mysql_password

# ------------------------------------
# AUTHENTICATION & SECURITY (JWT)
# ------------------------------------
JWT_SECRET=super_secret_access_jwt_key_change_in_production
JWT_REFRESH_SECRET=super_secret_refresh_jwt_key_change_in_production
JWT_EXPIRES_IN=1d

# ------------------------------------
# EMAIL NOTIFICATIONS (NODEMAILER / SMTP)
# ------------------------------------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
EMAIL_FROM_NAME=College Event Portal
EMAIL_FROM_ADDRESS=noreply@college.edu

# ------------------------------------
# AI COPILOT & ASSISTANT (GOOGLE GEMINI)
# ------------------------------------
# Optional: System will automatically use fallback intent classifier if omitted
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## 🏃 5. Development Workflow & Running Locally

### Starting the Application

**Option A: Running from Root Directory**
```bash
# Starts the server directly from root
npm start
```

**Option B: Separate Terminal Windows (Recommended)**

Terminal 1 — Server (Backend API):
```bash
cd server
npm run dev
```
*Backend runs at `http://localhost:5000`. On startup, Sequelize automatically syncs missing table definitions, seeds default badges, and initiates background job queues.*

Terminal 2 — Client (React SPA):
```bash
cd client
npm run dev
```
*Frontend runs at `http://localhost:5173` (or Vite's assigned port).*

---

## 🧪 6. Automated Testing & Quality Assurance

The system incorporates comprehensive testing using **Jest** and **Supertest** for the backend API, and **Oxlint** for frontend code quality.

### 6.1 Running Backend Tests
Navigate to `/server` and run:
```bash
# Run all backend test suites
npm test
```

### 6.2 Test Suites Breakdown
The backend contains 19 specialized test files located in `server/tests/`:

| Test Suite File | Domain / Module Covered |
| :--- | :--- |
| [`auth.test.js`](file:///c:/Registration%20Portal/server/tests/auth.test.js) | JWT registration, login, lockouts, and token verification |
| [`event.test.js`](file:///c:/Registration%20Portal/server/tests/event.test.js) | Admin event CRUD, capacity bounds, and scheduling |
| [`registration.test.js`](file:///c:/Registration%20Portal/server/tests/registration.test.js) | Double-booking protection, atomic SQL transactions, ticket issuance |
| [`qr_system.test.js`](file:///c:/Registration%20Portal/server/tests/qr_system.test.js) | QR code generation, signature verification, and check-in pass |
| [`entry_verification_access.test.js`](file:///c:/Registration%20Portal/server/tests/entry_verification_access.test.js) | Door verification, coordinator role permissions |
| [`gamification.test.js`](file:///c:/Registration%20Portal/server/tests/gamification.test.js) | Points calculation, level progression, badge unlocking |
| [`analytics.test.js`](file:///c:/Registration%20Portal/server/tests/analytics.test.js) | Admin analytics reporting, CSV export data structures |
| [`copilot_assistant.test.js`](file:///c:/Registration%20Portal/server/tests/copilot_assistant.test.js) | AI Copilot query routing & Gemini integration |
| [`intent_chatbot.test.js`](file:///c:/Registration%20Portal/server/tests/intent_chatbot.test.js) | Intent classifier fallback patterns & rule engine |
| [`unified_ai_assistant.test.js`](file:///c:/Registration%20Portal/server/tests/unified_ai_assistant.test.js) | AI assistant endpoint responses |
| [`gallery.test.js`](file:///c:/Registration%20Portal/server/tests/gallery.test.js) | Event image gallery uploads & retrieval |
| [`feedback_system.test.js`](file:///c:/Registration%20Portal/server/tests/feedback_system.test.js) | Post-event feedback & rating submission |
| [`admin_notification.test.js`](file:///c:/Registration%20Portal/server/tests/admin_notification.test.js) | Broadcast notifications & alert queues |
| [`attendance_import.test.js`](file:///c:/Registration%20Portal/server/tests/attendance_import.test.js) | Bulk attendance CSV processing |
| [`hardening.test.js`](file:///c:/Registration%20Portal/server/tests/hardening.test.js) | Rate limiters, security headers, input sanitization |
| [`security.test.js`](file:///c:/Registration%20Portal/server/tests/security.test.js) | Password hashing, CORS headers, SQL parameterization |
| [`phase5.test.js`](file:///c:/Registration%20Portal/server/tests/phase5.test.js) | PDF Certificate generation & server-side pagination |
| [`ai_hub_navigation.test.js`](file:///c:/Registration%20Portal/server/tests/ai_hub_navigation.test.js) | AI navigation endpoints |
| [`e2e_user_journey.test.js`](file:///c:/Registration%20Portal/server/tests/e2e_user_journey.test.js) | Full student journey from signup to attendance & certificate |

### 6.3 Running Frontend Linting
Navigate to `/client` and run:
```bash
npm run lint
```

---

## 🏛️ 7. Core Architecture & Key Technical Concepts

### 7.1 Database Transactions & Concurrency Control
Event registration requires strict concurrency safety to prevent overbooking. The registration endpoint in `registrationController.js` executes inside a Sequelize managed transaction:
```javascript
const result = await sequelize.transaction(async (t) => {
  // 1. Lock and check event capacity
  const event = await Event.findByPk(eventId, { transaction: t, lock: true });
  if (event.availableSeats <= 0) {
    throw new Error('Event is fully booked');
  }
  // 2. Decrement seat availability
  await event.decrement('availableSeats', { by: 1, transaction: t });
  // 3. Create registration record with generated QR code
  return await Registration.create({ ... }, { transaction: t });
});
```

### 7.2 Security Architecture
- **Password Protection**: Hashed using `bcryptjs` with 10 salt rounds. Last 3 password hashes saved to prevent reuse.
- **Failed Attempt Lockout**: Accounts temporarily locked (`lockoutUntil`) after 5 failed consecutive logins.
- **Request Throttling**: Express Rate Limiter restricts API endpoints to 300 requests per 15-minute window per IP.
- **HTTP Hardening**: Helmet middleware sets security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`).

### 7.3 AI Integration Architecture
- **Primary Engine**: Google Generative AI (`@google/generative-ai`) invoking `gemini-1.5-flash`.
- **Fallback Engine**: Local rule-based intent classifier ([`intentClassifier.js`](file:///c:/Registration%20Portal/server/utils/intentClassifier.js)) that processes standard queries when no API key is provided or when rate limits are exceeded.

---

## 🚀 8. Production Build & Deployment Guide

### Step 8.1: Database (Managed Cloud MySQL)
1. Provision a Cloud MySQL database instance (e.g., AWS RDS, Railway, PlanetScale, Aiven).
2. Execute `database/schema.sql` to initialize tables.
3. Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, and `DB_NAME` in production environment settings.

### Step 8.2: Backend Deployment (Render / Railway / Heroku / AWS)
1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Environment Variables**: Configure all variables specified in Section 4. Ensure `NODE_ENV=production` is set.
4. **CORS Configuration**: Update client origin domains allowed in Express CORS options (`server.js`).

### Step 8.3: Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. **Root Directory**: `client`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**: Define API base URL if specified in frontend client config (`src/services/api.js`).

---

## ❓ 9. Troubleshooting & FAQ

#### Q1: Port 5000 is already in use when starting the server
**Solution**: Check for existing background processes listening on port 5000:
- Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
- Linux/macOS: `lsof -i :5000` then `kill -9 <PID>`

#### Q2: Email notifications are not sending during testing
**Solution**: In development and test environments (`NODE_ENV=test`), Nodemailer email sending is simulated in the console (`[Email Simulation] To: ...`). To send real emails, set `NODE_ENV=development` or `production` and configure valid SMTP credentials in `.env`.

#### Q3: AI Assistant returns fallback responses
**Solution**: Ensure `GEMINI_API_KEY` is present and valid in `server/.env`. If the key is missing or quota is exceeded, the server seamlessly uses local intent classification.

---

*System Developer Onboarding & Setup Guide created for the College Event Registration Management System.*
