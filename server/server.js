const express = require("express");
const dotenv = require("dotenv");
const Replicate = require("replicate");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();
app.use(bodyParser.json());

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

app.post("/api/granite", async (req, res) => {
  const { prompt } = req.body;
  try {
    const output = await replicate.run("ibm-granite/granite-3.3-8b-instruct", {
      input: {
        prompt,
        max_tokens: 1500,
        temperature: 0.6,
        top_k: 50,
        top_p: 0.9,
      },
    });
    res.json({ success: true, data: output.join("") });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
