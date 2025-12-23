<div align="center">
  <img src="public/icon.png" alt="Image Optimizer Logo" width="200"/>

# Image Optimizer

Aplikasi sederhana untuk mengoptimasi gambar dengan UI modern dan CLI support.

</div>

## Fitur

- 🎨 UI yang sederhana dan modern
- 📁 Drag & drop untuk upload gambar
- ⚙️ Pengaturan kualitas dan ukuran yang fleksibel
- 📊 Statistik optimasi real-time
- 💾 Dukungan format JPEG, PNG, dan WebP
- 🖥️ Mode CLI untuk batch processing
- 📦 Backup otomatis gambar original

## Struktur Project

```
image-optimizer/
├── index.html      # UI web
├── style.css       # Stylesheet
├── app.js          # JavaScript client-side
├── server.js       # Express server
├── script.js       # CLI optimizer
├── package.json    # Dependencies
├── input/          # Folder untuk gambar input (CLI)
├── output/         # Folder hasil optimasi (CLI)
└── backup/         # Folder backup original (CLI)
```

## Dependencies

- **express** - Web server
- **multer** - File upload handler
- **sharp** - Image processing library

## Tips Penggunaan

- Untuk web/gambar responsif: gunakan format **WebP** dengan kualitas 80-85%
- Untuk print/kualitas tinggi: gunakan **PNG** dengan kualitas 90-95%
- Untuk website umum: gunakan **JPEG** dengan kualitas 80-85%
- Lebar maksimal 1200-1920px sudah cukup untuk kebanyakan website
