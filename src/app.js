import "./style.css";
import $ from "jquery";
import Swal from "sweetalert2";
import moment from "moment";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import { dummyProducts } from "./data/products";
import { saveProducts, getProducts, initProducts } from "./utils/storage";
import { handlePrediction, predictWithGranite } from "./utils/predict";

// set data awal jika belum ada di localStorage
initProducts(dummyProducts);

const getToday = () => {
  const now = new Date();
  return now.toISOString().split("T")[0];
};

// Parser markdown-like ke HTML (diperluas)
function markdownToHtml(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") // Bold
    .replace(/\*(.+?)\*/g, "<em>$1</em>") // Italic
    .replace(/^## (.+)$/gm, "<h4>$1</h4>") // Heading
    .replace(/^- (.+)$/gm, "<ul><li>$1</li></ul>") // List
    .replace(/<\/ul>\s*<ul>/g, "") // Gabungkan <ul>
    .replace(/\n{2,}/g, "</p><p>") // Paragraf
    .replace(/\n/g, "<br>"); // Line break
}

// Format dan parsing teks insight AI
function formatInsight(text) {
  if (!text || typeof text !== "string") {
    return "<div class='prediction-item'>Tidak ada insight dari AI.</div>";
  }

  // Pastikan split tetap menghasilkan array of string
  const lines = String(text)
    .split("\n")
    .map((line) => (typeof line === "string" ? line : ""))
    .filter((line) => line.trim() !== "");

  let html = "";

  lines.forEach((line) => {
    const trimmed = markdownToHtml(line.trim());

    // Pola 1. xxx
    const numbered = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numbered) {
      html += `<div class="prediction-item numbered"><strong>${numbered[1]}.</strong> ${numbered[2]}</div>`;
    } else if (
      /estimasi|restock|saran|rata-rata|tendensi|prediksi/i.test(trimmed)
    ) {
      html += `<div class="prediction-item highlight">${trimmed}</div>`;
    } else if (trimmed.includes(":")) {
      const [key, value] = trimmed.split(/:(.+)/);
      html += `<div class="prediction-item"><strong>${key.trim()}:</strong> ${
        value?.trim() || ""
      }</div>`;
    } else {
      html += `<div class="prediction-item">${trimmed}</div>`;
    }
  });

  return html;
}

