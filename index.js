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
          done(err);
          onQueryReturn(err, results);
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

var errorCheck = function(cb) {
  return function(err, result) {
    if (err) {
      console.error(err);
      throw err;
    } else {
      cb(result);
    }
  }
}

var printRows = function(text) {
  return errorCheck(function(results) {
    console.log(results.rows);
    if (text) console.log(text);
  });
}

var selectAllShipments = selectAll('shipments');
selectAllShipments(printRows());

//Step 4 - Building on this API
//Now when you want to select all rows from other collections you can build
//a function using selectAll.
var selectAllBooks = selectAll('books')
selectAllBooks(printRows())
var selectAllAuthors = selectAll('authors')
selectAllAuthors(printRows());
//You get the idea. We use the selectAll function generating function to build
//specifically named functions. These functions could be made into methods on
//their appropriate objects.

//Author Function
function AuthorCtrl() {

}
AuthorCtrl.prototype.selectAll = selectAllAuthors;
//Try using the AuthorCtrl.selectAllMethod
var authorCtrl = new AuthorCtrl();
authorCtrl.selectAll(printRows('Im from the Author Controller'));

//Step 5 - Building a limit clause API
//If you take a look at our 'functional' functions and function returning
//functions, you'll notice that it's very specific to select all of a particular
//table. Let's build our functional API a little different now.

//In this API we want to build a runnable Query that will return at most N books
var selectAtMostNBooks = buildDynamicQuery([
  'select * from books',
  'limit $1'
]);

//Now we can call this function with the first parameter being our limit
var selectAtMost5Books = selectAtMostNBooks(5);
selectAtMost5Books(printRows('Select at most 5 books'));


//Ok great you say. Now how to we implement the buildDynamicQuery function?
//Each step we are generating another function
//First we take in the sql statements. We return a function that accepts the
//parameters. Running this function with the values for a query returns a function
//for actually executing the sql. Here you pass in the error/result handler.
//You'll notice because of closure properties we can capture the variables.
//We don't actually construct the sql query until the query is actually run.
function buildDynamicQuery(statements) {
  return function () {
    var parameters = _.toArray(arguments)
    return function (onQueryReturn) {
      var reg = new RegExp(/\$\d+/);
      var sql = statements.join(' ');
      _.each(parameters, function(p, i) {
        sql = sql.replace('$' + (i + 1), p);
      });
      var queryClient = buildQueryClient(sql);
      return queryClient(onQueryReturn);
    }
  }
}

//Step 6 building advanced functions
var getOurCostOfCurrentInventory = buildDynamicQuery([
  'select sum(cost * stock) from stock'
])(/* No parameters */);
getOurCostOfCurrentInventory(printRows('cost of inventory'))


var getAuthorNameByBookTitle = buildDynamicQuery([
  "select concat(authors.first_name, ' ', authors.last_name) as author from authors",
  "join books on books.author_id = authors.id",
  "where books.title like '$1'"
]);

var getVelveteenRabbitAuthor = getAuthorNameByBookTitle('The Velveteen Rabbit');
//or what you'd probably do with an API like this
getAuthorNameByBookTitle('The Velveteen Rabbit')(errorCheck(function(result){
  console.log(result.rows[0]);
}));


//This code will shutdown the 'pg' module's pool so the program exits
setTimeout(pg.end.apply(pg), 5000);
