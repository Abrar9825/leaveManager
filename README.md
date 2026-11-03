# Full-Stack Leave & Daily Attendance Management System

A modern, high-performance, and clutter-free attendance and leave management platform built with **Node.js, Express, MongoDB (Mongoose), and React (Vite, Tailwind CSS)**.

---

## 🚀 Key Features & Business Rules

### 1. ⏱️ Daily Check-in & Late Attendance (10:00 AM Cutoff)
- **Punch-In Only (No Punch-Out)**: Focused purely on daily arrival time.
- **One-Touch Long-Press Check-In**: Press and hold the punch button (~600ms) with a smooth animated radial progress ring and haptic vibration to instantly check in with current system time.
- **Manual Time Entry**: Option to enter manual arrival time and date whenever needed with immediate late/on-time feedback.
- **10:00 AM Cutoff Rule**:
  - Check-in $\le$ 10:00 AM $\rightarrow$ **On Time** (Emerald).
  - Check-in $>$ 10:00 AM $\rightarrow$ **Late** (Rose) with minutes late calculated.
- **Late Strike Deduction**:
  - **Every 3 late arrivals in a month** deducts **0.5 Day (Half Day)** from your monthly leave balance:
    - 1st & 2nd Late: Warning strike ($1/3$, $2/3$).
    - 3rd Late: Triggers **0.5 Day** leave deduction.
    - 6th Late: Triggers another **0.5 Day** (total $1.0$ day deduction), and so on.

---

### 2. 📅 Strictly Month-Wise Leave Quota (2.0 Days/Month)
- **Month-Wise Balance Cycle**: Quota operates month-by-month (not yearly).
- **Monthly Allowance**: Every month has a standard quota of **2.0 Paid Leaves / Holidays**.
- **Negative Balance / Deficit Display**:
  - If leaves taken + late penalties exceed 2.0 days in a month, the balance drops into negative (e.g. `-0.5`, `-1.0`).
  - Negative values are prominently highlighted in bold crimson/rose with a dedicated **Deficit Badge** (`-0.5 Days Deficit`) to clearly show over-limit leaves.
- **Month & Year Navigator**: Easily browse between months (`← November 2026 →`) with a quick "Jump to Current Month" shortcut.

---

### 3. 📋 Daily Attendance & Holiday Ledger
- A clean, uncluttered daily ledger for the entire month showing:
  - Exact check-in time for each day.
  - On-time vs Late badges.
  - Official public & gazetted holidays.
  - Approved leaves.
  - Weekly offs (Saturdays & Sundays).
- Interactive quick-log option for any day.

---

### 4. 🏖️ Weekend Policy (Friday & Monday Rules)
- Friday leave asks if you will work on Saturday.
- Monday leave verifies if you worked on Saturday.
- Sandwiched Sundays between leave ranges are accounted for under policy.

---

## 🛠️ API Reference

### Attendance API
- `POST /api/attendance/punch` — Punch in (current time or manual time & date)
- `GET /api/attendance` — Fetch attendance records for a specific `year` and `month`
- `GET /api/attendance/today` — Check today's punch-in status
- `DELETE /api/attendance/:id` — Delete attendance record

### Leaves API
- `GET /api/leaves` — List leaves
- `POST /api/leaves` — Submit new leave & auto-recalculate balance
- `PUT /api/leaves/:id` — Update leave & recalculate balance difference
- `DELETE /api/leaves/:id` — Delete leave & restore days

### Balances & Holidays API
- `GET /api/balance` — Get balance ledgers
- `GET /api/holidays` — Official gazetted and public holidays list
