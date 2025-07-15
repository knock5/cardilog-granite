import { askGranite } from "../api/askGranite.js";
import { getProducts } from "./storage.js";

// Moving Average untuk 7 hari (mingguan)
export const calculateWeeklyAverage = (binCard) => {
  const recent = binCard.slice(-7);
  if (recent.length === 0) return 0;
  const totalOut = recent.reduce((sum, e) => sum + (e.out || 0), 0);
  return (totalOut / recent.length).toFixed(2);
};

// Panggil AI Granite dengan penanganan error
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

// Fungsi utama prediksi (khusus mingguan)
export async function handlePrediction(pid) {
  const product = getProducts().find((p) => p.id === pid);
  if (!product) return null;

  const binCard = product.binCard;
  if (!binCard.length) return null;

  const recentData = binCard.slice(-7);
  if (recentData.length === 0) {
    return {
      average: "0",
      insight: "⚠️ Data untuk 7 hari terakhir tidak tersedia.",
    };
  }

  const totalOut = recentData.reduce((sum, e) => sum + (e.out || 0), 0);
  const average = (totalOut / recentData.length).toFixed(1);

  const prompt = `Berikan insight stok untuk produk ${product.name} berdasarkan konsumsi mingguan rata-rata ${average}.

Nama produk: ${product.name}
Packing: ${product.packing}
Unit: ${product.unit}
Consumption Rate: ${product.consumption}`;

  const insight = await predictWithGranite(prompt);

  return {
    average: `${average} / minggu`,
    insight,
  };
}
