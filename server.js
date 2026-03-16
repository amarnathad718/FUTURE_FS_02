const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Lead = require("./models/Lead");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI. Create a .env file using .env.example");
  process.exit(1);
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/leads", async (_req, res) => {
  const leads = await Lead.find({}).sort({ updatedAt: -1 }).lean();
  res.json(leads);
});

app.put("/api/leads/replace", async (req, res) => {
  const incoming = Array.isArray(req.body) ? req.body : [];

  const normalized = incoming.map((lead) => ({
    id: String(lead.id || ""),
    name: String(lead.name || "").trim(),
    email: String(lead.email || "").trim().toLowerCase(),
    phone: String(lead.phone || "").trim(),
    source: ["Website", "Referral", "Social Media", "Other"].includes(lead.source) ? lead.source : "Website",
    status: ["New", "Contacted", "Converted"].includes(lead.status) ? lead.status : "New",
    priority: ["High", "Medium", "Low"].includes(lead.priority) ? lead.priority : "Medium",
    notes: String(lead.notes || ""),
    followUpDate: String(lead.followUpDate || ""),
    followUp: String(lead.followUp || ""),
    createdAt: String(lead.createdAt || new Date().toISOString()),
    updatedAt: String(lead.updatedAt || new Date().toISOString())
  }));

  if (normalized.some((lead) => !lead.id || !lead.name || !lead.email || !lead.phone)) {
    return res.status(400).json({ error: "Each lead must include id, name, email, and phone" });
  }

  const ids = normalized.map((lead) => lead.id);
  if (ids.length === 0) {
    await Lead.deleteMany({});
    return res.json([]);
  }

  await Lead.deleteMany({ id: { $nin: ids } });

  const operations = normalized.map((lead) => ({
    updateOne: {
      filter: { id: lead.id },
      update: { $set: lead },
      upsert: true
    }
  }));

  if (operations.length > 0) {
    await Lead.bulkWrite(operations, { ordered: false });
  }

  const latest = await Lead.find({}).sort({ updatedAt: -1 }).lean();
  res.json(latest);
});

app.get("*", (req, res) => {
  const safePath = req.path === "/" ? "/index.html" : req.path;
  const filePath = path.join(__dirname, safePath);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("Not Found");
    }
  });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo connection error:", err.message);
    process.exit(1);
  });
