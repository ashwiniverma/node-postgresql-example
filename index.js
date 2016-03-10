//First we need to require the 'pg' module
var pg = require('pg');
//Next we define a connection string. This string follows a syntax to provide the
//connection protocol, username, password, host, post, and database name. For a
//localhost database it is simple
var connectionString = 'postgres://localhost/booktown';

//Now we access a PostgreSQL client
//There's a way to construct a single client, but I only recommend using the 'pg'
//module's client pooling feature.

//Step 2

//We pass the connect function our database connection string, and a callback function
//'onConnect'. We will now define that function.
pg.connect(connectionString, onConnect);

function onConnect(err, client, done) {
  //Err - This means something went wrong connecting to the database. The credentials
  //may be incorrect, the host down, and database doesn't exist.
  //For now, let's console.error this message if it exists and exit the process
  //with a non zero error code.
  if (err) {
    console.error(err);
    process.exit(1);
  }
  //Now we have a 'client' and a 'done' callback.
  //We can use the client to run sql queries for booktown.

  //For now let's end client
  client.end();
}

//Step 3
//We want to build a nice API for creating query code and functions to process
//the data from queries. Let's use a combination of functional programming and
//callbacks to acheive our API.
//For this example let's keep our feature set limited. We will build an api for
//selecting collections with an optional limit
var _ = require('underscore');
//Now we'll use the _.partial function to make a convience function called connectWithConnectionString.
var connectWithConnectionString =  _.bind(_.partial(pg.connect, connectionString), pg);
//connectWithConnectionString is still using pg.connect underneath. It will automatically apply the
//connection string each time we call connectWithConnectionString. So now the API is
//connectWithConnectionString(function(err, client, done) { //your code here })

//OK Cool! So now when we want a PostgreSQL client we only need to worry about the callback
//function. Can we do better? Yes, let's handle the connection 'err' object the same for
//every callback

function buildSelectQuery(tableName) {
  return ['select * from', tableName].join(' ');
}

function buildQueryClient(query) {
  return function(onQueryReturn) {
    connectWithConnectionString(function(err, client, done) {
      if (err) {
        return onQueryReturn(new Error(['Database Connection Failed with Error', err.toString()].join(' ')));
      } else {
        client.query(query, function(err, results) {
          onQueryReturn(err, results);
          client.end();
          done();
        });
      }
    });
  }
}

function selectAll(tableName) {
  return function(onSelectReturn) {
    var sql = buildSelectQuery(tableName);
    var queryClient = buildQueryClient(sql);
    queryClient(function(err, tableValues) {
      if (err) {
        return onSelectReturn(new Error(['Select all failed on', tableName, 'with error', err.toString()].join(' ')));
      } else {
        return onSelectReturn(null, tableValues);
      }
    });
  }
}

var selectAllShipments = selectAll('shipments');
selectAllShipments(function(err, shipments) {
  if (err) {
    //Handle select shipments failure;
    console.error(err)
  } else {
    console.log(shipments.rows);
  }
});
