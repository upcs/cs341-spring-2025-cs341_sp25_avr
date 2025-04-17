[![codecov](https://codecov.io/gh/mckinler2/cs341-spring-2025-cs341_sp25_avr/graph/badge.svg?token=9YIMPTQY09)](https://codecov.io/gh/mckinler2/cs341-spring-2025-cs341_sp25_avr)

# Campus History Web Application

The **Campus History Web Application** is an interactive, web-based tool designed to showcase the rich history of the University of Portland. Developed as part of the university's 125th-anniversary celebration, this application offers users access to historical images, facts, and stories about key campus locations. By leveraging geolocation, users receive contextual pop-ups as they explore the campus, creating an immersive journey through time.

### Website Link:
[Campus History Web Application](http://cs341avr.campus.up.edu/)

## Geo Database

### Table of Contents

1. [Introduction](#introduction)
2. [Table Structure](#table-structure)
3. [Adding a New Row](#adding-a-new-row)
4. [Example INSERT Statement](#example-insert-statement)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

### Introduction

This section provides instructions on how to add a new row to the `Geo` database. The `Geo` database stores geographic information about buildings on the university campus.

### Table Structure

The `Geo` table has the following columns:

| Column Name   | Data Type   | Description                                   |
|---------------|-------------|-----------------------------------------------|
| buildingName  | VARCHAR(50) | The name of the building                      |
| lat           | DOUBLE      | The latitude of the building                  |
| lon           | DOUBLE      | The longitude of the building                 |
| radius        | DOUBLE      | The radius around the building                |

### Adding a New Row

To add a new row to the `Geo` table, follow these steps:

1. **Determine the building name**: The building name should be a string that uniquely identifies the building.
2. **Determine the latitude and longitude**: The latitude and longitude should be decimal values representing the coordinates of the building.
3. **Determine the radius**: The radius should be a decimal value representing the area around the building.
4. **Insert the data**: Use a SQL INSERT statement to add the data to the `Geo` table.

### Example INSERT Statement

```sql
INSERT INTO Geo (buildingName, lat, lon, radius)
VALUES ('New Building', 45.12345, -122.12345, 50);
```

### Best Practices

* **Use consistent naming conventions**: Building names should be in title case.
* **Use precise coordinates**: Latitude and longitude should be accurate.
* **Verify data accuracy**: Ensure that the data is consistent with other sources.
* **Use standard units**: Use degrees for latitude and longitude values.
* **Avoid duplicate entries**: Ensure that each building name is unique.

### Troubleshooting

* **Error: Duplicate entry**: Check that the building name is unique.
* **Error: Invalid data type**: Ensure that the data types match the table structure.
* **Error: Out of range values**: Verify that latitude and longitude values are within valid ranges.

## Content Database

### Table of Contents

1. [Introduction](#introduction-1)
2. [Table Structure](#table-structure-1)
3. [Adding a New Row](#adding-a-new-row-1)
4. [Example INSERT Statement](#example-insert-statement-1)
5. [Best Practices](#best-practices-1)
6. [Troubleshooting](#troubleshooting-1)

### Introduction

This section provides instructions on how to use the `Content` table. The `Content` table stores information about buildings on the university campus.

### Table Structure

The `Content` table has the following columns:

| Column Name   | Data Type   | Description                                   |
|---------------|-------------|-----------------------------------------------|
| buildingName  | VARCHAR(50) | The name of the building                      |
| year          | INT(11)     | The year associated with the content          |
| description   | VARCHAR(10000) | A description of the content                |
| imagePath     | VARCHAR(100) | The path to an image associated with the content |

### Adding a New Row

To add a new row to the `Content` table, follow these steps:

1. **Determine the building name**: The building name should be a string that uniquely identifies the building.
2. **Determine the year**: The year should be an integer representing the year associated with the content.
3. **Determine the description**: The description should provide a brief overview of the content.
4. **Determine the image path**: The image path should represent the location of an associated image.
5. **Insert the data**: Use a SQL INSERT statement to add the data to the `Content` table.

### Example INSERT Statement

```sql
INSERT INTO Content (buildingName, year, description, imagePath)
VALUES ('New Building', 2022, 'This is a new building on campus.', 'path/to/image.jpg');
```

### Best Practices

* **Use consistent naming conventions**: Building names should be in title case.
* **Use precise dates**: Years should be accurate.
* **Verify data accuracy**: Ensure that the data is consistent with other sources.
* **Use standard file paths**: Image paths should be in a standard format.
* **Avoid duplicate entries**: Ensure that each building name and year combination is unique.
* **Use descriptive descriptions**: Descriptions should provide a clear and concise summary of the content.

### Troubleshooting

* **Error: Duplicate entry**: Check that the building name and year are unique.
* **Error: Invalid data type**: Ensure that the data types match the table structure.
* **Error: Out of range values**: Verify that the year is within a valid range.
* **Data inconsistencies**: If you notice data inconsistencies, verify the data against other sources and correct any errors.
* **Image path errors**: Check that the image path is correct and the image exists.
```
