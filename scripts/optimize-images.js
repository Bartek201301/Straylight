const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

/**
 * Image optimization script for StrayLight project
 * Generates WebP, AVIF formats and multiple sizes for responsive images
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.inputDir = options.inputDir || 'public';
    this.outputDir = options.outputDir || 'public/optimized';
    this.formats = options.formats || [
      { format: 'webp', quality: 85, suffix: 'webp' },
      { format: 'avif', quality: 80, suffix: 'avif' },
      { format: 'jpeg', quality: 85, suffix: 'jpg', progressive: true },
    ];
    this.sizes = options.sizes || [320, 640, 1024, 1920];
    this.skipOptimized = options.skipOptimized !== false;
    this.verbose = options.verbose || false;
    this.maxProcessingTime = options.maxProcessingTime || 60000; // 1 minute max
  }

  log(message, type = 'info') {
    if (!this.verbose && type !== 'error') return;

    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async getImageMetadata(imagePath) {
    try {
      return await sharp(imagePath).metadata();
    } catch (error) {
      this.log(
        `Failed to get metadata for ${imagePath}: ${error.message}`,
        'error'
      );
      return null;
    }
  }

  generateBlurPlaceholder(imagePath) {
    return sharp(imagePath)
      .resize(10, 10, { fit: 'inside' })
      .blur(1)
      .png({ quality: 20 })
      .toBuffer()
      .then((buffer) => `data:image/png;base64,${buffer.toString('base64')}`);
  }

  async optimizeImage(imagePath, outputDir) {
    const parsedPath = path.parse(imagePath);
    const relativeInputPath = path.relative(this.inputDir, imagePath);

    // Skip already optimized images
    if (this.skipOptimized && parsedPath.name.includes('-optimized')) {
      this.log(`Skipping already optimized: ${relativeInputPath}`);
      return { skipped: true };
    }

    this.log(`Processing: ${relativeInputPath}`);

    try {
      const metadata = await this.getImageMetadata(imagePath);
      if (!metadata) {
        return { error: 'Failed to read image metadata' };
      }

      const results = {
        original: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: (await fs.stat(imagePath)).size,
        },
        optimized: [],
        blurPlaceholder: null,
      };

      // Generate blur placeholder
      try {
        results.blurPlaceholder = await this.generateBlurPlaceholder(imagePath);
      } catch (error) {
        this.log(
          `Failed to generate blur placeholder for ${relativeInputPath}: ${error.message}`,
          'error'
        );
      }

      // Process each format and size combination
      for (const formatConfig of this.formats) {
        for (const targetWidth of this.sizes) {
          // Skip if target size is larger than original
          if (targetWidth > metadata.width) continue;

          const outputFileName = `${parsedPath.name}-${targetWidth}.${formatConfig.suffix}`;
          const outputPath = path.join(outputDir, outputFileName);

          try {
            let sharpInstance = sharp(imagePath).resize(targetWidth, null, {
              withoutEnlargement: true,
              fit: 'inside',
            });

            // Apply format-specific optimizations
            switch (formatConfig.format) {
              case 'webp':
                sharpInstance = sharpInstance.webp({
                  quality: formatConfig.quality,
                  effort: 6, // Max compression effort
                });
                break;
              case 'avif':
                sharpInstance = sharpInstance.avif({
                  quality: formatConfig.quality,
                  effort: 9, // Max compression effort
                });
                break;
              case 'jpeg':
                sharpInstance = sharpInstance.jpeg({
                  quality: formatConfig.quality,
                  progressive: formatConfig.progressive || false,
                  mozjpeg: true, // Use mozjpeg encoder
                });
                break;
              case 'png':
                sharpInstance = sharpInstance.png({
                  quality: formatConfig.quality,
                  progressive: formatConfig.progressive || false,
                  compressionLevel: 9,
                });
                break;
            }

            const info = await sharpInstance.toFile(outputPath);

            results.optimized.push({
              format: formatConfig.format,
              width: targetWidth,
              height: info.height,
              size: info.size,
              filename: outputFileName,
              compressionRatio: (
                ((results.original.size - info.size) / results.original.size) *
                100
              ).toFixed(1),
            });

            this.log(
              `Generated: ${outputFileName} (${info.size} bytes, ${(((results.original.size - info.size) / results.original.size) * 100).toFixed(1)}% smaller)`
            );
          } catch (error) {
            this.log(
              `Failed to optimize ${relativeInputPath} to ${formatConfig.format}@${targetWidth}px: ${error.message}`,
              'error'
            );
          }
        }
      }

      return results;
    } catch (error) {
      this.log(
        `Error processing ${relativeInputPath}: ${error.message}`,
        'error'
      );
      return { error: error.message };
    }
  }

  async findImages() {
    const patterns = [
      `${this.inputDir}/**/*.jpg`,
      `${this.inputDir}/**/*.jpeg`,
      `${this.inputDir}/**/*.png`,
    ];

    const imageFiles = [];
    for (const pattern of patterns) {
      const files = glob.sync(pattern, { ignore: `${this.outputDir}/**` });
      imageFiles.push(...files);
    }

    return [...new Set(imageFiles)]; // Remove duplicates
  }

  async generateImageMap(results) {
    const imageMap = {};

    for (const [imagePath, result] of Object.entries(results)) {
      if (result.error || result.skipped) continue;

      const baseName = path.parse(imagePath).name;
      imageMap[baseName] = {
        original: {
          src: '/' + path.relative('public', imagePath).replace(/\\/g, '/'),
          width: result.original.width,
          height: result.original.height,
          size: result.original.size,
        },
        optimized: result.optimized.map((opt) => ({
          src: '/optimized/' + opt.filename,
          format: opt.format,
          width: opt.width,
          height: opt.height,
          size: opt.size,
        })),
        blurPlaceholder: result.blurPlaceholder,
      };
    }

    const outputPath = path.join(this.outputDir, 'image-map.json');
    await fs.writeFile(outputPath, JSON.stringify(imageMap, null, 2));
    this.log(`Generated image map: ${outputPath}`, 'success');

    return imageMap;
  }

  async optimize() {
    this.log('Starting image optimization...', 'info');

    try {
      // Ensure output directory exists
      await this.ensureDirectoryExists(this.outputDir);

      // Find all images
      const imageFiles = await this.findImages();
      this.log(`Found ${imageFiles.length} images to process`);

      if (imageFiles.length === 0) {
        this.log('No images found to optimize', 'info');
        return;
      }

      // Process images
      const results = {};
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      let totalSavedBytes = 0;

      for (const imagePath of imageFiles) {
        const result = await this.optimizeImage(imagePath, this.outputDir);
        results[imagePath] = result;

        if (result.error) {
          errorCount++;
        } else if (result.skipped) {
          skippedCount++;
        } else {
          successCount++;
          // Calculate total bytes saved
          const savedBytes = result.optimized.reduce((total, opt) => {
            return total + (result.original.size - opt.size);
          }, 0);
          totalSavedBytes += savedBytes;
        }
      }

      // Generate image map for easy access
      await this.generateImageMap(results);

      // Print summary
      this.log('\n📊 Optimization Summary:', 'success');
      this.log(`✅ Successfully processed: ${successCount} images`);
      this.log(`⏭️ Skipped: ${skippedCount} images`);
      this.log(`❌ Errors: ${errorCount} images`);
      this.log(
        `💾 Total bytes saved: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`
      );
    } catch (error) {
      this.log(`Optimization failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    inputDir: 'public',
    outputDir: 'public/optimized',
  };

  const optimizer = new ImageOptimizer(options);
  optimizer
    .optimize()
    .then(() => {
      console.log('✅ Image optimization completed!');
    })
    .catch((error) => {
      console.error('❌ Image optimization failed:', error);
      process.exit(1);
    });
}

module.exports = ImageOptimizer;
