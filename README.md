# Full-Stack Leave Management System (End-to-End)

A modern, high-performance leave management platform built with **Node.js, Express, MongoDB (Mongoose), and React (Vite, Tailwind CSS)**.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (verified on Node v24)
- **MongoDB**: Local MongoDB server running on `mongodb://127.0.0.1:27017`

### 2. Backend Setup (`server/`)
```bash
cd server
npm install
npm start
# Server runs on http://localhost:5000
```
- MongoDB database: `leave_manager_db`
- Default seeds automatically inserted on first launch.

### 3. Frontend Setup (`Client/`)
```bash
cd Client
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 🌟 Key Features & Business Rules

### 1. Automatic Balance Recalculation on Edit & Delete
- **Delete Leave**: Restores leave days back into available balance and monthly quota in MongoDB, and logs an audit entry.
- **Edit Leave**: Automatically computes the delta (`newDays - oldDays`), updates the year's balance, and writes to audit logs.

### 2. Friday / Monday & Saturday "Raja" Policy Rule
When an employee applies for leave on **Friday** or **Monday** (or spans across the weekend):
- The application automatically triggers the **Weekend Adjacent Policy Form**:
  1. Asks: *"Is Saturday an official holiday / off day for your company?"* (Yes / No)
  2. If Saturday is a holiday:
     - **Friday Leave**: Prompts *"Will you come to work on Saturday? (Saturday aaoge?)"*
       - `Yes`: Saturday compensatory attendance confirmed (Compliant).
       - `No`: Tagged as Weekend Extension / Sandwich Leave.
     - **Monday Leave**: Prompts *"Did you come to work on Saturday? (Saturday aaye the?)"*
       - `Yes`: Saturday compensatory attendance confirmed.
       - `No`: Tagged as Weekend Extension.
- All policy decisions and attendance records are stored with the leave document in MongoDB (`saturdayRule`).

### 3. Dashboard Available Days Long-Press Reset with Tracking History
- **Long-Press on Balance Card**: Press and hold on the "Days available" card for ~650ms (with haptic feedback and dynamic hold progress ring) to trigger the **Reset Balance Modal**.
- **Live Recalibration**: Easily reset to standard quotas (24.0, 18.0) or set custom values with a required reason.
- **Permanent Tracking History (Audit Log)**:
  - Every reset, edit, deduction, and restoration is recorded in the MongoDB `BalanceHistory` collection.
  - Viewable at any time via the **"Tracking History"** button on the dashboard card.
  - Shows timestamp, change type, old balance, new balance, net adjustment (`+` / `-`), user, and reason.

---

## 🛠️ API Reference

### Leaves
- `GET /api/leaves` — List all leaves (optional `?year=2026`)
- `GET /api/leaves/:id` — Get single leave details
- `POST /api/leaves` — Submit new leave & auto-recalculate balance
- `PUT /api/leaves/:id` — Update leave & recalculate balance difference
- `DELETE /api/leaves/:id` — Delete leave & restore days to balance

### Balance & History
- `GET /api/balance` — Get all yearly balances
- `GET /api/balance/:year` — Get balance document for a specific year
- `POST /api/balance/adjust` — Reset / calibrate balance (long-press action)
- `GET /api/balance/history` — Audit trail of all balance modifications

### Auth & Profile
- `POST /api/auth/login` — Sign in
- `GET /api/auth/profile` — Fetch current user profile
- `PUT /api/auth/password` — Update account password

