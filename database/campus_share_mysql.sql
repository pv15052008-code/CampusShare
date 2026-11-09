-- ============================================================
-- Project: CampusShare – Smart Campus Resource Sharing System
-- File: campus_share_mysql.sql (Master Database Script - MySQL)
-- Description: Complete schema creation (DDL) and sample data (DML)
--              compatible with cloud MySQL (Aiven, PlanetScale, Render, Clever Cloud).
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Booking;
DROP TABLE IF EXISTS Resource;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS Faculty;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS Category;

-- ------------------------------------------------------------
-- 1. Table: Category
-- ------------------------------------------------------------
CREATE TABLE Category (
    Category_ID INT AUTO_INCREMENT PRIMARY KEY,
    Category_Name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. Table: Student
-- ------------------------------------------------------------
CREATE TABLE Student (
    Student_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(120) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Branch VARCHAR(50) NOT NULL,
    Year INT NOT NULL,
    CONSTRAINT chk_student_year CHECK (Year BETWEEN 1 AND 4)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. Table: Faculty
-- ------------------------------------------------------------
CREATE TABLE Faculty (
    Faculty_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(120) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Department VARCHAR(50) NOT NULL,
    Designation VARCHAR(50) NOT NULL DEFAULT 'Assistant Professor'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. Table: Admin
-- ------------------------------------------------------------
CREATE TABLE Admin (
    Admin_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(120) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. Table: Resource
-- ------------------------------------------------------------
CREATE TABLE Resource (
    Resource_ID INT AUTO_INCREMENT PRIMARY KEY,
    Resource_Name VARCHAR(150) NOT NULL,
    Category_ID INT NOT NULL,
    Description TEXT,
    Owner_ID INT NOT NULL,
    Owner_Type VARCHAR(20) NOT NULL DEFAULT 'Student',
    Availability_Status VARCHAR(20) NOT NULL DEFAULT 'Available',
    CONSTRAINT chk_resource_status CHECK (Availability_Status IN ('Available', 'Booked', 'Maintenance')),
    FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. Table: Booking
-- ------------------------------------------------------------
CREATE TABLE Booking (
    Booking_ID INT AUTO_INCREMENT PRIMARY KEY,
    Student_ID INT NOT NULL,
    Borrower_Type VARCHAR(20) NOT NULL DEFAULT 'Student',
    Resource_ID INT NOT NULL,
    Booking_Date DATE NOT NULL,
    Return_Date DATE NOT NULL,
    Booking_Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    CONSTRAINT chk_booking_status CHECK (Booking_Status IN ('Pending', 'Approved', 'Rejected', 'Returned')),
    CONSTRAINT chk_booking_dates CHECK (Return_Date >= Booking_Date),
    FOREIGN KEY (Resource_ID) REFERENCES Resource(Resource_ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- INSERT SAMPLE DATA & DEMO ACCOUNTS
-- ============================================================

-- Categories
INSERT INTO Category (Category_ID, Category_Name) VALUES
(1, 'Laptops & Computing'),
(2, 'Cameras & Media'),
(3, 'Projectors & AV'),
(4, 'Books & Reference'),
(5, 'Lab Equipment & Kits'),
(6, 'Study & Discussion Rooms');

-- Students
INSERT INTO Student (Student_ID, Name, Email, Password, Branch, Year) VALUES
(1, 'Demo Student', 'student@campusshare.com', 'student123', 'Computer Science', 3),
(2, 'Aarav Sharma', 'aarav.sharma@campus.edu', 'student123', 'Computer Science', 3),
(3, 'Priya Patel', 'priya.patel@campus.edu', 'student123', 'Electronics & Comm', 4),
(4, 'Rohan Verma', 'rohan.verma@campus.edu', 'student123', 'Mechanical Engg', 2),
(5, 'Ananya Iyer', 'ananya.iyer@campus.edu', 'student123', 'Information Tech', 3),
(6, 'Kabir Mehta', 'kabir.mehta@campus.edu', 'student123', 'Electrical Engg', 1);

-- Faculty
INSERT INTO Faculty (Faculty_ID, Name, Email, Password, Department, Designation) VALUES
(1, 'Demo Faculty', 'faculty@campusshare.com', 'faculty123', 'Computer Science', 'Associate Professor'),
(2, 'Dr. Sunita Rao', 'sunita.rao@campus.edu', 'faculty123', 'Electronics & Comm', 'Professor'),
(3, 'Prof. Vikram Malhotra', 'vikram.m@campus.edu', 'faculty123', 'Mechanical Engg', 'Assistant Professor');

-- Admins
INSERT INTO Admin (Admin_ID, Name, Email, Password) VALUES
(1, 'Demo Admin', 'admin@campusshare.com', 'admin123'),
(2, 'Prof. S. K. Gupta', 'admin@campus.edu', 'admin123'),
(3, 'Dr. Neha Sen', 'coordinator@campus.edu', 'admin123');

-- Resources
INSERT INTO Resource (Resource_ID, Resource_Name, Category_ID, Description, Owner_ID, Owner_Type, Availability_Status) VALUES
(1, 'Dell Inspiron 15 (16GB RAM, i7)', 1, 'High-performance laptop suitable for programming, CAD, and simulations.', 1, 'Student', 'Available'),
(2, 'Canon EOS 1500D DSLR Camera', 2, '24.1 MP DSLR with 18-55mm lens and tripod, ideal for college media events.', 2, 'Student', 'Booked'),
(3, 'Epson Full HD Projector (EB-FH06)', 3, '3500 lumens bright display projector with HDMI & VGA cables.', 1, 'Faculty', 'Available'),
(4, 'Database System Concepts (Korth, 7th Ed)', 4, 'Standard reference book for Database Management Systems coursework.', 4, 'Student', 'Available'),
(5, 'Arduino Complete Starter Kit', 5, 'Includes Arduino Uno board, breadboard, sensors, jumper wires, and LEDs.', 3, 'Student', 'Booked'),
(6, 'Digital Storage Oscilloscope (50 MHz)', 5, 'Dual-channel lab equipment for electronics and circuit troubleshooting.', 2, 'Faculty', 'Maintenance'),
(7, 'Discussion Room 204 (Whiteboard & AC)', 6, 'Group study room with seating for 6 students, projector, and high-speed Wi-Fi.', 1, 'Faculty', 'Available'),
(8, 'Sony Alpha A6400 Mirrorless Camera', 2, 'Compact 4K camera with 16-50mm power zoom lens for tech club coverage.', 5, 'Student', 'Available'),
(9, 'NVIDIA Jetson Nano Developer Kit', 5, 'AI/ML embedded computing board for robotics and computer vision research.', 1, 'Faculty', 'Available'),
(10, 'MacBook Air M2 (16GB, 512GB)', 1, 'Apple Silicon laptop for iOS app development and UI/UX design workshops.', 1, 'Faculty', 'Available');

-- Bookings
INSERT INTO Booking (Booking_ID, Student_ID, Borrower_Type, Resource_ID, Booking_Date, Return_Date, Booking_Status) VALUES
(1, 4, 'Student', 2, '2026-11-01', '2026-11-05', 'Returned'),
(2, 5, 'Student', 2, '2026-11-08', '2026-11-12', 'Approved'),
(3, 2, 'Student', 5, '2026-11-07', '2026-11-10', 'Approved'),
(4, 1, 'Student', 3, '2026-11-09', '2026-11-14', 'Pending'),
(5, 3, 'Student', 7, '2026-11-10', '2026-11-10', 'Pending'),
(6, 1, 'Faculty', 9, '2026-11-08', '2026-11-15', 'Approved'),
(7, 4, 'Student', 8, '2026-10-25', '2026-10-27', 'Rejected');
