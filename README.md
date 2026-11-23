# Salon Queue Management System

**Live demo:** https://salon-queue-aurelia.vercel.app  
**Hosted on:** Vercel (frontend) + Render (backend)  
**Staff Access PIN:** `1234`

---

## 🌟 About the Project

**AURELIA · Haute Coiffure & Luxury Grooming Lounge** is a production-grade, bilingual (English & Gujarati) Queue Management Platform designed to eliminate weekend waiting-room chaos and uncertain queues in salons. 

Customers can effortlessly check live wait times, select services, choose preferred stylists, and track their position from their mobile devices with real-time countdowns and turn alerts. Front-desk staff, barbers, and salon owners manage the salon lifecycle through dedicated, PIN-protected, and TV-optimized interfaces powered by **SQLite** and **Socket.IO**.

The UI is custom-crafted with an Obsidian Charcoal & Imperial Gold aesthetic, typography powered by *Cinzel* and *Plus Jakarta Sans*, Web Audio API synthesizers for real-time chimes, interactive circular SVG progress dials, and celebratory confetti upon client turn alerts.

---

## 🚀 Quick Start & Run Locally

### Prerequisites
- Node.js v18+ (tested on Node v22.14.0)
- npm v10+

### Step-by-Step Execution

1. **Clone & Navigate:**
   ```bash
   cd salon-queue
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   *(Default `.env` is already configured for local dev on ports 5173 and 4000)*

4. **Launch Application (Frontend + Backend concurrently):**
   ```bash
   npm run dev
   ```

5. **Run Automated Test Suite:**
   ```bash
   npm test
   ```

6. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🖥️ Screen URLs & Testing Access

| Screen | URL | Intended User & Device | Access PIN |
|---|---|---|---|
| **1. Customer Home** | [http://localhost:5173/](http://localhost:5173/) | Mobile / All Clients | Public |
| **2. Join Queue** | [http://localhost:5173/join](http://localhost:5173/join) | Mobile Client | Public |
| **3. Live Status** | [http://localhost:5173/status/:id](http://localhost:5173/status/1) | Mobile Client | Public |
| **4. Front Desk Reception** | [http://localhost:5173/reception](http://localhost:5173/reception) | Tablet (10" Landscape) / Laptop | `1234` |
| **5. Stylist Station (Ravi)** | [http://localhost:5173/barber/Ravi](http://localhost:5173/barber/Ravi) | Mobile Barber View | `1234` |
| **Stylist Station (Amit)** | [http://localhost:5173/barber/Amit](http://localhost:5173/barber/Amit) | Mobile Barber View | `1234` |
| **Stylist Station (Imran)** | [http://localhost:5173/barber/Imran](http://localhost:5173/barber/Imran) | Mobile Barber View | `1234` |
| **6. Waiting Area TV** | [http://localhost:5173/display](http://localhost:5173/display) | 1080p TV Display (No Nav) | Public |
| **7. Owner Settings** | [http://localhost:5173/admin](http://localhost:5173/admin) | Desktop / Tablet Admin | `1234` |

---

## ✨ Implemented Features

### 1. Customer Experience
- **Live Salon Overview:** Real-time Open/Closed indicator, waiting count, and live status of each stylist (`Busy`, `Available`, `On break`).
- **Remote Queue Joining:** 10-digit mobile phone validation, multi-select service selection (max 3), live calculation of duration and price in ₹.
- **Barber Preference:** Choose "Any stylist (fastest)" or select a specific master stylist.
- **Duplicate Prevention:** If a mobile number already has an active queue entry (`Waiting`, `Called`, or `In chair`), returns the active spot instead of creating duplicate tokens.
- **Live Status Tracking:** Real-time position in line, circular countdown dial, and "⚡ Start coming to the salon" banner when 2nd in line.
- **Turn Alert:** Full-screen celebratory gold alert with device vibration, Web Audio API pentatonic chimes, and confetti burst when Called.
- **Self-Service Cancellation:** Clients can cancel their spot with a confirmation dialog while in `Waiting` status.

### 2. Reception & Front Desk
- **Tablet Landscape Layout:** Left-hand stylist station status cards and right-hand active queue table.
- **Call Next Logic:** Respects strict barber preferences; never assigns a customer who selected Ravi to Amit or Imran.
- **Walk-in Registrations:** Fast modal to add walk-ins at the end of the queue. Walk-ins function even when online joining is closed.
- **Late Arrivals & No-Shows:** Reception can mark a client as `No-show` after confirming 10 minutes have elapsed since being called.
- **Re-Add Flow:** Late clients can be re-added to the end of the queue with a brand new sequential token.
- **Wait Duration Highlights:** Entries waiting longer than 60 minutes are automatically highlighted in amber/red alert styling.

### 3. Stylist Chairs (Barber View)
- **Station Chair Dashboard:** Real-time customer details, requested services, and live service stopwatch timer (`MM:SS`).
- **One-Tap Actions:** Big `Start Service` (moves `Called` -> `In chair`) and `Finish Service` (moves `In chair` -> `Done`).
- **Upcoming Client:** "Next in line for you" card previewing the next customer.
- **Break Controls:** Instant toggle between Available and On Break.

### 4. Waiting Area TV Board (`/display`)
- **Full Screen 1920x1080:** Optimized for readability from 5+ metres with zero navigation controls.
- **Two Clear Sections:** Left 65% displays on-duty stylists with current serving tokens; Right 35% displays the next 5 upcoming tokens with estimated wait.
- **Flash & Chime Alert:** Newly called tokens trigger a prominent glowing gold banner for 5 seconds accompanied by a synthesized dual-tone chime.
- **Auto-reconnect:** Resilient Socket.IO reconnection logic with reconnect banners.

### 5. Executive Salon Controls (`/admin`)
- **Performance KPIs:** Daily metrics for clients served today, average wait time, and no-shows.
- **Online Booking Switch:** Master toggle to open or close online bookings.
- **Service Catalog CRUD:** Add, update, and toggle active/inactive status for services with bilingual names, duration, and price.
- **Stylist Management:** Toggle On-Duty and Off-Duty states in real time.

### 6. Design & Architecture
- **Obsidian Charcoal & Imperial Gold:** Palette featuring `#0B0F17`, `#111827`, and `#D4A017`.
- **Bilingual Support (EN / GU):** Complete English and Gujarati localization across all seven screens, powered by a single centralized language dictionary.
- **Shared Backend Rules Engine:** All status transitions, queue calculations, and token issuances are governed by a single backend module (`server/src/queueRules.ts`).
- **Daily Token Reset:** Resets sequence daily at midnight in the `Asia/Kolkata` timezone.

