const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  try {
    const store = getStore({
      name: "ballots",
      consistency: "strong",
    });

    const { blobs } = await store.list();

    const ballots = await Promise.all(
      blobs.map(async ({ key }) => {
        try {
          return await store.get(key, { type: "json" });
        } catch {
          return null;
        }
      })
    );

    const valid = ballots
      .filter(Boolean)
      .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

    const tally = {};
    for (const ballot of valid) {
      for (const { rank, title, author } of ballot.selections) {
        if (!tally[title]) tally[title] = { title, author, points: 0, mentions: 0 };
        tally[title].points += Math.max(0, 11 - rank);
        tally[title].mentions += 1;
      }
    }

    const aggregate = Object.values(tally)
      .sort((a, b) => b.points - a.points || a.title.localeCompare(b.title));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ballots: valid, aggregate }),
    };
  } catch (err) {
    console.error("Blobs error:", err);
    return { statusCode: 500, body: "Storage error: " + err.message };
  }
};

