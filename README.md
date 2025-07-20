# Cardilog: Smart Inventory Tracker with AI Prediction

## 🧩 Project Overview

Cardilog adalah aplikasi manajemen stok barang berbasis web yang dirancang untuk kebutuhan restoran dan bisnis kuliner kecil-menengah. Aplikasi ini menggunakan konsep **bin card** untuk mencatat keluar masuk barang secara akurat serta menyediakan prediksi stok di masa depan berbasis data historis.

Permasalahan yang sering dihadapi oleh pelaku usaha adalah kesulitan dalam memantau pergerakan stok dan mengantisipasi kehabisan barang secara tiba-tiba. Cardilog hadir sebagai solusi dengan menggabungkan pencatatan manual yang efisien dan kecerdasan buatan (AI) untuk memberikan insight prediktif terhadap pergerakan barang.

Pendekatan yang digunakan dalam proyek ini melibatkan:

- Penyimpanan data lokal di browser (localStorage/sessionStorage)
- Interaksi antarmuka modern berbasis JavaScript vanilla dan PWA
- Analisis tren pemakaian stok barang menggunakan **Moving Average**
- Pemanfaatan model **IBM Granite AI** untuk memberikan rekomendasi dan insight
- Deployment menggunakan 2 platform yakni <a href="https://render.com/" target="_blank" rel="noopener noreferrer">onrender</a> untuk frontend dan <a href="https://fly.io/" target="_blank" rel="noopener noreferrer">fly.io</a> untuk backend server

---

## 💻 Technologies Used

| Teknologi                              | Deskripsi                                                 |
| -------------------------------------- | --------------------------------------------------------- |
| **JavaScript (Vanilla)**               | Bahasa utama untuk logika aplikasi                        |
| **HTML & CSS**                         | Struktur dan desain tampilan UI                           |
| **Webpack**                            | Modul bundler untuk mengelola dependensi                  |
| **SweetAlert2**                        | Tampilan modal interaktif untuk input & feedback pengguna |
| **IBM Granite AI (via Replicate API)** | Model AI untuk analisis dan prediksi stok                 |
| **LocalStorage / SessionStorage**      | Media penyimpanan data sementara di browser               |
| **Progressive Web App (PWA)**          | Dukungan instalasi dan penggunaan offline                 |

**Alasan pemilihan teknologi**:

- JavaScript murni dipilih agar ringan dan mudah di-deploy tanpa framework berat.
- PWA memungkinkan aplikasi bisa digunakan seperti native app tanpa instalasi server.
- IBM Granite dipilih karena kemampuannya dalam menghasilkan insight berkualitas tinggi dari data yang diberikan.

---

## 🚀 Features

### ✅ Manajemen Stok

- Tambah produk dan kelola balance awal
- Catat transaksi masuk dan keluar barang
- Lihat histori transaksi dalam bentuk tabel dinamis
- Scroll otomatis ke input form aktif

### 📈 Prediksi Stok

- Menggunakan metode **Moving Average** dalam mingguan
- Tampilkan hasil prediksi berupa jumlah stok yang disarankan

### 💡 Insight AI (Granite)

- Prediksi hybrid: kombinasi perhitungan Moving Average dan insight dari model AI
- Tampilan hasil insight dalam format HTML rapi dengan parser markdown-like

### 💾 Penyimpanan Lokal

- Data disimpan di browser (tidak memerlukan backend)
- Format penyimpanan mendukung pencadangan dan reset
  Custom data product terdapat dalam **/src/data/products.js** yang mana ini memanfaatkan local storage dari browser yang mendukung

---

## 🤖 AI Integration

Aplikasi ini terintegrasi dengan model AI **IBM Granite** yang diakses melalui API Replicate. Fungsi `askGranite()` digunakan untuk mengirim ringkasan data stok dan mendapatkan insight cerdas dalam bentuk teks naratif.

Contoh penggunaan:

- Mengambil data produk dengan frekuensi keluar tertinggi
- Memberikan rekomendasi penyesuaian stok berdasarkan pola konsumsi
- Insight divisualisasikan dengan fungsi `formatInsight()` yang mendukung sintaks markdown-like agar mudah dibaca

**Dampak Penggunaan AI:**

- Membantu pemilik usaha memahami tren penggunaan barang
- Meningkatkan akurasi dalam mengambil keputusan pembelian
- Menghemat waktu dalam menganalisis histori secara manual

---

## 📦 Instalasi & Penggunaan

Repositori ini menyediakan server backend yang terletak dalam folder **server** yang dapat digunakan jika ingin menjalankannya melalui lokal yang tentunya perlu disesuaikan terlebih dahulu untuk environmentnya.

1. **Clone repositori**
   ```bash
   git clone https://github.com/username/cardilog-granite.git
   cd cardilog-granite
   ```
2. **install dependensi**
   ```bash
   npm install
   ```
3. **Set API Key**

- Buat file .env dan masukkan: (Atur API Token)

```bash
REPLICATE_API_TOKEN=your_token_here
API_URL=API_URL_TARGET
PORT=NUMBER_PORT
```

4. **Jalankan Aplikasi (Mode Development)**
   ```bash
   npm start
   ```
   Kemudian akses via browser melalui url dan port yang sedang dijalankan.

## 📂 Struktur Folder

cardilog-granite/
├── public/
│ └── index.html
├── server/
│ └── server.js
├── src/
│ ├── api/askGranite.js
│ ├── data/products.js
│ ├── utils/predict.js
│ ├── app.js
│ ├── style.css.js
├── .env.example
├── package.json
├── README.md
└── webpack.config.js

## 👨‍💻 Kontributor

- Moch. Miftachul Huda - <putihbiru0505@gmail.com>
- Model AI oleh IBM Granite Instruct via [Replicate](https://replicate.com/ibm-granite/granite-3.3-8b-instruct)

## Preview Website

Website cardilog bisa diakses melalui link berikut ini 👉 <a href="https://cardilog-granite.onrender.com" target="_blank" rel="noopener noreferrer">cardilog</a>

### Data Produk

![Pict Data Produk](https://res.cloudinary.com/dlmcdjahv/image/upload/v1753013673/main-data_rmdsvu.png)
Terdapat tombol untuk menambahkan suatu produk baru ataupun transaksi baru. Tersedia fitur untuk kelola data produk seperti edit dan delete, serta menyediakan fitur insight AI Granite Instruct Model dengan menekan tombol prediksi yang akan menganalisa tingkat penjualan atau prediksi penggunaan stok barang secara mingguan.

### Insight AI Model

![Pict Data Produk](https://res.cloudinary.com/dlmcdjahv/image/upload/v1753013794/result_granite_ask8fa.png)
Hasil dari request prediksi akan ditampilkan pada section prediction box dengan penjelasan dari Granite Instruct Model AI.

### Data Bin Card

![Pict Data Produk](https://res.cloudinary.com/dlmcdjahv/image/upload/v1753013793/data-bincard_yij01k.png)
Data bincard didapatkan sesuai dengan tombol detail yang dipilih pada data produk. Bisa juga untuk mengelola data bin card sepert edit dan delete data bin card.
