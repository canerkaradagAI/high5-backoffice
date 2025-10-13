const fs = require('fs');
const path = require('path');

// Basit HTML görselleri oluştur (tarayıcıda görüntülenebilir)
const createShoeImage = (color, name, description) => {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${name}</title>
    <style>
        body { margin: 0; padding: 0; background: ${color}; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: Arial, sans-serif; }
        .shoe-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); text-align: center; }
        .shoe-name { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .shoe-brand { font-size: 18px; color: #666; margin-bottom: 5px; }
        .shoe-desc { font-size: 14px; color: #888; }
    </style>
</head>
<body>
    <div class="shoe-container">
        <div class="shoe-name">${name}</div>
        <div class="shoe-brand">SKECHERS</div>
        <div class="shoe-desc">${description}</div>
    </div>
</body>
</html>`;
};

// Görselleri oluştur
const shoes = [
  { color: '#8B4513', name: 'BROWN SLIP-ON', description: 'Kahverengi slip-on ayakkabı', filename: 'shoe1-brown-slip-on.html' },
  { color: '#2F2F2F', name: 'BLACK TRAIL', description: 'Siyah trail ayakkabısı', filename: 'shoe2-black-trail.html' },
  { color: '#4169E1', name: 'BLUE ALL-TERRAIN', description: 'Mavi all-terrain ayakkabı', filename: 'shoe3-blue-all-terrain.html' },
  { color: '#808080', name: 'GRAY SLIP-INS', description: 'Gri slip-ins ayakkabı', filename: 'shoe4-gray-slip-ins.html' },
  { color: '#696969', name: 'DARK GRAY ATHLETIC', description: 'Koyu gri atletik ayakkabı', filename: 'shoe5-dark-gray-athletic.html' }
];

const shoesDir = path.join(__dirname, '..', 'public', 'shoes');

shoes.forEach(shoe => {
  const htmlContent = createShoeImage(shoe.color, shoe.name, shoe.desc);
  const filePath = path.join(shoesDir, shoe.filename);
  
  fs.writeFileSync(filePath, htmlContent);
  console.log(`✅ ${shoe.filename} oluşturuldu`);
});

console.log('🎉 Tüm ayakkabı görselleri oluşturuldu!');
