# Guest House Task Manager (GHTM) — Puri Yuanna Living

Selamat datang di dokumentasi resmi **Guest House Task Manager (GHTM)**! 

Aplikasi ini dibangun khusus untuk mendigitalisasi operasional harian di lingkungan properti **Puri Yuanna** (Guest House & Kost). Dengan sistem ini, seluruh penugasan operasional—mulai dari instruksi kebersihan kamar, perbaikan fasilitas, pengecekan berkala, hingga inspeksi mutu—dikelola secara terpusat, transparan, dan tidak lagi mengandalkan pesan lisan atau grup WhatsApp yang mudah terlewat.

---

## Akun Demo Siap Pakai

Sistem telah dilengkapi dengan data seeder bawaan sehingga Anda dapat langsung masuk dan mencoba alur kerja dari berbagai sudut pandang peran (*role*):

| Peran (Role) | Alamat Email | Kata Sandi | Wewenang Utama |
|---|---|---|---|
| **Admin Utama** | `admin@puriyuanna.com` | `dsa` | Akses penuh master data, manajemen unit, staf, dan pengawasan operasional |
| **Manager Operasional** | `manager@puriyuanna.com` | `dsa` | Membuat tugas, menyusun checklist, menugaskan staf, dan approval akhir |
| **Supervisor (SPV)** | `spv@puriyuanna.com` | `dsa` | Menginspeksi pekerjaan lapangan, me-review laporan masuk, *approve* atau minta revisi (*reject*) |
| **Staff Operasional** | `staff@puriyuanna.com` | `dsa` | Melihat tugas yang di-assign, mencentang checklist, upload foto bukti, dan submit laporan |

---

## Cara Menjalankan Aplikasi

Aplikasi GHTM telah dikemas menggunakan Docker sehingga Anda dapat menjalankannya dengan mudah tanpa perlu mengonfigurasi database atau web server secara manual.

### 1. Menjalankan Container
Pastikan Docker dan Docker Compose telah terpasang di komputer Anda, lalu buka terminal di folder proyek dan jalankan:
```bash
docker compose up -d
```
Container yang akan aktif:
- **`ghtm_frontend`**: Aplikasi antarmuka Next.js di port `3001`
- **`ghtm_backend`**: REST API Laravel di port `8000`
- **`ghtm_db`**: Database PostgreSQL di port `5432`

