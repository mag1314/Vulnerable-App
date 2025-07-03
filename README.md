# Vulnerable-App


CREATE DATABASE car_app;
USE car_app;

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(255)
);

CREATE TABLE cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2)
);


CREATE TABLE interests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    car_id INT,
    customer_id INT,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    contact_number VARCHAR(255),
    address TEXT,
    email VARCHAR(255),
    phone_number VARCHAR(255),
    other_info TEXT,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

INSERT INTO cars (name, price) VALUES ('Tesla Model 3', 50000), ('BMW X5', 60000), ('Audi A4', 45000);


npm install express mysql2 bcryptjs xlsx body-parser ejs csv-writer


app.post('/interest', (req, res) => {
    const {
        user, // this is username
        car_id,
        first_name,
        last_name,
        contact_number,
        address,
        email,
        phone_number,
        other_info
    } = req.body;

    //Get customer ID using username
    db.query('SELECT id FROM customers WHERE username = ?', [user], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching customer ID.');
        }
        if (results.length === 0) {
            return res.status(400).send('User not found.');
        }

        const customer_id = results[0].id; // get numeric id

        // Now insert using the numeric customer_id
        db.query(
            'INSERT INTO interests (car_id, customer_id, first_name, last_name, contact_number, address, email, phone_number, other_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [car_id, customer_id, first_name, last_name, contact_number, address, email, phone_number, other_info],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error submitting interest.');
                }
                res.send('Interest submitted successfully.');
            }
        );
    });
});























app.get('/cars', (req, res) => {
    const username = req.query.user;
    db.query('SELECT id FROM customers WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) return res.send('User not found');

        const customer_id = results[0].id;

        db.query('SELECT * FROM cars', (err, cars) => {
            if (err) throw err;
            res.render('cars', { cars, customer_id }); // Pass customer_id
        });
    });
});
