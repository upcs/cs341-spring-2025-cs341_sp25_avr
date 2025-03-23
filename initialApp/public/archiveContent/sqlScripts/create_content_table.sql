CREATE TABLE Content (
  buildingName VARCHAR(50),
  year INT(11),
  description VARCHAR(10000),
  imagePath VARCHAR(100)
);

INSERT INTO Content (buildingName, year, description, imagePath)
VALUES
('chapel', 1937, 'St. Mary’s was constructed (1937) as the first Commons, the student cafeteria.  When the current dining facilities were built (1958), the St. Mary’s building was repurposed as the university chapel (1958-1985).', 'initialApp\public\archiveContent\chapel\1937.jpg'),
('chapel', 1986, 'Outgrowing St. Mary’s, The Chapel of Christ the Teacher was our first building designed and dedicated as a chapel. The Chapel of Christ the Teacher was dedicated October 5th 1986, the name of the chapel expresses an essential theme of the University of Portland mission.', 'initialApp\public\archiveContent\chapel\1986.jpg'),
('chapel', 1996, 'With the intention of maintaining the near linkage between the two buildings, a Marian Garden was planned to enclose the area joining the Chapel and St. Mary’s. This space for reflection was fulfilled in stages, with the Galati rosary garden (1996) and the Bell Tower Plaza (2009).', 'initialApp\public\archiveContent\chapel\1996.jpg'),
('chapel', 2009, 'The Bell Tower is our tallest structure at 106 feet; a landmark at a crossroads where faith, academics, and student life intersect. With fourteen bells — each named and baptized and with its own distinct musical voice– The Bell Tower chimes the hour and quarter-hours from 9 to 9 and sounds a call to prayer for Sunday and the daily noon Masses.', 'initialApp\public\archiveContent\chapel\2009.jpg'),
('chiles', 1984, 'The Chiles Center opened on October 20th, 1984. It was a 5,000 seat facility that was built to host concerts, lectures, conventions, spectator sports, as well as other campus and community events.', 'initialApp\public\archiveContent\chiles\1984.jpg'),
('chiles', 1997, 'Close-up view of the Chiles Center with a red dome. The dome was red from 1997 to 2008.', 'initialApp\public\archiveContent\chiles\1997.jpg');