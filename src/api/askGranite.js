export const askGranite = async (prompt) => {
  try {
    const res = await fetch("/api/granite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const result = await res.json();

    if (!result.success || !result.data) {
      console.warn("Granite response invalid:", result);
      return { output: "Granite tidak memberikan hasil." };
    }

    return { output: result.data };
  } catch (err) {
    console.error("Error from askGranite:", err);
    return { output: "Terjadi kesalahan saat menghubungi AI." };
  }
};
