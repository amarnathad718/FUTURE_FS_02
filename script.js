const STORAGE_KEY = "miniCRMLeads";
const THEME_KEY = "miniCRMTheme";
const LAST_NOTIFY_KEY = "miniCRMLastDueNotifyDate";
const APP_ORIGIN = "http://localhost:3000";
const LEADS_API_URL = "/api/leads";
const AUTH_KEY = "miniCRMAuth";
const DEMO_EMAIL = "admin@forgecrm.in";
const DEMO_PASSWORD = "admin123";

let leadsCache = [];

function withPriorityDefaults(leads) {
  return leads.map((lead) => ({
    ...lead,
    priority: ["High", "Medium", "Low"].includes(lead.priority) ? lead.priority : "Medium"
  }));
}

function isoDaysAgo(days, hour = 10, minute = 15) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function ymdDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function readLocalLeadBackup() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? withPriorityDefaults(parsed) : [];
  } catch {
    return [];
  }
}

function getLeads() {
  return withPriorityDefaults(leadsCache);
}

function ensureServedFromApp() {
  if (location.protocol !== "file:") return true;

  const currentFile = location.pathname.split("/").pop() || "index.html";
  const targetUrl = `${APP_ORIGIN}/${currentFile}${location.search}${location.hash}`;
  location.replace(targetUrl);
  return false;
}

async function loadLeadsFromApi() {
  try {
    const response = await fetch(LEADS_API_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Failed to load leads (${response.status})`);

    const data = await response.json();
    leadsCache = Array.isArray(data) ? withPriorityDefaults(data) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsCache));
  } catch {
    leadsCache = readLocalLeadBackup();
  }
}

async function saveLeads(leads) {
  leadsCache = withPriorityDefaults(leads);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsCache));

  try {
    const response = await fetch(`${LEADS_API_URL}/replace`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadsCache),
      keepalive: true
    });

    if (!response.ok) {
      throw new Error(`Failed to sync leads (${response.status})`);
    }
    const updated = await response.json();
    leadsCache = Array.isArray(updated) ? withPriorityDefaults(updated) : leadsCache;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsCache));
  } catch (error) {
    throw error;
  }
}

async function createLeadInApi(lead) {
  const response = await fetch(LEADS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead)
  });

  if (!response.ok) {
    throw new Error(`Failed to create lead (${response.status})`);
  }

  const created = await response.json();
  leadsCache = withPriorityDefaults([created, ...getLeads().filter((item) => item.id !== created.id)]);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsCache));
  return created;
}

async function updateLeadInApi(lead) {
  const response = await fetch(`${LEADS_API_URL}/${encodeURIComponent(lead.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead)
  });

  if (!response.ok) {
    throw new Error(`Failed to update lead (${response.status})`);
  }

  const updated = await response.json();
  leadsCache = withPriorityDefaults(
    getLeads().map((item) => {
      if (item.id !== updated.id) return item;
      return updated;
    })
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsCache));
  return updated;
}

