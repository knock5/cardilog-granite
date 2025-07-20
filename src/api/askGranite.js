const API_URL = process.env.API_URL;

export async function askGranite(prompt) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const result = await response.json();
    return result.data || "Tidak ada respons dari AI.";
  } catch (error) {
    console.error("Error memanggil Granite API:", error);
    return "Terjadi kesalahan saat memanggil AI.";
  }
}
