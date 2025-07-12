import "./style.css";
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import { dummyProducts } from "./data/products";
import { saveProducts, getProducts, initProducts } from "./utils/storage";

// set data awal jika belum ada di localStorage
initProducts(dummyProducts);

const getToday = () => {
  const now = new Date();
  return now.toISOString().split("T")[0]; // format YYYY-MM-DD
};

const renderProducts = () => {
  const products = getProducts();
  const container = document.getElementById("app");

  container.innerHTML = `
    <h1>📦 Stock Produk</h1>

    <div class="center-btn">
      <button id="add-transaction-btn" class="btn-add">+ Tambah Transaksi</button>
    </div>

    <div id="transaction-form" class="form-box" style="display: none;">
      <div class="form-group">
        <label for="product-select">Produk:</label>
        <select id="product-select">
          ${products
            .map((p) => `<option value="${p.id}">${p.name}</option>`)
            .join("")}
        </select>
      </div>

      <div class="form-group">
        <label for="trans-date">Tanggal Transaksi:</label>
        <input type="date" id="trans-date" value="${getToday()}" />
      </div>

      <div class="form-group">
        <label for="trans-in">Jumlah Masuk:</label>
        <input type="number" id="trans-in" placeholder="0" min="0" />
      </div>

      <div class="form-group">
        <label for="trans-out">Jumlah Keluar:</label>
        <input type="number" id="trans-out" placeholder="0" min="0" />
      </div>

      <div class="form-group">
        <label for="exp-date">Tanggal Kadaluarsa:</label>
        <input type="date" id="exp-date" />
      </div>

      <button id="submit-transaction">Simpan</button>
    </div>

    <table id="product-table" class="display dataTable">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Packing</th>
          <th>Unit</th>
          <th>Consumption</th>
          <th>Saldo Terakhir</th>
        </tr>
      </thead>
      <tbody>
        ${products
          .map(
            (p) => `
          <tr>
            <td>${p.name}</td>
            <td>${p.packing}</td>
            <td>${p.unit}</td>
            <td>${p.consumption}</td>
            <td>${p.binCard.at(-1)?.balance || 0}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  document
    .getElementById("add-transaction-btn")
    .addEventListener("click", () => {
      const form = document.getElementById("transaction-form");
      form.style.display = form.style.display === "none" ? "block" : "none";
    });

  document
    .getElementById("submit-transaction")
    .addEventListener("click", () => {
      const id = parseInt(document.getElementById("product-select").value);
      const date = document.getElementById("trans-date").value;
      const inputIn = parseInt(document.getElementById("trans-in").value) || 0;
      const inputOut =
        parseInt(document.getElementById("trans-out").value) || 0;
      const expInput = document.getElementById("exp-date").value;

      const product = products.find((p) => p.id === id);
      if (!product) return alert("Produk tidak ditemukan.");

      const lastBalance = product.binCard.at(-1)?.balance || 0;
      if (inputOut > lastBalance) {
        return alert(
          `Jumlah keluar (${inputOut}) melebihi saldo (${lastBalance}).`
        );
      }

      const expDate =
        expInput.trim() !== ""
          ? expInput
          : product.binCard.at(-1)?.expDate || "";

      const newBalance = lastBalance + inputIn - inputOut;

      product.binCard.push({
        date,
        in: inputIn,
        out: inputOut,
        balance: newBalance,
        expDate,
      });

      saveProducts(products);
      alert("Transaksi berhasil disimpan!");
      renderProducts(); // re-render seluruh tampilan
    });

  $("#product-table").DataTable();
};

renderProducts();
