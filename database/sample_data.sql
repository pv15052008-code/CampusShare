-- ============================================================
-- Project: CampusShare – Smart Campus Resource Sharing System
-- File: sample_data.sql (Data Manipulation / DML)
-- Description: Realistic sample records including required demo accounts.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- 1. Insert Categories
-- ------------------------------------------------------------
INSERT INTO Category (Category_ID, Category_Name) VALUES
(1, 'Laptops & Computing'),
(2, 'Cameras & Media'),
(3, 'Projectors & AV'),
(4, 'Books & Reference'),
(5, 'Lab Equipment & Kits'),
(6, 'Study & Discussion Rooms');

-- ------------------------------------------------------------
-- 2. Insert Students (Including Demo Student)
-- ------------------------------------------------------------
INSERT INTO Student (Student_ID, Name, Email, Password, Branch, Year) VALUES
(1, 'Demo Student', 'student@campusshare.com', 'student123', 'Computer Science', 3),
(2, 'Aarav Sharma', 'aarav.sharma@campus.edu', 'student123', 'Computer Science', 3),
(3, 'Priya Patel', 'priya.patel@campus.edu', 'student123', 'Electronics & Comm', 4),
(4, 'Rohan Verma', 'rohan.verma@campus.edu', 'student123', 'Mechanical Engg', 2),
(5, 'Ananya Iyer', 'ananya.iyer@campus.edu', 'student123', 'Information Tech', 3),
(6, 'Kabir Mehta', 'kabir.mehta@campus.edu', 'student123', 'Electrical Engg', 1);

-- ------------------------------------------------------------
-- 3. Insert Faculty (Including Demo Faculty)
-- ------------------------------------------------------------
INSERT INTO Faculty (Faculty_ID, Name, Email, Password, Department, Designation) VALUES
(1, 'Demo Faculty', 'faculty@campusshare.com', 'faculty123', 'Computer Science', 'Associate Professor'),
(2, 'Dr. Sunita Rao', 'sunita.rao@campus.edu', 'faculty123', 'Electronics & Comm', 'Professor'),
(3, 'Prof. Vikram Malhotra', 'vikram.m@campus.edu', 'faculty123', 'Mechanical Engg', 'Assistant Professor');

-- ------------------------------------------------------------
-- 4. Insert Admins (Including Demo Admin)
-- ------------------------------------------------------------
INSERT INTO Admin (Admin_ID, Name, Email, Password) VALUES
(1, 'Demo Admin', 'admin@campusshare.com', 'admin123'),
(2, 'Prof. S. K. Gupta', 'admin@campus.edu', 'admin123'),
(3, 'Dr. Neha Sen', 'coordinator@campus.edu', 'admin123');

-- ------------------------------------------------------------
-- 5. Insert Resources
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 6. Insert Bookings
-- ------------------------------------------------------------
INSERT INTO Booking (Booking_ID, Student_ID, Borrower_Type, Resource_ID, Booking_Date, Return_Date, Booking_Status) VALUES
(1, 4, 'Student', 2, '2026-11-01', '2026-11-05', 'Returned'),
(2, 5, 'Student', 2, '2026-11-08', '2026-11-12', 'Approved'),
(3, 2, 'Student', 5, '2026-11-07', '2026-11-10', 'Approved'),
(4, 1, 'Student', 3, '2026-11-09', '2026-11-14', 'Pending'),
(5, 3, 'Student', 7, '2026-11-10', '2026-11-10', 'Pending'),
(6, 1, 'Faculty', 9, '2026-11-08', '2026-11-15', 'Approved'),
(7, 4, 'Student', 8, '2026-10-25', '2026-10-27', 'Rejected');
