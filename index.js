const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
require('dotenv').config();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Set up the view engine to use EJS templates
app.set('views', path.join(__dirname, 'view')); 
app.set('view engine', 'ejs'); // Set EJS as the view engine

// Establish database connection
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

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Change to true if using HTTPS
}));


app.use((req, res, next) => {
  console.log(`Request for: ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/fps', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'fps.html'));
});

app.get('/new_fps', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'fps_register.html'));
});

app.get('/added_stock', async (req, res) => {
  if (!req.session.fps_id) {
    return res.redirect('/');  // Redirect to login if no fps_id in session
  }

  try {
    const [rows] = await db.query(
      'SELECT stock_id, stock_name, quantity, stock_date FROM stock WHERE fps_id = ?',
      [req.session.fps_id]
    );

    // Pass the `fps_id` along with the stock data
    res.render('stock', {
      stock: rows,           // Stock data to display
      fps_id: req.session.fps_id  // Pass fps_id to the template
    });
  } catch (err) {
    console.error('Error fetching stock data:', err);
    res.status(500).send('Database error');
  }
});


app.get('/dashboard', async (req, res) => {
  if (!req.session.ben_id) {
    return res.redirect('/');
  }

  try {
    // Fetch the ration card data for the logged-in beneficiary
    const [rows] = await db.query(
      'SELECT ration_no, expiry, card_type, member_count FROM ration_card WHERE ben_id = ?',
      [req.session.ben_id]
    );

    if (rows.length === 0) {
      return res.status(404).send("No ration card information found.");
    }

    const cardData = rows[0];

    // Fetch the distribution records for the logged-in beneficiary
    const [records] = await db.query(
      'SELECT item_name, Quantity_distributed, distribution_date FROM record WHERE ben_ID = ?',
      [req.session.ben_id]
    );

    res.render('dashboard', {
      card_no: cardData.ration_no,
      expiry: cardData.expiry,
      card_type: cardData.card_type,
      member_no: cardData.member_count,
      records: records // Pass the record data to the template
    });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Internal server error");
  }
});


app.get('/fps_dashboard', async (req, res) => {
  console.log(req.session); // Log session data for debugging
  if (!req.session.fps_id) {
    return res.redirect('/');
  }

  try {
    // Retrieve FPS information
    const [fpsRows] = await db.query(
      'SELECT shop_name, city, fname, lname, contact FROM fps WHERE fps_id = ?',
      [req.session.fps_id]
    );

    if (fpsRows.length === 0) {
      return res.status(404).send("No FPS information found.");
    }
    const fpsData = fpsRows[0];

    // Retrieve eligibility data
    const [eligibilityRows] = await db.query(
      'SELECT ben_id, annual_income, occupation, verification_status, verified FROM eligibility'
    );
    const [complaintsRows] = await db.query(
      'SELECT complaint_ID, complaint_type, description_complaint,status FROM complaint WHERE fps_id = ?',
      [req.session.fps_id] // Assuming complaints are linked to a specific FPS by `fps_id`
    );
    // complaint_ID int  AUTO_INCREMENT primary key,
    // ben_id int,
    // complaint_type VARCHAR(200) NOT NULL, 
    // description_complaint VARCHAR(1000) NOT NULL,
    // complaint_time datetime default current_timestamp(),
    // Render the template with both fpsData and eligibility data
    res.render('fps_dashboard', {
      shop_name: fpsData.shop_name,
      city: fpsData.city,
      fname: fpsData.fname,
      lname: fpsData.lname,
      contact: fpsData.contact,
      fps_id: req.session.fps_id,
      eligibilityRecords: eligibilityRows,
      complaintsRows:complaintsRows // Pass eligibility data to the template
    });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("Internal server error");
  }
});
app.post('/verify_eligibility', async (req, res) => {
    const { ben_id, verification_status, verified } = req.body;

    try {
        // Update the verification status and verified field
        const result = await db.query(
            'UPDATE eligibility SET verification_status = ?, verified = ? WHERE ben_id = ?',
            [verification_status, verified === 'true', ben_id] // Convert 'true'/'false' to boolean
        );

        // Redirect back to the dashboard after updating
        res.redirect('/fps_dashboard');
    } catch (err) {
        console.error(err);
        res.send('Error updating verification status');
    }
});



// Login post
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
      return res.redirect('/');
    }

    const storedPassword = rows[0].password;
    if (storedPassword !== password) {
      console.log('Incorrect password');
      return res.redirect('/');
    }

    req.session.ben_id = rows[0].ben_id;
    res.redirect("/dashboard");
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal server error');
  }
});
// FPS login post
app.post('/fps-login', async (req, res) => {
  const { fps_id, password } = req.body;
  console.log(req.body);
  if (!fps_id || !password) {
    return res.status(400).send("FPS ID and password are required.");
  }

  try {
    const [rows] = await db.query(
      'SELECT fps_id, password FROM fps WHERE fps_id = ?',
      [fps_id]
    );

    if (rows.length === 0 || rows[0].password !== password) {
      console.log('Invalid FPS ID or password');
      return res.status(404).send('Invalid FPS ID or password.');
    }

    req.session.fps_id = rows[0].fps_id; // Correctly set the session
    res.redirect("/fps_dashboard");
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal server error');
  }
});


// New registration post
// New registration post
app.post('/register', async (req, res) => {
  const {
    email, password, fname, mname, lname, ration_no, city, 
    street, state, pincode, dob, gender, card_type
  } = req.body;

  if (!fname || !lname || !email || !password || !ration_no ||
      !city || !street || !state || !pincode || !dob || !gender) {
    return res.status(400).send("Please fill all required fields properly.");
  }

  try {
    const query = `INSERT INTO beneficiary (email, password, fname, mname, lname, ration_no, city, street, state, pincode, dob, gender, card_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    await db.query(query, [email, password, fname, mname, lname, ration_no, city, street, state, pincode, dob, gender, card_type]);
    
    res.redirect('/');  // Redirect upon successful registration
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).send('Database error');
  }
});


