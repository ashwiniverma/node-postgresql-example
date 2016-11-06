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
            done(); //call done to release the client to the connection pool.
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
    .alias('i', 'id')
    .describe('i', 'customer id for an update')
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

function update(options) {
    if (!options.id) {
        throw new Error('id is required for an update');
    }
    let fieldsToUpdate = [];
    let valuesToUpdate = [];
    if (options.firstName) {
        fieldsToUpdate.push('first_name');
        valuesToUpdate.push(options.firstName);
    }
    if (options.lastName) {
        fieldsToUpdate.push('last_name');
        valuesToUpdate.push(options.lastName);
    }
    if (options.email) {
        fieldsToUpdate.push('email');
        valuesToUpdate.push(options.email);
    }
    if (options.phone) {
        fieldsToUpdate.push('phone');
        valuesToUpdate.push(options.phone);
    }

    if (fieldsToUpdate.length === 0 || valuesToUpdate.length === 0) {
        throw new Error('no fields to update');
    }
    let placeHolderParams = (_.map(valuesToUpdate, (v, i) => {
        return `$${i + 1}`;
    })).join(', ');
    let idWhereClause = `where id = $${valuesToUpdate.length + 1}`;
    valuesToUpdate.push(options.id);
    let query = `update customers set (${fieldsToUpdate.join(', ')}) = (${placeHolderParams}) ${idWhereClause}`;
    runQuery(query, valuesToUpdate, (err, result) => {
        if (err) {
            console.error(err);
        } else {
            console.log(result);
            if (result.rowCount === 0) {
                console.error('No record updated');
            }
        }
        process.exit();
    });
}