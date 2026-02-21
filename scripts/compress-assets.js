/**
 * Asset compression script for production builds
 * Compresses CSS, JS, HTML files using gzip and brotli
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const glob = require('glob');

const gzip = promisify(zlib.gzip);
const brotliCompress = promisify(zlib.brotliCompress);

// Configuration
const CONFIG = {
  // Source directories to compress
  inputDirs: ['.next/static', '.next/server', 'public'],
  // File patterns to compress
  patterns: [
    '**/*.js',
    '**/*.css',
    '**/*.html',
    '**/*.json',
    '**/*.svg',
    '**/*.txt',
  ],
  // Minimum file size to compress (bytes)
  minSize: 1024,
  // Compression options
  gzipOptions: {
    level: 9, // Maximum compression
    windowBits: 15,
    memLevel: 8,
  },
  brotliOptions: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Maximum quality
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
  },
};

class AssetCompressor {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.stats = {
      processed: 0,
      compressed: 0,
      originalSize: 0,
      compressedSize: 0,
      skipped: 0,
    };
  }

  /**
   * Main compression function
   */
  async compress() {
    console.log('🗜️  Starting asset compression...');

    try {
      const files = await this.findFiles();
      console.log(`Found ${files.length} files to process`);

      for (const file of files) {
        await this.compressFile(file);
      }

      this.printStats();
    } catch (error) {
      console.error('❌ Compression failed:', error);
      process.exit(1);
    }
  }

  /**
   * Find all files matching compression patterns
   */
  async findFiles() {
    const allFiles = [];

    for (const dir of this.config.inputDirs) {
      if (!fs.existsSync(dir)) {
        console.warn(`⚠️  Directory ${dir} not found, skipping...`);
        continue;
      }

      for (const pattern of this.config.patterns) {
        const files = glob.sync(path.join(dir, pattern), {
          nodir: true,
          ignore: ['**/*.gz', '**/*.br', '**/*.map', '**/node_modules/**'],
        });

        allFiles.push(...files);
      }
    }

    // Remove duplicates and sort
    return [...new Set(allFiles)].sort();
  }

  /**
   * Compress individual file with both gzip and brotli
   */
  async compressFile(filePath) {
    try {
      const stats = fs.statSync(filePath);

      // Skip small files
      if (stats.size < this.config.minSize) {
        this.stats.skipped++;
        return;
      }

      const content = fs.readFileSync(filePath);
      this.stats.originalSize += stats.size;
      this.stats.processed++;

      // Gzip compression
      const gzipPath = `${filePath}.gz`;
      if (
        !fs.existsSync(gzipPath) ||
        this.shouldRecompress(filePath, gzipPath)
      ) {
        const gzipContent = await gzip(content, this.config.gzipOptions);
        fs.writeFileSync(gzipPath, gzipContent);

        console.log(
          `📦 Gzipped: ${path.relative(process.cwd(), filePath)} (${this.formatSize(stats.size)} → ${this.formatSize(gzipContent.length)})`
        );
      }

      // Brotli compression
      const brotliPath = `${filePath}.br`;
      if (
        !fs.existsSync(brotliPath) ||
        this.shouldRecompress(filePath, brotliPath)
      ) {
        const brotliContent = await brotliCompress(
          content,
          this.config.brotliOptions
        );
        fs.writeFileSync(brotliPath, brotliContent);

        console.log(
          `📦 Brotli: ${path.relative(process.cwd(), filePath)} (${this.formatSize(stats.size)} → ${this.formatSize(brotliContent.length)})`
        );

        this.stats.compressedSize += Math.min(
          fs.statSync(gzipPath).size,
          brotliContent.length
        );
      }

      this.stats.compressed++;
    } catch (error) {
      console.error(`❌ Failed to compress ${filePath}:`, error.message);
    }
  }

  /**
   * Check if file should be recompressed
   */
  shouldRecompress(originalPath, compressedPath) {
    if (!fs.existsSync(compressedPath)) return true;

    const originalStats = fs.statSync(originalPath);
    const compressedStats = fs.statSync(compressedPath);

    return originalStats.mtime > compressedStats.mtime;
  }

  /**
   * Format file size for display
   */
  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Print compression statistics
   */
  printStats() {
    const savings = this.stats.originalSize - this.stats.compressedSize;
    const percentage =
      this.stats.originalSize > 0
        ? ((savings / this.stats.originalSize) * 100).toFixed(1)
        : 0;

    console.log('\n📊 Compression Summary:');
    console.log(`Files processed: ${this.stats.processed}`);
    console.log(`Files compressed: ${this.stats.compressed}`);
    console.log(`Files skipped: ${this.stats.skipped}`);
    console.log(`Original size: ${this.formatSize(this.stats.originalSize)}`);
    console.log(
      `Compressed size: ${this.formatSize(this.stats.compressedSize)}`
    );
    console.log(`Space saved: ${this.formatSize(savings)} (${percentage}%)`);
    console.log('✅ Asset compression complete!');
  }
}

// CLI handling
if (require.main === module) {
  const compressor = new AssetCompressor();
  compressor.compress().catch(console.error);
}

module.exports = AssetCompressor;
