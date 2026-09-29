# RxPulse
### Drug Inventory & Supply Chain Tracking System

Mini project (Sem 3) — React + FastAPI + MongoDB.

> "Right Quantity of Right Product on Right Place at Right Time in Right Condition
> at Right Cost for Right People."

---

## 1. Tech stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | React 18 (Vite), React Router, Tailwind CSS, Axios |
| Backend   | FastAPI, Motor (async MongoDB driver), Pydantic, JWT auth (python-jose), bcrypt (passlib) |
| Database  | MongoDB (8 collections, schema in `backend/app/models.py` / `database.py`) |
| Auth      | JWT bearer tokens, role-based access (`admin`, `pharmacist`, `vendor`, `institution_staff`) |

---

## 2. Project structure

```
rxpulse/
├── .gitignore
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router registration
│   │   ├── database.py        # Mongo connection + all 8 collections
│   │   ├── auth.py            # JWT creation/validation, password hashing, role guard
│   │   ├── models.py          # Pydantic request/response schemas
│   │   ├── utils.py           # ObjectId → JSON serialization helpers
│   │   └── routers/
│   │       ├── auth_routes.py       # POST /api/auth/register, /login
│   │       ├── users.py             # GET /api/users (admin only)
│   │       ├── generic_crud.py      # Reusable CRUD factory
│   │       ├── institutions.py      # institutions CRUD (built on the factory)
│   │       ├── vendors.py           # vendors CRUD
│   │       ├── drugs.py             # drugs CRUD
│   │       ├── purchase_orders.py   # PO creation + status workflow
│   │       ├── inventory.py         # stock in/out, syncs drug quantity
│   │       ├── distributions.py     # dispatch to institutions, auto-logs inventory "out"
│   │       └── dashboard.py         # aggregated stats for the dashboard
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/axios.js              # Axios instance + JWT interceptor
        ├── context/AuthContext.jsx   # login/register/logout, session persistence
        ├── context/ThemeContext.jsx  # dark/light mode (persisted, class-based)
        ├── components/
        │   ├── Navbar.jsx            # Services dropdown, theme toggle, user menu
        │   ├── Sidebar.jsx           # Side panel navigation
        │   ├── Layout.jsx            # Combines Navbar + Sidebar + page content
        │   ├── CrudPage.jsx          # Generic list + add-form UI (Drugs/Vendors/Institutions)
        │   ├── Alert.jsx             # Inline error/success/info banners
        │   └── ProtectedRoute.jsx    # Redirects to /login if not authenticated
        └── pages/
            ├── Login.jsx / Register.jsx
            ├── Dashboard.jsx
            ├── Drugs.jsx / Vendors.jsx / Institutions.jsx
            ├── PurchaseOrders.jsx / Inventory.jsx / Distributions.jsx
            └── Users.jsx
```

---

## 3. How to run it

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env            # edit MONGO_URI / JWT_SECRET if needed
uvicorn app.main:app --reload --port 8000
```
API docs (auto-generated): http://localhost:8000/docs

You need a MongoDB instance running — either local (`mongodb://localhost:27017`)
or a free MongoDB Atlas cluster (paste the connection string into `.env`).

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at http://localhost:5173 and talks to the API at `http://localhost:8000`
(change `VITE_API_URL` in a `.env` file in `frontend/` if your API runs elsewhere).

### First use
1. Open the app → **Register** → create an `admin` account first.
2. Log in → add a **Vendor**, then a few **Drugs** (linked to that vendor).
3. Add an **Institution** (hospital/clinic).
4. Raise a **Purchase Order** from a vendor → mark it approved → shipped → delivered.
5. Record a **stock-in** Inventory transaction (simulating goods received).
6. Create a **Distribution** to send drugs to the institution — stock is
   automatically deducted and a matching "stock-out" Inventory record is created.
7. Watch the **Dashboard** update: low-stock alerts, recent orders, recent
   distributions.

---

## 4. How the collections connect

```
 users ─────────────► institutions
   │                       ▲
   │ places                │ receives
   ▼                       │
 vendors ◄──── purchase_orders           distributions
   │                  │                        ▲
   │ supplies         │ received as            │ dispatched as
   ▼                  ▼                        │
 drugs ───────────► inventory (in) ──────► inventory (out) ──┘
```

- **users** log in and perform every action below; `role` decides what they're
  allowed to do (e.g. only `admin`/`pharmacist` can create purchase orders).
- **vendors** supply **drugs**. Each drug has a `vendor_id`.
- A **purchase_order** is raised against one vendor, listing several drugs
  (`items[]`). Its `status` moves through
  `pending → approved → shipped → delivered`.
- When stock physically arrives, an **inventory** record with
  `transaction_type: "in"` is created, referencing the `purchase_order_id`.
  This increases the matching drug's `quantity` in the `drugs` collection —
  so the catalog always reflects real stock on hand.
- A **distribution** sends drugs from central stock to an **institution**.
  Creating a distribution automatically:
  1. inserts one `inventory` record with `transaction_type: "out"` per item,
     referencing the new `distribution_id`, and
  2. decrements the matching drug's `quantity`.
- The **Dashboard** aggregates all of the above: total drugs/vendors/
  institutions, pending orders, low-stock drugs (`quantity <= reorder_level`),
  and the most recent orders/distributions/transactions.

This keeps `drugs.quantity` as the single source of truth for "how much stock
do we have right now", while `inventory` keeps the full audit trail of how it
got there (every in/out movement, who performed it, and when).

---

## 5. Notable design choices (useful to explain to your professor)

- **JWT auth** — stateless tokens, so the API scales without server-side
  sessions. Passwords are hashed with bcrypt and never stored or returned in
  plain text.
- **Role-based access control** — enforced server-side via a FastAPI
  dependency (`require_roles(...)`), not just hidden in the UI.
- **A generic CRUD router factory** (`generic_crud.py`) avoids repeating the
  same list/get/create/update/delete logic for `institutions`, `vendors` and
  `drugs` — a common backend pattern for master-data collections.
- **Inventory as an audit log, `drugs.quantity` as the live total** — a
  standard "event log + materialized balance" pattern used in real inventory
  systems, so you always have both a fast current count and full traceability.
- **Dark/light mode** persists to `localStorage` and uses Tailwind's
  `class` strategy, so it's instant with no flash of the wrong theme.