// Register FPS post
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
      res.redirect('fps_dashboard');
      
  } catch (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('Database error');
  }
});

app.post('/add_member', async (req, res) => {
  const { name, dob, aadhar, relationship } = req.body;

  if (!name || !dob || !aadhar || !relationship) {
    return res.status(400).send("Please fill all required fields properly!");
  }

  try {
    // Insert member into the family_members table
    const query = 'INSERT INTO family_members (ben_id, name, dob, aadhaar_number, relationship) VALUES (?, ?, ?, ?, ?)';
    await db.query(query, [req.session.ben_id, name, dob, aadhar, relationship]);

    // Update the member_count in the beneficiary table based on actual member count in family_members
    const updateBeneficiaryQuery = `
      UPDATE beneficiary b
      JOIN (SELECT ben_id, COUNT(*) AS member_count FROM family_members GROUP BY ben_id) fm
      ON b.ben_id = fm.ben_id
      SET b.member_count = fm.member_count+1  
      WHERE b.ben_id = ?;
    `;
    await db.query(updateBeneficiaryQuery, [req.session.ben_id]);

    // Update the member_count in the ration_card table based on actual member count in family_members
    const updateRationCardQuery = `
      UPDATE ration_card r
      JOIN (SELECT ben_id, COUNT(*) AS member_count FROM family_members GROUP BY ben_id) fm
      ON r.ben_id = fm.ben_id
      SET r.member_count = fm.member_count+1
      WHERE r.ben_id = ?;
    `;
    await db.query(updateRationCardQuery, [req.session.ben_id]);

    res.redirect('/dashboard');
  } catch (err) {
    console.error("Error inserting data: ", err);
    res.redirect('/dashboard');
  }
});

// New complaint GET
app.get('/new_complaint', (req, res) => {
  if (!req.session.ben_id) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'view', 'complaint.html'));
});

// New complaint POST
app.post('/new_complaint', async (req, res) => {
  const { complaint_type, description_complaint,fps_id } = req.body;

  if (!complaint_type || !description_complaint ||!fps_id) {
    return res.status(400).send("Please fill the above values properly!");
  }

  try {
    const query = 'INSERT INTO complaint (ben_id, complaint_type, description_complaint,fps_id) VALUES (?, ?, ?,?)';
    await db.query(query, [req.session.ben_id, complaint_type, description_complaint,fps_id]);
    
    res.redirect('/dashboard')
  } catch (err) {
    console.error("Error inserting data: ", err);
    res.status(500).send("Database error");
  }  
});
app.get('/new',(req,res)=>{
  res.sendFile(path.join(__dirname, 'view', 'register.html'));
})
app.get('/eligibility_verification',(req,res)=>{
  res.redirect('/dashboard');
})
app.post('/eligibility_verification', async (req, res) => {
  const { annual_income, occupation } = req.body;

  // Ensure that session is set
  if (!req.session.ben_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No beneficiary ID found.' });
  }

  try {
      const benId = req.session.ben_id;
      console.log(benId, annual_income, occupation);
      // Step 1: Check if the ben_id already exists in the database
      const checkQuery = `SELECT verification_status, verified FROM eligibility WHERE ben_id = ?`;
      const [existingRecords] = await db.query(checkQuery, [benId]);
  
      // Step 2: If ben_id exists, return the verification status
      if (existingRecords.length > 0) {
          const { verification_status, verified } = existingRecords[0];
          return res.json({
              success: true,
              message: 'Beneficiary ID already exists.',
              verification_status: verification_status || 'Pending  ', // Show 'Pending' if null
              verified: verified ? 'Yes  ' : '  No  ' // Convert boolean to 'Yes' or 'No'
          });
      }

      // Step 3: If ben_id does not exist, insert a new record
      const query = `INSERT INTO eligibility (ben_id, annual_income, occupation) VALUES (?, ?, ?)`;
      const [result] = await db.query(query, [benId, annual_income, occupation]);
      console.log('Data inserted successfully:', result);

      res.json({ success: true, message: 'Eligibility verification request is sent successfully!' });
  } catch (err) {
      console.error('Error processing request:', err);
      res.status(500).json({ success: false, message: 'An error occurred while processing the request.' });
  }
});


