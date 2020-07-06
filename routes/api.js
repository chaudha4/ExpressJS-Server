/*
 *  Useful Links
 *  https://javascript.info/promise-chaining
 *
 *
 *
 */

"use strict";

var expect = require("chai").expect;

var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;

var ThreadHandler = require('../controllers/threadHandler.js');

module.exports = function(app) {
  
  const client = new MongoClient(process.env.DB, {useUnifiedTopology: true});

  let db = null;
  const dbName = "FCC_Mesg_DB";
  const dbTable = "Boards_Delete"; // delete after cleanup
  const boardTable = "Boards";
  const replyTable = "Replies";

  function connect2DB() {
    return client
      .connect()
      .then( () => {
        console.log("Connected to DB");
        db = client.db(dbName);
        //console.log(db);
      })
      .catch(err => {
        console.log(err);
      })
      ;
  }
  
  let th = new ThreadHandler(app);

  function installThreadRoute() {
    return new Promise((resolve, reject) => {
      
      console.log("Installing Thread Route");     
      app
        .route("/api/threads/:board")

        .get(function(req, res, next) {
          console.log("Called", req.method, req.url, req.ip, req.params, req.body, req.query);
          th.getMesgBoardThreads(req, res)
            //.then((data) => {console.log("getBoard", data); resolve(data); })
            //.then((data) => {addThread(req,res,data);} )
            .then((data) => {
              res.send(data);
              
            })
            .catch(err => {
              console.log(err);
              res.send("Failure");
            });
        }) //get
      
        .post(function(req, res, next) {
          console.log("Called", req.method, req.url, req.ip, req.params, req.body, req.query);
          th.insertMesgBoardThread(req, res)
            //.then((data) => {console.log("getBoard", data); resolve(data); })
            //.then((data) => {addThread(req,res,data);} )
            .then(() => {
              //res.send("done");
              res.redirect("/b/" + req.params.board + "");
            })
            .catch(err => {
              console.log(err);
              res.send("Failure");
            });
        }) //post

        .put(function(req, res, next) {
          console.log("Called", req.method, req.url, req.ip, req.params, req.body, req.query);
          th.reportMesgBoardThread(req, res)
            //.then((data) => {console.log("getBoard", data); resolve(data); })
            //.then((data) => {addThread(req,res,data);} )

            .then(data => {
              res.send("done");
              resolve(data);
            })

            .catch(err => {
              console.log(err);
              res.send("Failure");
            });        
          }) //put
      
        .delete(function(req, res, next) {
          console.log("Called", req.method, req.url, req.ip, req.params, req.body, req.query);
          th.deleteMesgBoardThread(req, res)
            .then(data => {
              if (data.result && data.result.n > 0) {
                res.send("done");
              } else {
                res.send("Failure");
              }              
              resolve(data);
            })
            .catch(err => {
              console.log(err);
              res.send("Failure");
            });        
          }) //delete           
          ; //route
      
      console.log("Installing Replies Route");
      app.route("/api/replies/:board")
      
        .get(function(req, res, next) {
          console.log("Called", req.method, req.url, req.ip, req.params, req.body, req.query);
          th.getReply(req, res)
            //.then((data) => {console.log("getBoard", data); resolve(data); })
            //.then((data) => {addThread(req,res,data);} )
            .then(() => {
              res.send("done");
              //res.redirect("/b/" + req.body.board);
            })
            .catch(err => {
              console.log(err);
              res.send("Failure");
            });
        }) //get        
      
        .post(function(req, res, next) {
          console.log("Called", req.method, req.url, req.ip, req.params, req.body, req.query);
          th.insertReply(req, res)
            //.then((data) => {console.log("getBoard", data); resolve(data); })
            //.then((data) => {addThread(req,res,data);} )
            .then(() => {
              res.send("done");
              //res.redirect("/b/" + req.params.board + "");
            })
            .catch(err => {
              console.log(err);
              res.send("Failure");
            });
        }) //post

        .put(function(req, res, next) {
          console.log("Called", req.method, req.url, req.ip, req.params, req.body, req.query);
          th.reportReply(req, res)
            //.then((data) => {console.log("getBoard", data); resolve(data); })
            //.then((data) => {addThread(req,res,data);} )

            .then(data => {
              res.send("done");
              resolve(data);
            })

            .catch(err => {
              console.log(err);
              res.send("Failure");
            });        
          }) //put      
      
        .delete(function(req, res, next) {
          console.log("Called", req.method, req.url, req.ip, req.params, req.body, req.query);
          th.deleteReply(req, res)
            .then(data => {
              if (data.result && data.result.n > 0) {
                res.send("done");
              } else {
                res.send("Failure");
              }              
              resolve(data);
            })
            .catch(err => {
              console.log(err);
              res.send("Failure");
            });        
          }) //delete                
      ; //route

      resolve();
    }); // Promise
  }

  function installRepliesRoute() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  return connect2DB()
    .then(installThreadRoute)
    .then(installRepliesRoute);
}; //module.exports
