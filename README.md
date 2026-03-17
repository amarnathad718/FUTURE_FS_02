# Forge CRM (Mini CRM)

A lead management web app built with HTML, CSS, Vanilla JavaScript, Node.js, Express, and MongoDB.

It includes a landing page + login flow, a dashboard with charts/insights, and full lead CRUD persisted in MongoDB.

---

## Features

### App Flow
- Public landing page (`index.html`)
- Login page (`login.html`)
- Protected CRM pages:
  - Dashboard (`dashboard.html`)
  - Leads (`leads.html`)
  - Add/Edit Lead (`add-lead.html`)
- If opened as `file://...`, frontend auto-redirects to `http://localhost:3000/...`

### Lead Management
- Add, edit, view, delete leads
- Bulk operations:
  - Multi-select rows
  - Bulk status update
  - Bulk delete
- Search by name/email/phone/source
- Filters by status and priority
- Lead details panel (notes, follow-up, timestamps)

### Dashboard
- KPI cards:
  - Total Leads
  - New Leads
  - Contacted Leads
  - Converted Leads
  - Average Lead Health
- Status distribution progress bars
- Focus cards (overdue/hot/top-source)
- Reminder cards:
  - Overdue
  - Due today
  - Upcoming (next 3 days)
- Charts (Canvas API):
  - Status Overview (bar graph)
  - Lead Source Mix (donut chart)

### UX
- Responsive layout
- Light/Dark theme toggle (saved preference)
- Browser reminder notifications (optional permission)

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Node.js + Express
- MongoDB + Mongoose

---

## Project Structure

```
project2/
├── models/
│   └── Lead.js
├── index.html        # Landing page
├── login.html        # Login page
├── dashboard.html    # Main CRM dashboard (protected)
├── leads.html        # Leads table + bulk actions + details panel (protected)
├── add-lead.html     # Add/Edit lead form (protected)
├── style.css
├── script.js
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Setup & Run

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example`:
   - `MONGO_URI=mongodb://127.0.0.1:27017/mini_crm`
   - `PORT=3000`
3. Start MongoDB service locally.
4. Start app server:
   - `npm start`
5. Open:
   - `http://localhost:3000/index.html`

Demo login credentials:
- Email: `admin@forgecrm.in`
- Password: `admin123`

---

## API Endpoints

- `GET /api/health`
- `GET /api/leads`
- `POST /api/leads`
- `PUT /api/leads/:id`
- `DELETE /api/leads/:id`
- `PUT /api/leads/replace` (bulk sync path)

All add/edit/delete actions in the UI are persisted to MongoDB via these APIs.

---

## Local Storage Keys

- `miniCRMLeads` (backup cache)
- `miniCRMTheme` (theme preference)
- `miniCRMLastDueNotifyDate` (notification throttle)
- `miniCRMAuth` (session auth flag)

---

## Notes

- Use the app via `http://localhost:3000/...`, not direct `file://` HTML opens.
- If MongoDB is not running, write operations will fail and show alerts.
- Seed/demo data is merged into low-data setups to keep sample records visible.
