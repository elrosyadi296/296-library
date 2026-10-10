# 296 Library — Sistem Informasi Perpustakaan Online

**296 Library** adalah aplikasi perpustakaan online profesional, modern, responsif, aman, dan siap pakai untuk operasional perpustakaan nyata. Arsitektur aplikasi ini dirancang tanpa memerlukan server berbayar yang rumit—menggunakan **Frontend pada GitHub Pages**, **Backend Google Apps Script Web App**, dan **Database Google Spreadsheet**.

## Fitur Utama
- **Role-Based Access Control (RBAC):** Superadmin, Admin Perpustakaan, Petugas, Anggota, dan Pengunjung (Publik).
- **Manajemen Katalog & Eksemplar:** Pemisahan data bibliografi dan eksemplar unik berkode inventaris/barcode.
- **Sirkulasi Lengkap:** Alur peminjaman, pengembalian, perpanjangan, denda, dan pembayaran denda.
- **Reservasi & Antrean:** Pengelolaan antrean buku secara otomatis.
- **Katalog Publik & Digital:** Pencarian cepat, filter lengkap, serta koleksi dokumen digital.
- **Keamanan Ketat:** Hashing password aman, token sesi dengan masa berlaku, validasi server-side, `LockService` untuk mencegah race condition, serta audit log.

## Struktur Direktori Proyek
```text
296-library/
├── index.html
├── login.html
├── catalog.html
├── book-detail.html
├── member-portal.html
├── dashboard.html
├── README.md
├── PETUNJUK.txt
├── .gitignore
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   ├── dashboard.css
│   │   └── responsive.css
│   └── js/
│       ├── config.example.js
│       ├── api.js
│       ├── auth.js
│       ├── ui.js
│       ├── catalog.js
│       ├── books.js
│       ├── members.js
│       ├── circulation.js
│       ├── reports.js
│       └── app.js
└── backend/
    ├── Code.gs
    ├── Config.gs
    ├── Database.gs
    ├── Auth.gs
    ├── Books.gs
    ├── Members.gs
    ├── Circulation.gs
    ├── Fines.gs
    ├── Reservations.gs
    ├── Reports.gs
    ├── Validation.gs
    ├── Audit.gs
    ├── Utilities.gs
    └── appsscript.json
```

## Teknologi
- **Frontend:** HTML5, CSS3, JavaScript ES6+ (Vanilla JS murni dengan arsitektur modular).
- **Backend:** Google Apps Script (JavaScript V8).
- **Database:** Google Sheets.