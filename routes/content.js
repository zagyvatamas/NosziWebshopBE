const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post('/contentAdd', upload.single('image'), (req, res) => {
  const { title, description, price, user_id } = req.body;
  const imagePath = req.file ? req.file.path : null;

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
      image_url: `${req.protocol}://${req.get('host')}/${item.image_path}`
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
