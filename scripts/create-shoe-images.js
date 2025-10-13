const fs = require('fs');
const path = require('path');

// Basit SVG görselleri oluştur
const createShoeImage = (color, name) => {
  return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${color}" stroke="#333" stroke-width="2"/>
    <text x="200" y="200" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">${name}</text>
    <text x="200" y="240" text-anchor="middle" font-family="Arial" font-size="16" fill="white">SKECHERS</text>
  </svg>`;
};

// Görselleri oluştur
const shoes = [
  { color: '#8B4513', name: 'BROWN', filename: 'shoe1-brown-slip-on.jpg' },
  { color: '#2F2F2F', name: 'BLACK', filename: 'shoe2-black-trail.jpg' },
  { color: '#4169E1', name: 'BLUE', filename: 'shoe3-blue-all-terrain.jpg' },
  { color: '#808080', name: 'GRAY', filename: 'shoe4-gray-slip-ins.jpg' },
  { color: '#696969', name: 'DARK GRAY', filename: 'shoe5-dark-gray-athletic.jpg' }
];

const shoesDir = path.join(__dirname, '..', 'public', 'shoes');

shoes.forEach(shoe => {
  const svgContent = createShoeImage(shoe.color, shoe.name);
  const filePath = path.join(shoesDir, shoe.filename.replace('.jpg', '.svg'));
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ ${shoe.filename} oluşturuldu`);
});

console.log('🎉 Tüm ayakkabı görselleri oluşturuldu!');