const renderProducts = () => {
  const products = getProducts();
  const container = document.getElementById("app");

  container.innerHTML = `
    <div class="brand-wrap flex">
      <h1>CardiLog</h1>
    </div>

    <div class="flex center">
      <button id="add-transaction-btn" class="btn btn-add">+ Tambah Transaksi</button>
      <button id="add-product-btn" class="btn btn-add" style="margin-left: 10px;">+ Tambah Produk</button>
    </div>

    <div class="table-container">
      <table id="product-table" class="display dataTable sticky-header">
        <thead>
          <tr>
            <th>ID</th><th>Nama</th><th>Packing</th><th>Unit</th><th>Consumption</th><th>Balance</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${products
            .map(
              (p) => `
            <tr>
              <td>${p.id}</td><td>${p.name}</td><td>${p.packing}</td><td>${
                p.unit
              }</td><td>${p.consumption}</td><td>${
                p.binCard.at(-1)?.balance || 0
              }</td>
              <td>
                <button class="btn btn-detail" data-id="${
                  p.id
                }">Lihat Detail</button>
                <button class="btn btn-edit-product" data-id="${
                  p.id
                }">Edit</button>
                <button class="btn btn-delete-product" data-id="${
                  p.id
                }">Hapus</button>
                <button class="btn btn-predict" data-id="${
                  p.id
                }">Prediksi <span class="loading-spinner" style="display: none;"></span></button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
    
    <div id="prediction-result" class="detail-box prediction-box" style="display: none;">
      <div class="prediction-header">
        <h3>📊 Prediksi Produk Mingguan</h3>
        <button class="btn btn-close" id="close-predict">Tutup</button>
      </div>
      <div class="prediction-result-box">
        <p><strong>📌 Rata-rata 7 hari terakhir:</strong> ...</p>
        <p><strong>🤖 Insight Model Granite Instruct AI:</strong></p>
        <pre class="prediction-text">Output dari Granite AI...</pre>
      </div>
    </div>

    <div id="detail-view" class="detail-box" style="display: none;"></div>

    <!-- Modal edit produk -->
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
  `;

  document
    .getElementById("add-transaction-btn")
    .addEventListener("click", async () => {
      const products = getProducts();

      const { value: formValues } = await Swal.fire({
        title: "Tambah Transaksi",
        html: `
      <label for="swal-product" style="font-size:12px; display:block; text-align:center; margin-bottom:4px;">📦 Produk</label>
      <select id="swal-product" class="swal2-input">
        ${products
          .map((p) => `<option value="${p.id}">${p.name}</option>`)
          .join("")}
      </select>

      <label for="swal-date" style="font-size:12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">📅 Tanggal Transaksi</label>
      <input id="swal-date" type="date" class="swal2-input" value="${getToday()}">

      <label for="swal-in" style="font-size:12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">📥 Jumlah Masuk</label>
      <input id="swal-in" type="number" class="swal2-input" placeholder="0" min="0">

      <label for="swal-out" style="font-size:12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">📤 Jumlah Keluar</label>
      <input id="swal-out" type="number" class="swal2-input" placeholder="0" min="0">

      <label for="swal-exp" style="font-size:12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">🕒 Tanggal Kadaluarsa</label>
      <input id="swal-exp" type="date" class="swal2-input">
    `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Simpan",
        cancelButtonText: "Batal",
        preConfirm: () => {
          return {
            id: parseInt(document.getElementById("swal-product").value),
            date: document.getElementById("swal-date").value,
            inputIn: parseInt(document.getElementById("swal-in").value) || 0,
            inputOut: parseInt(document.getElementById("swal-out").value) || 0,
            expDate: document.getElementById("swal-exp").value,
          };
        },
      });

      if (formValues) {
        const { id, date, inputIn, inputOut, expDate } = formValues;
        const products = getProducts();
        const product = products.find((p) => p.id === id);
        if (!product)
          return Swal.fire("Error", "Produk tidak ditemukan.", "error");

        const lastBalance = product.binCard.at(-1)?.balance || 0;

        if (inputOut > lastBalance) {
          return Swal.fire({
            icon: "error",
            title: "Jumlah keluar melebihi saldo!",
            text: `Keluar: ${inputOut}, Saldo: ${lastBalance}`,
          });
        }

        const newBalance = lastBalance + inputIn - inputOut;
        const finalExp =
          expDate.trim() !== ""
            ? expDate
            : product.binCard.at(-1)?.expDate || "";

        product.binCard.push({
          date,
          in: inputIn,
          out: inputOut,
          balance: newBalance,
          expDate: finalExp,
        });

        saveProducts(products);
        renderProducts();

        setTimeout(() => {
          // Toast notifikasi
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Transaksi ditambahkan",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          });
        }, 200);
      }
    });

  document
    .getElementById("add-product-btn")
    .addEventListener("click", async () => {
      const { value: formValues } = await Swal.fire({
        title: "Tambah Produk Baru",
        html: `
          <label for="swal-name" style="font-size:12px; display:block; text-align:center; margin-bottom:4px;">Nama Produk</label>
          <input id="swal-name" class="swal2-input" placeholder="Contoh: Beras Medium">

          <label for="swal-pack" style="font-size:12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">Packing</label>
          <input id="swal-pack" class="swal2-input" placeholder="Contoh: 1 kg">

          <label for="swal-unit" style="font-size:12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">Unit</label>
          <input id="swal-unit" class="swal2-input" placeholder="Contoh: pcs">

          <label for="swal-cons" style="font-size:12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">Konsumsi Harian (opsional)</label>
          <input id="swal-cons" class="swal2-input" placeholder="Contoh: 5">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Tambah",
        cancelButtonText: "Batal",
        preConfirm: () => {
          return {
            name: document.getElementById("swal-name").value.trim(),
            packing: document.getElementById("swal-pack").value.trim(),
            unit: document.getElementById("swal-unit").value.trim(),
            consumption: document.getElementById("swal-cons").value.trim(),
          };
        },
      });

      if (formValues) {
        const products = getProducts();
        const newId = Math.floor(Math.random() * 100000);

        products.push({
          id: newId,
          name: formValues.name,
          packing: formValues.packing,
          unit: formValues.unit,
          consumption: formValues.consumption,
          binCard: [],
        });

        saveProducts(products);
        renderProducts();

        Swal.fire({
          icon: "success",
          title: "Produk ditambahkan!",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });

  $("#product-table").DataTable({
    order: [[0, "desc"]],
    scrollX: true,
    scrollCollapse: true,
    autoWidth: true,
    columnDefs: [
      {
        targets: "_all",
        className: "dt-center",
      },
      {
        targets: 0,
        orderable: false,
      },
      {
        targets: 5,
        orderable: false,
      },
    ],
  });

  // Edit produk
  document.querySelectorAll(".btn-edit-product").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pid = parseInt(btn.getAttribute("data-id"));
      const products = getProducts();
      const product = products.find((p) => p.id === pid);
      if (!product) return;

      const { value: formValues } = await Swal.fire({
        title: "Edit Produk",
        html: `
        <input id="swal-name" class="swal2-input" placeholder="Nama Produk" value="${product.name}">
        <input id="swal-pack" class="swal2-input" placeholder="Packing" value="${product.packing}">
        <input id="swal-unit" class="swal2-input" placeholder="Unit" value="${product.unit}">
        <input id="swal-cons" class="swal2-input" placeholder="Consumption" value="${product.consumption}">
      `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Simpan",
        preConfirm: () => {
          return {
            name: document.getElementById("swal-name").value,
            packing: document.getElementById("swal-pack").value,
            unit: document.getElementById("swal-unit").value,
            consumption: document.getElementById("swal-cons").value,
          };
        },
      });

      if (formValues) {
        product.name = formValues.name.trim();
        product.packing = formValues.packing.trim();
        product.unit = formValues.unit.trim();
        product.consumption = formValues.consumption.trim();
        saveProducts(products);
        renderProducts();
        Swal.fire("Berhasil", "Produk diperbarui", "success");
      }
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
              <th>Balance</th>
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
                  <button class="btn btn-edit-bincard" data-pid="${product.id}" data-index="${i}">✏️</button>
                  <button class="btn btn-delete-bincard" data-pid="${product.id}" data-index="${i}">🗑️</button>
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
        btn.addEventListener("click", async () => {
          const pid = parseInt(btn.getAttribute("data-pid"));
          const index = parseInt(btn.getAttribute("data-index"));
          const products = getProducts();
          const product = products.find((p) => p.id === pid);
          const target = product?.binCard[index];
          if (!target) return;

          const { value: formValues } = await Swal.fire({
            title: "Edit Transaksi",
            html: `
              <label for="swal-date" style="font-size: 12px; display:block; text-align:center; margin-bottom:4px;">📅 Tanggal Transaksi</label>
              <input id="swal-date" type="date" class="swal2-input" value="${target.date}">
              
              <label for="swal-in" style="font-size: 12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">📥 Jumlah Masuk</label>
              <input id="swal-in" type="number" class="swal2-input" placeholder="Masuk" value="${target.in}">
              
              <label for="swal-out" style="font-size: 12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">📤 Jumlah Keluar</label>
              <input id="swal-out" type="number" class="swal2-input" placeholder="Keluar" value="${target.out}">
              
              <label for="swal-exp" style="font-size: 12px; display:block; text-align:center; margin-top:10px; margin-bottom:4px;">🕒 Tanggal Expired</label>
              <input id="swal-exp" type="date" class="swal2-input" value="${target.expDate}">
            `,

            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Simpan",
            cancelButtonText: "Batal",
            preConfirm: () => {
              return {
                date: document.getElementById("swal-date").value,
                in: parseInt(document.getElementById("swal-in").value) || 0,
                out: parseInt(document.getElementById("swal-out").value) || 0,
                expDate: document.getElementById("swal-exp").value,
              };
            },
          });

          if (formValues) {
            const { date, in: inputIn, out: inputOut, expDate } = formValues;

            // Hitung saldo baru dari transaksi ini
            const previousBalance =
              index > 0 ? product.binCard[index - 1].balance : 0;
            const newBalance = previousBalance + inputIn - inputOut;

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
            renderProducts();

            Swal.fire({
              icon: "success",
              title: "Berhasil",
              text: "Transaksi berhasil diperbarui!",
              timer: 1500,
              showConfirmButton: false,
            });

            setTimeout(() => {
              document.querySelector(`.btn-detail[data-id="${pid}"]`)?.click();
            }, 100);
          }
        });
      });

      detailBox.style.display = "block";

      // Re-inisialisasi datatable detail
      $("#detail-table").DataTable({
        order: [[0, "desc"]],
        scrollX: true,
        scrollCollapse: true,
        autoWidth: false,
        columnDefs: [
          {
            targets: "_all",
            className: "dt-center",
          },
          {
            targets: 5,
            orderable: false,
          },
          {
            targets: 0,
            render: (data) => {
              return moment(data).format("DD/MM/YYYY");
            },
          },
          {
            targets: 4,
            render: (data) => {
              return data ? moment(data).format("DD/MM/YYYY") : "Tidak ada";
            },
          },
        ],
      });
    });
  });

  // listener untuk prediksi
  document.querySelectorAll(".btn-predict").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pid = parseInt(btn.getAttribute("data-id"));
      const box = document.getElementById("prediction-result");
      const spinner = btn.querySelector(".loading-spinner");

      // Tampilkan spinner
      spinner.style.display = "inline-block";
      box.style.display = "block";

      // Reset isi sementara
      box.innerHTML = `
      <div class="prediction-header">
        <h3>📊 Prediksi Produk</h3>
        <div>
          <button class="btn-close" id="close-predict">Tutup</button>
        </div>
      </div>
      <div class="prediction-result-box">
        <p><strong>🤖 Insight Model Granite Instruct AI:</strong></p>
        <div class="prediction-text">Memproses insight dari AI...</div>
      </div>
    `;

      await new Promise((r) => setTimeout(r, 100));

      const mode = document.getElementById("predict-mode")?.value || "weekly";
      const result = await handlePrediction(pid, mode);
      spinner.style.display = "none";

      const avg = result?.average ?? "-";
      const insight = result?.insight ?? "Gagal memuat insight.";

      box.innerHTML = `
      <div class="prediction-header">
        <h3>📊 Prediksi Produk Mingguan</h3>
        <div>
          <button class="btn btn-close" id="close-predict">Tutup</button>
        </div>
      </div>
      <div class="prediction-result-box">
        <p><strong>📉 Rata-rata:</strong> ${avg}</p>
        <p><strong>🤖 Insight Model Granite Instruct AI:</strong></p>
        <div class="prediction-text">${formatInsight(insight)}</div>
      </div>
    `;

      // Scroll to result
      window.scrollTo({ top: box.offsetTop - 40, behavior: "smooth" });
    });
  });

  // Listener tombol "Tutup"
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "close-predict") {
      document.getElementById("prediction-result").style.display = "none";
    }
  });
};

renderProducts();
