const KEY = "products-data";

export const saveProducts = (products) => {
  // validasi array produk
  if (!Array.isArray(products)) {
    console.error("Invalid input: products should be an array.");
    return;
  }

  localStorage.setItem(KEY, JSON.stringify(products));
};

export const getProducts = () => {
  // cek browser support for localStorage
  if (typeof Storage === "undefined") {
    console.error("LocalStorage is not supported by this browser.");
    return [];
  }
  // Ambil data produk dari localStorage
  if (!localStorage.getItem(KEY)) {
    console.warn("No products found in localStorage.");
    return [];
  }

  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const initProducts = (initialData) => {
  if (!localStorage.getItem(KEY)) {
    saveProducts(initialData);
  }
};