async function deleteLeadInApi(id) {
  const response = await fetch(`${LEADS_API_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(`Failed to delete lead (${response.status})`);
  }

  leadsCache = withPriorityDefaults(getLeads().filter((item) => item.id !== id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsCache));
}

async function initializeLeadStore() {
  await loadLeadsFromApi();

  const fromServer = getLeads();
  const fromLocalBackup = readLocalLeadBackup();

  if (fromServer.length === 0 && fromLocalBackup.length > 0) {
    await saveLeads(fromLocalBackup);
    return;
  }

  await seedLeads();
}

function shouldUpgradeSeedData(existingLeads) {
  if (!Array.isArray(existingLeads) || existingLeads.length === 0) return true;
  if (existingLeads.length < 5) return true;
  const placeholderCount = existingLeads.filter((lead) =>
    String(lead.email || "").toLowerCase().endsWith("@example.com")
  ).length;

  return placeholderCount > 0 && existingLeads.length <= 6;
}

async function seedLeads() {
  const existingLeads = getLeads();
  if (!shouldUpgradeSeedData(existingLeads)) return;

  const seeded = [
    {
      id: crypto.randomUUID(),
      name: "Aarav Sharma",
      email: "aarav.sharma@northstarretail.in",
      phone: "9876543210",
      source: "Website",
      status: "New",
      priority: "High",
      notes: "Downloaded pricing sheet and requested integration checklist.",
      followUpDate: ymdDaysFromNow(1),
      followUp: "Intro call with operations head on Monday 11:00 AM",
      createdAt: isoDaysAgo(1, 9, 45),
      updatedAt: isoDaysAgo(0, 9, 10)
    },
    {
      id: crypto.randomUUID(),
      name: "Priya Nair",
      email: "priya.nair@meridianlogistics.co",
      phone: "9988776655",
      source: "Referral",
      status: "Contacted",
      priority: "High",
      notes: "Pricing discussed with procurement. Asked for annual contract comparison.",
      followUpDate: ymdDaysFromNow(-1),
      followUp: "Send revised quote with user-tier breakup",
      createdAt: isoDaysAgo(8, 14, 20),
      updatedAt: isoDaysAgo(2, 16, 5)
    },
    {
      id: crypto.randomUUID(),
      name: "Daniel Lee",
      email: "daniel.lee@bluepeakstudios.com",
      phone: "9123456780",
      source: "Social Media",
      status: "Converted",
      priority: "Low",
      notes: "Converted on annual plan. Team onboarding completed and kickoff done.",
      followUpDate: "",
      followUp: "Quarterly success review in June",
      createdAt: isoDaysAgo(34, 11, 5),
      updatedAt: isoDaysAgo(6, 10, 30)
    },
    {
      id: crypto.randomUUID(),
      name: "Meera Iyer",
      email: "meera.iyer@cascadedigital.ai",
      phone: "9012345678",
      source: "Website",
      status: "Contacted",
      priority: "High",
      notes: "Requested SSO and audit log details for enterprise security review.",
      followUpDate: ymdDaysFromNow(2),
      followUp: "Share security whitepaper and SOC2 timeline",
      createdAt: isoDaysAgo(4, 10, 10),
      updatedAt: isoDaysAgo(1, 17, 20)
    },
    {
      id: crypto.randomUUID(),
      name: "Rohan Gupta",
      email: "rohan.gupta@fleetbridge.io",
      phone: "9345678901",
      source: "Referral",
      status: "Converted",
      priority: "Medium",
      notes: "Pilot succeeded with dispatch team. Signed 2-year agreement for 65 seats.",
      followUpDate: "",
      followUp: "Renewal health check after 90 days",
      createdAt: isoDaysAgo(52, 15, 0),
      updatedAt: isoDaysAgo(3, 12, 40)
    },
    {
      id: crypto.randomUUID(),
      name: "Ananya Rao",
      email: "ananya.rao@zenorahealth.com",
      phone: "9456789012",
      source: "Social Media",
      status: "New",
      priority: "Medium",
      notes: "Submitted contact form for clinic workflow automation.",
      followUpDate: ymdDaysFromNow(3),
      followUp: "Initial qualification call",
      createdAt: isoDaysAgo(0, 13, 35),
      updatedAt: isoDaysAgo(0, 13, 35)
    },
    {
      id: crypto.randomUUID(),
      name: "Vikram Sethi",
      email: "vikram.sethi@urbanforge.in",
      phone: "9567890123",
      source: "Other",
      status: "Contacted",
      priority: "Medium",
      notes: "Met at trade expo. Interested in API-based lead routing.",
      followUpDate: ymdDaysFromNow(5),
      followUp: "Technical scoping meeting with engineering",
      createdAt: isoDaysAgo(11, 9, 5),
      updatedAt: isoDaysAgo(2, 10, 55)
    },
    {
      id: crypto.randomUUID(),
      name: "Neha Kapoor",
      email: "neha.kapoor@orbiteducation.org",
      phone: "9678901234",
      source: "Website",
      status: "New",
      priority: "High",
      notes: "Requested campus-wide deployment pricing for 4 departments.",
      followUpDate: ymdDaysFromNow(-2),
      followUp: "Pending follow-up email",
      createdAt: isoDaysAgo(6, 12, 30),
      updatedAt: isoDaysAgo(6, 12, 30)
    },
    {
      id: crypto.randomUUID(),
      name: "Kabir Malhotra",
      email: "kabir.malhotra@greenlinefoods.com",
      phone: "9789012345",
      source: "Referral",
      status: "Converted",
      priority: "Low",
      notes: "Procurement approved. Migrated from previous CRM with data import support.",
      followUpDate: "",
      followUp: "Customer success check-in next month",
      createdAt: isoDaysAgo(67, 10, 50),
      updatedAt: isoDaysAgo(4, 15, 10)
    },
    {
      id: crypto.randomUUID(),
      name: "Sana Ali",
      email: "sana.ali@finqoreadvisors.com",
      phone: "9890123456",
      source: "Social Media",
      status: "Contacted",
      priority: "High",
      notes: "Needs compliance and role-based access information before final signoff.",
      followUpDate: ymdDaysFromNow(1),
      followUp: "Compliance review with legal team",
      createdAt: isoDaysAgo(13, 16, 45),
      updatedAt: isoDaysAgo(0, 18, 5)
    },
    {
      id: crypto.randomUUID(),
      name: "Ishan Verma",
      email: "ishan.verma@atlaswarehousing.com",
      phone: "9901234567",
      source: "Website",
      status: "New",
      priority: "Medium",
      notes: "Inbound lead from ROI calculator page.",
      followUpDate: ymdDaysFromNow(4),
      followUp: "Discovery call with warehouse operations manager",
      createdAt: isoDaysAgo(2, 8, 20),
      updatedAt: isoDaysAgo(2, 8, 20)
    },
    {
      id: crypto.randomUUID(),
      name: "Tara Menon",
      email: "tara.menon@pixelvista.agency",
      phone: "9011223344",
      source: "Other",
      status: "Contacted",
      priority: "Medium",
      notes: "Agency wants white-label option for multiple client teams.",
      followUpDate: ymdDaysFromNow(6),
      followUp: "Share partner program proposal",
      createdAt: isoDaysAgo(9, 11, 35),
      updatedAt: isoDaysAgo(1, 12, 0)
    },
    {
      id: crypto.randomUUID(),
      name: "Dev Khanna",
      email: "dev.khanna@novagridenergy.com",
      phone: "9122334455",
      source: "Referral",
      status: "Converted",
      priority: "Low",
      notes: "Signed after 3-week pilot with regional sales team.",
      followUpDate: "",
      followUp: "Upsell conversation for analytics add-on",
      createdAt: isoDaysAgo(41, 14, 15),
      updatedAt: isoDaysAgo(7, 10, 10)
    },
    {
      id: crypto.randomUUID(),
      name: "Pooja Bansal",
      email: "pooja.bansal@claritylegal.in",
      phone: "9233445566",
      source: "Website",
      status: "New",
      priority: "High",
      notes: "Asked for legal document workflow template examples.",
      followUpDate: ymdDaysFromNow(2),
      followUp: "Share legal use-case deck",
      createdAt: isoDaysAgo(0, 10, 5),
      updatedAt: isoDaysAgo(0, 10, 5)
    },
    {
      id: crypto.randomUUID(),
      name: "Arjun Bedi",
      email: "arjun.bedi@rapidmart.co",
      phone: "9344556677",
      source: "Social Media",
      status: "Contacted",
      priority: "High",
      notes: "Retail chain evaluating migration in Q2. Needs bulk import support details.",
      followUpDate: ymdDaysFromNow(-3),
      followUp: "Follow-up overdue: waiting for migration estimate",
      createdAt: isoDaysAgo(15, 9, 20),
      updatedAt: isoDaysAgo(5, 17, 30)
    }
  ];

  const existingEmails = new Set(existingLeads.map((lead) => String(lead.email || "").toLowerCase()));
  const merged = [...existingLeads];

  seeded.forEach((lead) => {
    const key = String(lead.email || "").toLowerCase();
    if (existingEmails.has(key)) return;
    merged.push(lead);
    existingEmails.add(key);
  });

  if (merged.length === existingLeads.length) return;
  await saveLeads(merged);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function toDateFromYMD(ymd) {
  if (!ymd) return null;
  const date = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursSince(isoString) {
  if (!isoString) return Number.POSITIVE_INFINITY;
  const then = new Date(isoString);
  if (Number.isNaN(then.getTime())) return Number.POSITIVE_INFINITY;
  return (Date.now() - then.getTime()) / (1000 * 60 * 60);
}

function getLeadHealthScore(lead) {
  let score = 30;

  if (lead.status === "Converted") score += 38;
  else if (lead.status === "Contacted") score += 22;
  else score += 10;

  const sourceBonus = {
    Referral: 10,
    Website: 7,
    "Social Media": 5,
    Other: 3
  };
  score += sourceBonus[lead.source] || 0;

  const noteLength = (lead.notes || "").trim().length;
  if (noteLength >= 40) score += 8;
  else if (noteLength > 0) score += 4;

  const updatedInHours = hoursSince(lead.updatedAt || lead.createdAt);
  if (updatedInHours <= 48) score += 10;
  else if (updatedInHours <= 24 * 7) score += 4;
  else score -= 6;

  const followUpDate = toDateFromYMD(lead.followUpDate);
  if (followUpDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inDays = Math.floor((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (inDays < 0 && lead.status !== "Converted") score -= 12;
    else if (inDays <= 7) score += 8;
    else score += 5;
  } else if (lead.status !== "Converted") {
    score -= 5;
  }

  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

function getHealthLevel(score) {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function getConversionPrediction(lead) {
  const score = getLeadHealthScore(lead);

  if (lead.status === "Converted") {
    return { label: "High", className: "pred-high" };
  }
  if (score >= 75 || lead.status === "Contacted") {
    return { label: "High", className: "pred-high" };
  }
  if (score >= 50) {
    return { label: "Medium", className: "pred-medium" };
  }
  return { label: "Low", className: "pred-low" };
}

function setActiveNav() {
  const fileName = location.pathname.split("/").pop();
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === fileName) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function normalizedNextPath(nextPath) {
  const allowed = new Set(["dashboard.html", "leads.html", "add-lead.html"]);
  if (!nextPath || !allowed.has(nextPath)) return "dashboard.html";
  return nextPath;
}

function requireAuthForPage(page) {
  const protectedPages = new Set(["dashboard", "leads", "add-lead"]);
  if (!protectedPages.has(page)) return true;
  if (isAuthenticated()) return true;

  const next = location.pathname.split("/").pop() || "dashboard.html";
  location.href = `login.html?next=${encodeURIComponent(next)}`;
  return false;
}

function initLandingPage() {
  const enterDashboardBtn = document.getElementById("enterDashboardBtn");
  if (!enterDashboardBtn) return;

  enterDashboardBtn.addEventListener("click", (event) => {
    if (isAuthenticated()) return;
    event.preventDefault();
    location.href = "login.html?next=dashboard.html";
  });
}

function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const params = new URLSearchParams(location.search);
  const next = normalizedNextPath(params.get("next"));
  const error = document.getElementById("loginError");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const fields = form.elements;
    const email = String(fields.namedItem("email")?.value || "").trim().toLowerCase();
    const password = String(fields.namedItem("password")?.value || "");

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      location.href = next;
      return;
    }

    if (error) error.textContent = "Invalid email or password.";
  });
}

function getStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return "light";
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
    toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
}

function initThemeToggle() {
  applyTheme(getStoredTheme());
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

function statusClass(status) {
  if (status === "Contacted") return "status-contacted";
  if (status === "Converted") return "status-converted";
  return "status-new";
}

function priorityClass(priority) {
  if (priority === "High") return "priority-high";
  if (priority === "Low") return "priority-low";
  return "priority-medium";
}

function ymdToday() {
  return new Date().toISOString().slice(0, 10);
}

function getReminderBuckets(leads) {
  const today = ymdToday();
  const end = new Date(`${today}T00:00:00`);
  end.setDate(end.getDate() + 3);

  const overdue = [];
  const dueToday = [];
  const upcoming = [];

  leads.forEach((lead) => {
    if (!lead.followUpDate || lead.status === "Converted") return;
    const followUp = toDateFromYMD(lead.followUpDate);
    const todayDate = toDateFromYMD(today);
    if (!followUp || !todayDate) return;

    if (followUp < todayDate) {
      overdue.push(lead);
      return;
    }
    if (lead.followUpDate === today) {
      dueToday.push(lead);
      return;
    }
    if (followUp <= end) {
      upcoming.push(lead);
    }
  });

  return { overdue, dueToday, upcoming };
}

function renderReminderList(containerId, leads, emptyText) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (leads.length === 0) {
    container.innerHTML = `<p class="muted">${escapeHtml(emptyText)}</p>`;
    return;
  }

  container.innerHTML = leads
    .slice(0, 6)
    .map(
      (lead) =>
        `<div class="reminder-item"><strong>${escapeHtml(lead.name)}</strong><span>${escapeHtml(
          lead.followUpDate || ""
        )}${lead.followUp ? ` | ${escapeHtml(lead.followUp)}` : ""}</span></div>`
    )
    .join("");
}

function maybeSendDueTodayNotifications(leads) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const today = ymdToday();
  if (localStorage.getItem(LAST_NOTIFY_KEY) === today) return;

  const { dueToday } = getReminderBuckets(leads);
  if (dueToday.length === 0) return;

  dueToday.slice(0, 3).forEach((lead) => {
    new Notification(`Follow-up due today: ${lead.name}`, {
      body: lead.followUp || "Open the CRM to update follow-up status."
    });
  });

  localStorage.setItem(LAST_NOTIFY_KEY, today);
}

function initNotifyButton(leads) {
  const button = document.getElementById("notifyBtn");
  if (!button) return;

  if (!("Notification" in window)) {
    button.disabled = true;
    button.textContent = "Browser Alerts Not Supported";
    return;
  }

  if (Notification.permission === "granted") {
    button.textContent = "Browser Alerts Enabled";
  } else if (Notification.permission === "denied") {
    button.textContent = "Alerts Blocked in Browser";
    button.disabled = true;
  }

  button.addEventListener("click", async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      button.textContent = "Browser Alerts Enabled";
      maybeSendDueTodayNotifications(leads);
      return;
    }
    if (permission === "denied") {
      button.textContent = "Alerts Blocked in Browser";
      button.disabled = true;
    }
  });
}

function setChartLegend(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = items
    .map(
      (item) =>
        `<span class="legend-item"><span class="legend-dot" style="background:${item.color}"></span>${escapeHtml(
          item.label
        )}: ${item.value}</span>`
    )
    .join("");
}

function clearAndLabelCanvas(canvas, label) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const width = canvas.clientWidth || 300;
  const height = canvas.clientHeight || 220;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, width, height);
  if (label) {
    ctx.fillStyle = "#64748b";
    ctx.font = "14px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(label, width / 2, height / 2);
  }

  return { ctx, width, height };
}

function drawStatusBarChart(leads) {
  const canvas = document.getElementById("statusChart");
  if (!canvas) return;

  const counts = {
    New: leads.filter((lead) => lead.status === "New").length,
    Contacted: leads.filter((lead) => lead.status === "Contacted").length,
    Converted: leads.filter((lead) => lead.status === "Converted").length
  };

  const chart = clearAndLabelCanvas(canvas, "");
  if (!chart) return;
  const { ctx, width, height } = chart;

  const entries = [
    { label: "New", value: counts.New, color: "#0b7285" },
    { label: "Contacted", value: counts.Contacted, color: "#e67700" },
    { label: "Converted", value: counts.Converted, color: "#2f9e44" }
  ];

  setChartLegend("statusLegend", entries);

  const max = Math.max(...entries.map((item) => item.value), 1);
  const chartPadding = { top: 20, right: 18, bottom: 26, left: 18 };
  const graphWidth = width - chartPadding.left - chartPadding.right;
  const graphHeight = height - chartPadding.top - chartPadding.bottom;
  const barGap = 16;
  const barWidth = (graphWidth - barGap * (entries.length - 1)) / entries.length;

  ctx.strokeStyle = "#d8e0e8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(chartPadding.left, height - chartPadding.bottom + 0.5);
  ctx.lineTo(width - chartPadding.right, height - chartPadding.bottom + 0.5);
  ctx.stroke();

  entries.forEach((item, index) => {
    const x = chartPadding.left + index * (barWidth + barGap);
    const barHeight = (item.value / max) * (graphHeight - 6);
    const y = height - chartPadding.bottom - barHeight;

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 8);
    ctx.fill();

    ctx.fillStyle = "#334155";
    ctx.font = "12px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(String(item.value), x + barWidth / 2, y - 6);
    ctx.fillText(item.label, x + barWidth / 2, height - 8);
  });
}

function drawSourceDonutChart(leads) {
  const canvas = document.getElementById("sourceChart");
  if (!canvas) return;

  const sourceCounts = leads.reduce((acc, lead) => {
    const key = lead.source || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const palette = {
    Website: "#0b7285",
    Referral: "#2f9e44",
    "Social Media": "#e67700",
    Other: "#7c3aed"
  };

  const entries = Object.entries(sourceCounts)
    .map(([label, value]) => ({ label, value, color: palette[label] || "#64748b" }))
    .sort((a, b) => b.value - a.value);

  setChartLegend("sourceLegend", entries);

  const total = entries.reduce((sum, item) => sum + item.value, 0);
  const chart = clearAndLabelCanvas(canvas, total === 0 ? "No source data available" : "");
  if (!chart || total === 0) return;
  const { ctx, width, height } = chart;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.32;
  const ringWidth = Math.max(18, radius * 0.35);
  let start = -Math.PI / 2;

  entries.forEach((item) => {
    const sweep = (item.value / total) * Math.PI * 2;
    const end = start + sweep;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, end);
    ctx.strokeStyle = item.color;
    ctx.lineWidth = ringWidth;
    ctx.lineCap = "butt";
    ctx.stroke();
    start = end;
  });

  ctx.fillStyle = "#334155";
  ctx.font = "700 14px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText("Total", centerX, centerY - 4);
  ctx.font = "700 20px Segoe UI";
  ctx.fillText(String(total), centerX, centerY + 20);
}

function renderDashboardCharts(leads) {
  drawStatusBarChart(leads);
  drawSourceDonutChart(leads);
}

function initDashboardPage() {
  const leads = getLeads();

  const total = leads.length;
  const newCount = leads.filter((lead) => lead.status === "New").length;
  const contactedCount = leads.filter((lead) => lead.status === "Contacted").length;
  const convertedCount = leads.filter((lead) => lead.status === "Converted").length;
  const avgHealth =
    leads.length === 0
      ? 0
      : Math.round(leads.reduce((acc, lead) => acc + getLeadHealthScore(lead), 0) / leads.length);

  document.getElementById("totalLeads").textContent = total;
  document.getElementById("newLeads").textContent = newCount;
  document.getElementById("contactedLeads").textContent = contactedCount;
  document.getElementById("convertedLeads").textContent = convertedCount;
  document.getElementById("avgHealthScore").textContent = avgHealth;

  updateDistribution("distNew", "distNewCount", newCount, total);
  updateDistribution("distContacted", "distContactedCount", contactedCount, total);
  updateDistribution("distConverted", "distConvertedCount", convertedCount, total);

  const overdueCount = leads.filter((lead) => {
    if (lead.status === "Converted") return false;
    const followUpDate = toDateFromYMD(lead.followUpDate);
    if (!followUpDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return followUpDate < today;
  }).length;

  const hotLeadsCount = leads.filter((lead) => lead.status === "New" && hoursSince(lead.createdAt) >= 48).length;

  const newSourceCounts = leads
    .filter((lead) => lead.status === "New")
    .reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {});

  const topSourceEntry = Object.entries(newSourceCounts).sort((a, b) => b[1] - a[1])[0];
  const topSourceText = topSourceEntry ? `${topSourceEntry[0]} (${topSourceEntry[1]})` : "No new leads yet";

  document.getElementById("focusOverdue").textContent = String(overdueCount);
  document.getElementById("focusHot").textContent = String(hotLeadsCount);
  document.getElementById("focusTopSource").textContent = topSourceText;

  const reminders = getReminderBuckets(leads);
  renderReminderList("overdueReminderList", reminders.overdue, "No overdue follow-ups.");
  renderReminderList("todayReminderList", reminders.dueToday, "No reminders due today.");
  renderReminderList("upcomingReminderList", reminders.upcoming, "No upcoming reminders in the next 3 days.");
  initNotifyButton(leads);
  maybeSendDueTodayNotifications(leads);

  renderDashboardCharts(leads);

  window.addEventListener("resize", () => {
    renderDashboardCharts(getLeads());
  });
}

function updateDistribution(barId, countId, count, total) {
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
  document.getElementById(barId).style.width = `${percentage}%`;
  document.getElementById(countId).textContent = `${count} (${percentage}%)`;
}

function initLeadsPage() {
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const priorityFilter = document.getElementById("priorityFilter");
  const tableBody = document.getElementById("leadsTableBody");
  const detailsWrap = document.getElementById("leadDetails");
  const selectAllLeads = document.getElementById("selectAllLeads");
  const bulkSelectedCount = document.getElementById("bulkSelectedCount");
  const bulkStatusSelect = document.getElementById("bulkStatusSelect");
  const applyBulkStatusBtn = document.getElementById("applyBulkStatusBtn");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");

  let selectedLeadId = new URLSearchParams(location.search).get("view") || "";
  const selectedLeadIds = new Set();

  function filteredLeadIds() {
    return filteredLeads().map((lead) => lead.id);
  }

  function updateBulkUi() {
    const visibleIds = filteredLeadIds();
    const selectedVisibleCount = visibleIds.filter((id) => selectedLeadIds.has(id)).length;

    bulkSelectedCount.textContent = `${selectedLeadIds.size} selected`;
    selectAllLeads.checked = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
    selectAllLeads.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
  }

  function pruneSelection() {
    const currentIds = new Set(getLeads().map((lead) => lead.id));
    Array.from(selectedLeadIds).forEach((id) => {
      if (!currentIds.has(id)) selectedLeadIds.delete(id);
    });
  }

  function filteredLeads() {
    const leads = getLeads();
    const q = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const priority = priorityFilter.value;

    return leads.filter((lead) => {
      const haystack = `${lead.name} ${lead.email} ${lead.phone} ${lead.source}`.toLowerCase();
      const matchesSearch = q === "" || haystack.includes(q);
      const matchesStatus = status === "All" || lead.status === status;
      const matchesPriority = priority === "All" || lead.priority === priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  function renderTable() {
    pruneSelection();
    const rows = filteredLeads();
    if (rows.length === 0) {
      tableBody.innerHTML = "<tr><td colspan=\"8\" class=\"muted\">No leads found.</td></tr>";
      updateBulkUi();
      return;
    }

    tableBody.innerHTML = rows
      .map(
        (lead) => {
          return `
        <tr>
          <td><input class="row-select" type="checkbox" data-id="${lead.id}" ${
            selectedLeadIds.has(lead.id) ? "checked" : ""
          } aria-label="Select ${escapeHtml(lead.name)}" /></td>
          <td>${escapeHtml(lead.name)}</td>
          <td>${escapeHtml(lead.email)}</td>
          <td>${escapeHtml(lead.phone)}</td>
          <td>${escapeHtml(lead.source)}</td>
          <td><span class="status-pill ${statusClass(lead.status)}">${escapeHtml(lead.status)}</span></td>
          <td><span class="priority-pill ${priorityClass(lead.priority)}">${escapeHtml(lead.priority)}</span></td>
          <td>
            <div class="actions">
              <button class="action-btn action-view" data-action="view" data-id="${lead.id}">View</button>
              <button class="action-btn action-edit" data-action="edit" data-id="${lead.id}">Edit</button>
              <button class="action-btn action-delete" data-action="delete" data-id="${lead.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
        }
      )
      .join("");

    updateBulkUi();
  }

  function renderDetails() {
    const lead = getLeads().find((item) => item.id === selectedLeadId);

    if (!lead) {
      detailsWrap.innerHTML = "<p class=\"muted\">Select a lead to view full details and follow-up information.</p>";
      return;
    }

    const healthScore = getLeadHealthScore(lead);
    const prediction = getConversionPrediction(lead);

    detailsWrap.innerHTML = `
      <div class="details-row"><strong>Name:</strong> ${escapeHtml(lead.name)}</div>
      <div class="details-row"><strong>Email:</strong> ${escapeHtml(lead.email)}</div>
      <div class="details-row"><strong>Phone:</strong> ${escapeHtml(lead.phone)}</div>
      <div class="details-row"><strong>Source:</strong> ${escapeHtml(lead.source)}</div>
      <div class="details-row"><strong>Status:</strong> ${escapeHtml(lead.status)}</div>
      <div class="details-row"><strong>Priority:</strong> <span class="priority-pill ${priorityClass(lead.priority)}">${escapeHtml(
      lead.priority
    )}</span></div>
      <div class="details-row"><strong>Lead Health Score:</strong> ${healthScore}/100</div>
      <div class="details-row"><strong>Conversion Predictor:</strong> <span class="predict-pill ${prediction.className}">${prediction.label}</span></div>
      <div class="details-row"><strong>Notes:</strong> ${lead.notes ? escapeHtml(lead.notes) : "No notes available."}</div>
      <div class="details-row"><strong>Follow-up Date:</strong> ${lead.followUpDate ? escapeHtml(lead.followUpDate) : "Not scheduled"}</div>
      <div class="details-row"><strong>Follow-up:</strong> ${lead.followUp ? escapeHtml(lead.followUp) : "Not scheduled"}</div>
      <div class="details-row"><strong>Created:</strong> ${formatDate(lead.createdAt)}</div>
      <div class="details-row"><strong>Updated:</strong> ${formatDate(lead.updatedAt)}</div>
    `;
  }

  async function deleteLead(id) {
    const leadExists = getLeads().some((lead) => lead.id === id);
    if (!leadExists) return;

    await deleteLeadInApi(id);

    if (selectedLeadId === id) {
      selectedLeadId = "";
    }

    selectedLeadIds.delete(id);
  }

  async function applyBulkStatus() {
    const nextStatus = bulkStatusSelect.value;
    if (!nextStatus) {
      alert("Select a status for bulk update.");
      return;
    }
    if (selectedLeadIds.size === 0) {
      alert("Select at least one lead.");
      return;
    }

    const leads = getLeads();
    let changed = 0;
    leads.forEach((lead) => {
      if (!selectedLeadIds.has(lead.id)) return;
      lead.status = nextStatus;
      lead.updatedAt = new Date().toISOString();
      changed += 1;
    });
    try {
      await saveLeads(leads);
      bulkStatusSelect.value = "";
      if (changed > 0) {
        renderTable();
        renderDetails();
      }
    } catch (error) {
      alert("Could not update leads in MongoDB. Ensure server and MongoDB are running.");
    }
  }

  async function deleteSelected() {
    if (selectedLeadIds.size === 0) {
      alert("Select at least one lead.");
      return;
    }
    if (!confirm(`Delete ${selectedLeadIds.size} selected lead(s)?`)) return;

    const remaining = getLeads().filter((lead) => !selectedLeadIds.has(lead.id));
    if (selectedLeadId && selectedLeadIds.has(selectedLeadId)) {
      selectedLeadId = "";
    }
    try {
      await saveLeads(remaining);
      selectedLeadIds.clear();
      renderTable();
      renderDetails();
    } catch (error) {
      alert("Could not delete selected leads from MongoDB. Ensure server and MongoDB are running.");
    }
  }

  searchInput.addEventListener("input", renderTable);
  statusFilter.addEventListener("change", renderTable);
  priorityFilter.addEventListener("change", renderTable);

  selectAllLeads.addEventListener("change", () => {
    const visibleIds = filteredLeadIds();
    if (selectAllLeads.checked) {
      visibleIds.forEach((id) => selectedLeadIds.add(id));
    } else {
      visibleIds.forEach((id) => selectedLeadIds.delete(id));
    }
    renderTable();
  });

  applyBulkStatusBtn.addEventListener("click", applyBulkStatus);
  deleteSelectedBtn.addEventListener("click", deleteSelected);

  tableBody.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".row-select");
    if (!checkbox) return;
    const id = checkbox.getAttribute("data-id");
    if (!id) return;

    if (checkbox.checked) selectedLeadIds.add(id);
    else selectedLeadIds.delete(id);
    updateBulkUi();
  });

  tableBody.addEventListener("click", async (event) => {
    if (event.target.closest(".row-select")) return;
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.getAttribute("data-action");
    const leadId = button.getAttribute("data-id");

    if (action === "view") {
      selectedLeadId = leadId;
      renderDetails();
      return;
    }

    if (action === "edit") {
      location.href = `add-lead.html?edit=${encodeURIComponent(leadId)}`;
      return;
    }

    if (action === "delete") {
      if (!confirm("Delete this lead permanently?")) return;
      try {
        await deleteLead(leadId);
        renderTable();
        renderDetails();
      } catch (error) {
        alert("Could not delete lead from MongoDB. Ensure server and MongoDB are running.");
      }
    }
  });

  renderTable();
  renderDetails();
}

