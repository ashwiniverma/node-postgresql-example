'use strict';

const pg = require('pg');
const async = require('async');
const _ = require('underscore');

let pool = new pg.Pool({
    host: 'localhost',
    database: 'booktown'
});

function runQuery(query, callback) {
    pool.connect((err, client, done) => {
        if (err) {
            //likely a connection error that will print to console.
            done();
            throw err;
        }
        client.query(query, (err, results) => {
           done();  //call done to release the client to the connection pool.
           callback(err, results); //make it the callers responsiblity for checking for query errors.
        });
    });
}

//Let's run all of the queries listed in the 'let's explore' section.

async.eachSeries([
   'select * from books',
   'select * from authors',
   'select title, first_name, last_name from books join authors on books.author_id = authors.id',
   "select title from authors join books on authors.id = books.author_id where authors.first_name = 'Mark' and authors.last_name = 'Lutz'",
   'select title, id, isbn from editions join books on editions.book_id = books.id',
   'select sum(cost * stock) as cost, sum(retail * stock) as retail_value from stock'
], (query, callback) => {
    console.log(`Running query: ${query}`);
    runQuery(query, (err, results) => {
        if (err) {
            console.error(`Error running query: ${err}`);
        } else {
            console.log('Rows from query');
            _.each(results.rows, (r) => {
                console.log(r);
            });
        }
        callback();
    });
}, (err) => {
    if (err) {
        throw err;
    }
    console.log('Finished running lets explore queries.');
    process.exit();
});