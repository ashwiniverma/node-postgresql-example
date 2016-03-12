//First we 'require' the 'pg' module
var pg = require('pg');
//Next we define a connection string. The string contains the
connection protocol, username, password, host, post, and database name.

For a
//localhost database it is simple
var connectionString = 'postgres://localhost/booktown';

//Now we access a PostgreSQL client


//We use the 'pg' modules' recommended client pooling API

//Step 2

//We pass the connect function our database connection string, and a callback function
//'onConnect'. We will now define that function.
pg.connect(connectionString, onConnect);

function onConnect(err, client, done) {
  //Err - This means something went wrong connecting to the database.
  if (err) {
    console.error(err);
    process.exit(1);
  }

  //For now let's end client
  client.end();
}

//Step 3
//An API for selecting all or some members of a collection.

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

//Selects all of the supplied tableName
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

//Convience function to handle errors in callback functions.
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

//Handles callback errors using `errorCheck` and printRows with
//optional text.
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
//named functions. On objects, these functions become methods.

//Author Function
function AuthorCtrl() {

}
AuthorCtrl.prototype.selectAll = selectAllAuthors;
//Try using the AuthorCtrl.selectAllMethod
var authorCtrl = new AuthorCtrl();
authorCtrl.selectAll(printRows('Im from the Author Controller'));

//Step 5 - Building a limit clause API
//If you take a look at our 'functional' functions and function returning
//functions, you'll notice that it's specific to select all a particular
//table. Let's build our functional API a little different now.

//In this API we want to build a Query that returns at most N books
var selectAtMostNBooks = buildDynamicQuery([
  'select * from books',
  'limit $1'
]);

//Now we call this function with the limit parameter.
var selectAtMost5Books = selectAtMostNBooks(5);
selectAtMost5Books(printRows('Select at most 5 books'));
//We build a function that accepts SQL statements. It returns
//a function that accepts query parameters. It returns a function
//to query. It accepts a callback function to handle query return values.
//Closure properties capture the variables. The SQL string isn't //constructed until query execution.

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
//You don't have to be so specific with function names.
getAuthorNameByBookTitle('The Velveteen Rabbit')(errorCheck(function(result){
  console.log(result.rows[0]);
}));


//This code ends the 'pg' module's pool after five seconds.
//The process then exits because their are no more event listeners.
setTimeout(pg.end.apply(pg), 5000);
