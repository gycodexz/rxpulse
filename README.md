# RxPulse
### Multi-Role Drug Inventory & Supply Chain Tracking System

RxPulse is an enterprise healthcare supply chain platform redesigned with **distinct role-based user interfaces, dedicated dashboards, and specialized workflows** across the entire pharmaceutical lifecycle.

---

## 1. Role-Based Architecture & Interfaces

RxPulse provides dedicated interfaces, color themes, navigation sidebars, and tools tailored for each healthcare actor:

| Role | Interface Theme | Key Responsibilities & Dedicated Pages |
| :--- | :--- | :--- |
| **🏛️ Administrator** | Executive Slate & Dark Navy, Crimson alerts | • **Executive Shortage Radar** (`/admin/dashboard`): live inventory asset valuation, depletion countdowns, emergency procurement triggers<br/>• **Shortages & Critical Stock Control** (`/admin/shortages`): burn-rate analysis, suggested reorder volumes, 1-click PO generator<br/>• **PO Financial Approvals** (`/admin/approvals`): executive sign-off for high-value orders<br/>• **Regional Health Network & Users** (`/institutions`, `/vendors`, `/users`) |
| **💊 Pharmacist** | Clinical Emerald & Teal, precision custody | • **Pharmacy Operations Overview** (`/pharmacist/dashboard`): custody batch count, near-expiry alerts, low-stock warnings<br/>• **Drug Master Catalog** (`/pharmacist/drugs`): clinical salt compositions, schedule classes (OTC, H, H1, X), storage temperatures<br/>• **Stock Movement Ledger** (`/pharmacist/inventory`): Goods Receipt (Stock In), stock-out/adjustments with batch audit logs<br/>• **Expiry & Quarantine Center** (`/pharmacist/expiry-quarantine`): shelf-life countdown and 1-click safety batch quarantine<br/>• **Hospital Dispatches** (`/pharmacist/distributions`): dispatch gate passes and hospital allocations |
| **🚚 Vendor / Supplier** | B2B Commerce Indigo & Violet, supplier portal | • **Supplier Overview** (`/vendor/dashboard`): revenue metrics, active contracts, urgent warehouse demand opportunities<br/>• **Medicine Supply Cart & Quotes** (`/vendor/supply-cart`): interactive cart to quote wholesale rates, batch lots, and expiry dates<br/>• **Order Fulfillment Pipeline** (`/vendor/orders`): status stepper (`Pending → Approved → Shipped → Delivered`), courier partner & tracking consignment (AWB) logging<br/>• **Product Catalog** (`/vendor/products`): certified product offerings & licenses |
| **🏥 Hospital Staff** | Patient Care Sky Blue & Cyan, dispensary station | • **Dispensary Dashboard** (`/staff/dashboard`): ward stock, inbound deliveries arriving today, daily dosing count<br/>• **Hospital Requisition / Indent Cart** (`/staff/requisition`): digital shopping cart to indent medicines by department (ICU, Trauma, Pediatrics) with urgency priority<br/>• **Inbound Shipment Acceptance** (`/staff/deliveries`): physical receiving checklist (cold chain & tamper seals) and 1-click delivery acceptance<br/>• **Ward Dispensing Log** (`/staff/dispense`): EHR log of patient bed administrations |

---

## 2. Instant Demo Persona Switcher

RxPulse includes an **Instant Demo Persona Switcher** built directly into the header bar and the login screen.
Evaluators can switch between **Administrator, Pharmacist, Vendor, and Hospital Staff** with **1 click** to instantly experience the completely different layouts, color palettes, and workflow capabilities.

---

## 3. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Vite), React Router v6, Tailwind CSS, Axios |
| **Backend** | FastAPI, Motor (Async MongoDB), Pydantic v2, JWT Auth (python-jose), bcrypt (passlib) |
| **Database** | MongoDB (10 collections: users, institutions, vendors, drugs, purchase_orders, inventory, distributions, requisitions, vendor_quotes, consumption_logs) |
| **Auth** | Role-based access control (`admin`, `pharmacist`, `vendor`, `institution_staff`) |

---

## 4. How to Run

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # On Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt

# Run the comprehensive demo data seeder (optional but recommended):
python -m app.seed

# Start the API server:
uvicorn app.main:app --reload --port 8000
```
Interactive API docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Application runs at: http://localhost:5173

---

## 5. Pre-Seeded Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@rxpulse.org` | `password123` |
| **Pharmacist** | `pharmacist@rxpulse.org` | `password123` |
| **Vendor** | `vendor@rxpulse.org` | `password123` |
| **Hospital Staff** | `staff@rxpulse.org` | `password123` |

*(You can also use the 1-click demo buttons on the login page or the top navigation bar to switch without typing credentials!)*
