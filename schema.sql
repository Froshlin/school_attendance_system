USE attendance_db;
     
     CREATE TABLE students (
         id INT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(100) NOT NULL,
         fingerprint_template VARCHAR(256) NOT NULL, -- Hashed template
         guardian_email VARCHAR(100) NOT NULL
     );
     
     CREATE TABLE attendance (
         id INT AUTO_INCREMENT PRIMARY KEY,
         student_id INT,
         date DATE,
         time TIME,
         status ENUM('present', 'absent') DEFAULT 'absent',
         FOREIGN KEY (student_id) REFERENCES students(id)
     );
     
     CREATE TABLE notifications (
         id INT AUTO_INCREMENT PRIMARY KEY,
         student_id INT,
         notification_time DATETIME,
         status ENUM('sent', 'failed') DEFAULT 'failed',
         FOREIGN KEY (student_id) REFERENCES students(id)
     );