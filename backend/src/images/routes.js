const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const prisma = require('../prisma');
const cron = require('node-cron');
const authMiddleware = require('../auth/middleware');

const router = express.Router();

// 명시적으로 IMAGE_DIR 설정 (Docker 볼륨 마운트 경로로)
const IMAGE_DIR = '/app/images';
fs.ensureDirSync(IMAGE_DIR);
console.log(`[DEBUG] Using image directory: ${IMAGE_DIR}`);
console.log(`[DEBUG] Directory exists: ${fs.existsSync(IMAGE_DIR)}`);
console.log(`[DEBUG] Process CWD: ${process.cwd()}`);


// Hourly cleanup of expired images (>48h)
cron.schedule('0 * * * *', async () => {
  const expireBefore = new Date(Date.now() - 48 * 3600000);
  const expired = await prisma.imageAsset.findMany({ where: { createdAt: { lt: expireBefore } } });
  for (const asset of expired) {
    const p = path.join(IMAGE_DIR, `${asset.assetId}.jpg`);
    await fs.remove(p).catch(() => {});
    await prisma.imageAsset.delete({ where: { assetId: asset.assetId } }).catch(() => {});
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Upload endpoint
router.post('/', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    // Validate image MIME type
    if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'Invalid file type' });
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const assetId = hash;
    const imagePath = path.join(IMAGE_DIR, `${assetId}.jpg`);
    let width, height;
    const existing = await prisma.imageAsset.findUnique({ where: { assetId } });
    if (existing && await fs.pathExists(imagePath)) {
      width = existing.width;
      height = existing.height;
    } else {
      const img = sharp(req.file.buffer);
      const meta = await img.metadata();
      const w = meta.width || 0, h = meta.height || 0;
      let newW = w, newH = h;
      const maxLong = 1024, maxShort = 768;
      if (w >= h) {
        if (w > maxLong) { newW = maxLong; newH = Math.round(h * (maxLong / w)); }
        if (newH > maxShort) { newH = maxShort; newW = Math.round(newW * (maxShort / newH)); }
      } else {
        if (h > maxLong) { newH = maxLong; newW = Math.round(w * (maxLong / h)); }
        if (newW > maxShort) { newW = maxShort; newH = Math.round(newH * (maxShort / newW)); }
      }
      const outBuffer = await img.resize(newW, newH).jpeg({ quality: 85 }).toBuffer();
      await fs.writeFile(imagePath, outBuffer);
      width = newW;
      height = newH;
    }
    await prisma.imageAsset.upsert({
      where: { assetId },
      update: { width, height, createdAt: new Date() },
      create: { assetId, width, height, user: { connect: { id: req.userId } } }
    });
    // URL 반환
    const serverHost = req.get('host');
    const protocol = req.protocol;
    const url = `${protocol}://${serverHost}/api/images/${assetId}`;
    console.log(`[DEBUG] Image upload success: ${assetId}`);
    console.log(`[DEBUG] Image URL: ${url}`);
    console.log(`[DEBUG] Host: ${serverHost}, Protocol: ${protocol}`);
    return res.status(201).json({
      assetId, 
      width, 
      height, 
      url,
      debug: { 
        serverHost, 
        protocol,
        imagePath: `${IMAGE_DIR}/${assetId}.jpg`,
        exists: fs.existsSync(`${IMAGE_DIR}/${assetId}.jpg`)
      }
    });
  } catch (err) {
    next(err);
  }
});

// Serve image or expired (public)
router.get('/:assetId', async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const record = await prisma.imageAsset.findUnique({ where: { assetId } });
    if (!record) return res.sendStatus(404);
    const age = Date.now() - new Date(record.createdAt).getTime();
    if (age > 48 * 3600000) {
      const imagePath = path.join(IMAGE_DIR, `${assetId}.jpg`);
      fs.remove(imagePath).catch(() => {});
      prisma.imageAsset.delete({ where: { assetId } }).catch(() => {});
      return res.status(410).send('Image expired');
    }
    const imagePath = path.join(IMAGE_DIR, `${assetId}.jpg`);
    if (!await fs.pathExists(imagePath)) return res.sendStatus(404);
    res.setHeader('Content-Type', 'image/jpeg');
    fs.createReadStream(imagePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
