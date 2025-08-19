const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

async function optimizeImages() {
  const files = fs.readdirSync(publicDir);
  
  for (const file of files) {
    if (file.match(/\.(png|jpg|jpeg|webp)$/i)) {
      const filePath = path.join(publicDir, file);
      const stats = fs.statSync(filePath);
      const originalSize = stats.size;
      
      console.log(`Compressing ${file}...`);
      
      try {
        const optimizedBuffer = await sharp(filePath)
          .png({ quality: 85, compressionLevel: 9 })
          .toBuffer();
        
        fs.writeFileSync(filePath, optimizedBuffer);
        
        const newStats = fs.statSync(filePath);
        const newSize = newStats.size;
        const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
        
        console.log(`✅ ${file}: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (-${savings}%)`);
      } catch (error) {
        console.error(`❌ Error compressing ${file}:`, error.message);
      }
    }
  }
}

optimizeImages().catch(console.error);

