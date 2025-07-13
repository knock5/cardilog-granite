import { askGranite } from "../api/askGranite.js";
import { getProducts } from "./storage.js";

// perhitungan prediksi dengan metode Moving Average, nilai n = 7
export const calculateMovingAverage = (binCard, days = 7) => {
  const recent = binCard.slice(-days);
  if (recent.length === 0) return 0;
  const totalOut = recent.reduce((sum, e) => sum + (e.out || 0), 0);
  return (totalOut / recent.length).toFixed(2);
};

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

export const handlePrediction = async (productId) => {
  const products = getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const avg = calculateMovingAverage(product.binCard, 7);
  const prompt = generatePrompt(product, avg);
  const result = await askGranite(prompt);

  return {
    average: avg,
    insight: result.data,
  };
};
