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
