const multiparty = require('multiparty');
const sharp = require('sharp');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Parse error:', err);
        return res.status(400).json({ error: 'Failed to parse form data' });
      }

      if (!files.image || !files.image[0]) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const imageFile = files.image[0];
      const quality = parseInt(fields.quality[0]) || 85;
      const maxWidth = parseInt(fields.maxWidth[0]) || 1200;
      const format = fields.format[0] || 'jpeg';

      try {
        const originalSize = imageFile.size;

        // Create sharp instance
        let image = sharp(imageFile.path, { limitInputPixels: false });

        // Get metadata
        const metadata = await image.metadata();

        // Resize if needed
        if (maxWidth && metadata.width > maxWidth) {
          image = image.resize(maxWidth, null, {
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
                quality: quality,
                progressive: true,
                mozjpeg: true
              })
              .toBuffer();
            break;

          case 'png':
            outputBuffer = await image
              .png({
                quality: quality,
                compressionLevel: 9,
                progressive: true
              })
              .toBuffer();
            break;

          case 'webp':
            outputBuffer = await image
              .webp({
                quality: quality,
                effort: 6
              })
              .toBuffer();
            break;

          default:
            outputBuffer = await image
              .jpeg({
                quality: quality,
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

        // Set headers
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('X-Image-Stats', JSON.stringify({
          originalSize: formatSize(originalSize),
          optimizedSize: formatSize(optimizedSize),
          reduction: reduction
        }));

        res.send(outputBuffer);

      } catch (error) {
        console.error('Optimization error:', error);
        res.status(500).json({ error: 'Failed to optimize image' });
      }
    });

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
