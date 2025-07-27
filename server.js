require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const User = require('./models/User');
const Vendor = require('./models/Vendor');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const MONGO_URI = process.env.MONGO_URI;

// MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once('open', () => console.log('✅ MongoDB connected'));

// Serve static files from ../public (excluding index.html override)
app.use(express.static(path.join(__dirname, '../public'), { index: false }));

// Root route → land.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'land.html'));
});

// SIGNUP route
app.post('/api/signup', async (req, res) => {
  const { fullName, email, password, userType } = req.body;

  try {
    const existingUser = userType === 'vendor'
      ? await Vendor.findOne({ email })
      : await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    if (userType === 'vendor') {
      const { stallName, foodType, foodItem, city, location, phone } = req.body;
      const vendor = new Vendor({
        fullName, email, password: hashed, userType,
        stallName, foodType, foodItem, city, location, phone
      });
      await vendor.save();
      return res.json({ message: 'Vendor registered successfully', redirect: '/vendordash.html' });
    } else {
      const user = new User({ fullName, email, password: hashed, userType });
      await user.save();
      return res.json({ message: 'User registered successfully', redirect: '/index.html' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    let userType = 'user';

    if (!user) {
      user = await Vendor.findOne({ email });
      userType = 'vendor';
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });

    const redirectTo = userType === 'vendor' ? '/vendordash.html' : '/index.html';

    const token = jwt.sign(
      { email: user.email, userType, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, userType, fullName: user.fullName, redirect: redirectTo });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'land.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('404: Page Not Found');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
