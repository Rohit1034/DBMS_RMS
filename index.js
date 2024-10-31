const express = require('express');
const mysql = require('mysql2/promise'); // Use promise-based mysql2
require('dotenv').config();
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3001;
let ben_idlogin = 0;

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

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log(`Request for: ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/fps', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'fps.html'));
});

app.get('/new_fps', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'fps_register.html'));
});

app.get('/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'dashboard.html'));
});

// Login POST route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  try {
    const [rows] = await db.query(
      'SELECT ben_id, password FROM beneficiary WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      console.log('No user found with that email');
      return res.status(404).send('Invalid email or password.');
    }

    const { ben_id, password: storedPassword } = rows[0];
    if (storedPassword !== password) {
      console.log('Incorrect password');
      return res.status(401).send('Invalid email or password.');
    }

    // Set the ben_idlogin variable
    ben_idlogin = ben_id;
    console.log(`Logged in with ben_id: ${ben_idlogin}`);

    res.redirect("/dashboard");
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal server error');
  }
});

// FPS login POST route
app.post('/fps-login', async (req, res) => {
  const { fps_id, password } = req.body;
  if (!fps_id || !password) {
    return res.status(400).send("Email and password are required.");
  }

  try {
    const [rows] = await db.query(
      'SELECT password FROM fps WHERE fps_id = ?',
      [fps_id]
    );

    if (rows.length === 0) {
      console.log('No user found with that fps_id');
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

// Registration POST route for beneficiary
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
    const query = `INSERT INTO beneficiary (email, password, fname, mname, lname, ration_no, city, street, state, pincode, dob, gender, member_count) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.query(query, [email, password, fname, mname, lname, ration_no, city, street, state, pincode, dob, gender, member_count]);

    res.redirect('/');
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).send('Database error');
  }
});

// Registration POST route for FPS
app.post('/register_fps', async (req, res) => {
  const {
    fname, mname, lname, password, contact, city,
    street, state, pincode, shop_name
  } = req.body;

  if (!fname || !mname || !lname || !contact || !password || !shop_name ||
      !city || !street || !state || !pincode) {
    return res.status(400).send("Please fill all values properly.");
  }

  try {
    const query = `INSERT INTO fps (fname, mname, lname, password, contact, city, street, state, pincode, shop_name) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await db.query(query, [fname, mname, lname, password, contact, city, street, state, pincode, shop_name]);

    const newFpsId = result.insertId;
    res.send(`User registered successfully! Your FPS ID is ${newFpsId}`);
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).send('Database error');
  }
});

// New complaint POST route
app.post('/new_complaint', async (req, res) => {
  const {
    complaint_type, description_complaint
  } = req.body;

  if (!complaint_type || !description_complaint) {
    return res.status(400).send("Please fill the above values properly!");
  }

  try {
    const query2 = 'INSERT INTO complaint (ben_id, complaint_type, description_complaint) VALUES (?, ?, ?)';
    await db.query(query2, [ben_idlogin, complaint_type, description_complaint]);

    res.send("Complaint sent successfully!");
  } catch (err) {
    console.error("Error inserting data: ", err);
    res.status(500).send("Database error");
  }
});

app.get('/new_complaint', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'complaint.html'));
});

app.get('/forgot', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'forgot.html'));
});

// General error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal server error');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
