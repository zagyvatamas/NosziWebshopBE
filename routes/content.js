const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const sharp = require('sharp');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    cb(null, true);
  } else {
    cb(new Error('Csak JPG és PNG fájlok engedélyezettek!'), false);
  }
};
const upload = multer({ storage, fileFilter });

router.post('/contentAdd', upload.any(), (req, res) => {
  const { title, description, price, user_id } = req.body;

  const imagePath = req.files && req.files.length > 0 ? 'uploads/' + req.files[0].filename : null;

  if (!title || !description || !imagePath || !price || !user_id) {
    return res.status(400).json({ error: 'Hiányzó mezők!' });
  }

  const numericPrice = parseInt(price);
  const numericUserId = parseInt(user_id);

  if (isNaN(numericPrice) || isNaN(numericUserId)) {
    return res.status(400).json({ error: 'Érvénytelen számformátum a price vagy user_id mezőnél!' });
  }

  const query = `
    INSERT INTO webshop_data (title, description, price, user_id, image_path)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.execute(query, [title, description, numericPrice, numericUserId, imagePath], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB hiba', details: err });
    res.json({ message: 'Sikeres feltöltés!', id: results.insertId });
  });
});


router.get('/contentAll', (req, res) => {
  const query = 'SELECT id, title, description, image_path, price, user_id FROM webshop_data';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB lekérdezési hiba', details: err });


    const formattedResults = results.map(item => ({
      ...item,
      image_url: `${req.protocol}://${req.get('host')}/${item.image_path.replace(/\\/g, '/')}`
    }));

    res.json(formattedResults);
  });
});

router.get('/content/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT id, title, description, image_path FROM webshop_data WHERE id = ?';
  db.execute(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB hiba', details: err });

    if (results.length === 0) {
      return res.status(404).json({ error: 'Termék nem található' });
    }

    const item = results[0];
    item.image_url = `${req.protocol}://${req.get('host')}/${item.image_path}`;

    res.json(item);
  });
});

module.exports = router;
