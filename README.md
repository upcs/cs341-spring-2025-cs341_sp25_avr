
#AVR 125th UP Anniversary
The Campus History Web Application is an interactive web-based tool designed to showcase the University of Portland’s rich history. 
As part of the university’s 125th-anniversary celebration, this application provides users with historical images, facts, and 
stories about key campus locations. Using geolocation, users can receive contextual pop-ups as they explore the campus, 
offering an immersive journey through time.

=======
Website Link: https://upcs.github.io/cs341-spring-2025-cs341_sp25_avr/initialApp/public/index.html
[![codecov](https://codecov.io/gh/mckinler2/cs341-spring-2025-cs341_sp25_avr/graph/badge.svg?token=9YIMPTQY09)](https://codecov.io/gh/mckinler2/cs341-spring-2025-cs341_sp25_avr)

# Geo Database README

## Table of Contents

1. [Introduction](#introduction)
2. [Table Structure](#table-structure)
3. [Adding a New Row](#adding-a-new-row)
4. [Example INSERT Statement](#example-insert-statement)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Introduction

This README provides instructions on how to add a new row to the `Geo` database. The `Geo` database stores geographic information about buildings on a university campus.

## Table Structure

The `Geo` table has the following columns:

| Column Name | Data Type | Description |
| --- | --- | --- |
| buildingName | VARCHAR(50) | The name of the building |
| latMax | DOUBLE | The maximum latitude of the building |
| latMin | DOUBLE | The minimum latitude of the building |
| longMax | DOUBLE | The maximum longitude of the building |
| longMin | DOUBLE | The minimum longitude of the building |

## Adding a New Row

To add a new row to the `Geo` table, follow these steps:

1. **Determine the building name**: The building name should be a string that uniquely identifies the building. It should be in title case (e.g., "Shiley").
2. **Determine the latitude and longitude bounds**: The latitude and longitude bounds should be decimal values that represent the maximum and minimum coordinates of the building. The bounds should be in the WGS84 coordinate system.
3. **Use the correct data types**: The building name should be a string (VARCHAR(50)), and the latitude and longitude bounds should be decimal values (DOUBLE).
4. **Insert the data**: Use a SQL INSERT statement to add the data to the `Geo` table.

## Example INSERT Statement

INSERT INTO Geo (buildingName, latMax, latMin, longMax, longMin)
VALUES ('New Building', 45.12345, 45.12340, -122.12345, -122.12350);

## Best Practices

* **Use consistent naming conventions**: Building names should be in title case.
* **Use precise coordinates**: Latitude and longitude bounds should be precise to 5 decimal places.
* **Verify data accuracy**: Verify that the data is accurate and consistent with other sources.
* **Use standard units**: Use degrees for latitude and longitude values.
* **Avoid duplicate entries**: Ensure that each building name is unique.

## Troubleshooting

* **Error: Duplicate entry**: If you receive an error message indicating a duplicate entry, check that the building name is unique.
* **Error: Invalid data type**: If you receive an error message indicating an invalid data type, check that the data types match the table structure.
* **Error: Out of range values**: If you receive an error message indicating out of range values, check that the latitude and longitude values are within the valid range (-90 to 90 for latitude and -180 to 180 for longitude).
* **Data inconsistencies**: If you notice data inconsistencies, such as mismatched building names or coordinates, verify the data against other sources and correct any errors.

# Content Table SQL File

## Table of Contents

1. [Introduction](#introduction)
2. [Table Structure](#table-structure)
3. [Adding a New Row](#adding-a-new-row)
4. [Example INSERT Statement](#example-insert-statement)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Introduction

This README provides instructions on how to use the `content_table.sql` file to create and populate the `Content` table. The `Content` table stores information about buildings on a university campus.

## Table Structure

The `Content` table has the following columns:


| Column Name | Data Type | Description |
| --- | --- | --- |
| buildingName | VARCHAR(50) | The name of the building |
| year | INT(11) | The year associated with the content |
| description | VARCHAR(10000) | A description of the content |
| imagePath | VARCHAR(100) | The path to an image associated with the content |

## Adding a New Row

To add a new row to the `Content` table, follow these steps:


1. **Determine the building name**: The building name should be a string that uniquely identifies the building.
2. **Determine the year**: The year should be an integer that represents the year associated with the content.
3. **Determine the description**: The description should be a string that provides a brief description of the content.
4. **Determine the image path**: The image path should be a string that represents the path to an image associated with the content.
5. **Use the correct data types**: The building name and image path should be strings (VARCHAR), the year should be an integer (INT), and the description should be a string (VARCHAR).
6. **Insert the data**: Use a SQL INSERT statement to add the data to the `Content` table.

## Example INSERT Statement

INSERT INTO Content (buildingName, year, description, imagePath)
VALUES ('New Building', 2022, 'This is a new building on campus.', 'path//to//image.jpg');

## Best Practices

* **Use consistent naming conventions**: Building names should be in title case.
* **Use precise dates**: Years should be precise to the year.
* **Verify data accuracy**: Verify that the data is accurate and consistent with other sources.
* **Use standard file paths**: Image paths should be in a standard format.
* **Avoid duplicate entries**: Ensure that each building name and year combination is unique.
* **Use descriptive descriptions**: Descriptions should provide a clear and concise summary of the content.

## Troubleshooting

* **Error: Duplicate entry**: If you receive an error message indicating a duplicate entry, check that the building name and year are unique.
* **Error: Invalid data type**: If you receive an error message indicating an invalid data type, check that the data types match the table structure.
* **Error: Out of range values**: If you receive an error message indicating out of range values, check that the year is within a valid range.
* **Data inconsistencies**: If you notice data inconsistencies, such as mismatched building names or years, verify the data against other sources and correct any errors.
* **Image path errors**: If you receive an error message indicating an invalid image path, check that the image path is correct and the image exists.
