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
  const { title, description } = req.body;
  const imagePath = req.file ? req.file.path : null;

  if (!title || !description || !imagePath) {
    return res.status(400).json({ error: 'Hiányzó mezők!' });
  }

  const query = 'INSERT INTO webshop_data (title, description, image_path) VALUES (?, ?, ?)';
  db.execute(query, [title, description, imagePath], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB hiba', details: err });
    res.json({ message: 'Sikeres feltöltés!', id: results.insertId });
  });
});

router.get('/content', (req, res) => {
  const query = 'SELECT id, title, description, image_path FROM webshop_data';
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