//add stock
app.post('/add_stock', async (req, res) => {
  const { stock_name, quantity, stock_date } = req.body;

  // Validate inputs
  if (!stock_name || !quantity || !stock_date) {
    return res.status(400).json({ success: false, message: 'All fields (stock_name, quantity, stock_date) are required.' });
  }

  // Ensure fps_id exists in the session
  if (!req.session.fps_id) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No FPS ID found in session.' });
  }

  try {
    const query = 'INSERT INTO stock (stock_name, fps_id, quantity, stock_date) VALUES (?, ?, ?, ?)';
    
    // Insert the stock data into the database
    await db.query(query, [stock_name, req.session.fps_id, quantity, stock_date]);

    // Redirect on success
    res.redirect('/added_stock');
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});


//show members
app.get('/get_members', async (req, res) => {
  if (!req.session.ben_id) {
      return res.redirect('/');
  }
  try {
      const [rows] = await db.query(
          'SELECT name, dob, aadhaar_number, relationship FROM family_members WHERE ben_id = ?',
          [req.session.ben_id]
      );
      res.json(rows);
  } catch (err) {
      console.error("Database query error:", err);
      res.status(500).send("Internal server error");
  }
});


//show members
app.get('/get_members', async (req, res) => {
  if (!req.session.ben_id) {
      return res.redirect('/');
  }
  try {
      const [rows] = await db.query(
          'SELECT name, dob, aadhaar_number, relationship FROM family_members WHERE ben_id = ?',
          [req.session.ben_id]
      );
      res.json(rows);
  } catch (err) {
      console.error("Database query error:", err);
      res.status(500).send("Internal server error");
  }
});
app.post('/add_record', async (req, res) => {
  const { ben_id, item_name, quantity_distributed, distribution_date } = req.body;

  // Ensure that fps_id exists in the session
  if (!req.session.fps_id) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No FPS ID found in session.' });
  }

  try {
    // Check if the ben_id exists in the beneficiary table
    const [benRows] = await db.query('SELECT ben_id FROM beneficiary WHERE ben_id = ?', [ben_id]);

    if (benRows.length === 0) {
      // If ben_id does not exist, redirect to the record panel with an error message
      return res.redirect('/fps_dashboard?error=Beneficiary ID does not exist');  
    }

    // Proceed with inserting the record if ben_id exists
    const query = `
      INSERT INTO record (ben_ID, fps_id, item_name, Quantity_distributed, distribution_date)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      ben_id,                // Beneficiary ID from the form
      req.session.fps_id,    // FPS ID from the session
      item_name,             // Item name from the form
      quantity_distributed,  // Quantity distributed from the form
      distribution_date      // Distribution date from the form
    ]);

    // Redirect to the stock page or wherever after successful insertion
    return res.redirect('/fps_dashboard?message=added successfully');
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});
// Route to handle updating complaint status
app.post('/update_complaint_status/:complaint_id', async (req, res) => {
  const { status } = req.body;
  const { complaint_id } = req.params;

  try {
      // Update the status of the complaint in the database
      const result = await db.query(
          'UPDATE complaint SET status = ? WHERE complaint_ID = ?',
          [status, complaint_id]
      );

      // Redirect back to the dashboard after updating
      res.redirect('/fps_dashboard');
  } catch (err) {
      console.error("Error updating complaint status:", err);
      res.status(500).send("Internal server error");
  }
});

// Forgot password page
app.get('/forgot', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'forgot.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
