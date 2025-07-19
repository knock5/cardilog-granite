const express = require("express");
const dotenv = require("dotenv");
const Replicate = require("replicate");
const path = require("path");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Init API Granite
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

app.post("/api/granite", async (req, res) => {
  const { prompt } = req.body;
  console.log("[DEBUG] Prompt diterima:", prompt);
  console.log(
    "[DEBUG] Token tersedia:",
    process.env.REPLICATE_API_TOKEN ? "YES" : "NO"
  );

  try {
    const output = await replicate.run("ibm-granite/granite-3.3-8b-instruct", {
      input: {
        prompt,
        max_tokens: 2000,
        temperature: 0.6,
        top_k: 50,
        top_p: 0.9,
      },
    });
    res.json({ success: true, data: output.join("") });
  } catch (err) {
    console.error("[ERROR] Granite failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// serve hasil build (frontend)
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

// fallback untuk SPA
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
