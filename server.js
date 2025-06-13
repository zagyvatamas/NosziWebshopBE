const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content')
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:4200', 
  credentials: true 
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);

app.listen(3000, () => {
  console.log('Szerver fut a 3000-es porton');
});

