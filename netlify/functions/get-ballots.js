import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("ballots");

  // List all ballot keys
  const { blobs } = await store.list();

  // Fetch each ballot in parallel
  const ballots = await Promise.all(
    blobs.map(async ({ key }) => {
      try {
        return await store.get(key, { type: "json" });
      } catch {
        return null;
      }
    })
  );

  // Filter out any nulls, sort by submission time
  const valid = ballots
    .filter(Boolean)
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

  // Build aggregate tally
  // Score: 10 pts for #1, 9 for #2 … 1 for #10
  const tally = {};
  for (const ballot of valid) {
    for (const { rank, title, author } of ballot.selections) {
      if (!tally[title]) tally[title] = { title, author, points: 0, mentions: 0, ranks: [] };
      tally[title].points  += Math.max(0, 11 - rank);
      tally[title].mentions += 1;
      tally[title].ranks.push(rank);
    }
  }

  const aggregate = Object.values(tally)
    .sort((a, b) => b.points - a.points || a.title.localeCompare(b.title));

  return new Response(JSON.stringify({ ballots: valid, aggregate }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/get-ballots" };
