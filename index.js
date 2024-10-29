const express = require('express');
const mysql = require('mysql2/promise'); // Use promise-based mysql2
require('dotenv').config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Establish database connection using promise-based MySQL
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log('Connected to the database');
  } catch (err) {
    console.error('Error connecting to the database:', err.message);
    process.exit(1);
  }
})();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'view')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'login.html'));
  console.log("GET request to /");
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  try {
    const [rows] = await db.query(
      'SELECT password FROM beneficiary WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      console.log('No user found with that email');
      return res.status(404).send('Invalid email or password.');
    }
    const storedPassword = rows[0].password;
    if (storedPassword !== password) {
      console.log('Incorrect password');
      return res.status(401).send('Invalid email or password.');
    }

    res.send('Logged in successfully!');
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal server error');
  }
});


app.get('/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'register.html'));
});


app.post('/register', async (req, res) => {
  const {
    email, password, fname, mname, lname, ration_no, city, 
    street, state, pincode, dob, gender, member_count
  } = req.body;

  if (!fname || !mname || !lname || !email || !password || !ration_no ||
      !city || !street || !state || !pincode || !dob || !gender || !member_count) {
    return res.status(400).send("Please fill all values properly.");
  }

  try {
    const query =`
      INSERT INTO beneficiary
      (email, password, fname, mname, lname, ration_no, city, street, state, pincode, dob, gender, member_count) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(query, [email, password, fname, mname, lname, ration_no, city, street, state, pincode, dob, gender, member_count]);
    res.send('User registered successfully!');
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).send('Database error');
  }
});
app.get('/forgot', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'forgot.html'));
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
