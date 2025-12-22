const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Configuration
const config = {
  inputDir: path.join(__dirname, "input"),
  outputDir: path.join(__dirname, "output"),
  backupDir: path.join(__dirname, "backup"),
  quality: 85,
  maxWidth: 1200,
  format: "jpeg", // jpeg, png, or webp
  progressive: true,
  preserveOriginal: true
};

// Create directories if they don't exist
function ensureDirectories() {
  [config.inputDir, config.outputDir, config.backupDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Format file size for display
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

// Optimize single image
async function optimizeImage(inputPath, outputPath, backupPath) {
  try {
    const originalSize = fs.statSync(inputPath).size;
    const fileName = path.basename(inputPath);

    console.log(`\n📸 Processing: ${fileName}`);

    // Backup original if enabled
    if (config.preserveOriginal) {
      fs.copyFileSync(inputPath, backupPath);
      console.log("  ✓ Backup created");
    }

    // Create sharp instance with optimization
    let image = sharp(inputPath, { limitInputPixels: false });

    // Get metadata
    const metadata = await image.metadata();
    console.log(`  ℹ Original dimensions: ${metadata.width}x${metadata.height}`);

    // Resize if needed
    if (metadata.width > config.maxWidth) {
      image = image.resize(config.maxWidth, null, {
        withoutEnlargement: true,
        fit: "inside"
      });
      console.log(`  ✓ Resized to max width: ${config.maxWidth}px`);
    }

    // Apply format-specific optimization
    switch (config.format) {
      case "jpeg":
        await image
          .jpeg({
            quality: config.quality,
            progressive: config.progressive,
            mozjpeg: true
          })
          .toFile(outputPath);
        break;

      case "png":
        await image
          .png({
            quality: config.quality,
            compressionLevel: 9,
            progressive: config.progressive
          })
          .toFile(outputPath);
        break;

      case "webp":
        await image
          .webp({
            quality: config.quality,
            effort: 6
          })
          .toFile(outputPath);
        break;

      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    // Calculate statistics
    const optimizedSize = fs.statSync(outputPath).size;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

    console.log(`  ✓ Optimization complete!`);
    console.log(`    Original size:   ${formatSize(originalSize)}`);
    console.log(`    Optimized size:  ${formatSize(optimizedSize)}`);
    console.log(`    Size reduction:  ${reduction}%`);

    return {
      success: true,
      fileName,
      originalSize,
      optimizedSize,
      reduction
    };

  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return {
      success: false,
      fileName: path.basename(inputPath),
      error: error.message
    };
  }
}

// Process all images in input directory
async function optimizeAllImages() {
  console.log("🖼️  Image Optimizer CLI");
  console.log("=" .repeat(50));

  ensureDirectories();

  // Get all image files from input directory
  const files = fs.readdirSync(config.inputDir)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

  if (files.length === 0) {
    console.log(`\n⚠️  No images found in ${config.inputDir}`);
    console.log(`   Please add images to optimize.\n`);
    return;
  }

  console.log(`\n📁 Found ${files.length} image(s) to process`);
  console.log(`⚙️  Settings:`);
  console.log(`   Quality: ${config.quality}%`);
  console.log(`   Max width: ${config.maxWidth}px`);
  console.log(`   Format: ${config.format}`);

  const results = [];

  // Process each image
  for (const file of files) {
    const inputPath = path.join(config.inputDir, file);
    const baseName = path.parse(file).name;
    const outputFile = `${baseName}-optimized.${config.format}`;
    const outputPath = path.join(config.outputDir, outputFile);
    const backupPath = path.join(config.backupDir, `${baseName}-original${path.extname(file)}`);

    const result = await optimizeImage(inputPath, outputPath, backupPath);
    results.push(result);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary");
  console.log("=".repeat(50));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✓ Successful: ${successful}`);
  if (failed > 0) {
    console.log(`✗ Failed: ${failed}`);
  }

  if (successful > 0) {
    const totalOriginal = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimized = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.optimizedSize, 0);
    const totalReduction = ((1 - totalOptimized / totalOriginal) * 100).toFixed(2);

    console.log(`\nTotal original size:   ${formatSize(totalOriginal)}`);
    console.log(`Total optimized size:  ${formatSize(totalOptimized)}`);
    console.log(`Total reduction:       ${totalReduction}%`);
    console.log(`\n✨ Optimized images saved to: ${config.outputDir}`);

    if (config.preserveOriginal) {
      console.log(`📦 Original backups saved to: ${config.backupDir}`);
    }
  }

  console.log("");
}

// Run optimizer
optimizeAllImages().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