---

## 🧪 Comprehensive QA Audit & Test Results

The application was tested against every requirement in `docs/03-flows-rules.md`:

| # | Verification Scenario | Expected Outcome | Status |
|---|---|---|---|
| 1 | Phone Number Validation | Rejects non-10-digit inputs; formats properly | **PASS** |
| 2 | Service Selection Limit | Enforces 1 to 3 services maximum | **PASS** |
| 3 | Duplicate Active Phone | Returns existing spot without issuing new token | **PASS** |
| 4 | Barber Preference Rules | Customer requesting Ravi is never called by Amit | **PASS** |
| 5 | Single Chair Occupancy | Barber cannot call another client while chair is occupied | **PASS** |
| 6 | Forward-Only Transitions | Rejects backward moves (e.g., Done -> Waiting) | **PASS** |
| 7 | Daily Token Reset | Resets token sequence to S-1 daily in Asia/Kolkata | **PASS** |
| 8 | Online Cutoff Window | Disables online join 30m prior to closing time | **PASS** |
| 9 | Walk-In After Cutoff | Walk-ins succeed even when online joining is closed | **PASS** |
| 10 | Wait Time Calculation | Service minutes divided by active working barbers | **PASS** |
| 11 | No-Show 10-Minute Rule | Requires 10 mins elapsed in Called state | **PASS** |
| 12 | Late Arrival Re-Add | Issues brand new sequential token at queue tail | **PASS** |
| 13 | Customer Self-Cancel | Spot successfully cancelled; released from queue | **PASS** |
| 14 | Multi-Window Live Sync | Socket.IO broadcasts updates across phone, tablet, and TV | **PASS** |
| 15 | Audio Chime on Call | Web Audio API plays pentatonic chime when Called | **PASS** |
| 16 | Confetti Animation | Canvas confetti triggers on customer turn alert | **PASS** |
| 17 | Full Gujarati Localization | All labels, services, and alerts render cleanly in GU | **PASS** |
| 18 | Production Build | Clean TypeScript compilation and Vite bundling | **PASS** |

---

## 📝 Half-Page Reflection

### What the AI Agent Initially Got Wrong
During initial scaffolding, the agent treated queue wait calculation as a static client-side estimation based simply on token position multiplied by a fixed 5-minute factor. Additionally, it initially allowed customers in the `Called` state to cancel their spot from the customer view, violating the salon rule that only `Waiting` clients can cancel.

### How it was Noticed
During an end-to-end trace with preferred stylists, customer wait times showed an arbitrary 10 minutes even when the chosen stylist had 3 consecutive haircuts (90 minutes total) scheduled ahead. Furthermore, clicking "Cancel" after the receptionist called the client broke the state machine because the stylist's station still had the client registered for an upcoming `Start Service` action.

### How the Prompt and Rules were Corrected
The prompt and `docs/03-flows-rules.md` were updated to strictly enforce:
1. Wait time must be dynamically calculated on the backend as:
   $$\text{Expected Wait} = \left\lceil \frac{\text{Total Service Minutes Ahead}}{\text{Number of Active, Non-Break Barbers}} \right\rceil$$
2. The state transition machine in `server/src/queueRules.ts` was locked so that only `Waiting -> Cancelled` is permissible; `Called` spots cannot be cancelled by the user and must instead either move forward to `In chair` or be marked as `No-show` by reception after the 10-minute absence window.

---

## 📦 Deployment Instructions

- **Frontend (Vercel):** Connect your GitHub repository, choose `Vite` framework, set root directory to `.` or `client`, build command `npm run build:client`, and output directory `client/dist`.
- **Backend (Render / Railway):** Set start command to `node dist/server/server/src/index.js`, build command `npm ci && npm run build:server`, and add environment variable `CLIENT_ORIGIN` set to your Vercel URL.
