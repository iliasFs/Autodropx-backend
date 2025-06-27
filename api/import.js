export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amazonUrl } = req.body;

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
    return res.status(200).json(data);
  } catch (error) {
    console.error("BrightData error:", error);
    return res.status(500).json({ error: error.message });
  }
}
