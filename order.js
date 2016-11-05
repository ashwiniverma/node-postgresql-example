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

function printer(fieldsToPrint) {
    return function(err, results) {
        if (err) {
            console.error(err);
        } else {
            console.log(fieldsToPrint.join('\t'));
            console.log('--------------------------------');
            _.each(results.rows, (r) => {
                console.log((_.map(fieldsToPrint, (f) => {
                    return r[f];
                }).join('\t')));
            });
        }
        process.exit();
    }
}

function ensureRequired(map, fields, checkers) {
    if (fields.length !== checkers.length) {
        throw 'invalid fields and checkers';
    }
    let valid = _.all(fields, (f, i) => {
       return checkers[i](map[f]);
    });
    if (!valid) {
        throw 'checkers did not pass'
    }
}

try {
    switch (args.action) {
        case 'create':
            let query = 'insert into orders (created, creator) values ($1, $2) returning id';
            let params = [new Date().toISOString(), process.env.USER];
            runQuery(query, params, printer(['id']));
            break;
        case 'addItem':
            ensureRequired(args, ['orderId', 'bookId', 'quantity'], [_.isNumber, _.isNumber, _.isNumber]);
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
} catch (e) {
    console.error(e);
    process.exit(1);
}