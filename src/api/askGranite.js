export const askGranite = async (prompt) => {
  const res = await fetch("/api/granite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return await res.json();
};
