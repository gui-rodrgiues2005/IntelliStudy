// src/services/api.js
const api = import.meta.env.VITE_API_URL || "http://localhost:5051";

export async function get(endpoint) {
  const res = await fetch(`${api}${endpoint}`);
  return res.json();
}

export async function post(endpoint, body) {
  const res = await fetch(`${api}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
