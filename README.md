# Traveloop AI 🌍

> AI-native travel operating system. Built for hackathon-winning full-stack engineering.

## 🏗️ Architecture

```
traveloop2/
├── src/                    ← Next.js 16 Frontend
│   ├── app/                ← App Router pages (14 routes)
│   ├── components/         ← 14 screen components
│   ├── context/            ← Global state (AppContext)
│   ├── lib/api.ts          ← Backend API client (typed)
│   └── data/mock.ts        ← Demo seed data
│
└── backend/                ← Express.js REST API
    ├── config/             ← db.js, cloudinary.js
    ├── controllers/        ← 7 controllers (auth, trip, itinerary, budget, journal, ai)
    ├── middleware/         ← authMiddleware, errorMiddleware, uploadMiddleware
    ├── models/             ← 6 raw SQL models (User, Trip, Itinerary, Expense, Journal)
    ├── routes/             ← 6 route files
    ├── services/           ← aiService, weatherService, recommendationService
    ├── utils/              ← generateToken.js, validators.js
    ├── database/schema.sql ← Complete MySQL schema (14 tables)
    └── server.js           ← Express entry point
```

## 🛢️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TailwindCSS v4, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MySQL (14 tables, proper indexes, FK constraints) |
| Auth | JWT + bcryptjs |
| File Uploads | Multer + Cloudinary |
| Security | Helmet, CORS, express-validator |
| Logging | Morgan |

## 🚀 Quick Start

### 1. Setup MySQL Database

```bash
mysql -u root -p < backend/database/schema.sql
```

### 2. Configure Backend

```bash
cd backend
# Edit .env with your MySQL credentials (DB_HOST, DB_USER, DB_PASSWORD)
npm install
npm run dev    # → http://localhost:5000
```

### 3. Run Frontend

```bash
# In root directory
npm run dev    # → http://localhost:3000
```

## 📡 API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login + JWT |
| GET | `/api/auth/profile` | ✅ | Get profile |
| GET | `/api/trips` | ✅ | List my trips |
| POST | `/api/trips` | ✅ | Create trip |
| GET | `/api/itinerary/:tripId` | ✅ | Get itinerary |
| POST | `/api/itinerary/:tripId/generate` | ✅ | AI generate |
| GET | `/api/budget/expenses/:tripId` | ✅ | Expenses list |
| GET | `/api/budget/optimize/:tripId` | ✅ | AI optimizer |
| GET | `/api/journals/community` | — | Public feed |
| POST | `/api/ai/chat` | ✅ | AI Loopi chat |
| POST | `/api/ai/personality` | ✅ | Personality quiz |
| GET | `/api/ai/weather/:city` | — | Weather data |
| GET | `/api/admin/stats` | ✅ Admin | Platform stats |

## 🔐 Auth Flow

1. `POST /api/auth/register` → returns JWT token
2. Store JWT in `localStorage` via `storage.setToken()`
3. All protected requests include `Authorization: Bearer <token>`
4. JWT expires in 7 days (set `JWT_EXPIRES_IN` in `.env`)

## 🗃️ Database Tables (14)

`users` · `trips` · `trip_cities` · `itinerary_days` · `activities`
`expenses` · `packing_items` · `journals` · `collaborators` · `votes`
`community_posts` · `post_likes` · `saved_trips` · `user_followers`

## 🧠 AI Features

- **Personality Analyzer** — 7 traveler archetypes
- **AI Itinerary Builder** — Day-by-day schedule generation
- **Budget Optimizer** — Category benchmarks + savings suggestions
- **Packing Suggestions** — Destination-aware smart lists
- **Loopi AI Chat** — Context-aware travel assistant

> Swap placeholder logic in `backend/services/aiService.js` with Gemini/OpenAI API calls when keys are set in `.env`.
