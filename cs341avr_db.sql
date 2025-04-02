/*!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.8-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: pdx0mysql00.campus.up.edu    Database: cs341-02
-- ------------------------------------------------------
-- Server version	10.3.39-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Content`
--

DROP TABLE IF EXISTS `Content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Content` (
  `buildingName` varchar(50) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `description` varchar(10000) DEFAULT NULL,
  `imagePath` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Content`
--

LOCK TABLES `Content` WRITE;
/*!40000 ALTER TABLE `Content` DISABLE KEYS */;
INSERT INTO `Content` VALUES
('chapel',1937,'St. Mary’s was constructed (1937) as the first Commons, the student cafeteria.  When the current dining facilities were built (1958), the St. Mary’s building was repurposed as the university chapel (1958-1985).','initialApp\\public\\archiveContent\\chapel\\1937.jpg'),
('chapel',1986,'Outgrowing St. Mary’s, The Chapel of Christ the Teacher was our first building designed and dedicated as a chapel. The Chapel of Christ the Teacher was dedicated October 5th 1986, the name of the chapel expresses an essential theme of the University of Portland mission.','initialApp\\public\\archiveContent\\chapel\\1986.jpg'),
('chapel',1996,'With the intention of maintaining the near linkage between the two buildings, a Marian Garden was planned to enclose the area joining the Chapel and St. Mary’s. This space for reflection was fulfilled in stages, with the Galati rosary garden (1996) and the Bell Tower Plaza (2009).','initialApp\\public\\archiveContent\\chapel\\1996.jpg'),
('chapel',2009,'The Bell Tower is our tallest structure at 106 feet; a landmark at a crossroads where faith, academics, and student life intersect. With fourteen bells — each named and baptized and with its own distinct musical voice– The Bell Tower chimes the hour and quarter-hours from 9 to 9 and sounds a call to prayer for Sunday and the daily noon Masses.','initialApp\\public\\archiveContent\\chapel\\2009.jpg'),
('chiles',1984,'The Chiles Center opened on October 20th, 1984. It was a 5,000 seat facility that was built to host concerts, lectures, conventions, spectator sports, as well as other campus and community events.','initialApppublicarchiveContentchiles1984.jpg'),
('chiles',1997,'Close-up view of the Chiles Center with a red dome. The dome was red from 1997 to 2008.','initialApppublicarchiveContentchiles1997.jpg');
/*!40000 ALTER TABLE `Content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Geo`
--

DROP TABLE IF EXISTS `Geo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Geo` (
  `buildingName` varchar(50) DEFAULT NULL,
  `latMax` double DEFAULT NULL,
  `latMin` double DEFAULT NULL,
  `longMax` double DEFAULT NULL,
  `longMin` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Geo`
--

LOCK TABLES `Geo` WRITE;
/*!40000 ALTER TABLE `Geo` DISABLE KEYS */;
INSERT INTO `Geo` VALUES
('shiley',45.5724,45.57132,-122.72718,-122.72872),
('mago',45.57373,45.57285,-122.72737,-122.72874),
('merlo',45.57554,45.57357,-122.72586,-122.72899),
('chapel',45.57153,45.57082,-122.72592,-122.72697),
('commons',45.57166,45.57026,-122.72643,-122.72828),
('waldschmidt',45.57216,45.571368,-122.72395,-122.72512),
('db',45.57294,45.572,-122.72401,-122.72585),
('shiley marcos',45.57241,45.5715,-122.7285,-122.72996),
('fields and scho',45.57641,45.57517,-122.73091,-122.73286),
('beauchamp',45.57584,45.57454,-122.72932,-122.73144),
('lund',45.57657,45.57529,-122.72885,-122.73091),
('chiles',45.5759,45.574082,-122.72764,-122.72985),
('baseball',45.57497,45.57297,-122.72798,-122.73084),
('library',45.57323,45.57231,-122.72599,-122.72739),
('phouse',45.57348,45.57261,-122.72496,-122.726158),
('plaza',45.57301,45.57242,-122.72542,-122.72644),
('franz',45.5732,45.57212,-122.72692,-122.72853),
('buckley',45.57276,45.57133,-122.7252,-122.72701),
('swindels',45.57163,45.57085,-122.72448,-122.72588),
('romanaggi',45.57217,45.57153,-122.72513,-122.72596);
/*!40000 ALTER TABLE `Geo` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-22 20:59:23
