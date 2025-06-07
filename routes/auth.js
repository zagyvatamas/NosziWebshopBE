const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');
require('dotenv').config();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, hashedPassword],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Hiba történt a regisztráció során.' });
      }

      const userId = result.insertId;

      db.query('SELECT id FROM roles WHERE name = ?', ['user'], (err2, roleResults) => {
        if (err2 || roleResults.length === 0) {
          console.error(err2 || 'Nincs ilyen szerepkör: user');
          return res.status(500).json({ error: 'Szerepkör hozzárendelés sikertelen.' });
        }

        const roleId = roleResults[0].id;

        db.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleId],
          (err3) => {
            if (err3) {
              console.error(err3);
              return res.status(500).json({ error: 'Szerepkör hozzárendelés sikertelen.' });
            }

            res.status(201).json({ message: 'Felhasználó létrehozva és szerepkör hozzárendelve.' });
          }
        );
      });
    }
  );
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = `
    SELECT u.*, r.name AS role 
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.email = ?
  `;

  db.query(query, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: 'Hibás email vagy jelszó.' });
    }

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Hibás email vagy jelszó.' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({ message: 'Sikeres bejelentkezés', token });
  });
});

router.get('/profile', verifyToken, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });
});

module.exports = router;
