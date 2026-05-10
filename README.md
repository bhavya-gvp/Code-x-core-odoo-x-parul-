# 🌍 Traveloop AI — Intelligent Travel Planning Platform

> **An engineering-first, production-grade AI travel operating system.**  
> Built for scalability, maintainability, and real-world deployment.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Product Vision](#product-vision)
- [Architecture Overview](#architecture-overview)
- [Database Design](#database-design)
- [Backend Engineering](#backend-engineering)
- [AI Engine (Internal)](#ai-engine-internal)
- [Security Implementation](#security-implementation)
- [Frontend Architecture](#frontend-architecture)
- [API Reference](#api-reference)
- [Setup & Installation](#setup--installation)
- [Engineering Decisions](#engineering-decisions)

---

## Product Vision

Traveloop AI is a **logic-driven, internally engineered** travel planning platform. The system generates complete, optimized trip itineraries based on user inputs using **custom algorithm engines** — not API wrappers.

**Core philosophy:** Real engineering over flashy integrations. Every intelligence feature is built in-house.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  Next.js 14 (App Router) · TypeScript · TailwindCSS            │
│  Framer Motion · Custom Hooks · Feature Modules                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP / REST
┌────────────────────────────▼────────────────────────────────────┐
│                        API GATEWAY                              │
│  Express.js · Helmet · CORS · Rate Limiting · Morgan Logging    │
│  Winston Structured Logs · X-Request-ID Tracing                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌──────────┐       ┌──────────┐       ┌──────────┐
   │Controllers│      │  Routes  │      │Middleware │
   │(I/O only) │      │(versioned│      │ auth/val/ │
   └─────┬────┘       │ grouped) │      │  error)   │
         │            └──────────┘      └──────────┘
         ▼
   ┌──────────┐
   │ Services │ ← Business Logic (pure functions)
   │ (domain) │
   └─────┬────┘
         │
         ▼
   ┌──────────┐
   │Repositories│ ← Database Abstraction (SQL only here)
   └─────┬────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                            │
│  MySQL 8.0 · 28 Tables · 3NF Normalized · Composite Indexes   │
│  Soft Deletes · Audit Logs · Connection Pool (20 connections)  │
└────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Rule |
|-------|----------------|------|
| **Controller** | Parse request, call service, send response | No business logic |
| **Service** | Business logic, orchestration | No direct DB calls |
| **Repository** | SQL queries, data access | No business rules |
| **Middleware** | Auth, validation, logging, errors | Cross-cutting concerns |
| **Engine** | Algorithms, scoring, generation | Stateless pure functions |

---

## Database Design

### Entity Relationship Map

```
users ─────────────────────────────────────────────────────────┐
  │                                                             │
  ├── trips (1:N)                                               │
  │     ├── trip_cities (1:N)                                   │
  │     ├── itinerary_days (1:N)                                │
  │     │     └── activities (1:N)                              │
  │     ├── expenses (1:N)                                      │
  │     ├── packing_items (1:N)                                 │
  │     ├── trip_insights (1:N) ← AI-generated                  │
  │     ├── fatigue_scores (1:1) ← Algorithm output             │
  │     ├── trip_notes (1:N)                                    │
  │     ├── trip_tags (M:N) ─── tags                            │
  │     └── collaborators (1:N)                                 │
  │           └── collaborator_votes (1:N) ← Borda count        │
  │                                                             │
  ├── journals (1:N)                                            │
  ├── community_posts (1:N)                                     │
  │     ├── post_likes (M:N) ── users                           │
  │     ├── comments (1:N, self-referential for threading)      │
  │     └── saved_posts (M:N) ── users                          │
  │                                                             │
  ├── notifications (1:N)                                       │
  ├── user_preferences (1:1)                                    │
  └── user_followers (M:N self-ref)                             │
                                                               │
activity_categories ──── activities ───────────────────────────┘
destination_tags ──── tags
```

### Complete Table Reference (28 Tables)

| # | Table | Purpose | Key Design Decision |
|---|-------|---------|---------------------|
| 1 | `users` | User accounts | UUID PK, bcrypt password, soft delete |
| 2 | `trips` | Core trip entity | `ai_generated` flag, mood enum, soft delete |
| 3 | `trip_cities` | Destinations per trip | Ordered by `order_index`, stores coordinates |
| 4 | `itinerary_days` | One row per travel day | FK to trip + date, theme from AI engine |
| 5 | `activities` | Per-day activities | `time_slot` enum (morning/afternoon/evening/night) |
| 6 | `activity_categories` | Activity type master | Seeded, referenced by activities FK |
| 7 | `expenses` | Budget tracking | Category enum, currency field, `expense_date` |
| 8 | `packing_items` | Packing lists | Per-trip, sortable, `is_packed` flag |
| 9 | `journals` | Travel journals | Markdown content, mood, photo support |
| 10 | `collaborators` | Trip sharing | Role enum (owner/editor/viewer) |
| 11 | `collaborator_votes` | Group decisions | Borda count scoring (vote_value: -1/0/1) |
| 12 | `community_posts` | Public sharing | `visibility` enum, `likes_count` denormalized |
| 13 | `post_likes` | Like tracking | Junction table with unique constraint |
| 14 | `saved_posts` | Bookmark posts | Unique (post_id, user_id) constraint |
| 15 | `comments` | Threaded comments | `parent_id` self-referential FK for nesting |
| 16 | `tags` | Reusable tags | Seeded with 16 travel tags |
| 17 | `trip_tags` | Trip-tag junction | Composite PK (trip_id, tag_id) |
| 18 | `destination_tags` | Destination labeling | M:N with audit (tagged_by FK) |
| 19 | `trip_insights` | AI insights store | `insight_type` enum, `is_warning` flag |
| 20 | `fatigue_scores` | Algorithm output | 1:1 with trips, stores all scoring factors |
| 21 | `trip_notes` | Freeform notes | Color-coded, pinnable, soft delete |
| 22 | `notifications` | Platform alerts | `is_read`, `read_at` for unread count queries |
| 23 | `user_preferences` | Per-user settings | 1:1 with users, theme/currency/language |
| 24 | `user_followers` | Social graph | Self-referential M:N on users |
| 25 | `saved_trips` | Trip bookmarks | Separate from community saves |
| 26 | `activity_logs` | Audit trail | All user actions logged for security |
| 27 | `votes` | Generic votes | Reusable for various voting features |
| 28 | `post_saves` | (alias) saved posts | Maintained for API compatibility |

### Normalization Strategy

- **1NF**: All columns atomic, no repeating groups
- **2NF**: All non-key attributes fully dependent on PK (junction tables used for M:N)
- **3NF**: No transitive dependencies — `likes_count` on posts is intentionally denormalized (OLTP optimization to avoid expensive COUNT on every feed load)

### Index Strategy

```sql
-- Dashboard query: user's trips filtered by status
CREATE INDEX idx_trips_user_status ON trips (user_id, status, deleted_at);

-- Budget analytics: expenses by trip and category
CREATE INDEX idx_expenses_trip_cat ON expenses (trip_id, category);

-- Community feed: ordered by engagement
CREATE INDEX idx_posts_visibility_likes ON community_posts (visibility, likes_count, created_at);

-- Notification bell: unread count (most frequent query)
CREATE INDEX idx_notif_unread ON notifications (user_id, is_read);

-- Itinerary display: ordered activities per day
CREATE INDEX idx_activities_timeslot ON activities (itinerary_day_id, time_slot);
```

---

## Backend Engineering

### Project Structure

```
backend/
├── config/
│   ├── db.js              # MySQL pool (20 connections, keep-alive, UTF8MB4)
│   ├── constants.js        # All magic numbers in one place
│   └── cloudinary.js       # Optional media storage
│
├── controllers/            # HTTP I/O only — no business logic
│   ├── authController.js
│   ├── tripController.js   # includes generateTrip handler
│   ├── budgetController.js
│   ├── itineraryController.js
│   ├── journalController.js
│   ├── communityController.js
│   ├── adminController.js
│   └── aiController.js
│
├── services/               # All business logic lives here
│   ├── tripGenerationService.js  # ← MAIN AI ENGINE
│   ├── tripService.js
│   ├── budgetService.js
│   ├── communityService.js
│   ├── aiService.js
│   ├── recommendationService.js
│   └── weatherService.js
│
├── repositories/           # SQL queries only — no business rules
│   ├── BaseRepository.js   # Shared CRUD patterns
│   ├── TripRepository.js
│   ├── BudgetRepository.js
│   ├── ItineraryRepository.js
│   ├── CommunityRepository.js
│   └── UserRepository.js
│
├── engine/                 # Pure algorithmic modules
│   ├── budgetOptimizer.js        # Knapsack-inspired allocation
│   ├── travelFatigueScorer.js    # 7-factor fatigue model
│   ├── itineraryBalancer.js      # Round-robin intensity distribution
│   ├── packingEngine.js          # Climate/activity matrix
│   ├── recommendationEngine.js   # Weighted personality scoring
│   └── groupPreferenceMatcher.js # Borda count consensus
│
├── middleware/
│   ├── authMiddleware.js   # JWT verify, role check, optional auth
│   ├── errorMiddleware.js  # Centralized error formatting
│   └── uploadMiddleware.js # Multer file handling
│
├── validators/
│   └── tripValidator.js    # express-validator chains per route
│
├── data/                   # Internal datasets (no API needed)
│   ├── destinations.json   # 11 cities with cost tiers, mood mapping
│   └── activities.json     # 30+ activities with metadata
│
└── database/
    ├── schema.sql          # Base schema
    ├── schema_v2.sql       # Soft deletes, composite indexes, V2 tables
    ├── schema_v3.sql       # AI generation columns
    └── schema_v4.sql       # Final production tables (28 total)
```

### API Response Envelope

Every API response follows a consistent contract:

```json
{
  "success": true,
  "message": "Trip generated successfully",
  "data": { },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 154,
    "pages": 8
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "budget", "message": "Budget must be a positive number" }
  ],
  "requestId": "a3f9c2d1-xxxx"
}
```

---

## AI Engine (Internal)

> **Zero external AI API dependency.** All intelligence is algorithmic.

### Trip Generation — 8-Step Pipeline

```
POST /api/trips/generate
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  STEP 1: Duration Analysis                          │
│  → date diff → days/nights count                   │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│  STEP 2: Destination Resolution                     │
│  → fuzzy match against destinations.json            │
│  → auto-suggest if no input (mood + budget fit)     │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│  STEP 3: City Day Distribution                      │
│  → weight by recommendedDays / totalWeight          │
│  → clamp to [minDays, maxDays] per destination      │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│  STEP 4: Daily Schedule Generation                  │
│  → 4 time slots per day (morning/afternoon/eve/night)│
│  → slot pool + mood activity overlay                │
│  → cycle through to prevent repetition              │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│  STEP 5: Budget Allocation                          │
│  → mood-aware percentage split                      │
│  → hotels / food / transport / activities / buffer  │
│  → city-level breakdown by day ratio                │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│  STEP 6: Fatigue Score Calculation                  │
│  → city_switches × 8                               │
│  → activities_per_day scoring                       │
│  → trip length factor                               │
│  → label: Comfortable / Moderate / High / Extreme   │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│  STEP 7: Smart Insight Generation                   │
│  → 5 conditional insight types                      │
│  → destination / budget / mood / fatigue / duration │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│  STEP 8: Atomic MySQL Transaction Save              │
│  → trips → trip_cities → itinerary_days             │
│  → activities → expenses → activity_logs            │
│  → Rollback on any failure                          │
└─────────────────────────────────────────────────────┘
```

### Fatigue Scoring Model

```javascript
// 7-factor weighted model
score += citySwitches × 8          // movement penalty
score += activitiesPerDay >= 4 ? 10 : (== 3 ? 6 : 2)  // schedule density
score += tripLength > 7  ? 10 : 0  // duration fatigue
score += tripLength > 14 ? 15 : 0  // extended trip bonus fatigue
score += nightActivities ? 6 : 0   // late night penalty

// Output: 0–100 score with label
// < 30  → "Low — Very relaxed pace"
// < 50  → "Moderate — Balanced"
// < 70  → "High — Add rest days"
// >= 70 → "Extreme — Consider reducing activities"
```

### Budget Optimizer — Mood-Aware Allocation

```javascript
// Allocation changes based on travel mood
Romantic Escape:   Hotels 42% | Food 18% | Transport 18% | Activities 17% | Buffer 5%
Adventure Rush:    Hotels 30% | Food 18% | Transport 20% | Activities 27% | Buffer 5%
Standard/Default:  Hotels 38% | Food 22% | Transport 20% | Activities 15% | Buffer 5%
```

### Recommendation Engine — Weighted Scoring

```javascript
// Activities scored by compatibility
score = (moodMatch × 0.35) + (budgetFit × 0.25) + (styleMatch × 0.20) + (intensityFit × 0.20)
// Top N activities selected per time slot
```

---

## Security Implementation

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Authentication** | JWT (HS256) | 7-day expiry, `iss` claim validation |
| **Passwords** | bcrypt | Cost factor 12 |
| **Headers** | Helmet.js | CSP, HSTS, X-Frame-Options, etc. |
| **CORS** | Configured | Whitelist-based origin |
| **Rate Limiting** | 3-tier | Global: 100/15min, Auth: 10/15min, AI: 5/min |
| **Validation** | express-validator | Per-route chains, sanitization |
| **SQL Injection** | Parameterized queries | `mysql2` prepared statements throughout |
| **Audit Trail** | activity_logs table | All state-changing actions logged |
| **Request Tracing** | X-Request-ID | UUID per request, logged in Winston |

---

## Frontend Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout + providers
│   ├── page.tsx            # App shell
│   └── [feature]/page.tsx  # Feature routes
│
├── components/             # Shared UI components
│   ├── AIGenerationScreen.tsx   # Animated generation flow
│   ├── GeneratedItineraryView.tsx # Rich itinerary display
│   ├── Dashboard.tsx
│   └── Navigation.tsx
│
├── features/               # Domain-driven feature modules
│   ├── trips/              # Co-located: components, hooks, types
│   ├── budget/
│   └── community/
│
├── hooks/                  # Custom React hooks
│   ├── useTrips.ts         # Trip CRUD with optimistic updates
│   ├── useBudget.ts        # Budget state + analytics
│   ├── useCommunity.ts     # Feed + interactions
│   ├── useDebounce.ts      # Input debouncing (300ms)
│   └── usePagination.ts    # Cursor-based pagination
│
├── lib/
│   ├── api.ts              # Axios instance + interceptors
│   ├── constants.ts        # App-wide constants
│   └── utils.ts            # Pure utility functions
│
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

---

## API Reference

### Authentication
```
POST   /api/auth/register     # Create account (bcrypt + JWT)
POST   /api/auth/login        # Login (rate-limited: 10/15min)
GET    /api/auth/me           # Get current user (JWT required)
PUT    /api/auth/profile      # Update profile
```

### AI Trip Generation
```
POST   /api/trips/generate    # ← Main AI generation endpoint
```
**Request:**
```json
{
  "destinations": ["Tokyo", "Kyoto", "Osaka"],
  "start_date": "2025-10-15",
  "end_date": "2025-10-21",
  "budget": 200000,
  "mood": "Nature Detox",
  "travel_type": "Couple Trip",
  "travelers": 2
}
```
**Response includes:** tripSummary, destinations (with day allocation), full itinerary, budget breakdown, fatigue score, AI insights

### Trips
```
GET    /api/trips             # All user trips (paginated)
POST   /api/trips             # Create trip (standard)
GET    /api/trips/public      # Public discovery feed
GET    /api/trips/:id         # Single trip detail
PUT    /api/trips/:id         # Update trip
DELETE /api/trips/:id         # Soft delete
GET    /api/trips/:id/budget  # Budget analytics
```

### Budget
```
GET    /api/budget/:tripId    # Budget summary + breakdown
POST   /api/budget/expense    # Log expense
GET    /api/budget/analytics  # Cross-trip analytics
```

### Community
```
GET    /api/community/feed    # Public post feed (paginated)
POST   /api/community/posts   # Create post
POST   /api/community/posts/:id/like    # Toggle like (atomic)
POST   /api/community/posts/:id/comment # Add comment
```

### Admin
```
GET    /api/admin/analytics   # Platform analytics (admin only)
GET    /api/admin/users       # Paginated user management
PUT    /api/admin/users/:id/status  # Suspend/activate account
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/bhavya-gvp/Code-x-core-odoo-x-parul-.git
cd Code-x-core-odoo-x-parul-

# Frontend dependencies
npm install

# Backend dependencies
cd backend && npm install
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE traveloop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Apply schemas in order
mysql -u root -p traveloop_db < backend/database/schema.sql
mysql -u root -p traveloop_db < backend/database/schema_v2.sql
mysql -u root -p traveloop_db < backend/database/schema_v3.sql
mysql -u root -p traveloop_db < backend/database/schema_v4.sql
```

### 3. Environment Configuration

```bash
# backend/.env
NODE_ENV=development
PORT=5001

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=traveloop_db

JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:3000
```

```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_APP_NAME=Traveloop AI
```

### 4. Start Development

```bash
# Terminal 1 — Backend
cd backend && node server.js

# Terminal 2 — Frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- Health Check: http://localhost:5001/health

> **Note:** Port 5001 is used because macOS AirPlay Receiver occupies port 5000 on newer macOS versions.

---

## Engineering Decisions

### Why MySQL over NoSQL?
The travel domain is inherently relational — trips have cities, cities have days, days have activities, activities have categories. A document store would denormalize these relationships and make cross-entity queries (e.g., "show all activities across all trips for a user in a date range") unnecessarily complex.

### Why Controller → Service → Repository (no models)?
Traditional ORM models couple database structure to business logic. Our repository pattern keeps SQL contained to one layer, making it trivial to optimize queries without touching business logic, and easy to test each layer independently.

### Why internal datasets over AI APIs?
- No API costs, no rate limits, no latency
- Deterministic output (same input = same quality output every time)
- Demonstrates algorithmic thinking vs. prompt engineering
- Works offline / in demo environments

### Why denormalize `likes_count` on posts?
Community feeds are read-heavy. Counting likes via JOIN on every feed load is O(N × rows) — expensive at scale. We use atomic `UPDATE likes_count = likes_count + 1` in a transaction when toggling likes, trading slight write complexity for dramatically faster reads.

### Why UUID over AUTO_INCREMENT?
- No enumeration attacks on IDs
- Safe for distributed systems / future sharding
- No lock contention on inserts at scale

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | SSR + client routing |
| **UI** | TailwindCSS | Utility-first styling |
| **Animations** | Framer Motion | Micro-interactions |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | MySQL 8.0 | Primary data store |
| **Auth** | JWT + bcrypt | Authentication |
| **Logging** | Winston | Structured JSON logs |
| **Validation** | express-validator | Input sanitization |
| **Security** | Helmet + CORS + Rate Limiter | Attack surface reduction |
| **Type Safety** | TypeScript 5.0 | Frontend type safety |
| **Code Quality** | ESLint + Prettier | Consistent standards |

---

*Built with engineering excellence for Traveloop AI — a hackathon project demonstrating production-grade full-stack development.*
