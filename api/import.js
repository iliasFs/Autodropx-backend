// /api/snapshot.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://auto-drop-x.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { snapshot_id } = req.query;
  if (!snapshot_id) return res.status(400).json({ error: "Missing snapshot_id" });

  try {
    const response = await fetch(
      `https://api.brightdata.com/datasets/v3/snapshot_data?dataset_id=gd_l7q7dkf244hwjntr0&snapshot_id=${snapshot_id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BRIGHT_DATA_API_KEY}`,
        },
      }
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}