### 2. Membuka di Browser
- **Antarmuka Web (Frontend):** Buka [http://localhost:3001](http://localhost:3001)
- **REST API (Backend):** Buka [http://localhost:8000/api](http://localhost:8000/api)

### 3. Reset Data (Opsional)
Jika di kemudian hari Anda ingin mengembalikan kondisi database ke pengaturan awal bersih:
```bash
docker exec ghtm_backend php artisan migrate:fresh --seed
```

---

## Panduan Lengkap Mengoperasikan Web GHTM

Alur kerja GHTM dirancang saling terhubung menyerupai operasional perhotelan sesungguhnya. Berikut adalah langkah demi langkah cara mengoperasikan sistem sesuai peran Anda:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Manager / Admin │ ───>  │ Staff Lapangan  │ ───>  │ Supervisor / SPV│
│  (Buat Tugas &  │       │  (Eksekusi &    │       │  (Review &      │
│   Checklist)    │       │   Upload Bukti) │       │   Keputusan)    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                   ▲                         │
                                   │     Minta Revisi        │
                                   └─────────────────────────┘
```

---

### Bagian 1: Panduan untuk Manager & Admin

Sebagai Manager atau Admin, fokus utama Anda adalah memastikan properti terdaftar dengan baik, tim staf tersedia di sistem, dan tugas harian tersampaikan dengan instruksi yang jelas.

#### 1. Login ke Aplikasi
1. Buka halaman utama [http://localhost:3001/login](http://localhost:3001/login).
2. Masukkan email `manager@puriyuanna.com` (atau `admin@puriyuanna.com`) dan kata sandi `dsa`.
3. Anda akan diarahkan ke halaman **Dashboard Overview**.

#### 2. Mengelola Properti (Menu "Manajemen Unit")
Sebelum membuat tugas, pastikan kamar atau area properti sudah terdaftar:
1. Klik menu **"Manajemen Unit"** pada bilah samping (*sidebar*).
2. Anda dapat melihat daftar unit properti (Guest House maupun Kost).
3. Untuk menambahkan unit baru, klik tombol **"Tambah Unit"**:
   - Masukkan **Nama Unit** (contoh: *Kamar 102 - Deluxe Double*).
   - Pilih **Tipe Unit**: *Guest House (GH)* atau *Kost*.
   - Masukkan **Alamat / Lokasi** (contoh: *Lantai 1 - Sayap Timur*).
4. Klik **Simpan Unit**. Data akan langsung tampil di tabel.

#### 3. Mengelola Akun Staf (Menu "Manajemen Staff")
1. Klik menu **"Manajemen Staff"** di sidebar.
2. Di halaman ini Anda dapat melihat daftar seluruh petugas beserta status aktifnya.
3. Untuk mendaftarkan staf baru, klik tombol **"Tambah Staff"**:
   - Isi **Nama Lengkap**, **Alamat Email**, dan **Kata Sandi**.
   - Pilih **Role**: *Staff*, *SPV*, atau *Manager*.
   - Hubungkan dengan unit penugasan utamanya.
4. Anda juga dapat menonaktifkan akun atau memperbarui informasi staf kapan saja.

#### 4. Membuat Tugas Baru (Menu "Manajemen Tugas")
Inilah fitur inti untuk mendelegasikan pekerjaan ke staf:
1. Buka menu **"Manajemen Tugas"**.
2. Klik tombol **"Buat Tugas Baru"** di sudut kanan atas. Jendela formulir akan terbuka:
   - **Judul Tugas:** Buat judul yang spesifik (contoh: *Pembersihan Menyeluruh Kamar 201 Pasca Check-Out*).
   - **Kategori:** Pilih kategori pekerjaan, misal: *Housekeeping*, *Maintenance*, *Front Desk*, atau *General*.
   - **Prioritas:** Tentukan urgensi tugas:
     - **Rendah (Low):** Pekerjaan berkala yang santai.
     - **Sedang (Medium):** Tugas standar harian.
     - **Tinggi (High):** Tugas mendesak (misal: persiapan kamar tamu VIP yang akan tiba).
   - **Batas Waktu (Deadline):** Pilih tanggal dan jam target selesai.
   - **Tugaskan Kepada (Staff):** Pilih nama staf yang bertanggung jawab.
   - **Instruksi / Deskripsi:** Tuliskan catatan pendukung (misal: *Ganti sprei dengan set linen baru dan semprot pengharum aroma melati*).
3. **Menyusun Item Checklist Dinamis:**
   - Di bagian bawah formulir, terdapat kolom untuk menyusun butir-butir checklist.
   - Tulis teks item (contoh: *Sapu dan pel lantai hingga bersih*).
   - Tentukan sifatnya:
     - **Wajib:** Harus dicentang oleh staf agar laporan bisa disubmit.
     - **Opsional:** Pekerjaan pendukung yang dapat dilewati jika tidak diperlukan.
   - Klik **"+ Tambah Item Checklist"** untuk menambahkan poin berikutnya (misal: *Bersihkan kaca jendela*, *Cek fungsi AC & remot*, *Ganti perlengkapan mandi*).
4. Klik **"Simpan & Tugaskan"**.
5. Sistem akan menyimpan tugas, mengubah statusnya menjadi **Menunggu Pengerjaan (Pending)**, dan **otomatis mengirimkan notifikasi** ke akun staf yang bersangkutan.

---

### Bagian 2: Panduan untuk Staf Lapangan (Housekeeping & Maintenance)

Sebagai staf lapangan, aplikasi ini menjadi asisten kerja Anda agar tidak ada instruksi yang terlewat dan seluruh hasil kerja tervalidasi dengan rapi.

#### 1. Membuka Tugas yang Ditugaskan
1. Masuk menggunakan akun staf (email: `staff@puriyuanna.com`, sandi: `password123`).
2. Masuk ke menu **"Tugas Saya"** di bilah navigasi.
3. Anda akan melihat kartu-kartu tugas yang dibagikan khusus untuk Anda, lengkap dengan tanda prioritas, batas waktu (*deadline*), dan status saat ini.
4. Klik tombol **"Kerjakan Tugas"** pada tugas yang ingin Anda mulai.

#### 2. Membaca Instruksi & Mengerjakan Checklist
1. Pada halaman detail tugas, Anda akan melihat instruksi kerja lengkap dari Manager serta **Bilah Kemajuan (Progress Bar)** yang menunjukkan persentase penyelesaian.
2. Kerjakan tugas fisik di kamar/area sesuai instruksi.
3. Setiap kali satu bagian selesai, centang kotak checkbox item terkait:
   - Status tugas akan otomatis berubah menjadi **Sedang Dikerjakan (In Progress)**.
   - Angka persentase pada progress bar akan langsung naik secara real-time.
4. **Menambahkan Catatan per Item (Opsional tapi Disarankan):**
   - Jika ada hal khusus di lapangan, ketik pada kolom catatan di samping checklist (misal: *Handuk tamu lama sedikit robek di sudut, sudah diganti baru*).
5. **Mengunggah Foto Bukti Penyelesaian:**
   - Di samping setiap item checklist, klik tombol **"Upload Foto"** / ikon kamera.
   - Pilih foto hasil pekerjaan Anda (misal: foto sprei yang sudah rapi atau kamar mandi yang sudah kinclong).
   - Foto akan otomatis diunggah ke server dan muncul sebagai thumbnail kecil yang dapat diklik untuk melihat pratinjau.

#### 3. Mengirimkan Laporan (*Submit Report*)
1. Setelah semua item yang bertipe **"Wajib"** tercentang hijau:
   - Tombol **"Kirim Laporan"** di bagian bawah halaman akan aktif dan berwarna cerah.
   - *(Catatan: Jika masih ada 1 saja item wajib yang belum selesai, tombol akan terkunci untuk mencegah laporan dikirim setengah jadi).*
2. Klik tombol **"Kirim Laporan"**.
3. Jendela pop-up konfirmasi akan muncul. Anda dapat menuliskan catatan penutup (misal: *Kamar 201 sudah selesai dibersihkan dan siap digunakan kembali*).
4. Klik **"Ya, Kirim Laporan Sekarang"**.
5. Status tugas akan berubah menjadi **Menunggu Approval (Waiting Approval)** dan formulir dikunci sementara. Pada saat yang sama, notifikasi langsung terkirim ke Supervisor/Manager.

---

### Bagian 3: Panduan untuk Supervisor (SPV) & Manager (Approval)

Supervisor bertugas menjaga standar kualitas properti. Setelah staf mengirimkan laporan, tugas SPV adalah memeriksa keabsahan pengerjaan sebelum menyatakan tugas selesai.

#### 1. Mengetahui Ada Laporan Masuk
- Saat staf mengirim laporan, lonceng notifikasi di pojok kanan atas akan menampilkan tanda merah menyala.
- Anda dapat mengklik lonceng notifikasi untuk membaca pesan *"Laporan Tugas Masuk"* dan langsung menuju ke laporan tersebut.
- Atau, Anda bisa langsung membuka menu **"Approval Laporan"** di bilah menu samping.

#### 2. Memeriksa Laporan (Review Detail)
1. Di halaman **Approval Laporan**, Anda akan melihat tab status:
   - **Menunggu Review:** Daftar laporan yang baru masuk dan butuh keputusan Anda.
   - **Disetujui:** Laporan yang sudah berhasil selesai.
   - **Perlu Revisi:** Laporan yang sedang dikembalikan ke staf untuk diperbaiki.
   - **Semua Laporan:** Arsip lengkap seluruh riwayat.
2. Klik tombol **"Review Laporan"** pada baris tugas yang ingin Anda nilai.
3. Modal review terperinci akan terbuka, menampilkan:
   - Nama staf pelapor, unit properti, dan waktu pengiriman.
   - Catatan pengantar dari staf.
   - Daftar seluruh butir checklist beserta status centangnya.
   - **Foto Bukti Lapangan:** Klik foto thumbnail untuk memperbesar ke ukuran layar penuh (*lightbox*) guna memastikan kebersihan secara jelas.
   - **Timeline Riwayat Approval (Approval Logs):** Menampilkan histori keputusan terdahulu jika tugas ini pernah mengalami revisi.

#### 3. Memberikan Keputusan
Di bagian bawah modal review, Anda memiliki dua pilihan keputusan:

##### Pilihan A: Menyetujui Laporan (Approve)
- Jika seluruh pengerjaan telah memenuhi standar mutu Puri Yuanna:
  1. Klik tombol hijau **"Approve Laporan"**.
  2. Sistem akan menandai laporan sebagai **Disetujui**, mengubah status tugas menjadi **Selesai (Done)**, dan mencatat nama Anda di log persetujuan.
  3. Staf pembuat laporan akan menerima notifikasi bahwa tugasnya telah disetujui.

##### Pilihan B: Meminta Perbaikan (Reject / Revisi)
- Jika ada poin yang terlewat, belum bersih, atau foto bukti tidak sesuai:
  1. Klik tombol merah **"Minta Revisi"**.
  2. Dialog catatan revisi akan muncul. **Kolom alasan wajib diisi** agar staf memahami letak kekurangannya (contoh: *Lantai bawah meja rias masih berdebu dan handuk belum diganti, mohon dibersihkan ulang dan foto kembali*).
  3. Klik **"Konfirmasi Penolakan"**.
  4. Status tugas akan berubah menjadi **Perlu Revisi (Rejected)** dan dikembalikan ke staf.

---

### Bagian 4: Alur Penanganan Revisi oleh Staf

Jika laporan ditolak oleh Supervisor, staf tidak perlu panik atau mengulang dari awal:
1. Staf akan menerima notifikasi dengan label merah: *"Laporan Perlu Revisi"*.
2. Saat staf membuka tugas tersebut:
   - Terdapat **Banner Peringatan Merah** di bagian atas yang menampilkan catatan alasan perbaikan langsung dari Supervisor.
   - Formulir checklist akan **terbuka kembali** sehingga dapat diedit.
3. Staf hanya perlu memperbaiki poin yang diminta (misal: membersihkan ulang sudut yang tertinggal dan mengunggah foto baru). Item lain yang sudah benar tidak perlu diulang.
4. Setelah selesai, klik tombol **"Kirim Ulang Laporan Revisi"**.
5. Laporan kembali masuk ke antrean Supervisor untuk diperiksa ulang.

---

### Bagian 5: Fitur Notifikasi Terintegrasi (In-App Bell)

Di sudut kanan atas halaman aplikasi (pada bilah *header*), terdapat ikon lonceng notifikasi pintar:
- **Indikator Merah:** Menandakan jumlah pemberitahuan penting yang belum Anda baca.
- **Auto-Refresh:** Notifikasi otomatis diperbarui di latar belakang tanpa perlu memuat ulang (*refresh*) halaman peramban.
- **Tandai Semua Dibaca:** Memudahkan Anda membersihkan badge angka notifikasi dalam sekali klik.
- **Direct Navigation:** Setiap kali Anda mengklik salah satu pesan notifikasi, sistem akan langsung mengarahkan Anda ke halaman tugas atau laporan terkait secara instan.

---

## Arti Status Tugas & Kode Warna

Untuk memudahkan pemantauan cepat, GHTM menggunakan kode warna visual yang konsisten:

| Status | Label di Aplikasi | Warna Badge | Keterangan |
|---|---|---|---|
| `pending` | Belum Dikerjakan | Kuning / Amber | Tugas baru dibuat dan belum disentuh oleh staf |
| `in_progress` | Sedang Dikerjakan | Toska / Biru | Staf telah mulai mencentang checklist di lapangan |
| `waiting_approval` | Menunggu Approval | Ungu / Indigo | Checklist wajib selesai dan staf telah mengirimkan laporan |
| `done` | Selesai & Disetujui | Hijau | Laporan telah diperiksa dan disetujui oleh SPV/Manager |
| `rejected` | Perlu Revisi | Merah | Laporan ditolak oleh SPV dan wajib diperbaiki oleh staf |

---

## Pertanyaan yang Sering Diajukan (FAQ)

**T: Kenapa tombol "Kirim Laporan" berwarna abu-abu dan tidak bisa diklik oleh staf?**  
*J:* Sistem memiliki validasi integritas. Tombol pengiriman laporan hanya akan aktif jika **semua item checklist bertipe "Wajib" sudah dicentang**. Periksa kembali apakah ada poin wajib yang masih belum tercentang.

**T: Di mana foto bukti pengerjaan disimpan?**  
*J:* Seluruh foto diunggah ke storage aman server backend (`storage/app/public/checklist_photos`) dan dapat dilihat secara cepat melalui URL publik storage yang telah tersambung secara otomatis.

**T: Bisakah Manager melakukan approval jika Supervisor sedang berhalangan?**  
*J:* Tentu saja. Baik akun bertipe `SPV`, `Manager`, maupun `Admin` memiliki hak akses penuh ke menu **Approval Laporan** untuk memeriksa dan menyetujui tugas yang masuk.

---

## Ringkasan Teknologi yang Digunakan

- **Frontend:** [Next.js](https://nextjs.org/) (React 19) + [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons + Zustand State Management.
- **Backend:** [Laravel](https://laravel.com/) (PHP 8.4) REST API + JWT Authentication (`tymon/jwt-auth`).
- **Database:** [PostgreSQL 15](https://www.postgresql.org/).
- **Containerization:** [Docker Compose](https://docs.docker.com/compose/).

---

*Dikembangkan dengan penuh dedikasi untuk efisiensi dan keunggulan mutu operasional **Puri Yuanna Living**.*
