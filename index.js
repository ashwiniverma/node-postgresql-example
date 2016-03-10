//First we need to require the 'pg' module
var pg = require('pg');
//Next we define a connection string. This string follows a syntax to provide the
//connection protocol, username, password, host, post, and database name. For a
//localhost database it is simple
var connectionString = 'postgres://localhost/booktown';

//Now we access a PostgreSQL client
//There's a way to construct a single client, but I only recommend using the 'pg'
//module's client pooling feature.

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
