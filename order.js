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
    .alias('i', 'orderId')
    .describe('i', 'order id to operate on')
    .alias('b', 'bookId')
    .describe('b', 'book id to operate on')
    .alias('q', 'quantity')
    .describe('q', 'the quantity of the book')
    .alias('a', 'action')
    .demand('a')
    .describe('a', 'action to take [create, addItem, removeItem, updateItem, list, delete]')
    .argv;


switch (args.action) {
    case 'create':
        break;
    case 'addItem':
        break;
    case 'removeItem':
        break;
    case 'updateItem':
        break;
    case 'list':
        break;
    case 'delete':
        break;
    default:
        console.log('Action not supported');
}