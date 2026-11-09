-- ============================================================
-- Project: CampusShare – Smart Campus Resource Sharing System
-- File: queries.sql (DBMS Operations & Concepts Demonstration)
-- Description: Essential SQL queries required for the application
--              and your viva presentation.
-- ============================================================

-- ------------------------------------------------------------
-- 1. BASIC SELECT, WHERE, AND ORDER BY
-- ------------------------------------------------------------

-- Query 1.1: Fetch all currently available resources sorted alphabetically by name
SELECT Resource_ID, Resource_Name, Description, Availability_Status
FROM Resource
WHERE Availability_Status = 'Available'
ORDER BY Resource_Name ASC;

-- Query 1.2: Search resources by keyword in name or description (Search feature)
SELECT Resource_ID, Resource_Name, Description, Availability_Status
FROM Resource
WHERE Resource_Name LIKE '%Camera%' OR Description LIKE '%Camera%';

-- Query 1.3: Filter resources by Category (Filter feature)
SELECT Resource_ID, Resource_Name, Availability_Status
FROM Resource
WHERE Category_ID = 2;


-- ------------------------------------------------------------
-- 2. RELATIONAL JOINS (MULTI-TABLE QUERIES)
-- ------------------------------------------------------------

-- Query 2.1: [INNER JOIN] Display complete resource details along with 
--            Category Name and Owner (Student) Name.
SELECT 
    R.Resource_ID,
    R.Resource_Name,
    C.Category_Name,
    S.Name AS Owner_Name,
    S.Email AS Owner_Email,
    R.Availability_Status
FROM Resource R
INNER JOIN Category C ON R.Category_ID = C.Category_ID
INNER JOIN Student S ON R.Owner_ID = S.Student_ID
ORDER BY R.Resource_ID;

-- Query 2.2: [INNER JOIN] Full booking ledger for Admin dashboard:
--            Shows who booked what, the category, dates, and status.
SELECT 
    B.Booking_ID,
    S.Name AS Student_Name,
    S.Branch,
    R.Resource_Name,
    C.Category_Name,
    B.Booking_Date,
    B.Return_Date,
    B.Booking_Status
FROM Booking B
INNER JOIN Student S ON B.Student_ID = S.Student_ID
INNER JOIN Resource R ON B.Resource_ID = R.Resource_ID
INNER JOIN Category C ON R.Category_ID = C.Category_ID
ORDER BY B.Booking_ID DESC;

-- Query 2.3: [LEFT JOIN] List all resources and any active bookings they have,
--            including resources that have NEVER been booked yet.
SELECT 
    R.Resource_ID,
    R.Resource_Name,
    R.Availability_Status,
    B.Booking_ID,
    B.Booking_Status
FROM Resource R
LEFT JOIN Booking B ON R.Resource_ID = B.Resource_ID;


-- ------------------------------------------------------------
-- 3. AGGREGATE FUNCTIONS, GROUP BY, AND HAVING
-- ------------------------------------------------------------

-- Query 3.1: Count the total number of resources in each category
SELECT 
    C.Category_Name,
    COUNT(R.Resource_ID) AS Total_Resources
FROM Category C
LEFT JOIN Resource R ON C.Category_ID = R.Category_ID
GROUP BY C.Category_ID, C.Category_Name
ORDER BY Total_Resources DESC;

-- Query 3.2: Count total bookings made by each student
SELECT 
    S.Student_ID,
    S.Name AS Student_Name,
    S.Branch,
    COUNT(B.Booking_ID) AS Total_Bookings
FROM Student S
LEFT JOIN Booking B ON S.Student_ID = B.Student_ID
GROUP BY S.Student_ID, S.Name, S.Branch
ORDER BY Total_Bookings DESC;

-- Query 3.3: Categories that have more than 1 resource listed (HAVING clause)
SELECT 
    C.Category_Name,
    COUNT(R.Resource_ID) AS Resource_Count
FROM Category C
INNER JOIN Resource R ON C.Category_ID = R.Category_ID
GROUP BY C.Category_ID, C.Category_Name
HAVING COUNT(R.Resource_ID) > 1;


-- ------------------------------------------------------------
-- 4. SUBQUERIES (NESTED QUERIES)
-- ------------------------------------------------------------

-- Query 4.1: Find resources that have NEVER been requested or booked
SELECT Resource_ID, Resource_Name
FROM Resource
WHERE Resource_ID NOT IN (
    SELECT DISTINCT Resource_ID FROM Booking
);

-- Query 4.2: Find students who have at least one 'Approved' booking
SELECT Student_ID, Name, Email, Branch
FROM Student
WHERE Student_ID IN (
    SELECT Student_ID 
    FROM Booking 
    WHERE Booking_Status = 'Approved'
);


-- ------------------------------------------------------------
-- 5. UPDATE AND DELETE OPERATIONS
-- ------------------------------------------------------------

-- Query 5.1: Approve a pending booking request
UPDATE Booking
SET Booking_Status = 'Approved'
WHERE Booking_ID = 4 AND Booking_Status = 'Pending';

-- Query 5.2: Update resource availability status when an item is booked
UPDATE Resource
SET Availability_Status = 'Booked'
WHERE Resource_ID = (
    SELECT Resource_ID FROM Booking WHERE Booking_ID = 4
);

-- Query 5.3: Delete rejected booking records older than a specific date
DELETE FROM Booking
WHERE Booking_Status = 'Rejected';
