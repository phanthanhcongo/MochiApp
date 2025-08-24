-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: mochi
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `en_contexts`
--

DROP TABLE IF EXISTS `en_contexts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `en_contexts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `en_word_id` bigint unsigned NOT NULL,
  `context_vi` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `en_contexts_en_word_id_foreign` (`en_word_id`),
  CONSTRAINT `en_contexts_en_word_id_foreign` FOREIGN KEY (`en_word_id`) REFERENCES `en_words` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `en_contexts`
--

LOCK TABLES `en_contexts` WRITE;
/*!40000 ALTER TABLE `en_contexts` DISABLE KEYS */;
INSERT INTO `en_contexts` VALUES (5,5,'Ví dụ sử dụng từ \'affect\' trong giao tiếp hàng ngày.','2025-08-11 04:45:23','2025-08-14 21:15:35'),(6,6,'Ví dụ sử dụng từ \'afford\' trong giao tiếp hàng ngày.','2025-08-11 04:45:23','2025-08-11 04:45:23'),(7,7,'Ví dụ sử dụng từ \'analyze\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(8,8,'Ví dụ sử dụng từ \'announce\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-14 02:27:49'),(9,9,'Ví dụ sử dụng từ \'apologize\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(10,10,'Ví dụ sử dụng từ \'apply\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(11,11,'Ví dụ sử dụng từ \'appreciate\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(12,12,'Ví dụ sử dụng từ \'approach\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(13,13,'Ví dụ sử dụng từ \'approve\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(14,14,'Ví dụ sử dụng từ \'argue\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(15,15,'Ví dụ sử dụng từ \'arrange\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(16,16,'Ví dụ sử dụng từ \'arrive\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(17,17,'Ví dụ sử dụng từ \'assist\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(18,18,'Ví dụ sử dụng từ \'assume\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(19,19,'Ví dụ sử dụng từ \'attract\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(20,20,'Ví dụ sử dụng từ \'avoid\' trong giao tiếp hàng ngày.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(21,21,'Táo thường dùng để ăn hoặc làm bánh.','2025-08-14 00:59:53','2025-08-14 00:59:53'),(22,22,'Táo thường dùng để ăn hoặc làm bánh.','2025-08-14 01:00:46','2025-08-14 01:00:46'),(27,27,'samurai','2025-08-14 01:10:28','2025-08-14 01:10:28');
/*!40000 ALTER TABLE `en_contexts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `en_daily_logs`
--

DROP TABLE IF EXISTS `en_daily_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `en_daily_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `reviewed_at` date NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `en_daily_logs_user_id_reviewed_at_unique` (`user_id`,`reviewed_at`),
  CONSTRAINT `en_daily_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `en_daily_logs`
--

LOCK TABLES `en_daily_logs` WRITE;
/*!40000 ALTER TABLE `en_daily_logs` DISABLE KEYS */;
INSERT INTO `en_daily_logs` VALUES (1,1,'2025-08-02',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(2,1,'2025-08-03',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(3,1,'2025-08-04',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(4,1,'2025-08-05',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(5,1,'2025-08-06',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(6,1,'2025-08-07',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(7,1,'2025-08-08',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(8,1,'2025-08-09',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(9,1,'2025-08-10',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(10,1,'2025-08-11',1,'2025-08-11 11:45:15','2025-08-11 11:45:15'),(12,2,'2025-08-11',1,'2025-08-11 09:03:16','2025-08-11 09:03:16'),(13,2,'2025-08-12',1,'2025-08-11 18:43:40','2025-08-11 18:43:40'),(14,2,'2025-08-19',1,'2025-08-19 00:33:43','2025-08-19 00:33:43');
/*!40000 ALTER TABLE `en_daily_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `en_example_exercises`
--

DROP TABLE IF EXISTS `en_example_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `en_example_exercises` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `example_id` bigint unsigned NOT NULL,
  `question_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'multiple_choice | fill_in_blank',
  `question_text` text COLLATE utf8mb4_unicode_ci,
  `blank_position` int DEFAULT NULL COMMENT 'Vị trí chèn ô trống nếu có',
  `answer_explanation` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `en_example_exercises_example_id_foreign` (`example_id`),
  CONSTRAINT `en_example_exercises_example_id_foreign` FOREIGN KEY (`example_id`) REFERENCES `en_examples` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `en_example_exercises`
--

LOCK TABLES `en_example_exercises` WRITE;
/*!40000 ALTER TABLE `en_example_exercises` DISABLE KEYS */;
INSERT INTO `en_example_exercises` VALUES (5,5,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Affect\' means ảnh hưởng in English.','2025-08-11 04:45:23','2025-08-11 04:45:23'),(6,6,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Afford\' means có đủ khả năng in English.','2025-08-11 04:45:23','2025-08-11 04:45:23'),(7,7,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Analyze\' means phân tích in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(8,8,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Announce\' means thông báo in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(9,9,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Apologize\' means xin lỗi in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(10,10,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Apply\' means nộp đơn, áp dụng in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(11,11,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Appreciate\' means đánh giá cao in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(12,12,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Approach\' means tiếp cận in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(13,13,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Approve\' means chấp thuận in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(14,14,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Argue\' means tranh luận in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(15,15,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Arrange\' means sắp xếp in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(16,16,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Arrive\' means đến nơi in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(17,17,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Assist\' means hỗ trợ in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(18,18,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Assume\' means giả định in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(19,19,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Attract\' means thu hút in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(20,20,'fill_in_blank','They need to ____ the situation carefully.',3,'\'Avoid\' means tránh in English.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(21,21,'fill_in_blank','She is eating ____ apple.',3,'Mạo từ \'an\' được dùng trước danh từ bắt đầu bằng nguyên âm.','2025-08-14 00:59:53','2025-08-14 00:59:53'),(22,22,'fill_in_blank','She is eating ____ apple.',3,'Mạo từ \'an\' được dùng trước danh từ bắt đầu bằng nguyên âm.','2025-08-14 01:00:46','2025-08-14 01:00:46'),(23,27,'FillInBlankPractice','samurai',NULL,'samurai','2025-08-14 01:10:28','2025-08-14 01:10:28'),(24,28,'FillInBlankPractice','They need to ____ the situation carefully.',3,'\'Affect\' means ảnh hưởng in English.','2025-08-14 02:27:28','2025-08-14 02:27:28'),(25,29,'FillInBlankPractice','They need to ____ the situation carefully.',3,'\'Affect\' means ảnh hưởng in English.','2025-08-14 02:27:30','2025-08-14 02:27:30'),(26,30,'FillInBlankPractice','They need to ____ the situation carefully.',3,'\'Announce\' means thông báo in English.','2025-08-14 02:27:49','2025-08-14 02:27:49'),(27,31,'FillInBlankPractice','They need to ____ the situation carefully.',3,'\'Affect\' means ảnh hưởng in English.','2025-08-14 21:15:35','2025-08-14 21:15:35');
/*!40000 ALTER TABLE `en_example_exercises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `en_examples`
--

DROP TABLE IF EXISTS `en_examples`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `en_examples` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `en_word_id` bigint unsigned NOT NULL,
  `sentence_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sentence_vi` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `en_examples_en_word_id_foreign` (`en_word_id`),
  CONSTRAINT `en_examples_en_word_id_foreign` FOREIGN KEY (`en_word_id`) REFERENCES `en_words` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `en_examples`
--

LOCK TABLES `en_examples` WRITE;
/*!40000 ALTER TABLE `en_examples` DISABLE KEYS */;
INSERT INTO `en_examples` VALUES (5,5,'They need to ____ the situation carefully.','Họ cần ảnh hưởng tình huống một cách cẩn thận.','2025-08-11 04:45:23','2025-08-11 04:45:23'),(6,6,'They need to ____ the situation carefully.','Họ cần có đủ khả năng tình huống một cách cẩn thận.','2025-08-11 04:45:23','2025-08-11 04:45:23'),(7,7,'They need to ____ the situation carefully.','Họ cần phân tích tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(8,8,'They need to ____ the situation carefully.','Họ cần thông báo tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(9,9,'They need to ____ the situation carefully.','Họ cần xin lỗi tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(10,10,'They need to ____ the situation carefully.','Họ cần nộp đơn, áp dụng tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(11,11,'They need to ____ the situation carefully.','Họ cần đánh giá cao tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(12,12,'They need to ____ the situation carefully.','Họ cần tiếp cận tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(13,13,'They need to ____ the situation carefully.','Họ cần chấp thuận tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(14,14,'They need to ____ the situation carefully.','Họ cần tranh luận tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(15,15,'They need to ____ the situation carefully.','Họ cần sắp xếp tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(16,16,'They need to ____ the situation carefully.','Họ cần đến nơi tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(17,17,'They need to ____ the situation carefully.','Họ cần hỗ trợ tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(18,18,'They need to ____ the situation carefully.','Họ cần giả định tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(19,19,'They need to ____ the situation carefully.','Họ cần thu hút tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(20,20,'They need to ____ the situation carefully.','Họ cần tránh tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(21,21,'She is eating an apple.','Cô ấy đang ăn một quả táo.','2025-08-14 00:59:53','2025-08-14 00:59:53'),(22,22,'She is eating an apple.','Cô ấy đang ăn một quả táo.','2025-08-14 01:00:46','2025-08-14 01:00:46'),(27,27,'samurai','samurai','2025-08-14 01:10:28','2025-08-14 01:10:28'),(28,5,'They need to ____ the situation carefully.','Họ cần ảnh hưởng tình huống một cách cẩn thận.','2025-08-14 02:27:28','2025-08-14 02:27:28'),(29,5,'They need to ____ the situation carefully.','Họ cần ảnh hưởng tình huống một cách cẩn thận.','2025-08-14 02:27:30','2025-08-14 02:27:30'),(30,8,'They need to ____ the situation carefully.','Họ cần thông báo tình huống một cách cẩn thận.','2025-08-14 02:27:49','2025-08-14 02:27:49'),(31,5,'They need to ____ the situation carefully.','Họ cần ảnh hưởng tình huống một cách cẩn thận.','2025-08-14 21:15:35','2025-08-14 21:15:35');
/*!40000 ALTER TABLE `en_examples` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `en_exercise_choices`
--

DROP TABLE IF EXISTS `en_exercise_choices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `en_exercise_choices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `exercise_id` bigint unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `en_exercise_choices_exercise_id_foreign` (`exercise_id`),
  CONSTRAINT `en_exercise_choices_exercise_id_foreign` FOREIGN KEY (`exercise_id`) REFERENCES `en_example_exercises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `en_exercise_choices`
--

LOCK TABLES `en_exercise_choices` WRITE;
/*!40000 ALTER TABLE `en_exercise_choices` DISABLE KEYS */;
INSERT INTO `en_exercise_choices` VALUES (17,5,'affect',1,'2025-08-11 04:45:23','2025-08-11 04:45:23'),(18,5,'ignore',0,'2025-08-11 04:45:23','2025-08-11 04:45:23'),(19,5,'delay',0,'2025-08-11 04:45:23','2025-08-11 04:45:23'),(20,5,'avoid',0,'2025-08-11 04:45:23','2025-08-11 04:45:23'),(21,6,'afford',1,'2025-08-11 04:45:23','2025-08-11 04:45:23'),(22,6,'ignore',0,'2025-08-11 04:45:23','2025-08-11 04:45:23'),(23,6,'delay',0,'2025-08-11 04:45:23','2025-08-11 04:45:23'),(24,6,'avoid',0,'2025-08-11 04:45:23','2025-08-11 04:45:23'),(25,7,'analyze',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(26,7,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(27,7,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(28,7,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(29,8,'announce',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(30,8,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(31,8,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(32,8,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(33,9,'apologize',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(34,9,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(35,9,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(36,9,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(37,10,'apply',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(38,10,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(39,10,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(40,10,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(41,11,'appreciate',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(42,11,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(43,11,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(44,11,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(45,12,'approach',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(46,12,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(47,12,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(48,12,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(49,13,'approve',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(50,13,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(51,13,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(52,13,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(53,14,'argue',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(54,14,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(55,14,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(56,14,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(57,15,'arrange',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(58,15,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(59,15,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(60,15,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(61,16,'arrive',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(62,16,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(63,16,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(64,16,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(65,17,'assist',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(66,17,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(67,17,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(68,17,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(69,18,'assume',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(70,18,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(71,18,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(72,18,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(73,19,'attract',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(74,19,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(75,19,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(76,19,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(77,20,'avoid',1,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(78,20,'ignore',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(79,20,'delay',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(80,20,'avoid',0,'2025-08-11 04:45:24','2025-08-11 04:45:24'),(81,21,'an',1,'2025-08-14 00:59:53','2025-08-14 00:59:53'),(82,21,'a',0,'2025-08-14 00:59:53','2025-08-14 00:59:53'),(83,21,'the',0,'2025-08-14 00:59:53','2025-08-14 00:59:53'),(84,22,'an',1,'2025-08-14 01:00:46','2025-08-14 01:00:46'),(85,22,'a',0,'2025-08-14 01:00:46','2025-08-14 01:00:46'),(86,22,'the',0,'2025-08-14 01:00:46','2025-08-14 01:00:46'),(87,23,'samurai',1,'2025-08-14 01:10:28','2025-08-14 01:10:28'),(88,24,'affect',1,'2025-08-14 02:27:28','2025-08-14 02:27:28'),(89,25,'affect',1,'2025-08-14 02:27:30','2025-08-14 02:27:30'),(90,26,'announce',1,'2025-08-14 02:27:49','2025-08-14 02:27:49'),(91,27,'affect',1,'2025-08-14 21:15:35','2025-08-14 21:15:35');
/*!40000 ALTER TABLE `en_exercise_choices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `en_words`
--

DROP TABLE IF EXISTS `en_words`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `en_words` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `word` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ipa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meaning_vi` text COLLATE utf8mb4_unicode_ci,
  `cefr_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'A1–C2',
  `level` int DEFAULT NULL,
  `last_reviewed_at` timestamp NULL DEFAULT NULL,
  `next_review_at` timestamp NULL DEFAULT NULL,
  `exampleEn` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `exampleVn` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `en_words_user_id_foreign` (`user_id`),
  CONSTRAINT `en_words_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `en_words`
--

LOCK TABLES `en_words` WRITE;
/*!40000 ALTER TABLE `en_words` DISABLE KEYS */;
INSERT INTO `en_words` VALUES (5,2,'affect','/əˈfekt/','ảnh hưởng','B1',1,'2025-08-11 20:23:06','2025-08-11 21:23:06','They need to affect the situation carefully.','Họ cần ảnh hưởng tình huống một cách cẩn thận.','2025-08-11 04:45:23','2025-08-14 21:15:35'),(6,2,'afford','/əˈfɔːd/','có đủ khả năng','B1',1,'2025-08-01 03:00:00','2025-08-10 02:20:06','They need to afford the situation carefully.','Họ cần có đủ khả năng tình huống một cách cẩn thận.','2025-08-11 04:45:23','2025-08-11 04:45:23'),(7,2,'analyze','/ˈænəlaɪz/','phân tích','B1',2,'2025-08-11 09:15:38','2025-08-11 15:15:38','They need to analyze the situation carefully.','Họ cần phân tích tình huống một cách cẩn thận.','2025-08-11 04:45:23','2025-08-11 09:19:12'),(8,2,'announce','/əˈnaʊns/','thông báo','B1',2,'2025-08-11 09:19:29','2025-08-11 15:19:29','They need to announce the situation carefully.','Họ cần thông báo tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-14 02:27:49'),(9,2,'apologize','/əˈpɒlədʒaɪz/','xin lỗi','B1',2,'2025-08-11 19:29:12','2025-08-12 01:29:12','They need to apologize the situation carefully.','Họ cần xin lỗi tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 19:29:17'),(10,2,'apply','/əˈplaɪ/','nộp đơn, áp dụng','B1',1,'2025-08-11 09:15:34','2025-08-11 10:15:34','They need to apply the situation carefully.','Họ cần nộp đơn, áp dụng tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 09:19:12'),(11,2,'appreciate','/əˈpriːʃieɪt/','đánh giá cao','B1',2,'2025-08-11 18:48:46','2025-08-12 00:48:46','They need to appreciate the situation carefully.','Họ cần đánh giá cao tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 18:50:00'),(12,2,'approach','/əˈprəʊtʃ/','tiếp cận','B1',3,'2025-08-11 09:48:30','2025-08-12 09:48:30','They need to approach the situation carefully.','Họ cần tiếp cận tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 09:10:42'),(13,2,'approve','/əˈpruːv/','chấp thuận','B1',2,'2025-08-19 00:33:16','2025-08-19 06:33:16','They need to approve the situation carefully.','Họ cần chấp thuận tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-19 00:33:43'),(14,2,'argue','/ˈɑːɡjuː/','tranh luận','B1',7,'2025-08-11 08:27:48','2025-09-10 08:27:48','They need to argue the situation carefully.','Họ cần tranh luận tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 09:01:08'),(15,2,'arrange','/əˈreɪndʒ/','sắp xếp','B1',1,'2025-08-01 03:00:00','2025-08-10 02:20:06','They need to arrange the situation carefully.','Họ cần sắp xếp tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 04:45:24'),(16,2,'arrive','/əˈraɪv/','đến nơi','B1',2,'2025-08-11 23:35:31','2025-08-12 05:35:31','They need to arrive the situation carefully.','Họ cần đến nơi tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 23:41:23'),(17,2,'assist','/əˈsɪst/','hỗ trợ','B1',7,'2025-08-11 09:48:30','2025-09-10 09:48:30','They need to assist the situation carefully.','Họ cần hỗ trợ tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 09:08:26'),(18,2,'assume','/əˈsjuːm/','giả định','B1',4,'2025-08-11 18:43:42','2025-08-14 18:43:42','They need to assume the situation carefully.','Họ cần giả định tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 18:50:00'),(19,2,'attract','/əˈtrækt/','thu hút','B1',2,'2025-08-11 09:36:58','2025-08-11 15:36:58','They need to attract the situation carefully.','Họ cần thu hút tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 09:37:24'),(20,2,'avoid','/əˈvɔɪd/','tránh','B1',2,'2025-08-11 09:19:26','2025-08-11 15:19:26','They need to avoid the situation carefully.','Họ cần tránh tình huống một cách cẩn thận.','2025-08-11 04:45:24','2025-08-11 09:19:35'),(21,2,'apple','/ˈæp.l̩/','quả táo','A1',1,'2025-08-14 00:59:53','2025-08-14 00:59:53','I like to eat an apple every morning.','Tôi thích ăn một quả táo mỗi sáng.','2025-08-14 00:59:53','2025-08-14 00:59:53'),(22,2,'apple','/ˈæp.l̩/','quả táo','A1',2,'2025-08-19 00:33:38','2025-08-19 06:33:38','I like to eat an apple every morning.','Tôi thích ăn một quả táo mỗi sáng.','2025-08-14 01:00:46','2025-08-19 00:33:43'),(27,2,'samurai','samurai','samurai','A1',1,'2025-08-14 01:10:28','2025-08-14 01:10:28','samurai','samurai','2025-08-14 01:10:28','2025-08-14 01:10:28');
/*!40000 ALTER TABLE `en_words` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jp_contexts`
--

DROP TABLE IF EXISTS `jp_contexts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jp_contexts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `jp_word_id` bigint unsigned NOT NULL,
  `context_vi` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jp_contexts_jp_word_id_foreign` (`jp_word_id`),
  CONSTRAINT `jp_contexts_jp_word_id_foreign` FOREIGN KEY (`jp_word_id`) REFERENCES `jp_words` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jp_contexts`
--

LOCK TABLES `jp_contexts` WRITE;
/*!40000 ALTER TABLE `jp_contexts` DISABLE KEYS */;
INSERT INTO `jp_contexts` VALUES (5,5,'Tôi đang học tiếng Nhật','2025-08-19 01:58:10','2025-08-19 01:58:10'),(6,5,'Học mỗi ngày giúp tiến bộ nhanh','2025-08-19 01:58:10','2025-08-19 01:58:10'),(7,7,'Từ \'trường học\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(8,8,'Từ \'giáo viên\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(9,9,'Từ \'học sinh\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(10,10,'Từ \'Nhật Bản\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(11,11,'Từ \'bạn bè\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(12,12,'Từ \'ăn\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(13,13,'Từ \'uống\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(14,14,'Từ \'mua\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(15,15,'Từ \'đi\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(16,16,'Từ \'đến\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(17,17,'Từ \'nói chuyện\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(18,18,'Từ \'nghe\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(19,19,'Từ \'xem, nhìn\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(20,20,'Từ \'viết\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(21,21,'Từ \'đọc\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(22,22,'Từ \'đứng\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(23,23,'Từ \'ngủ\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(24,24,'Từ \'thức dậy\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(25,25,'Từ \'về\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(26,26,'Từ \'làm việc\' rất phổ biến trong giao tiếp.','2025-08-19 02:02:42','2025-08-19 02:02:42');
/*!40000 ALTER TABLE `jp_contexts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jp_daily_logs`
--

DROP TABLE IF EXISTS `jp_daily_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jp_daily_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `reviewed_at` date NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `jp_daily_logs_user_id_reviewed_at_unique` (`user_id`,`reviewed_at`),
  CONSTRAINT `jp_daily_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jp_daily_logs`
--

LOCK TABLES `jp_daily_logs` WRITE;
/*!40000 ALTER TABLE `jp_daily_logs` DISABLE KEYS */;
INSERT INTO `jp_daily_logs` VALUES (1,2,'2025-08-19',1,'2025-08-19 02:08:40','2025-08-19 02:08:40'),(2,2,'2025-08-22',1,'2025-08-22 05:33:43','2025-08-22 05:33:43');
/*!40000 ALTER TABLE `jp_daily_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jp_example_exercises`
--

DROP TABLE IF EXISTS `jp_example_exercises`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jp_example_exercises` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `example_id` bigint unsigned NOT NULL,
  `question_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'multiple_choice | fill_in_blank | kanji_write',
  `question_text` text COLLATE utf8mb4_unicode_ci,
  `blank_position` int DEFAULT NULL COMMENT 'Vị trí chèn ô trống nếu có',
  `answer_explanation` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jp_example_exercises_example_id_foreign` (`example_id`),
  CONSTRAINT `jp_example_exercises_example_id_foreign` FOREIGN KEY (`example_id`) REFERENCES `jp_examples` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jp_example_exercises`
--

LOCK TABLES `jp_example_exercises` WRITE;
/*!40000 ALTER TABLE `jp_example_exercises` DISABLE KEYS */;
INSERT INTO `jp_example_exercises` VALUES (9,7,'fill_blank','毎日一時間（　）します',1,'Chỗ trống là 勉強','2025-08-19 01:58:10','2025-08-19 01:58:10'),(10,7,'meaning_choice','Nghĩa đúng của 勉強 là gì',0,'勉強 nghĩa là học','2025-08-19 01:58:10','2025-08-19 01:58:10'),(11,8,'fill_blank','毎日一時間（　）します',1,'Chỗ trống là 勉強','2025-08-19 01:58:10','2025-08-19 01:58:10'),(12,8,'meaning_choice','Nghĩa đúng của 勉強 là gì',0,'勉強 nghĩa là học','2025-08-19 01:58:10','2025-08-19 01:58:10'),(13,10,'fill_in_blank','学校を（　）します。',1,'‘学校’ là từ đúng vì có nghĩa \'trường học\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(14,11,'fill_in_blank','先生を（　）します。',1,'‘先生’ là từ đúng vì có nghĩa \'giáo viên\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(15,12,'fill_in_blank','学生を（　）します。',1,'‘学生’ là từ đúng vì có nghĩa \'học sinh\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(16,13,'fill_in_blank','日本を（　）します。',1,'‘日本’ là từ đúng vì có nghĩa \'Nhật Bản\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(17,14,'fill_in_blank','友達を（　）します。',1,'‘友達’ là từ đúng vì có nghĩa \'bạn bè\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(18,15,'fill_in_blank','食べるを（　）します。',1,'‘食べる’ là từ đúng vì có nghĩa \'ăn\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(19,16,'fill_in_blank','飲むを（　）します。',1,'‘飲む’ là từ đúng vì có nghĩa \'uống\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(20,17,'fill_in_blank','買うを（　）します。',1,'‘買う’ là từ đúng vì có nghĩa \'mua\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(21,18,'fill_in_blank','行くを（　）します。',1,'‘行く’ là từ đúng vì có nghĩa \'đi\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(22,19,'fill_in_blank','来るを（　）します。',1,'‘来る’ là từ đúng vì có nghĩa \'đến\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(23,20,'fill_in_blank','話すを（　）します。',1,'‘話す’ là từ đúng vì có nghĩa \'nói chuyện\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(24,21,'fill_in_blank','聞くを（　）します。',1,'‘聞く’ là từ đúng vì có nghĩa \'nghe\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(25,22,'fill_in_blank','見るを（　）します。',1,'‘見る’ là từ đúng vì có nghĩa \'xem, nhìn\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(26,23,'fill_in_blank','書くを（　）します。',1,'‘書く’ là từ đúng vì có nghĩa \'viết\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(27,24,'fill_in_blank','読むを（　）します。',1,'‘読む’ là từ đúng vì có nghĩa \'đọc\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(28,25,'fill_in_blank','立つを（　）します。',1,'‘立つ’ là từ đúng vì có nghĩa \'đứng\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(29,26,'fill_in_blank','寝るを（　）します。',1,'‘寝る’ là từ đúng vì có nghĩa \'ngủ\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(30,27,'fill_in_blank','起きるを（　）します。',1,'‘起きる’ là từ đúng vì có nghĩa \'thức dậy\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(31,28,'fill_in_blank','帰るを（　）します。',1,'‘帰る’ là từ đúng vì có nghĩa \'về\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(32,29,'fill_in_blank','働くを（　）します。',1,'‘働く’ là từ đúng vì có nghĩa \'làm việc\'.','2025-08-19 02:02:42','2025-08-19 02:02:42');
/*!40000 ALTER TABLE `jp_example_exercises` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jp_examples`
--

DROP TABLE IF EXISTS `jp_examples`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jp_examples` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `jp_word_id` bigint unsigned NOT NULL,
  `sentence_jp` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sentence_hira` text COLLATE utf8mb4_unicode_ci,
  `sentence_romaji` text COLLATE utf8mb4_unicode_ci,
  `sentence_vi` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jp_examples_jp_word_id_foreign` (`jp_word_id`),
  CONSTRAINT `jp_examples_jp_word_id_foreign` FOREIGN KEY (`jp_word_id`) REFERENCES `jp_words` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jp_examples`
--

LOCK TABLES `jp_examples` WRITE;
/*!40000 ALTER TABLE `jp_examples` DISABLE KEYS */;
INSERT INTO `jp_examples` VALUES (7,5,'毎日一時間勉強します','まいにちいちじかんべんきょうします','mainichi ichijikan benkyou shimasu','Mỗi ngày tôi học một giờ','2025-08-19 01:58:10','2025-08-19 01:58:10'),(8,5,'図書館で勉強するのが好きです','としょかんでべんきょうするのがすきです','toshokan de benkyou suru no ga suki desu','Tôi thích học ở thư viện','2025-08-19 01:58:10','2025-08-19 01:58:10'),(9,6,'今日は早く起きました','きょうははやくおきました','kyou wa hayaku okimashita','Hôm nay tôi dậy sớm','2025-08-19 01:58:10','2025-08-19 01:58:10'),(10,7,'学校を勉強します。','がっこうをべんきょうします。','gakkou o benkyou shimasu.','Tôi học từ \'trường học\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(11,8,'先生を勉強します。','せんせいをべんきょうします。','sensei o benkyou shimasu.','Tôi học từ \'giáo viên\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(12,9,'学生を勉強します。','がくせいをべんきょうします。','gakusei o benkyou shimasu.','Tôi học từ \'học sinh\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(13,10,'日本を勉強します。','にほんをべんきょうします。','nihon o benkyou shimasu.','Tôi học từ \'Nhật Bản\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(14,11,'友達を勉強します。','ともだちをべんきょうします。','tomodachi o benkyou shimasu.','Tôi học từ \'bạn bè\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(15,12,'食べるを勉強します。','たべるをべんきょうします。','taberu o benkyou shimasu.','Tôi học từ \'ăn\'.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(16,13,'飲むを勉強します。','のむをべんきょうします。','nomu o benkyou shimasu.','Tôi học từ \'uống\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(17,14,'買うを勉強します。','かうをべんきょうします。','kau o benkyou shimasu.','Tôi học từ \'mua\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(18,15,'行くを勉強します。','いくをべんきょうします。','iku o benkyou shimasu.','Tôi học từ \'đi\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(19,16,'来るを勉強します。','くるをべんきょうします。','kuru o benkyou shimasu.','Tôi học từ \'đến\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(20,17,'話すを勉強します。','はなすをべんきょうします。','hanasu o benkyou shimasu.','Tôi học từ \'nói chuyện\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(21,18,'聞くを勉強します。','きくをべんきょうします。','kiku o benkyou shimasu.','Tôi học từ \'nghe\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(22,19,'見るを勉強します。','みるをべんきょうします。','miru o benkyou shimasu.','Tôi học từ \'xem, nhìn\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(23,20,'書くを勉強します。','かくをべんきょうします。','kaku o benkyou shimasu.','Tôi học từ \'viết\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(24,21,'読むを勉強します。','よむをべんきょうします。','yomu o benkyou shimasu.','Tôi học từ \'đọc\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(25,22,'立つを勉強します。','たつをべんきょうします。','tatsu o benkyou shimasu.','Tôi học từ \'đứng\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(26,23,'寝るを勉強します。','ねるをべんきょうします。','neru o benkyou shimasu.','Tôi học từ \'ngủ\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(27,24,'起きるを勉強します。','おきるをべんきょうします。','okiru o benkyou shimasu.','Tôi học từ \'thức dậy\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(28,25,'帰るを勉強します。','かえるをべんきょうします。','kaeru o benkyou shimasu.','Tôi học từ \'về\'.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(29,26,'働くを勉強します。','はたらくをべんきょうします。','hataraku o benkyou shimasu.','Tôi học từ \'làm việc\'.','2025-08-19 02:02:42','2025-08-19 02:02:42');
/*!40000 ALTER TABLE `jp_examples` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jp_exercise_choices`
--

DROP TABLE IF EXISTS `jp_exercise_choices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jp_exercise_choices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `exercise_id` bigint unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jp_exercise_choices_exercise_id_foreign` (`exercise_id`),
  CONSTRAINT `jp_exercise_choices_exercise_id_foreign` FOREIGN KEY (`exercise_id`) REFERENCES `jp_example_exercises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jp_exercise_choices`
--

LOCK TABLES `jp_exercise_choices` WRITE;
/*!40000 ALTER TABLE `jp_exercise_choices` DISABLE KEYS */;
INSERT INTO `jp_exercise_choices` VALUES (25,9,'勉強',1,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(26,9,'散歩',0,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(27,9,'料理',0,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(28,10,'học',1,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(29,10,'chơi',0,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(30,10,'ngủ',0,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(31,11,'勉強',1,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(32,11,'散歩',0,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(33,11,'料理',0,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(34,12,'học',1,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(35,12,'chơi',0,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(36,12,'ngủ',0,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(37,13,'学校',1,'2025-08-19 02:02:41','2025-08-19 02:02:41'),(38,14,'先生',1,'2025-08-19 02:02:41','2025-08-19 02:02:41'),(39,15,'学生',1,'2025-08-19 02:02:41','2025-08-19 02:02:41'),(40,16,'日本',1,'2025-08-19 02:02:41','2025-08-19 02:02:41'),(41,17,'友達',1,'2025-08-19 02:02:41','2025-08-19 02:02:41'),(42,18,'食べる',1,'2025-08-19 02:02:41','2025-08-19 02:02:41'),(43,19,'飲む',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(44,20,'買う',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(45,21,'行く',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(46,22,'来る',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(47,23,'話す',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(48,24,'聞く',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(49,25,'見る',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(50,26,'書く',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(51,27,'読む',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(52,28,'立つ',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(53,29,'寝る',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(54,30,'起きる',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(55,31,'帰る',1,'2025-08-19 02:02:42','2025-08-19 02:02:42'),(56,32,'働く',1,'2025-08-19 02:02:42','2025-08-19 02:02:42');
/*!40000 ALTER TABLE `jp_exercise_choices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jp_hanviet`
--

DROP TABLE IF EXISTS `jp_hanviet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jp_hanviet` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `jp_word_id` bigint unsigned NOT NULL,
  `han_viet` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `explanation` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jp_hanviet_jp_word_id_foreign` (`jp_word_id`),
  CONSTRAINT `jp_hanviet_jp_word_id_foreign` FOREIGN KEY (`jp_word_id`) REFERENCES `jp_words` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jp_hanviet`
--

LOCK TABLES `jp_hanviet` WRITE;
/*!40000 ALTER TABLE `jp_hanviet` DISABLE KEYS */;
INSERT INTO `jp_hanviet` VALUES (5,5,'MIỄN CƯỜNG','Giải thích Hán Việt, nguồn gốc, ngữ nghĩa mở rộng','2025-08-19 01:58:10','2025-08-19 01:58:10'),(6,6,'TẢO','Chỉ thời điểm sớm hoặc tốc độ nhanh','2025-08-19 01:58:10','2025-08-19 01:58:10'),(7,7,'HỌC HIỆU','‘学校’ là từ trình độ N5, mang nghĩa trường học.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(8,8,'TIÊN SINH','‘先生’ là từ trình độ N5, mang nghĩa giáo viên.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(9,9,'HỌC SINH','‘学生’ là từ trình độ N5, mang nghĩa học sinh.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(10,10,'NHẬT BẢN','‘日本’ là từ trình độ N5, mang nghĩa Nhật Bản.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(11,11,'HỮU ĐẠT','‘友達’ là từ trình độ N5, mang nghĩa bạn bè.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(12,12,'THỰC','‘食べる’ là từ trình độ N5, mang nghĩa ăn.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(13,13,'ẨM','‘飲む’ là từ trình độ N5, mang nghĩa uống.','2025-08-19 02:02:41','2025-08-19 02:02:41'),(14,14,'MÃI','‘買う’ là từ trình độ N5, mang nghĩa mua.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(15,15,'HÀNH','‘行く’ là từ trình độ N5, mang nghĩa đi.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(16,16,'LAI','‘来る’ là từ trình độ N5, mang nghĩa đến.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(17,17,'THOẠI','‘話す’ là từ trình độ N5, mang nghĩa nói chuyện.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(18,18,'VĂN','‘聞く’ là từ trình độ N5, mang nghĩa nghe.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(19,19,'KIẾN','‘見る’ là từ trình độ N5, mang nghĩa xem, nhìn.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(20,20,'THƯ','‘書く’ là từ trình độ N5, mang nghĩa viết.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(21,21,'ĐỘC','‘読む’ là từ trình độ N5, mang nghĩa đọc.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(22,22,'LẬP','‘立つ’ là từ trình độ N5, mang nghĩa đứng.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(23,23,'TẨM','‘寝る’ là từ trình độ N5, mang nghĩa ngủ.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(24,24,'KHỞI','‘起きる’ là từ trình độ N5, mang nghĩa thức dậy.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(25,25,'QUY','‘帰る’ là từ trình độ N5, mang nghĩa về.','2025-08-19 02:02:42','2025-08-19 02:02:42'),(26,26,'ĐỘNG','‘働く’ là từ trình độ N5, mang nghĩa làm việc.','2025-08-19 02:02:42','2025-08-19 02:02:42');
/*!40000 ALTER TABLE `jp_hanviet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jp_strokes`
--

DROP TABLE IF EXISTS `jp_strokes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jp_strokes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `jp_word_id` bigint unsigned NOT NULL,
  `stroke_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL ảnh nét viết SVG/PNG',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jp_strokes_jp_word_id_foreign` (`jp_word_id`),
  CONSTRAINT `jp_strokes_jp_word_id_foreign` FOREIGN KEY (`jp_word_id`) REFERENCES `jp_words` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jp_strokes`
--

LOCK TABLES `jp_strokes` WRITE;
/*!40000 ALTER TABLE `jp_strokes` DISABLE KEYS */;
INSERT INTO `jp_strokes` VALUES (3,5,'https://example.com/strokes/benkyou.json','2025-08-19 01:58:10','2025-08-19 01:58:10'),(4,7,'https://example.com/stroke/gakkou.gif','2025-08-19 02:02:41','2025-08-19 02:02:41'),(5,8,'https://example.com/stroke/sensei.gif','2025-08-19 02:02:41','2025-08-19 02:02:41'),(6,9,'https://example.com/stroke/gakusei.gif','2025-08-19 02:02:41','2025-08-19 02:02:41'),(7,10,'https://example.com/stroke/nihon.gif','2025-08-19 02:02:41','2025-08-19 02:02:41'),(8,11,'https://example.com/stroke/tomodachi.gif','2025-08-19 02:02:41','2025-08-19 02:02:41'),(9,12,'https://example.com/stroke/taberu.gif','2025-08-19 02:02:41','2025-08-19 02:02:41'),(10,13,'https://example.com/stroke/nomu.gif','2025-08-19 02:02:41','2025-08-19 02:02:41'),(11,14,'https://example.com/stroke/kau.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(12,15,'https://example.com/stroke/iku.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(13,16,'https://example.com/stroke/kuru.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(14,17,'https://example.com/stroke/hanasu.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(15,18,'https://example.com/stroke/kiku.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(16,19,'https://example.com/stroke/miru.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(17,20,'https://example.com/stroke/kaku.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(18,21,'https://example.com/stroke/yomu.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(19,22,'https://example.com/stroke/tatsu.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(20,23,'https://example.com/stroke/neru.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(21,24,'https://example.com/stroke/okiru.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(22,25,'https://example.com/stroke/kaeru.gif','2025-08-19 02:02:42','2025-08-19 02:02:42'),(23,26,'https://example.com/stroke/hataraku.gif','2025-08-19 02:02:42','2025-08-19 02:02:42');
/*!40000 ALTER TABLE `jp_strokes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jp_words`
--

DROP TABLE IF EXISTS `jp_words`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jp_words` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `kanji` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reading_hiragana` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reading_romaji` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meaning_vi` text COLLATE utf8mb4_unicode_ci,
  `jlpt_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` int DEFAULT NULL,
  `last_reviewed_at` timestamp NULL DEFAULT NULL,
  `next_review_at` timestamp NULL DEFAULT NULL,
  `audio_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jp_words_user_id_foreign` (`user_id`),
  CONSTRAINT `jp_words_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jp_words`
--

LOCK TABLES `jp_words` WRITE;
/*!40000 ALTER TABLE `jp_words` DISABLE KEYS */;
INSERT INTO `jp_words` VALUES (5,2,'勉強','べんきょう','benkyou','học, việc học','N5',1,'2025-08-01 03:30:00','2025-08-05 03:30:00','https://example.com/audio/benkyou.mp3','2025-08-19 01:58:10','2025-08-19 01:58:10'),(6,2,'早い','はやい','hayai','sớm, nhanh','N5',1,NULL,NULL,NULL,'2025-08-19 01:58:10','2025-08-19 01:58:10'),(7,2,'学校','がっこう','gakkou','trường học','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/gakkou.mp3','2025-08-19 02:02:41','2025-08-19 02:02:41'),(8,2,'先生','せんせい','sensei','giáo viên','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/sensei.mp3','2025-08-19 02:02:41','2025-08-19 02:02:41'),(9,2,'学生','がくせい','gakusei','học sinh','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/gakusei.mp3','2025-08-19 02:02:41','2025-08-19 02:02:41'),(10,2,'日本','にほん','nihon','Nhật Bản','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/nihon.mp3','2025-08-19 02:02:41','2025-08-19 02:02:41'),(11,2,'友達','ともだち','tomodachi','bạn bè','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/tomodachi.mp3','2025-08-19 02:02:41','2025-08-19 02:02:41'),(12,2,'食べる','たべる','taberu','ăn','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/taberu.mp3','2025-08-19 02:02:41','2025-08-19 02:02:41'),(13,2,'飲む','のむ','nomu','uống','N5',2,'2025-08-19 02:08:32','2025-08-19 08:08:32','https://example.com/audio/nomu.mp3','2025-08-19 02:02:41','2025-08-19 02:08:40'),(14,2,'買う','かう','kau','mua','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/kau.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(15,2,'行く','いく','iku','đi','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/iku.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(16,2,'来る','くる','kuru','đến','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/kuru.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(17,2,'話す','はなす','hanasu','nói chuyện','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/hanasu.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(18,2,'聞く','きく','kiku','nghe','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/kiku.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(19,2,'見る','みる','miru','xem, nhìn','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/miru.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(20,2,'書く','かく','kaku','viết','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/kaku.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(21,2,'読む','よむ','yomu','đọc','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/yomu.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(22,2,'立つ','たつ','tatsu','đứng','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/tatsu.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(23,2,'寝る','ねる','neru','ngủ','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/neru.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(24,2,'起きる','おきる','okiru','thức dậy','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/okiru.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42'),(25,2,'帰る','かえる','kaeru','về','N5',2,'2025-08-19 02:08:37','2025-08-19 08:08:37','https://example.com/audio/kaeru.mp3','2025-08-19 02:02:42','2025-08-19 02:08:40'),(26,2,'働く','はたらく','hataraku','làm việc','N5',1,'2025-07-29 01:14:07','2025-08-01 01:14:07','https://example.com/audio/hataraku.mp3','2025-08-19 02:02:42','2025-08-19 02:02:42');
/*!40000 ALTER TABLE `jp_words` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000001_create_cache_table',1),(2,'2014_10_12_000000_create_users_table',1),(3,'2014_10_12_100000_create_password_reset_tokens_table',1),(4,'2019_08_19_000000_create_failed_jobs_table',1),(5,'2019_12_14_000001_create_personal_access_tokens_table',1),(6,'2025_07_25_165853_create_en_words_table',1),(7,'2025_07_25_165854_create_en_examples_table',1),(8,'2025_07_25_165855_create_en_contexts_table',1),(9,'2025_07_25_165858_create_en_example_exercises_table',1),(10,'2025_07_25_165859_create_en_exercise_choices_table',1),(11,'2025_07_27_032436_create_jp_words_table',1),(12,'2025_07_27_033747_create_jp_examples_table',1),(13,'2025_07_27_034058_create_jp_contexts_table',1),(14,'2025_07_27_034236_create_jp_han_viets_table',1),(15,'2025_07_27_034405_create_jp_strokes_table',1),(16,'2025_07_27_034907_create_jp_example_exercises_table',1),(17,'2025_07_27_035014_create_jp_exercise_choices_table',1),(18,'2025_08_07_040721_create_jp_daily_logs_table',1),(19,'2025_08_09_035819_create_sessions_table',1),(20,'2025_08_11_081413_create_en_daily_logs_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',2,'api-token','f5eaa1c6ac400d509cd100db659626d3374479fece2d296b377b6b328039f410','[\"*\"]','2025-08-11 08:07:59',NULL,'2025-08-11 04:45:54','2025-08-11 08:07:59'),(2,'App\\Models\\User',2,'api-token','1f696a64935fc7c2aa56a9ddf4940d838acceafa766f4eea2ff8f34d588b80ee','[\"*\"]','2025-08-19 01:52:34',NULL,'2025-08-11 08:10:45','2025-08-19 01:52:34'),(3,'App\\Models\\User',2,'api-token','927300430e2d5454b9a8b825e922fa6e7dc6301141fb422ca589922c3fe77723','[\"*\"]','2025-08-14 21:14:49',NULL,'2025-08-13 23:17:37','2025-08-14 21:14:49'),(4,'App\\Models\\User',2,'api-token','cebfef9c0289e92e675e49d497a99d94f9ffa4b8225335c5c792a7ed9994dcdb','[\"*\"]','2025-08-19 00:43:59',NULL,'2025-08-14 21:15:08','2025-08-19 00:43:59'),(5,'App\\Models\\User',2,'api-token','8184b6720a0789ab42b47062e92a23c7ae3f1276ddd58f17f944286344be5af5','[\"*\"]','2025-08-19 00:45:40',NULL,'2025-08-19 00:44:37','2025-08-19 00:45:40'),(6,'App\\Models\\User',2,'api-token','3d30f7cfbcc3aa3c96a8c6ae5e94061c6406291d92d7a11faa463183f996b41d','[\"*\"]','2025-08-19 01:03:36',NULL,'2025-08-19 01:00:43','2025-08-19 01:03:36'),(7,'App\\Models\\User',2,'api-token','65922ea43ae43cda6b67d998e4ff0f5ad5eaaf856d6083d5b78bd2a115398a1b','[\"*\"]','2025-08-19 01:03:46',NULL,'2025-08-19 01:03:44','2025-08-19 01:03:46'),(8,'App\\Models\\User',2,'api-token','ed0eaf4463b757314ddeaa2bfd86091a927a35cbae85c2f02619da74cec5c42f','[\"*\"]','2025-08-22 09:50:21',NULL,'2025-08-19 01:03:56','2025-08-22 09:50:21'),(9,'App\\Models\\User',2,'api-token','a71bc2221792ce9f77ebb2a0abf6e25e0efe27e3e692fef1bf38af50661f7340','[\"*\"]','2025-08-22 10:44:26',NULL,'2025-08-22 10:44:25','2025-08-22 10:44:26'),(10,'App\\Models\\User',2,'api-token','ce1ea67c54447b8530fb3a6d6438b57a137678691b07122aa959c939c141d001','[\"*\"]','2025-08-22 10:44:42',NULL,'2025-08-22 10:44:42','2025-08-22 10:44:42');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('zmikrjcQErWS4xmSdrRgEN7INsWPSQRCqHH3RXR4',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiVW1IRnFENDZrVGNpUHNHM0VZS29Xc0ZNb1J1ZFRHYjdMVnlSZDc3SyI7czoyMjoiUEhQREVCVUdCQVJfU1RBQ0tfREFUQSI7YTowOnt9czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1755884662);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user' COMMENT 'user | admin',
  `learning_language` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en' COMMENT 'Ngôn ngữ đang học: en | jp',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@example.com','$2y$12$WL/tdUpt.DaMogsehipUCOzGbbN1ew3KN.zdaI9NJ8oREm6BWwHzm','admin','en',NULL,'2025-08-11 04:45:13','2025-08-11 04:45:13'),(2,'user123','user123@example.com','$2y$12$bdALBCuM738XcwgruwpJsewgQQBdvQiP8uqFlb3vu/IRuEQPm6yhi','user','en',NULL,'2025-08-11 04:45:13','2025-08-22 09:22:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-23 23:45:05
