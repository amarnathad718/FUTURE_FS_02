# Mini CRM - Lead Management System

A responsive Mini CRM built with **HTML, CSS, Vanilla JavaScript, Node.js, Express, and MongoDB**.

This project provides a practical lead management workflow with dashboard insights, lead tracking, priority tagging, reminders, bulk actions, and MongoDB-backed persistence.

---

## Features

### Core CRM
- Dashboard with KPI cards:
  - Total Leads
  - New Leads
  - Contacted Leads
  - Converted Leads
  - Average Lead Health
- Lead status distribution bars
- Leads table with:
  - Name, Email, Phone, Source, Status, Priority, Actions
- Actions:
  - View, Edit, Delete
- Add/Edit lead form with validation
- Lead details panel with full info, notes, and follow-up details

### Data & Workflow
- MongoDB-backed persistence via Express API
- Full CRUD operations
- Realistic seeded CRM data
- Search leads by name/email/phone/source
- Filter by status and priority
- Bulk actions:
  - Multi-select leads
  - Bulk status update
  - Bulk delete

### Advanced UI/UX
- Top navigation layout
- Responsive design for desktop and mobile
- Light/Dark mode toggle with saved preference
- Hover interactions and modern card/table styling
- Dashboard graphs (Vanilla JS canvas):
  - Status Overview (bar chart)
  - Lead Source Mix (donut chart)

### Reminder & Notification System
- In-app reminder cards:
  - Overdue follow-ups
  - Due today
  - Upcoming (next 3 days)
- Optional browser notifications for due-today follow-ups

---

## Tech Stack

- **HTML5**
- **CSS3** (Flexbox/Grid + responsive media queries)
- **Vanilla JavaScript (ES6+)**
- **Node.js + Express**
- **MongoDB + Mongoose**
- **Canvas API** for charts
- **Notification API** (optional browser alerts)

---

## Project Structure

```
project2/
├── models/
│   └── Lead.js       # Mongoose schema
├── index.html       # Dashboard
├── leads.html       # Leads list, filters, bulk actions, details panel
├── add-lead.html    # Add/Edit lead form
├── style.css        # Shared styles + dark/light theme
├── script.js        # Frontend logic + API integration
├── server.js        # Express server + API routes
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## How to Run

1. Install dependencies:
  - `npm install`
2. Create environment file:
  - Copy `.env.example` to `.env`
  - Set your Mongo connection string in `MONGO_URI`
3. Start the app:
  - `npm start`
4. Open in browser:
  - `http://localhost:3000`

Optional for development auto-reload:
- `npm run dev`

---

## Data Storage

Leads are stored in MongoDB collection via API endpoints:
- `GET /api/leads`
- `PUT /api/leads/replace`

Frontend keeps a LocalStorage backup key for offline/fallback sync:
- `miniCRMLeads`

Theme preference is stored using:
- `miniCRMTheme`

Notification throttle marker (due-today alerts) uses:
- `miniCRMLastDueNotifyDate`

---

## Notes

- Browser notifications require user permission.
- If theme/style changes are not visible immediately, do a hard refresh (`Ctrl + F5`).
- If MongoDB is unavailable, the app falls back to LocalStorage backup data.

---

## Future Enhancements (Optional)

- CSV import/export
- Drag-and-drop Kanban pipeline
- User authentication and role-based permissions
- Real-time collaboration

---

## License

This project is for learning/demo purposes.
