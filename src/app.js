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

    <div id="edit-product-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <h3>Edit Produk</h3>
        <label>Nama</label>
        <input type="text" id="edit-prod-name" />
        <label>Packing</label>
        <input type="text" id="edit-prod-pack" />
        <label>Unit</label>
        <input type="text" id="edit-prod-unit" />
        <label>Consumption</label>
        <input type="text" id="edit-prod-cons" />
        <div class="modal-actions">
          <button id="cancel-edit-prod">Batal</button>
          <button id="save-edit-prod">Simpan Perubahan</button>
        </div>
      </div>
    </div>
    
    <div id="edit-bin-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <h3>Edit Transaksi</h3>
        <label>Tanggal</label>
        <input type="date" id="edit-date" />
        <label>Masuk</label>
        <input type="number" id="edit-in" />
        <label>Keluar</label>
        <input type="number" id="edit-out" />
        <label>Exp. Date</label>
        <input type="date" id="edit-exp" />
        <div class="modal-actions">
          <button id="cancel-edit">Batal</button>
          <button id="save-edit">Simpan Perubahan</button>
        </div>
      </div>
    </div>

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

  // Edit produk
  document.querySelectorAll(".btn-edit-product").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pid = parseInt(btn.getAttribute("data-id"));
      const products = getProducts();
      const product = products.find((p) => p.id === pid);
      if (!product) return;

      // Isi form
      document.getElementById("edit-prod-name").value = product.name;
      document.getElementById("edit-prod-pack").value = product.packing;
      document.getElementById("edit-prod-unit").value = product.unit;
      document.getElementById("edit-prod-cons").value = product.consumption;

      document.getElementById("save-edit-prod").dataset.id = pid;
      document.getElementById("edit-product-modal").style.display = "flex";
    });
  });

  // handle save edit produk
  document.getElementById("save-edit-prod").addEventListener("click", () => {
    const pid = parseInt(document.getElementById("save-edit-prod").dataset.id);
    const name = document.getElementById("edit-prod-name").value.trim();
    const packing = document.getElementById("edit-prod-pack").value.trim();
    const unit = document.getElementById("edit-prod-unit").value.trim();
    const consumption = document.getElementById("edit-prod-cons").value.trim();

    const products = getProducts();
    const product = products.find((p) => p.id === pid);
    if (!product) return;

    product.name = name;
    product.packing = packing;
    product.unit = unit;
    product.consumption = consumption;

    saveProducts(products);
    document.getElementById("edit-product-modal").style.display = "none";
    renderProducts();

    Swal.fire({
      icon: "success",
      title: "Produk Diperbarui",
      timer: 1500,
      showConfirmButton: false,
    });
  });

  document.getElementById("cancel-edit-prod").addEventListener("click", () => {
    document.getElementById("edit-product-modal").style.display = "none";
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

      // Edit bin card
      document.querySelectorAll(".btn-edit-bincard").forEach((btn) => {
        btn.addEventListener("click", () => {
          const pid = parseInt(btn.getAttribute("data-pid"));
          const index = parseInt(btn.getAttribute("data-index"));
          const products = getProducts();
          const product = products.find((p) => p.id === pid);
          const target = product?.binCard[index];
          if (!target) return;

          // Isi form dengan data lama
          document.getElementById("edit-date").value = target.date;
          document.getElementById("edit-in").value = target.in;
          document.getElementById("edit-out").value = target.out;
          document.getElementById("edit-exp").value = target.expDate;

          // Simpan info aktif
          document.getElementById("save-edit").dataset.pid = pid;
          document.getElementById("save-edit").dataset.index = index;

          document.getElementById("edit-bin-modal").style.display = "flex";
        });
      });

      // cancel edit btn
      document.getElementById("cancel-edit").addEventListener("click", () => {
        document.getElementById("edit-bin-modal").style.display = "none";
      });

      // handle save edit
      document.getElementById("save-edit").addEventListener("click", () => {
        const pid = parseInt(document.getElementById("save-edit").dataset.pid);
        const index = parseInt(
          document.getElementById("save-edit").dataset.index
        );

        const date = document.getElementById("edit-date").value;
        const inputIn = parseInt(document.getElementById("edit-in").value) || 0;
        const inputOut =
          parseInt(document.getElementById("edit-out").value) || 0;
        const expDate = document.getElementById("edit-exp").value;

        const products = getProducts();
        const product = products.find((p) => p.id === pid);
        if (!product) return;

        // Hitung saldo baru dari transaksi ini
        const previousBalance =
          index > 0 ? product.binCard[index - 1].balance : 0;
        const newBalance = previousBalance + inputIn - inputOut;

        // Ubah entri di index tertentu
        product.binCard[index] = {
          ...product.binCard[index],
          date,
          in: inputIn,
          out: inputOut,
          expDate,
          balance: newBalance,
        };

        // Update saldo ke bawah
        for (let i = index + 1; i < product.binCard.length; i++) {
          const prev = product.binCard[i - 1].balance;
          product.binCard[i].balance =
            prev + product.binCard[i].in - product.binCard[i].out;
        }

        saveProducts(products);
        document.getElementById("edit-bin-modal").style.display = "none";

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Transaksi berhasil diperbarui!",
          timer: 1500,
          showConfirmButton: false,
        });

        renderProducts();

        setTimeout(() => {
          document.querySelector(`.btn-detail[data-id="${pid}"]`)?.click();
        }, 100);
      });

      detailBox.style.display = "block";

      // Re-inisialisasi datatable detail
      $("#detail-table").DataTable();
    });
  });
};

renderProducts();
