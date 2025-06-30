export default async function handler(req, res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://auto-drop-x.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // POST: Trigger Bright Data and return snapshot_id
  if (req.method === "POST") {
    let amazonUrl;
    try {
      amazonUrl =
        typeof req.body === "string"
          ? JSON.parse(req.body).amazonUrl
          : req.body.amazonUrl;
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
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Bright Data trigger returned non-JSON:", text);
        return res.status(500).json({
          error: "Bright Data trigger returned non-JSON",
          details: text,
        });
      }
      if (data && data.snapshot_id) {
        return res.status(200).json({ snapshot_id: data.snapshot_id });
      } else {
        return res
          .status(500)
          .json({ error: "No snapshot_id returned from Bright Data", data });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET: Poll for snapshot data
  if (req.method === "GET") {
    const { snapshot_id } = req.query;
    if (!snapshot_id)
      return res.status(400).json({ error: "Missing snapshot_id" });

    try {
      // 1. Check progress
      const progressRes = await fetch(
        `https://api.brightdata.com/datasets/v3/progress/${snapshot_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
          },
        }
      );
      const progress = await progressRes.json();

      // In your GET handler, modify the 202 response:
      if (progress.status !== "done") {
        return res.status(202).json({
          status: progress.status,
          message: "Snapshot not ready yet",
          progress: progress, // Include the full progress object
        });
      }

      // 2. Download snapshot data
      const dataRes = await fetch(
        `https://api.brightdata.com/datasets/v3/snapshot/${snapshot_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
          },
        }
      );
      if (!dataRes.ok) {
        const errorData = await dataRes.json();
        console.error("Bright Data download error:", errorData);
        return res.status(500).json({
          error: "Bright Data API error",
          details: errorData,
        });
      }
      const data = await dataRes.json();
      // Ensure we're returning the data in a consistent format
      if (!Array.isArray(data) && data.data) {
        // If Bright Data wraps the array in a data property
        return res.status(200).json(data.data);
      }
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
