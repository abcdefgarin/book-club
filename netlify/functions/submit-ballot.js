import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let ballot;
  try {
    ballot = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { name, selections } = ballot;

  if (!name || !Array.isArray(selections) || selections.length === 0) {
    return new Response("Missing name or selections", { status: 400 });
  }

  const store = getStore("ballots");

  // Use lowercase name as key so same person can't double-submit under
  // different capitalization. Overwrites if they resubmit.
  const key = name.trim().toLowerCase().replace(/\s+/g, "-");

  await store.setJSON(key, {
    name: name.trim(),
    selections,           // array of { rank, title, author }
    submittedAt: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/submit-ballot" };
