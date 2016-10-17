'use strict';

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
    .alias('f', 'firstName')
    .describe('f', 'first name')
    .alias('l', 'lastName')
    .describe('l', 'last name')
    .alias('p', 'phone')
    .describe('p', 'phone number')
    .alias('e', 'email')
    .describe('e', 'email')
    .alias('a', 'action')
    .demand('a')
    .describe('a', 'action to take [update, create]')
    .argv;

if (args.action === 'create') {
   create(args);
} else if (args.action == 'update') {
   update(args);
} else {
    throw new Error('Action not supported');
}

function create(options) {
    let query = 'insert into customers(first_name, last_name, email, phone) values ($1, $2, $3, $4)';
    let args = [options.firstName, options.lastName, options.email, options.phone];
    runQuery(query, args, (err, results) => {
        if (err) {
            console.error(err);
        } else {
            console.log(results);
        }
        process.exit();
    })
}