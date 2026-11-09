-- ============================================================
-- Project: CampusShare – Smart Campus Resource Sharing System
-- File: schema.sql (Database Definition / DDL)
-- Description: Table creation scripts with PK, FK, and integrity constraints.
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- 1. Table: Student
-- Stores registered students who can share and borrow campus resources.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Student (
    Student_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(120) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Branch VARCHAR(50) NOT NULL,
    Year INTEGER NOT NULL CHECK (Year BETWEEN 1 AND 4)
);

-- ------------------------------------------------------------
-- 2. Table: Faculty
-- Stores college faculty members who share and oversee resources.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Faculty (
    Faculty_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(120) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Department VARCHAR(50) NOT NULL,
    Designation VARCHAR(50) NOT NULL DEFAULT 'Assistant Professor'
);

-- ------------------------------------------------------------
-- 3. Table: Category
-- Categorizes resources (Laptops, Cameras, Projectors, Books, Lab Equipment, Study Rooms).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Category (
    Category_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Category_Name VARCHAR(50) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- 4. Table: Admin
-- Stores staff/administrators who oversee system users, resources, and bookings.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Admin (
    Admin_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(120) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL
);

-- ------------------------------------------------------------
-- 5. Table: Resource
-- Stores all campus resources available for sharing or borrowing.
-- Foreign Keys:
--   - Category_ID references Category(Category_ID)
--   - Owner_ID references Student(Student_ID) or Faculty
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Resource (
    Resource_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Resource_Name VARCHAR(150) NOT NULL,
    Category_ID INTEGER NOT NULL,
    Description TEXT,
    Owner_ID INTEGER NOT NULL,
    Owner_Type VARCHAR(20) NOT NULL DEFAULT 'Student',
    Availability_Status VARCHAR(20) NOT NULL DEFAULT 'Available' 
        CHECK (Availability_Status IN ('Available', 'Booked', 'Maintenance')),
    FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID) ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 6. Table: Booking
-- Stores all resource loan transactions and requests.
-- Foreign Keys:
--   - Student_ID references borrower
--   - Resource_ID references Resource(Resource_ID)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS Booking (
    Booking_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Student_ID INTEGER NOT NULL,
    Borrower_Type VARCHAR(20) NOT NULL DEFAULT 'Student',
    Resource_ID INTEGER NOT NULL,
    Booking_Date DATE NOT NULL DEFAULT (CURRENT_DATE),
    Return_Date DATE NOT NULL,
    Booking_Status VARCHAR(20) NOT NULL DEFAULT 'Pending' 
        CHECK (Booking_Status IN ('Pending', 'Approved', 'Rejected', 'Returned')),
    FOREIGN KEY (Resource_ID) REFERENCES Resource(Resource_ID) ON DELETE CASCADE,
    CHECK (Return_Date >= Booking_Date)
);
