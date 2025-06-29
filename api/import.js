import fetch from "node-fetch";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://auto-drop-x.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Handle POST: trigger Bright Data and return snapshot_id
  if (req.method === "POST") {
    let amazonUrl;
    try {
      amazonUrl = typeof req.body === "string" ? JSON.parse(req.body).amazonUrl : req.body.amazonUrl;
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
    if (!amazonUrl) return res.status(400).json({ error: "Missing amazonUrl" });

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
      // Return the snapshot_id for polling
      if (data && data.snapshot_id) {
        return res.status(200).json({ snapshot_id: data.snapshot_id });
      } else {
        return res.status(500).json({ error: "No snapshot_id returned from Bright Data", data });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle GET: poll for snapshot data
  if (req.method === "GET") {
  const { snapshot_id } = req.query;
  if (!snapshot_id) return res.status(400).json({ error: "Missing snapshot_id" });

  try {
    const response = await fetch(
      `https://api.brightdata.com/datasets/v3/snapshot_data?dataset_id=gd_l7q7dkf244hwjntr0&snapshot_id=${snapshot_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
        },
      }
    );
    let data;
    let text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Bright Data returned non-JSON:", text);
      return res.status(500).json({ error: "Bright Data returned non-JSON", details: text });
    }

    if (!response.ok) {
      console.error("Bright Data error:", data);
      return res.status(500).json({ error: "Bright Data API error", details: data });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}