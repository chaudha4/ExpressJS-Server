"use strict";

const express = require("express");
var bodyParser = require("body-parser");
//var expect = require("chai").expect;
var cors = require("cors");
var helmet = require("helmet");
var cookieParser = require("cookie-parser");

var mesgBoard = require("./mesgBoard");

require("dotenv").config(); // load .env file into env variables.

const app = express();

// Add middleware to the global processing stack - start

// Helmet can help protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately.
app.use(helmet());

// Only allow your site to send the referrer for your own pages.
app.use(helmet.referrerPolicy({ policy: "same-origin" }));

//Only allow your site to be loading in an iFrame on your own pages.
app.use(helmet.frameguard({ action: "sameorigin" }));

// To serve static files, use the express.static built-in middleware function in Express.
//app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.static("public"));

app.use(cors({ origin: "*" })); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Parse Cookie header and populate req.cookies with an object keyed by the cookie names.
app.use(cookieParser());

// Add middleware to the global processing stack - end

// Test - Using GET for everything to keep testing simple.

app.get("/api/test/createDatabase", mesgBoard.createDatabase);
app.get("/api/test/readDatabase", mesgBoard.readDatabase);
app.get("/api/test/createContainer/:board", mesgBoard.createBoard);
app.get("/api/test/readContainer/:board", mesgBoard.getBoard);

// Board

app.get("/api/boards/:board", mesgBoard.getBoard);
app.post("/api/boards/:board", mesgBoard.createBoard);
app.delete("/api/boards/:board", mesgBoard.deleteBoard);

// Thread
app.get("/api/threads/:board", mesgBoard.getThreads);
app.post("/api/threads/:board", mesgBoard.createThread);
app.put("/api/threads/:board", mesgBoard.updateThread);

// Handle unsupported requests

app.use(function (req, res, next) {
  var mesg = "";
  if (req) {
    mesg += " " + req.method + " " + req.url;
  }
  mesg += " not supported.\n";
  res.status(404).type("text").send(mesg);
});


const port = process.env.PORT || 4000;
app.listen(port);
console.log("Listening on port " + port);
