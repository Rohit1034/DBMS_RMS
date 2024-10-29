const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();
const path = require("path");

const app = express();
const PORT = 3000;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    return;
  }
  console.log('Connected to the database as ID', db.threadId);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//homepage
app.get('/', function(res, req){
    req.sendFile(path.join(__dirname, 'view', 'login.html'));
});

// Example route to handle form submission
app.post('/login', async (req, res) => {
    const reqBody = {
        email: req.body.email,
        password: req.body.password,
    };
    if(!req.body.email || !req.body.password){
        return res.status(400).send("email and passowrd are required");
    }
//login page details adding to database
  const query = 'INSERT INTO benif (email, password)  VALUES (?, ?)';
  db.query(query, [req.body.email, req.body.password], (err, results) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('Database error');
      return;
    }
    res.send('Data submitted successfullyin Databsae!');
  });
});
// sending file to webpage
app.get('/about', function(res, req){
    req.sendFile(path.join(__dirname,'view', 'register.html'));
});

//register page details adding to database
app.post('/register', async (req, res)=> {
    const reqBody ={
        email: req.body.email,
        password: req.body.password,
        fname: req.body.fname,
        mname: req.body.mname,
        lname: req.body.lname,
        ration_no: req.body.ration_no,
        city: req.body.city,
        street: req.body.street,
        state: req.body.state,
        pincode: req.body.pincode,
        dob: req.body.dob,
        gender: req.body.gender,
        member_count: req.body.member_count,
    };
    if(!req.body.fname  ||  !req.body.mname ||  !req.body.lname ||  !req.body.email ||  !req.body.password ||  !req.body.ration_no ||  !req.body.city ||  !req.body.street ||  !req.body.state ||  !req.body.pincode || !req.body.dob ||  !req.body.gender || !req.body.member_count){
        return res.status(404).send("fill the above all values properly");
    }
    const query = "insert into beni ("
})
//password forget
app.get('/forgot', function(res, req){
    req.sendFile(path.join(__dirname,'view', 'forgot.html'));
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
