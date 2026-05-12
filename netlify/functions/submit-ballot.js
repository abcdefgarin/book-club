const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let ballot;
  try {
    ballot = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { name, selections } = ballot;

  if (!name || !Array.isArray(selections) || selections.length === 0) {
    return { statusCode: 400, body: "Missing name or selections" };
  }

  try {
    const store = getStore({
      name: "ballots",
      consistency: "strong",
    });

    const key = name.trim().toLowerCase().replace(/\s+/g, "-");

    await store.setJSON(key, {
      name: name.trim(),
      selections,
      submittedAt: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Blobs error:", err);
    return { statusCode: 500, body: "Storage error: " + err.message };
  }
};

