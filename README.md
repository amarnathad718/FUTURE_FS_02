# Mini CRM - Lead Management System

A responsive frontend Mini CRM built with **HTML, CSS, and Vanilla JavaScript**.

This project provides a practical lead management workflow with dashboard insights, lead tracking, priority tagging, reminders, and LocalStorage-based CRUD operations.

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
- LocalStorage-based persistence (no backend required)
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
- **LocalStorage API**
- **Canvas API** for charts
- **Notification API** (optional browser alerts)

---

## Project Structure

```
project2/
├── index.html       # Dashboard
├── leads.html       # Leads list, filters, bulk actions, details panel
├── add-lead.html    # Add/Edit lead form
├── style.css        # Shared styles + dark/light theme
├── script.js        # App logic, CRUD, charts, reminders, notifications
└── README.md
```

---

## How to Run

1. Open the project folder in VS Code.
2. Open `index.html` in a browser.
3. Start using the app:
   - Add/edit/delete leads
   - Filter and search
   - Use dashboard analytics and reminders

> Since this is a frontend-only app, no server setup is required.

---

## Data Storage

Leads are stored in browser LocalStorage using:
- `miniCRMLeads`

Theme preference is stored using:
- `miniCRMTheme`

Notification throttle marker (due-today alerts) uses:
- `miniCRMLastDueNotifyDate`

---

## Notes

- Browser notifications require user permission.
- If theme/style changes are not visible immediately, do a hard refresh (`Ctrl + F5`).
- Clearing browser LocalStorage resets lead data.

---

## Future Enhancements (Optional)

- CSV import/export
- Drag-and-drop Kanban pipeline
- User authentication and role-based permissions
- Backend API + database integration
- Real-time collaboration

---

## License

This project is for learning/demo purposes.