function initAddLeadPage() {
  const form = document.getElementById("leadForm");
  const pageTitle = document.getElementById("formPageTitle");
  const cardTitle = document.getElementById("formCardTitle");
  const submitBtn = document.getElementById("saveLeadBtn");
  const fields = form.elements;

  const params = new URLSearchParams(location.search);
  const editId = params.get("edit");
  const isEdit = Boolean(editId);

  if (isEdit) {
    pageTitle.textContent = "Edit Lead";
    cardTitle.textContent = "Update lead details";
    submitBtn.textContent = "Update Lead";

    const lead = getLeads().find((item) => item.id === editId);
    if (!lead) {
      alert("Lead not found.");
      location.href = "leads.html";
      return;
    }

    fields.namedItem("name").value = lead.name;
    fields.namedItem("email").value = lead.email;
    fields.namedItem("phone").value = lead.phone;
    fields.namedItem("source").value = lead.source;
    fields.namedItem("status").value = lead.status;
    fields.namedItem("priority").value = lead.priority || "Medium";
    fields.namedItem("notes").value = lead.notes || "";
    fields.namedItem("followUpDate").value = lead.followUpDate || "";
    fields.namedItem("followUp").value = lead.followUp || "";
  }

  function setError(fieldName, message) {
    const field = document.querySelector(`[data-error-for=\"${fieldName}\"]`);
    if (field) field.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll(".error").forEach((element) => {
      element.textContent = "";
    });
  }

  function validate(payload) {
    const errors = {};

    if (!payload.name || payload.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      errors.email = "Please enter a valid email address.";
    }

    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(payload.phone)) {
      errors.phone = "Phone should contain 7 to 15 digits.";
    }

    if (!payload.source) {
      errors.source = "Please select a lead source.";
    }

    if (!payload.status) {
      errors.status = "Please select a status.";
    }

    if (!payload.priority) {
      errors.priority = "Please select a priority.";
    }

    return errors;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const payload = {
      id: isEdit ? editId : crypto.randomUUID(),
      name: fields.namedItem("name").value.trim(),
      email: fields.namedItem("email").value.trim(),
      phone: fields.namedItem("phone").value.trim(),
      source: fields.namedItem("source").value,
      status: fields.namedItem("status").value,
      priority: fields.namedItem("priority").value,
      notes: fields.namedItem("notes").value.trim(),
      followUpDate: fields.namedItem("followUpDate").value,
      followUp: fields.namedItem("followUp").value.trim(),
      updatedAt: new Date().toISOString()
    };

    const errors = validate(payload);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => setError(field, message));
      return;
    }

    try {
      if (isEdit) {
        const existing = getLeads().find((lead) => lead.id === editId);
        if (!existing) {
          alert("Lead not found.");
          location.href = "leads.html";
          return;
        }

        payload.createdAt = existing.createdAt || new Date().toISOString();
        const updated = await updateLeadInApi(payload);
        location.href = `leads.html?view=${encodeURIComponent(updated.id)}`;
        return;
      }

      payload.createdAt = new Date().toISOString();
      const created = await createLeadInApi(payload);
      location.href = `leads.html?view=${encodeURIComponent(created.id)}`;
    } catch (error) {
      alert("Could not save lead to MongoDB. Ensure server and MongoDB are running.");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!ensureServedFromApp()) return;

  initThemeToggle();
  const page = document.body.dataset.page;

  if (page === "landing") {
    initLandingPage();
    return;
  }

  if (page === "login") {
    initLoginPage();
    return;
  }

  if (!requireAuthForPage(page)) return;

  setActiveNav();
  await initializeLeadStore();

  if (page === "dashboard") initDashboardPage();
  if (page === "leads") initLeadsPage();
  if (page === "add-lead") initAddLeadPage();
});
