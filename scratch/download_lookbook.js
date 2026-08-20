const fs = require('fs');
const path = require('path');
const https = require('https');

const lookbookDir = path.join(__dirname, '../../public/lookbook');
if (!fs.existsSync(lookbookDir)) {
  fs.mkdirSync(lookbookDir, { recursive: true });
}

// 25 genuine Unsplash haircut, barber, kids and men hairstyle photos
const lookbookItems = [
  { id: 'look_01', name: 'Fade Texturizado Urbano', category: 'corte', url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_02', name: 'Pompadour Clásico Barba', category: 'corte', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_03', name: 'Degradado Limpio Ejecutivo', category: 'corte', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_04', name: 'Crop Moderno con Flequillo', category: 'corte', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_05', name: 'Rizos Definidos con Fade', category: 'corte', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_06', name: 'Estilo Urbano Juvenil', category: 'corte', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_07', name: 'Taper Fade con Textura', category: 'corte', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_08', name: 'Fade Alto y Barba Esculpida', category: 'barba', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_09', name: 'Corte Infantil Deportivo', category: 'ninos', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_10', name: 'Corte Escolar Juvenil', category: 'ninos', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_11', name: 'Barba Vikinga y Rapado', category: 'barba', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_12', name: 'Textura Mate Ondas', category: 'corte', url: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_13', name: 'Skin Fade Pulido con Raya', category: 'corte', url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_14', name: 'Peinado Ejecutivo Lateral', category: 'corte', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_15', name: 'Barba Completa & Fade', category: 'barba', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_16', name: 'Fade Infantil con Ondas', category: 'ninos', url: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_17', name: 'Afro Taper con Esponja', category: 'corte', url: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_18', name: 'Fade Moderno Deportivo', category: 'corte', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_19', name: 'Diseño en Silla de Barbería', category: 'disenos', url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80' },
  { id: 'look_20', name: 'Perfilado de Navaja y Barba', category: 'barba', url: 'https://images.unsplash.com/photo-1593702295094-aea22597af65?w=600&auto=format&fit=crop&q=80' }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // handle redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log(`Downloading ${lookbookItems.length} lookbook images...`);
  let count = 0;
  for (const item of lookbookItems) {
    const dest = path.join(lookbookDir, `${item.id}.jpg`);
    try {
      await downloadFile(item.url, dest);
      console.log(`✓ Downloaded ${item.id}.jpg: ${item.name}`);
      count++;
    } catch (e) {
      console.warn(`✗ Skipped ${item.id}:`, e.message);
    }
  }
  console.log(`Finished! Downloaded ${count} images to public/lookbook/`);
}

run();
