const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak didukung'), false);
        }
    }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Optimize image endpoint
app.post('/optimize', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diupload' });
        }

        const { quality, maxWidth, format } = req.body;
        const originalSize = req.file.size;

        // Create sharp instance
        let image = sharp(req.file.buffer, { limitInputPixels: false });

        // Get metadata
        const metadata = await image.metadata();

        // Resize if needed
        if (maxWidth && metadata.width > parseInt(maxWidth)) {
            image = image.resize(parseInt(maxWidth), null, {
                withoutEnlargement: true,
                fit: 'inside'
            });
        }

        // Apply format-specific optimization
        let outputBuffer;
        switch (format) {
            case 'jpeg':
                outputBuffer = await image
                    .jpeg({
                        quality: parseInt(quality),
                        progressive: true,
                        mozjpeg: true
                    })
                    .toBuffer();
                break;

            case 'png':
                outputBuffer = await image
                    .png({
                        quality: parseInt(quality),
                        compressionLevel: 9,
                        progressive: true
                    })
                    .toBuffer();
                break;

            case 'webp':
                outputBuffer = await image
                    .webp({
                        quality: parseInt(quality),
                        effort: 6
                    })
                    .toBuffer();
                break;

            default:
                outputBuffer = await image
                    .jpeg({
                        quality: parseInt(quality),
                        progressive: true
                    })
                    .toBuffer();
        }

        const optimizedSize = outputBuffer.length;
        const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

        // Format file sizes
        const formatSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return (bytes / 1024 / 1024).toFixed(2) + ' MB';
        };

        // Set custom headers with stats
        res.set({
            'Content-Type': `image/${format}`,
            'X-Image-Stats': JSON.stringify({
                originalSize: formatSize(originalSize),
                optimizedSize: formatSize(optimizedSize),
                reduction: reduction
            })
        });

        res.send(outputBuffer);

    } catch (error) {
        console.error('Error optimizing image:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengoptimasi gambar' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Image Optimizer Server is running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`\n✨ Buka browser dan akses URL di atas untuk mulai mengoptimasi gambar\n`);
});
