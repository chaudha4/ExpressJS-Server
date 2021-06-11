const CosmosClient = require("@azure/cosmos").CosmosClient;

require("dotenv").config(); // load .env file into env variables.
const endpoint = process.env.endpoint;
const key = process.env.key;
const databaseId = process.env.database;


const partitionKey = { kind: "Hash", paths: ["/partitionKey"] };

const options = {
  endpoint: endpoint,
  key: key,
  userAgentSuffix: "MessageBoardDatabase",
};

const client = new CosmosClient(options);

/**
 * Create the database if it does not exist
 */
exports.createDatabase = async function createDatabase(req, res, next) {
  const { database } = await client.databases.createIfNotExists({
    id: databaseId,
  });
  console.log(`Created database:\n${database.id}\n`);
  res.send(`Created database:\n${database.id}\n`);
};

/**
 * Read the database definition
 */
exports.readDatabase = async function readDatabase(req, res, next) {
  const { resource: databaseDefinition } = await client
    .database(databaseId)
    .read();
  console.log(`Reading database:\n${databaseDefinition.id}\n`);
  res.send(`Reading database:\n${JSON.stringify(databaseDefinition)}\n`);
};

/**
 * Create the container if it does not exist
 * curl -X POST http://localhost:4000/api/boards/mesg2
 */
exports.createBoard = async function (req, res, next) {
  console.log(req.method, req.url, req.params, req.body, req.query);

  board = req.params.board;
  if (!board) {
    res.send(`Message board not specified`);
    return;
  }

  try {
    const { container } = await client
      .database(databaseId)
      .containers.createIfNotExists({
        id: board,
        partitionKey,
      });
    console.log("Created container", container);
    res.send(`Created Board ${board}`);
  } catch (err) {
    console.log(err);
    res.send(`Message board could not be created`);
  }
};

/**
 * Read the container definition
 * curl -X GET  http://localhost:4000/api/boards/mesg
 */
exports.getBoard = async function (req, res, next) {
  console.log(req.method, req.url, req.params, req.body, req.query);

  if (!req.params.board) {
    res.send(`Message board name invalid`);
    return;
  }

  try {
    const { resource: containerDefinition } = await client
      .database(databaseId)
      .container(req.params.board)
      .read();
    console.log(`Reading container: ${JSON.stringify(containerDefinition)}\n`);
    res.send(`Reading container: ${containerDefinition.id}\n`);
  } catch (err) {
    console.log(err);
    res.send(`Message board not found\n`);
  }
};

/**
 * Delete Board if it exists
 * curl -X DELETE  http://localhost:4000/api/boards/mesg2
 */

exports.deleteBoard = async function (req, res, next) {
  console.log("Called", req.method, req.url, req.params, req.body, req.query);
  board = req.params.board;
  if (!board) {
    res.send(`Message board not specified`);
    return;
  }
  try {
    await client.database(databaseId).container(board).delete();

    console.log("deleteBoard", board);

    res.send(`deleted ${board}`);
  } catch (err) {
    console.log(err);
    res.send(JSON.stringify(err));
  }
};

/**
 * Get all the threads in an existing board
 */
exports.getThreads = async function (req, res, next) {
  console.log("Called", req.method, req.url, req.params, req.body, req.query);

  if (!req.params.board) {
    res.send(`Message board name invalid`);
    return;
  }

  try {
    const { resources: results } = await client
      .database(databaseId)
      .container(req.params.board)
      .items.readAll()
      .fetchAll();

    for (var queryResult of results) {
      let resultString = JSON.stringify(queryResult);
      console.log(`\tQuery returned ${resultString}\n`);
    }

    res.send(results);
  } catch (err) {
    console.log(err);
    res.send(`Error getting threads`);
  }
};

/**
 * Add a new thread in an existing board
 * curl -X POST -d text="This is a test message" -d delete_password="123"  http://localhost:4000/api/threads/mesg1
 */
exports.createThread = async function (req, res, next) {
  console.log("Called", req.method, req.url, req.params, req.body, req.query);

  if (!req.params.board) {
    res.send(`Message board name invalid`);
    return;
  }

  const threadDetails = {};

  if (req.body.text) {
    threadDetails.text = req.body.text;
  }
  if (req.body.delete_password) {
    threadDetails.delete_password = req.body.delete_password;
  }
  if (req.body.reported) {
    if (req.body.reported === "true") {
      threadDetails.reported = true;
    } else {
      threadDetails.reported = false;
    }
  }

  threadDetails.bumped_on = new Date();
  threadDetails.created_on = new Date();
  threadDetails.replies = [];

  try {
    const { results } = await client
      .database(databaseId)
      .container(req.params.board)
      .items.upsert(threadDetails);

    res.send(results);
  } catch (err) {
    console.log(err);
    res.send(`Error creating thread`);
  }
};

/**
 * Update an exisitng thread.
 * curl -X PUT -d text="-------" -d delete_password="$$$"  http://localhost:4000/api/threads/mesg1
 */
exports.updateThread = async function (req, res, next) {
  console.log(
    "updateThread",
    req.method,
    req.url,
    req.params,
    req.body,
    req.query
  );

  if (!req.params.board) {
    res.send(`Message board name invalid`);
    return;
  }

  var toFind = "";

  if (req.body.text) {
    toFind = req.body.text;
  } else {
    res.send(`Thread Text invalid`);
    return;
  }

  // https://docs.microsoft.com/en-us/javascript/api/overview/azure/cosmos-readme?view=azure-node-latest#query-the-database
  const querySpec = {
    query: "SELECT * FROM c WHERE c.text = @text",
    parameters: [
      {
        name: "@text",
        value: toFind,
      },
    ],
  };

  const threadDetails = {};

  if (req.body.text) {
    threadDetails.text = req.body.text;
  }
  if (req.body.delete_password) {
    threadDetails.delete_password = req.body.delete_password;
  }
  if (req.body.reported) {
    if (req.body.reported === "true") {
      threadDetails.reported = true;
    } else {
      threadDetails.reported = false;
    }
  }

  threadDetails.bumped_on = new Date();
  threadDetails.created_on = new Date();
  threadDetails.replies = [];

  try {
    const { resources: results } = await client
      .database(databaseId)
      .container(req.params.board)
      .items.query(querySpec)
      .fetchAll();

    if (results) {
        threadDetails.id = results[0].id
        const { item } = await client
        .database(databaseId)
        .container(req.params.board)
        .item(results[0].id)
        .replace(threadDetails);

        console.log(item);
    }
    
    console.log(results);
    res.send(results);
  } catch (err) {
    console.log(err);
    res.send(`Error updating thread`);
  }
};


/**
 * 
 */