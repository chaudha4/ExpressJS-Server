# Message Board

This project implements a server that supports following APIs.

1. Create a new Message Board named mesg1: 
```curl -X POST http://localhost:4000/api/boards/mesg1```
1. Get a Message board named "mesg1": 
```curl -X GET http://localhost:4000/api/boards/mesg1```
1. Delete mesg1: 
```curl -X DELETE http://localhost:4000/api/boards/mesg1```
1. Get all the threads in an existing board mesg1: 
```curl -X GET http://localhost:4000/api/threads/mesg1```
1. Add a new thread in an mesg1: 
```curl -X POST -d text="This is a test message" -d delete_password="123" http://localhost:4000/api/threads/mesg1```
1. Update a thread named thread1 with new password:  
```curl -X PUT -d text="thread1" -d delete_password="newpwd"  http://localhost:4000/api/threads/mesg1```

Some test commands
1. Get all threads:
`curl -X GET  http://localhost:4000/api/test/getAllThreads`

## Setup

Create a .env file at root and provide following information.
- endpoint="Azure CosmosDb URL"
- key="DB key"
- database="DB name that you want to use". If the DB does not exist, you can create it from Azure portal or use the following test command.

```curl http://localhost:4000/api/test/createDatabase```

Install all packages require by running following command from root.
- `npm install`

Start the server using:
- `npm start`

The server will start at the default port 4000 unless you specified a port in `.env` file. E.g. `PORT=5000`