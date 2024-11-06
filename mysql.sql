yash rms


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
    member_count INT NOT NULL CHECK (member_count > 0)
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
CREATE TABLE ration_card (
    ration_no varchar(20) primary key,
    ben_id INT,
    expiry DATE,
    card_type VARCHAR(45) NOT NULL,
    member_count INT,
    FOREIGN KEY (ben_id) REFERENCES beneficiary(ben_id)
);
DELIMITER //

CREATE TRIGGER set_member_count_before_insert
BEFORE INSERT ON ration_card
FOR EACH ROW
BEGIN
    DECLARE ben_member_count INT;
    
    -- Select member_count from beneficiary table based on ben_id
    SELECT member_count INTO ben_member_count
    FROM beneficiary
    WHERE ben_id = NEW.ben_id;

    -- Set member_count in ration_card table to the value from beneficiary
    SET NEW.member_count = ben_member_count;
END //

DELIMITER ;