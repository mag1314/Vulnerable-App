const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'car_app'
});

db.connect(err => {
    if (err) throw err;
    console.log('Database connected');
});

// Home page
app.get('/', (req, res) => {
    res.render('index');
});

// Signup page
app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    db.query('INSERT INTO customers (username, password) VALUES (?, ?)', [username, hashed], (err) => {
        if (err) throw err;
        res.redirect('/login');
    });
});

// Login page (shared)
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin') {
        // Hardcoded admin password
        if (password === 'admin123') {
            res.redirect('/admin');
        } else {
            res.send('Invalid admin credentials');
        }
    } else {
        db.query('SELECT * FROM customers WHERE username = ?', [username], async (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                const match = await bcrypt.compare(password, results[0].password);
                if (match) {
                    res.redirect(`/cars?user=${encodeURIComponent(username)}`);
                } else {
                    res.send('Invalid credentials');
                }
            } else {
                res.send('User not found');
            }
        });
    }
});

app.get('/cars', (req, res) => {
    const user = req.query.user;
    db.query('SELECT * FROM cars', (err, cars) => {
        if (err) throw err;
        res.render('cars', { cars, user });
    });
});


//Custoemr cars
// app.get('/customer-cars', (req, res) => {
//     const user = req.query.user;
//     db.query('SELECT * FROM cars', (err, cars) => {
//         if (err) throw err;
//         res.render('customer-cars', { cars, user });
//     });
// });


//subit interests
app.get('/submit-form/:car_id', (req, res) => {
    const user = req.query.user;
    const car_id = req.params.car_id;
    db.query('SELECT * FROM cars WHERE id = ?', [car_id], (err, car) => {
        if (err) throw err;
        res.render('submit-form', { car: car[0], user });
    });
});

app.post('/interest', (req, res) => {
    const { user, car_id, first_name, last_name, contact_number, address, email, phone_number, other_info } = req.body;
    db.query('INSERT INTO interests (car_id, customer_id, first_name, last_name, contact_number, address, email, phone_number, other_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [car_id, user, first_name, last_name, contact_number, address, email, phone_number, other_info],
        (err) => {
            if (err) {
                console.log(err);  // Log error to console
                res.status(500).send('There was an error submitting your interest.');
            } else {
                res.send('Interest submitted successfully.');
            }
        }
    );
});


// Customer view
app.get('/customer', (req, res) => {
    const user = req.query.user;
    db.query('SELECT * FROM cars', (err, cars) => {
        if (err) throw err;
        res.render('customer', { cars, user });
    });
});

// Submit interest (vulnerable to formula injection)
app.post('/interest', (req, res) => {
    const { user, car_id, interest_details } = req.body;
    db.query('INSERT INTO interests (car_id, customer_id, interest_details) VALUES (?, ?, ?)',
        [car_id, user, interest_details],
        (err) => {
            if (err) throw err;
            res.send('Interest submitted (with potential formula injection).');
        }
    );
});

// Admin view
app.get('/admin', (req, res) => {
    db.query('SELECT * FROM interests', (err, interests) => {
        if (err) {
            console.log(err);  // Log error to console
            res.status(500).send('Error fetching interests.');
        } else {
            res.render('admin', { interests });
        }
    });
});

// XLS download (vulnerable)
// app.get('/download-xls', (req, res) => {
//     db.query('SELECT * FROM interests', (err, interests) => {
//         if (err) throw err;
//         const wb = xlsx.utils.book_new();
//         const ws = xlsx.utils.json_to_sheet(interests);
//         xlsx.utils.book_append_sheet(wb, ws, 'Interests');
//         const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
//         res.setHeader('Content-Disposition', 'attachment; filename="interests.xlsx"');
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.send(buf);
//     });
// });
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

app.get('/download-csv', (req, res) => {
    db.query('SELECT * FROM interests', (err, interests) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error fetching interests.');
        } else {
            // Define the path and columns for the CSV file
            const csvWriter = createCsvWriter({
                path: 'interests.csv', // Temporary path where CSV is saved
                header: [
                    { id: 'id', title: 'ID' },
                    { id: 'car_id', title: 'Car ID' },
                    { id: 'customer_id', title: 'Customer ID' },
                    { id: 'first_name', title: 'First Name' },
                    { id: 'last_name', title: 'Last Name' },
                    { id: 'contact_number', title: 'Contact Number' },
                    { id: 'address', title: 'Address' },
                    { id: 'email', title: 'Email' },
                    { id: 'phone_number', title: 'Phone Number' },
                    { id: 'other_info', title: 'Other Info' }
                ]
            });

            // Write the CSV data
            csvWriter.writeRecords(interests) // Writing the records to the CSV file
                .then(() => {
                    console.log('CSV file written successfully.');
                    res.setHeader('Content-Disposition', 'attachment; filename="interests.csv"');
                    res.setHeader('Content-Type', 'text/csv');
                    res.sendFile(path.join(__dirname, 'interests.csv')); // Send the CSV file as a response
                })
                .catch((err) => {
                    console.error('Error writing CSV file:', err);
                    res.status(500).send('Error generating CSV.');
                });
        }
    });
});


// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
