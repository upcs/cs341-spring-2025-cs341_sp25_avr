/**
 * dbms_promise.js
 *
 * This file contains functions for accessing the MySQL database
 * which contains the Cheesecake order data.
 *
 * Updated by: Stelios Papoutsakis & Spencer Rose
 * Edited by Emma and Google. Sorry
 */

exports.version = '0.0.1';


const mysql = require('mysql');
const async = require('async');

//Changed so it's more secure and uses environment vars
var host = process.env.DB_HOST;
var database = process.env.DB_DATABASE;
var user = process.env.DB_USER;
var password = process.env.DB_PASSWORD;

/**
 * dbquery
 *
 * performs a given SQL query on the database and returns the results
 * to the caller
 *
 * @param query     the SQL query to perform (e.g., "SELECT * FROM ...")
 */
exports.dbquery = function(query_str) {
  return new Promise((resolve, reject) => {
    //var dbclient;
    //var results = null;

    //Initialize MySQL connection
    console.log("Attempting to create MySQL connection...");
    var dbclient = mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database,
    });

    //EMMA TEST
    //Connect to MySQL
    dbclient.connect((err) => {
      if (err) {
        console.log("Database connection failed:", err);
        return reject(new Error("Database connection failed"));
      }
      console.log("Successfully connected to the database!");
    });

    //query
    dbclient.query(query_str, (err, results) => {
      if (err) {
        console.log("Database query failed:", err);
        return reject(new Error("Query failed"));
      }
      console.log("Database query completed:", results);
      //Return results
      resolve(results);  
    });

    //ORIGINAL (Gave me grief. I google and found this and work.)
    //Basically all the callback things kept giving me problems. This is the only way
    //I could get it to work. Sorry.

    // dbclient.connect(function(err) {
    //     if (err) {
    //         console.log("Database connection failed:", err);
    //         callback(err, null);
    //     } else {
    //         console.log("Successfully connected to the database!");
    //         callback(null);
    //     }
    // });
    // async.waterfall([

    //     //Step 1: Connect to the database
    //     function (callback) {
    //         console.log("\n** creating connection.");
    //         dbclient = mysql.createConnection({
    //             host: host,
    //             user: user,
    //             password: password,
    //             database: database,
    //         });

    //         dbclient.connect(callback);
    //     },

    //     //Step 2: Issue query
    //     function (results, callback) {
    //         console.log("\n** retrieving data");
    //         dbclient.query(query_str, callback);
    //     },

    //     //Step 3: Collect results
    //     function (rows, fields, callback) {
    //         console.log("\n** dumping data:");
    //         results = rows;
    //         console.log("" + rows);
    //         callback(null);
    //     }

    // ],
    // // waterfall cleanup function
    // function (err, res) {
    //     if (err) {
    //         console.log("Database query failed.  sad");
    //         console.log(err);
    //         reject(new Error(err, null));
    //     } else {
    //         console.log("Database query completed.");
    //         resolve(results);
    //     }

    //     //close connection to database
    //     dbclient.end();

    // });

  });

}//function dbquery
