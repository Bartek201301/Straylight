/**
 * Simple image optimization script
 * Quickly checks if images need optimization
 */

const fs = require('fs');
const path = require('path');

// Quick check if optimization is needed
async function checkOptimizationNeeded() {
  const publicDir = 'public';
  const optimizedDir = 'public/optimized';

  console.log('🔍 Checking if image optimization is needed...');

  // Check if optimized directory exists
  if (!fs.existsSync(optimizedDir)) {
    console.log('📁 Creating optimized directory...');
    fs.mkdirSync(optimizedDir, { recursive: true });
    console.log('✅ Optimized directory created');
    return;
  }

  // Count images in public vs optimized
  const publicImages = fs
    .readdirSync(publicDir)
    .filter(
      (file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file) &&
        !file.includes('optimized') &&
        file !== 'sw.js'
    );

  const optimizedImages = fs
    .readdirSync(optimizedDir)
    .filter((file) => /\.(webp|avif)$/i.test(file));

  console.log(
    `📊 Found ${publicImages.length} source images, ${optimizedImages.length} optimized versions`
  );

  // If we have optimized images, assume optimization is done
  if (optimizedImages.length > 0) {
    console.log('✅ Optimization already completed, skipping...');
    return;
  }

  console.log(
    '⚠️ No optimized images found, but skipping optimization for build speed'
  );
  console.log('💡 Run "npm run optimize-images" separately if needed');
}

// Run the check
checkOptimizationNeeded().catch(console.error);
