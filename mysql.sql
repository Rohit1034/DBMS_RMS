

CREATE TABLE beneficiary (
    ben_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fname VARCHAR(50) NOT NULL,
    mname VARCHAR(50),
    lname VARCHAR(50) NOT NULL,
    ration_no VARCHAR(20) NOT NULL UNIQUE,
    city VARCHAR(50) NOT NULL,
    street VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F', 'O')),
    member_count INT DEFAULT 1,
    card_type varchar(20)
);
CREATE TABLE fps (
    fps_id INT AUTO_INCREMENT PRIMARY KEY,  -- fps_id is now auto-incremented
    fname VARCHAR(255) NOT NULL,
    mname VARCHAR(255) NOT NULL,
    lname VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    contact VARCHAR(10) NOT NULL,
    city VARCHAR(255) NOT NULL,
    street VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    shop_name VARCHAR(255) NOT NULL
);
create TABLE complaint (
    complaint_ID int  AUTO_INCREMENT primary key,
    ben_id int,
    complaint_type VARCHAR(200) NOT NULL, 
    description_complaint VARCHAR(1000) NOT NULL,
    complaint_time datetime default current_timestamp(),
    foreign key(ben_id) references beneficiary(ben_id)
);
ALTER TABLE complaint
ADD COLUMN status varchar(45) default 'pending';
ALTER TABLE complaint
ADD COLUMN fps_id INT,
ADD CONSTRAINT fk_fps_id FOREIGN KEY (fps_id) REFERENCES fps(fps_id);
CREATE TABLE ration_card (
    ration_no varchar(20) primary key,
    ben_id INT,
    expiry DATE,
    card_type VARCHAR(45) NOT NULL,
    member_count INT,
    FOREIGN KEY (ben_id) REFERENCES beneficiary(ben_id)
);

CREATE TRIGGER insert_into_ration_card_after_beneficiary_insert
AFTER INSERT ON beneficiary
FOR EACH ROW
BEGIN
    INSERT INTO ration_card (ration_no, ben_id, expiry, card_type, member_count)
    VALUES (
        NEW.ration_no,                          -- Using ration_no from beneficiary
        NEW.ben_id,                             -- Using the newly inserted ben_id
        DATE_ADD(CURRENT_DATE, INTERVAL 5 YEAR),  -- Setting expiry to 5 years from today
        NEW.card_type,                          -- Using the card_type from beneficiary
        NEW.member_count                        -- Using the member_count from beneficiary
    );
END //

DELIMITER ;





CREATE TABLE family_members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each family member
    ben_id INT NOT NULL,                        -- Foreign key to reference the beneficiary
    name VARCHAR(100) NOT NULL,                 -- Name of the family member
    dob DATE NOT NULL,                          -- Date of birth
    aadhaar_number VARCHAR(12) UNIQUE,         -- Aadhaar number (assuming it's a 12-digit number)
    relationship VARCHAR(50) NOT NULL,         -- Relationship to the beneficiary
    FOREIGN KEY (ben_id) REFERENCES beneficiary(ben_id) -- Assuming 'ben_id' exists in beneficiary table
);

CREATE TABLE eligibility (
    ben_id INT UNIQUE,
    eg_id INT AUTO_INCREMENT PRIMARY KEY,
    annual_income DOUBLE,
    occupation VARCHAR(45),
    verification_status VARCHAR(100) DEFAULT 'pending',
    verified BOOLEAN
);

CREATE TABLE stock (
    stock_id int AUTO_INCREMENT primary key,
    stock_name varchar(20) not null,  
    fps_id int, 
    quantity int, 
    stock_date DATE,
    foreign key(fps_id) REFERENCES fps(fps_id)
    );
CREATE TABLE notification (
    notification INT PRIMARY KEY,
    ben_id INT,
    fps_id INT,
    message VARCHAR(255),
    timesent TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE record (
    rec_ID INT PRIMARY KEY,
    ben_ID INT,
    fps_id INT,
    item_name VARCHAR(255),
    Quantity_distributed INT,
    distribution_date DATE,
    
    
    FOREIGN KEY (ben_ID) REFERENCES Beneficiary(ben_ID),
    FOREIGN KEY (fps_id) REFERENCES fps(fps_id)
);
CREATE TABLE record (
    rec_ID INT auto_increment PRIMARY KEY,
    ben_ID INT,
    fps_id INT,
    item_name VARCHAR(255),
    Quantity_distributed INT,
    distribution_date DATE,
    
    
    FOREIGN KEY (ben_ID) REFERENCES Beneficiary(ben_ID),
    FOREIGN KEY (fps_id) REFERENCES fps(fps_id)
);