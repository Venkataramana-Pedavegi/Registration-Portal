-- MySQL 8.0 Schema for College Event Registration Management System

CREATE DATABASE IF NOT EXISTS `college_event_registration`;
USE `college_event_registration`;

-- --------------------------------------------------
-- Table structure for Students
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS `Students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fullName` VARCHAR(255) NOT NULL,
  `rollNumber` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `department` VARCHAR(255) NOT NULL,
  `year` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------
-- Table structure for Admins
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS `Admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) NOT NULL DEFAULT 'Admin',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------
-- Table structure for Events
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS `Events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `venue` VARCHAR(255) NOT NULL,
  `eventDate` DATETIME NOT NULL,
  `startTime` VARCHAR(255) NOT NULL,
  `endTime` VARCHAR(255) NOT NULL,
  `registrationDeadline` DATETIME NOT NULL,
  `organizer` VARCHAR(255) NOT NULL,
  `capacity` INT NOT NULL,
  `availableSeats` INT NOT NULL,
  `image` VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
  `status` VARCHAR(255) NOT NULL DEFAULT 'Upcoming',
  `createdBy` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_events_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `Admins` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_event_title_venue_date` (`title`, `venue`, `eventDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------
-- Table structure for Registrations
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS `Registrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `studentId` INT NOT NULL,
  `eventId` INT NOT NULL,
  `registrationDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(255) NOT NULL DEFAULT 'Registered',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_registrations_studentId` FOREIGN KEY (`studentId`) REFERENCES `Students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_registrations_eventId` FOREIGN KEY (`eventId`) REFERENCES `Events` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_student_event_registration` (`studentId`, `eventId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------
-- Table structure for Attendances
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS `Attendances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `registrationId` INT NOT NULL UNIQUE,
  `eventId` INT NOT NULL,
  `studentId` INT NOT NULL,
  `attendanceStatus` VARCHAR(255) NOT NULL DEFAULT 'Present',
  `markedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attendances_registrationId` FOREIGN KEY (`registrationId`) REFERENCES `Registrations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendances_eventId` FOREIGN KEY (`eventId`) REFERENCES `Events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendances_studentId` FOREIGN KEY (`studentId`) REFERENCES `Students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
