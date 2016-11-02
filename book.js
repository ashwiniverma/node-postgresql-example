'use strict';

const _ = require('underscore');

//Database functions
const pg = require('pg');

let pool = new pg.Pool({
    host: 'localhost',
    database: 'booktown'
});

function runQuery(query, argsArray, callback) {
    pool.connect((err, client, done) => {
        if (err) {
            //likely a connection error that will print to console.
            done();
            throw err;
        }
        client.query(query, argsArray, (err, results) => {
           done();  //call done to release the client to the connection pool.
           callback(err, results); //make it the callers responsiblity for checking for query errors.
        });
    });
}

const yargs = require('yargs');

const args = yargs
    .alias('a', 'action')
    .demand('a')
    .describe('a', 'action to take [list]')
    .argv;


if (args.action === 'list') {
    runQuery('select id, title from books', [], (err, results) => {
       if (err) {
           throw err;
       }
       console.log('id', 'title');
       _.each(results.rows, (r) => {
           console.log(r.id, r.title);
       });
       process.exit();
    });
}
