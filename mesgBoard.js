const CosmosClient = require("@azure/cosmos").CosmosClient;

require("dotenv").config(); // load .env file into env variables.
const endpoint = process.env.endpoint;
const key = process.env.key;
const databaseId = process.env.database;
const containerId = databaseId + "-container1";

/**
 * We will use Board Name as parition key to minimize Azure costs.
 * At first, I was using a new container for every new board. However,
 * this is expensive since each container RU/s cost is added up towards
 * database costs and the free tier only allows 1k RU/s.
 *
 * So, a cheaper option is to just use one container. Save the board names
 * as a partition key which improves performance as well since all board messages
 * will be keep in same partition (instead of a container in previous scheme)
 */

const partitionKey = { kind: "Hash", paths: ["/boardName"] };

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
  try {
    // Create DB
    const { database } = await client.databases.createIfNotExists({
      id: databaseId,
    });

    // Create Single Container
    const { container } = await client
      .database(databaseId)
      .containers.createIfNotExists({
        id: containerId,
        partitionKey,
      });

    console.log("Created DB and container", container);
    res.send(`Request completed.`);
  } catch (err) {
    console.log(err);
    res.status(404).type("text").send(`Request Failed`);
  }
};

/**
 * Read the database definition
 */
exports.readDatabase = async function readDatabase(req, res, next) {
  try {
    const { resource: databaseDefinition } = await client
      .database(databaseId)
      .read();
    console.log(`Reading database:\n${databaseDefinition.id}\n`);
    res.send(`Reading database:\n${JSON.stringify(databaseDefinition)}\n`);
  } catch (err) {
    console.log(err);
    res.status(404).type("text").send(`Request Failed`);
  }
};

/**
 * Create the container if it does not exist
 * curl -X POST http://localhost:4000/api/boards/mesg2
 */
exports.createBoard = async function (req, res, next) {
  console.log(req.method, req.url, req.params, req.body, req.query);

  res
    .status(404)
    .type("text")
    .send("Board creation not supported. Create a message instead.");
};

/**
 * Read the container definition
 * curl -X GET  http://localhost:4000/api/boards/mesg
 */
exports.getBoard = async function (req, res, next) {
  console.log(req.method, req.url, req.params, req.body, req.query);

  res.status(404).type("text").send("Operation not supported.\n");
};

/**
 * Delete Board if it exists
 * curl -X DELETE  http://localhost:4000/api/boards/immigration
 */

exports.deleteBoard = async function (req, res, next) {
  console.log("Called", req.method, req.url, req.params, req.body, req.query);
  board = req.params.board;
  if (!board) {
    res.send(`Message board not specified`);
    return;
  }

  const querySpec = {
    query: "SELECT * FROM c WHERE c.boardName = @text",
    parameters: [
      {
        name: "@text",
        value: req.params.board,
      },
    ],
  };

  //https://github.com/Azure/azure-cosmos-js/blob/master/samples/ItemManagement.ts
  try {
    const { resources: items } = await client
      .database(databaseId)
      .container(containerId)
      .items.query(querySpec)
      .fetchAll();

    for (var item of items) {
      toDel = client
        .database(databaseId)
        .container(containerId)
        .item(item.id, req.params.board);

      console.log("\nDeleting Item", toDel);
      await toDel.delete();
    }
    console.log("deleteBoard", board);

    res.send(`deleted ${board}`);
  } catch (err) {
    console.log(err);
    res.status(404).type("text").send("Delete Failed.");
  }
};

/**
 * Get all threads - Test functions
 * curl -X GET  http://localhost:4000/api/test/getAllThreads
 */
exports.getAllThreads = async function (req, res, next) {
  console.log("Called", req.method, req.url, req.params, req.body, req.query);

  try {
    const { resources: results } = await client
      .database(databaseId)
      .container(containerId)
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
 * Get all the threads in an existing board
 */
exports.getThreads = async function (req, res, next) {
  console.log("Called", req.method, req.url, req.params, req.body, req.query);

  if (!req.params.board) {
    res.send(`Message board name invalid`);
    return;
  }

  const querySpec = {
    query: "SELECT * FROM c WHERE c.boardName = @text",
    parameters: [
      {
        name: "@text",
        value: req.params.board,
      },
    ],
  };

  try {
    const { resources: results } = await client
      .database(databaseId)
      .container(containerId)
      .items.query(querySpec)
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
 * Add a new thread in an existing board named immigation
 * curl -X POST -d text="Another thread" -d delete_password="11123"  http://localhost:4000/api/threads/immigration
 */
exports.createThread = async function (req, res, next) {
  console.log("Called", req.method, req.url, req.params, req.body, req.query);

  const threadDetails = returnEmptyThread();

  if (!req.params.board) {
    res.send(`Message board name invalid`);
    return;
  } else {
    threadDetails.boardName = req.params.board;
  }

  if (req.body.text) {
    threadDetails.text = req.body.text;
  }
  if (req.body.delete_password) {
    threadDetails.delete_password = req.body.delete_password;
  }
  if (req.body.reported && req.body.reported === "true") {
    threadDetails.reported = true;
  }

  try {
    const { results } = await client
      .database(databaseId)
      .container(containerId)
      .items.upsert(threadDetails);

    res.send(results);
  } catch (err) {
    console.log(err);
    res.send(`Error creating thread`);
  }
};

/**
 * Update an existing thread.
 * curl -X PUT -d text="US Visa is approved" -d delete_password="newpassword123"  http://localhost:4000/api/threads/visa
 *
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

  if (!req.body.text) {
    res.send(`Thread Text invalid`);
    return;
  }

  // https://docs.microsoft.com/en-us/javascript/api/overview/azure/cosmos-readme?view=azure-node-latest#query-the-database
  const querySpec = {
    query: "SELECT * FROM c WHERE c.boardName = @bn AND c.text = @text",
    parameters: [
      { name: "@text", value: req.body.text },
      { name: "@bn", value: req.params.board },
    ],
  };

  try {
    const { resources: results } = await client
      .database(databaseId)
      .container(containerId)
      .items.query(querySpec)
      .fetchAll();

    if (results && results[0]) {
      const threadDetails = results[0];

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

      //threadDetails.id = results[0].id;

      console.log("Writing back", threadDetails);
      const { item } = await client
        .database(databaseId)
        .container(containerId)
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
function returnEmptyThread() {
  return {
    boardName: "",
    text: "",
    reported: false,
    delete_password: "",
    bumped_on: new Date(),
    created_on: new Date(),
    replies: [],
  };
}
