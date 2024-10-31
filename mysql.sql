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
<<<<<<< HEAD:yash rms sqlcommands.txt

create TABLE complaint (
    complaint_ID int  AUTO_INCREMENT primary key,
    ben_id int,
    complaint_type VARCHAR(200) NOT NULL, 
    description_complaint VARCHAR(1000) NOT NULL,
    complaint_time datetime,
    foreign key(ben_id) references beneficiary(ben_id)
);
alter table complaint modify complaint_time datetime default current_timestamp();
=======
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
>>>>>>> 6a2e5a02b9341653065b1506856d20b747430ae5:mysql.sql
);
