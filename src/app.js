import "./style.css";
import $ from "jquery";
import Swal from "sweetalert2";
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
          <th>ID</th>
          <th>Nama</th>
          <th>Packing</th>
          <th>Unit</th>
          <th>Consumption</th>
          <th>Balance</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${products
          .map(
            (p) => `
          <tr>
            <td>${p.id}</td>  
            <td>${p.name}</td>
            <td>${p.packing}</td>
            <td>${p.unit}</td>
            <td>${p.consumption}</td>
            <td>${p.binCard.at(-1)?.balance || 0}</td>
            <td>
              <button class="btn-detail" data-id="${p.id}">Lihat Detail</button>
              <button class="btn-edit-product" data-id="${p.id}">Edit</button>
              <button class="btn-delete-product" data-id="${
                p.id
              }">Hapus</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div id="detail-view" class="detail-box" style="display: none;"></div>
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

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Transaksi berhasil disimpan!",
        timer: 1500,
        showConfirmButton: false,
      });
      document.getElementById("transaction-form").style.display = "none";

      renderProducts();
    });

  $("#product-table").DataTable();

  // Edit produk (sementara: tampilkan alert, bisa dikembangkan nanti)
  document.querySelectorAll(".btn-edit-product").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      alert(`Fitur edit produk [ID ${id}] belum diimplementasikan.`);
      // TODO: Nanti buat form edit
    });
  });

  // Hapus produk
  document.querySelectorAll(".btn-delete-product").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      Swal.fire({
        title: "Hapus Produk?",
        text: "Produk dan semua datanya akan dihapus.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          const newList = products.filter((p) => p.id !== id);
          saveProducts(newList);
          renderProducts();

          Swal.fire({
            icon: "success",
            title: "Dihapus!",
            text: "Produk berhasil dihapus.",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      });
    });
  });

  // Detail riwayat bin card
  document.querySelectorAll(".btn-detail").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"));
      const product = products.find((p) => p.id === id);
      if (!product) return;

      const detailBox = document.getElementById("detail-view");

      detailBox.innerHTML = `
        <h2>📋 Riwayat Bin Card: ${product.name} - ID: ${product.id}</h2>
        <table id="detail-table" class="display dataTable">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Masuk</th>
              <th>Keluar</th>
              <th>Saldo</th>
              <th>Exp. Date</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${product.binCard
              .map(
                (entry, i) => `
              <tr>
                <td>${entry.date}</td>
                <td>${entry.in}</td>
                <td>${entry.out}</td>
                <td>${entry.balance}</td>
                <td>${entry.expDate}</td>
                <td>
                  <button class="btn-edit-bincard" data-pid="${product.id}" data-index="${i}">✏️</button>
                  <button class="btn-delete-bincard" data-pid="${product.id}" data-index="${i}">🗑️</button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;

      // Hapus bin card
      document.querySelectorAll(".btn-delete-bincard").forEach((btn) => {
        btn.addEventListener("click", () => {
          const pid = parseInt(btn.getAttribute("data-pid"));
          const index = parseInt(btn.getAttribute("data-index"));
          const target = products.find((p) => p.id === pid);
          if (!target) return;

          Swal.fire({
            title: "Hapus Data Ini?",
            text: "Data entry ini akan dihapus.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal",
          }).then((result) => {
            if (result.isConfirmed) {
              target.binCard.splice(index, 1);
              saveProducts(products);
              renderProducts();
              Swal.fire({
                icon: "success",
                title: "Berhasil dihapus!",
                text: "Entri bin card berhasil dihapus.",
                timer: 1500,
                showConfirmButton: false,
              });

              // Otomatis tampilkan detail ulang setelah hapus
              setTimeout(() => {
                document
                  .querySelector(`.btn-detail[data-id="${pid}"]`)
                  ?.click();
              }, 100);
            }
          });
        });
      });

      // Edit bin card (placeholder)
      document.querySelectorAll(".btn-edit-bincard").forEach((btn) => {
        btn.addEventListener("click", () => {
          const pid = btn.getAttribute("data-pid");
          const index = btn.getAttribute("data-index");
          alert(
            `Fitur edit binCard [produk ${pid} - baris ${index}] belum tersedia.`
          );
          // TODO: Nanti buatkan form inline/modal
        });
      });

      detailBox.style.display = "block";

      // Re-inisialisasi datatable detail
      $("#detail-table").DataTable();
    });
  });
};

renderProducts();
