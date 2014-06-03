/****************************************************************************************************************
                          _____                                     ____            _     
                         |  __ \                                   |  _ \          | |    
                         | |  | |_   _ _ __   __ _  ___  ___  _ __ | |_) | __ _ ___| |__  
                         | |  | | | | | '_ \ / _` |/ _ \/ _ \| '_ \|  _ < / _` / __| '_ \ 
                         | |__| | |_| | | | | (_| |  __/ (_) | | | | |_) | (_| \__ \ | | |
                         |_____/ \__,_|_| |_|\__, |\___|\___/|_| |_|____/ \__,_|___/_| |_|
                                              __/ |                                        
                                             |___/                                        
A online multiplayer game developed using the Node Express framework, JavaScript and HTML5 featuring websockets to
carry out client - server communication. This project was developed as my final year project for DIT in 2014.
Author: David Conroy
Student Number: C09626620
Module: DT228-4
Email: c09626620@mydit.ie
*****************************************************************************************************************/
//The code for this project is fully explained in the corresponding writeup document


var express = require('express')
, app = express()
, server = require('http').createServer(app)
, io = require("socket.io").listen(server)
, uuid = require('node-uuid')
, fs = require('fs')
, sanitize = require('validator').sanitize;

var people = {};
var games = [];
var currentGame = {};
var currentPeople = {};
var baseLevel; 
var roomLevel; 
var collisions;
var lvlWidth = 51;
var lvlHeight = 51;


app.configure(function() {
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
  	app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP);
	if (typeof ipaddress === "undefined") {
		console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
		app.set('ipaddr', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
	};
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.use('/components', express.static(__dirname + '/components'));
	app.use('/js', express.static(__dirname + '/js'));
	app.use('/icons', express.static(__dirname + '/icons'));
	app.use('/images', express.static(__dirname + '/images'));
	app.use('/lib', express.static(__dirname + '/lib'));
	app.set('views', __dirname + '/views');
});

app.get('/', function(req, res) {
  res.render('index.html');
});

server.listen(app.get('port'), app.get('ipaddr'), function(){
	console.log('Express server listening on  IP: ' + app.get('ipaddr') + ' and port ' + app.get('port'));
});

io.set("log level", 2);

io.sockets.on('connection', function (client) {

			console.log("Connected to client " + client.id);

            client.on('validate', function(message){
                //var escaped_message = sanitize(message).escape();
                if(people[client.id]){
                    var chatObject = {};
                    chatObject.message = message;
                    chatObject.id = people[client.id].name;
                    io.sockets.emit("chat", chatObject);
                } else {
                    var chatObject = {};
                    chatObject.message = message;
                    chatObject.id = "Anonymous";
                    io.sockets.emit("chat", chatObject);
                }    
            });

			client.on('createNewUser', function(name) {
				if(people[client.id]){
                    client.emit("update", "You already have an account.");
				} else {
				    people[client.id] = {"name" : name.name, "roomID" : name.roomID, 'x' : 88, 'y' : 166};

				    var player = {};
				    player.roomID = name.roomID;
				    player.name = name.name;
                    player.id = 1;
                    player.cID = client.id;
                    //currentPeople[client.id] = player;
				    client.emit("update", "You have connected to the server.");
				    client.emit("createNewPlayer", player);
				    io.sockets.emit("update", people[client.id].name + " is online.");
                    //io.sockets.emit("updatePeople", currentPeople);
				    io.sockets.emit("updatePeople", people);
				}	
			});

			client.on('createNewLevel', function(newGame) {
                if(currentGame[client.id]) {
                    if(games[newGame.roomID]){
                        if(games[newGame.roomID].owner === client.id){
                            client.emit("update", "You have already created a room.");
                        }
                        client.emit("update", "You have already created a room.");
                    }
                } else {
    				var level = {}
                    var currentPlayers = [];
                    currentPlayers.push(client.id);
                    level.roomID = newGame.roomID;
    				level.baseLevel = levelGeneration();
    				level.roomLevel = roomGeneration();
    				level.name = newGame.name;
    				level.owner = client.id;
    				level.collisions = collisionGeneration(level.roomLevel);
                    level.currentPlayers = currentPlayers;
                    games[newGame.roomID] = level;
                    currentGame[client.id] = level;
    				client.emit("newLevel", level);
                    io.sockets.emit("updateRooms", games);
                    io.sockets.emit("updatePeople", people);
              }


			});

            client.on('joinRoom', function(roomID) { 
                if(people[client.id]){ //Check if the user exists.
                    if(games[roomID]){ //Check if the room exists.
                        if(client.id !== games[roomID].owner){ //Check if you are the already the owner of this room.
                                if(people[client.id].roomID !== roomID) { //Check if you are already in the room.
                                    var joinLevel = {};
                                    joinLevel.baseLevel = games[roomID].baseLevel;
                                    joinLevel.roomLevel = games[roomID].roomLevel;
                                    joinLevel.collisions = games[roomID].collisions;
                                    joinLevel.join = 1;
                                    joinLevel.whoJoining = client.id;
                                    //if(games[people[client.id].roomID]){ //Remove the joining player from the currentPlayer list of the old room if it still exists.
                                    games[people[client.id].roomID].currentPlayers.pop();
                                    //} 
                                    games[roomID].currentPlayers.push(client.id); //Add the joining player to the currentPlayer list of then new room.
                                    //If statement which checks if the room being left is now empty. If so it will make that room null (closed).
                                    if(games[people[client.id].roomID].currentPlayers.length === 0){
                                        client.emit("update", "Room: " + people[client.id].roomID + " is empty and has been closed."); 
                                        games[people[client.id].roomID] = null;
                                    }
                                    people[client.id].roomID = roomID; //Updating their roomID to that of the new room.
                                    client.emit("newLevel", joinLevel); //Tells the client to render a new level which is identically the same as the level the user is joining.
                                    io.sockets.emit("updateRooms", games);
                                    io.sockets.emit("updatePeople", people);
                                }else {
                                    client.emit("update", "You are already in this room."); 
                                }
                            }else { 
                                 client.emit("update", "You are attempting to joing your own room.");
                            }
                    }else {
                        client.emit("update", "This room ID doesn't exist.");
                    }
                }else {
                    client.emit("update", "You must first create a user.");
                }
            });
/*
            client.on('syncPlayers', function(data){
                currentPeople[client.id] = data;
                io.sockets.emit("updatePeople", currentPeople);

            });
*/
			client.on('updatePlayerPosition', function(data) {
				if(people[client.id]){
                    parsedObject = JSON.parse(data);
                    parsedObject.cID = client.id;
                    parsedObject.id = 2;
                    console.log("Received message from client ",data);
                    data = JSON.stringify(parsedObject);
                    io.sockets.emit("message_to_client", data);
                }
			});
            /****************************************************************************************************************
            The below event is called automatically whenever a client disconnects or closes their browser.  It acts as a gen-
            eral cleanup class. It holds 3 main purposes:
            1) If the player who is disconnecting was in a room which they owned, it will delete the room.
            2) If the player who is disconnecting was in a room which they didn't own, it will update that rooms currentPlayer
                list to refletc that.
            3) It then deletes the player form the current players list and updates this change to all who are connected.
            *****************************************************************************************************************/
            client.on('disconnect', function() {
                if(people[client.id]) {
                    io.sockets.emit("update", people[client.id].name + " has disconnected");
                    if(games[people[client.id].roomID] && games[people[client.id].roomID].owner == client.id){
                        games[people[client.id].roomID] = null;
                        io.sockets.emit("update", "Room " + people[client.id].roomID + " has been closed by owner.");
                    } else if (games[people[client.id].roomID]) {
                        games[people[client.id].roomID].currentPlayers.pop();
                        for(var i = 0; i < games.length; i++) { 
                            if(games[people[client.id].roomID].currentPlayers.length === 0){
                                games[people[client.id].roomID] = null;
                                io.sockets.emit("update", "Room " + people[client.id].roomID + " has closed.");
                                break;
                            }
                        }
                    }
                    delete people[client.id];
                    io.sockets.emit("updatePeople", people);  
                    io.sockets.emit("updateRooms", games);   
                } else {
                    console.log("ERROR: Disconnecting client does not exit.")
                }
              //emitdisconnected
            });

});

