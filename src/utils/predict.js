import { askGranite } from "../api/askGranite.js";
import { getProducts } from "./storage.js";

// Moving Average (7 hari atau sesuai input)
export const calculateMovingAverage = (binCard, days = 7) => {
  const recent = binCard.slice(-days);
  if (recent.length === 0) return 0;
  const totalOut = recent.reduce((sum, e) => sum + (e.out || 0), 0);
  return (totalOut / recent.length).toFixed(2);
};

// Membuat prompt sederhana (tidak digunakan lagi)
export const generatePrompt = (product, avg) => {
  const history = product.binCard
    .slice(-10)
    .map((e) => `${e.date}: in ${e.in}, out ${e.out}, balance ${e.balance}`)
    .join("\n");

  return `
Saya memiliki data historis produk "${product.name}" (${product.packing}):

${history}

Rata-rata keluar 7 hari terakhir: ${avg} ${product.unit}.

Apa estimasi kebutuhan besok? Perlukah restock? Berikan analisis singkat.
  `.trim();
};

// Fungsi yang memanggil AI Granite
export async function predictWithGranite(prompt) {
  try {
    const response = await askGranite(prompt);
    if (typeof response === "string") return response;
    if (response?.output && typeof response.output === "string")
      return response.output;
    if (response?.data && typeof response.data === "string")
      return response.data;
    return "⚠️ Tidak ada respons yang bisa dibaca dari AI.";
  } catch (err) {
    console.error("❌ Gagal memanggil Granite:", err);
    return "❌ Terjadi kesalahan saat memanggil AI.";
  }
}

// Fungsi utama prediksi
export async function handlePrediction(pid, mode = "daily") {
  const product = getProducts().find((p) => p.id === pid);
  if (!product) return null;

  const binCard = product.binCard;
  if (!binCard.length) return null;

  let recentData;

  if (mode === "daily") {
    recentData = binCard.slice(-7);
  } else {
    const now = new Date();
    const lastMonth = now.getMonth() - 1;
    recentData = binCard.filter((entry) => {
      const d = new Date(entry.date);
      return (
        d.getMonth() === lastMonth && d.getFullYear() === now.getFullYear()
      );
    });
  }

  const totalOut = recentData.reduce((sum, e) => sum + e.out, 0);
  const average =
    mode === "daily"
      ? (totalOut / recentData.length).toFixed(1)
      : totalOut.toFixed(1);

  const prompt = `Berikan insight stok untuk produk ${
    product.name
  } berdasarkan konsumsi ${
    mode === "daily" ? "harian" : "bulanan"
  } rata-rata ${average}.`;

  const insight = await predictWithGranite(prompt);

  return {
    average: mode === "daily" ? `${average} / hari` : `${average} / bulan`,
    insight,
  };
}
