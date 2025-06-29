import fetch from "node-fetch"; // Add this at the top

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://auto-drop-x.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse body if needed
  let amazonUrl;
  if (typeof req.body === "string") {
    try {
      amazonUrl = JSON.parse(req.body).amazonUrl;
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  } else {
    amazonUrl = req.body.amazonUrl;
  }

  if (!amazonUrl) {
    return res.status(400).json({ error: "Missing amazonUrl" });
  }

  try {
    const response = await fetch(
      "https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_l7q7dkf244hwjntr0&include_errors=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ url: amazonUrl }]),
      }
    );

    const data = await response.json();
    console.log("BrightData response:", data);
    return res.status(200).json(data);
  } catch (error) {
    console.error("BrightData error:", error);
    return res.status(500).json({ error: error.message });
  }
}