function levelGeneration(){
        var lvl = new Array();
        for(i=0; i<lvlWidth; i++) {
            lvl[i] = new Array();
            for(j=0; j<lvlHeight; j++) {
                lvl[i][j] = 342;
            }
        }
        return lvl;
};

function roomGeneration(){
        var lvl = new Array();
        var numberRooms = 100;
        var blankLevel = levelGeneration();
        var roomCorners = roomStarts();
        var room = roomWalls(roomCorners);
        function roomStarts(){
            for(i=0; i<lvlWidth; i++) {   
                lvl[i] = new Array();
                for(j=0; j<lvlHeight; j++) {
                   // if( i%2 != 0 && j%2 !=0 && numberRooms > 0){   
                    lvl[i][j] = -1;
                   	if(numberRooms > 0){ 
                            if(Math.floor((Math.random()*20)+1) == 1){
                                lvl[i][j] = 521;
                                numberRooms--;  
                            } 
                        } 
                        else {
                            lvl[i][j] = -1;
                        }
                }
            }
            return lvl;
            console.log(lvl);
        }
        
        function roomWalls(room){
            for(i=0; i<lvlWidth; i++) {   
                for(j=0; j<lvlHeight; j++) {
                    if(room[i][j] == 521){
                        console.log("Room Present");
                        var width = 4;
                        var height = 6;
                        var num = 1;
                        for(k=0; k<width; k++){
                            //Create wall along negative X axis (left)
                            room[i][j] = 521;
                            j--;
                        }
                        for(k=0; k<height; k++){
                            //Create wall along positive Y axis (downward)
                            room[i][j] = 521;
                            i++;
                        }
                        for(k=0; k<width; k++){
                            //Create wall along positive X axis (right)
                            room[i][j] = 521;
                            j++;
                        }/*
                        for(k=0; k<height; k++){
                            //Create wall along negative Y axis (upward)
                            room[i][j] = 521;
                            //i--;

                        }*/
                    } else if(lvl[i][j] == 400)
                    {
                        console.log("Found a pot");
                    }
                }
            }

            return room;
        }
    return room;
};

function collisionGeneration(rooms){
        var lvl = new Array();
        for(i=0; i<lvlWidth; i++) {
            lvl[i] = new Array();
            for(j=0; j<lvlHeight; j++) {
                if(rooms[i][j] == 521) {
                    lvl[i][j] = 1;   
                } else {
                    lvl[i][j] = 0;
                }
            }
        }
        return lvl;
        console.log(lvl);
};
