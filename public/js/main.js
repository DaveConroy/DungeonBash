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
enchant();
//Global variables
var debug = false;//Change to true to see conline log outputs
var players = false;
var currentPlayers = [];
var games = [];
var ws = false;
var lvlWidth = 51;
var lvlHeight = 51;
var map = false;
var player = false;
var stage = new Group();

//creating a gamemanager element for later storing game updates.
var gameManager = document.createElement('div');
gameManager.id = "gameManager";
gameManager.style.cssFloat="right"; 
gameManager.style.width = "700px";
gameManager.style.overflow="scroll";
gameManager.style.height = "200px"; 
gameManager.style.border = "2px dotted red"; 
gameManager.style.padding = "10px";

//Standard code for turning on or off debug outputs. This code was not written by me
if(!debug){
    if(!window.console) window.console = {};
    var methods = ["log", "warn", "debug", "info"];
    for(var i=0; i<methods.length; i++){
        console[methods[i]] = function(){};
    }
}


window.onload = function() {


    var game = new Game(320, 320);
    game.fps = 10;
    game.width = 300;
    game.height = 300;
    game.preload('images/map1.gif', 'images/chara0.gif');

    game.onload = function() {


        /****************************************************************************************************************
        Vaariable to hold our websocket connection. For testing purposes we can use 127.0.0.1:3000 for local testing.
        When the game is pushed to the cloud server we must then use the specific websocket port for that service. In this 
        case being: "http://daveconroy-dungeongame.rhcloud.com:8000"
        *****************************************************************************************************************/

        var ws = io.connect("127.0.0.1:3000");
        //var ws = io.connect("http://daveconroy-dungeongame.rhcloud.com:8000");


        /****************************************************************************************************************
        The sendMsg function first grabs the 'create' element from the index.html page. It then adds a onclick listener
        to this button. When the user clicks this button it then grabs the 'username' value from the input box on index.html
        and saves it as a variable. Finally it emits an event called "createNewLevel" to the server over our websocket 
        connection passing the users requested name with it. 
        *****************************************************************************************************************/
        var sendUsername = document.getElementById('create');
            sendUsername.onclick = function(){ 
            var name = document.getElementById("username").value;
            var newGame = {};
            newGame.name = name;
            newGame.roomID = Math.floor(Math.random() * 100); 
            ws.emit("createNewLevel",newGame);
        };
//Same as above but for joining rooms
        var sendRoomName = document.getElementById('join');
            sendRoomName.onclick = function(){ 
            var name = document.getElementById("roomName").value;
            ws.emit("joinRoom",name);
        };
//Same as above but for sending messages 
        var sendMessage = document.getElementById('chat');
            sendMessage.onclick = function(){ 
            var message = document.getElementById("message").value;
            ws.emit("validate", message);
        };

        /****************************************************************************************************************
        A function which creates a new player object. This function takes a JSON object as a parameter. This JSON object
        contains the starting x and y positions, the cID which identifes a specific websocket connection, the name of the
        player, the ID of the current room they are in and finally their id (1 - Newly created, 2 - Updating position).
        This function uses this JSON object to set the variables of the newPlayer object making it ready to be rendered
        once returned. The function can only be called once when creating a new player and then whenever another player 
        (on another device) updates their movement so as to create that players instance in the current clients instance.
        *****************************************************************************************************************/
        var createPlayer = function(newP) {
            var newPlayer = new Sprite(32, 32);
            newPlayer.cID = newP.cID;
            newPlayer.x = newP.x;
            newPlayer.y = newP.y;
            newPlayer.name = newP.name;
            var image = new Surface(96, 128);
            image.draw(game.assets['images/chara0.gif'], 0, 0, 96, 128, 0, 0, 96, 128);
            newPlayer.image = image;
            newPlayer.direction = 0;
            newPlayer.walk = 1;
            newPlayer.addEventListener('enterframe', function() {
                this.frame = this.direction * 3 + this.walk;
            } );

            return newPlayer;
        }

        /****************************************************************************************************************
        Simple update event. When an update ocours on the server it is sent to the client to be broadcast in the console.
        *****************************************************************************************************************/
        ws.on("update", function(msg) {
  
            var update = document.createElement('div');
            update.id = "update";
            update.innerHTML = msg;
            gameManager.appendChild(update);


        });

        
        /****************************************************************************************************************
        This function is fired after the client recieves a 'connect' event from the server. Typically the bulk of code will
        be placed within this function as they user shouldn't be able to do much without first establishing a websocket
        connection with the server.
        *****************************************************************************************************************/
        ws.on('connect',function() {
            console.log('Client has connected to the server!');

            ws.on('newLevel', function(level) {
                console.log("Base level: ",level.baseLevel);
                console.log("Room level: ",level.roomLevel);
                console.log(level);
                map = new Map(16,16);
                map.image = game.assets['images/map1.gif'];
                map.loadData(level.baseLevel, level.roomLevel);
                map.collisionData = level.collisions;


                if(level.join === 1){
                    //stage.removeChild(map);
                    game.popScene();
                    var joiningPlayer = {};
                    joiningPlayer.id = 2;
                    joiningPlayer.roomID = null;
                    joiningPlayer.name = "Anonymous";
                    joiningPlayer.x = 88;
                    joiningPlayer.y = 164;
                    joiningPlayer.d = 0;
                    joiningPlayer.cID = level.whoJoining;
                    console.log("You joined the game");
                    currentPlayers[level.whoJoining] = createPlayer(joiningPlayer);
                    players.addChild(currentPlayers[level.whoJoining]);
                } else {
                    var nameAndRoom = {};
                    nameAndRoom.name = level.name;
                    nameAndRoom.roomID = level.roomID;
                    ws.emit("createNewUser",nameAndRoom);
                }
                stage.addChild(map);
            });

            ws.on('failedJoin', function() {
                var name = "Anonymous";
                ws.emit('join', name);
            });



/*the createPlayer function passing in the newPlayer object which contains the players socket ID 
and their desired username. This function returns an updated player object. The new player object is then
 given an event listener which will allow the user to control them. This code has been removed from the following code snippet as it is too
  large and is not directly to do with client – server communication. It will be discussed in further detail in the future. Finally the player
   is added to the players array which in turn is added to the games stage to be rendered. This players array holds a list of all current players
    and their location. 
It is incredibly important as it is the only way each client knows where to render another users player within their game.*/
            ws.on('createNewPlayer', function(newPlayer){
                newPlayer.x = 6 * 16 - 8;
                newPlayer.y = 10 * 16;
                //newPlayer.cID = newPlayer.cID;

                player = createPlayer(newPlayer);
                //currentPlayers.push(player.cID);
                console.log("New player created: ", player);


                //This section event listener code was not writen by me. Except for the
            /*  this.isMoving = true;
                arguments.callee.call(this);
                var msg = JSON.stringify ({'id': 2, 'roomID' : newPlayer.roomID, 'name' : newPlayer.name, 'x':this.x,'y': this.y,'d':this.direction});
                ws.emit("updatePlayerPosition",msg);
                console.log("Updated player postion: ", msg)
                Section in the middle
                                */
                player.addEventListener('enterframe', function() {
                    this.frame = this.direction * 3 + this.walk;
                    if (this.isMoving) {
                        this.moveBy(this.vx, this.vy);
         
                        if (!(game.frame % 3)) {
                            this.walk++;
                            this.walk %= 3;
                        }
                        if ((this.vx && (this.x-8) % 16 == 0) || (this.vy && this.y % 16 == 0)) {
                            this.isMoving = false;
                            this.walk = 1;
                        }
                    } else {
                        this.vx = this.vy = 0;
                        if (game.input.left) {
                            this.direction = 1;
                            this.vx = -4;
                        } else if (game.input.right) {
                            this.direction = 2;
                            this.vx = 4;
                        } else if (game.input.up) {
                            this.direction = 3;
                            this.vy = -4;
                        } else if (game.input.down) {
                            this.direction = 0;
                            this.vy = 4;
                            var room = null;
                        }
                        
                        if (this.vx || this.vy) {
                            var x = this.x + (this.vx ? this.vx / Math.abs(this.vx) * 16 : 0) + 16;
                            var y = this.y + (this.vy ? this.vy / Math.abs(this.vy) * 16 : 0) + 16;
                            if (0 <= x && x < map.width && 0 <= y && y < map.height && !map.hitTest(x, y)) {

                                this.isMoving = true;
                                arguments.callee.call(this);
                                var msg = JSON.stringify ({'id': 2, 'roomID' : newPlayer.roomID, 'name' : newPlayer.name, 'x':this.x,'y': this.y,'d':this.direction});
                                ws.emit("updatePlayerPosition",msg);
                                console.log("Updated player postion: ", msg);

                            }
                        }
                        
                    }
                });
                players = new Group();
                //players.addChild(player);

                currentPlayers[player.cID] = player;
                //ws.emit("syncPlayers", currentPlayers[player.cID]);
                players.addChild(currentPlayers[player.cID]);
                stage.addChild(player);
                stage.addChild(players);
                //stage.addChild(foregroundMap);
//Event listener that listens to see if the player is moving and updates the map accordingly. This was created with the help of the enchat js 
                game.rootScene.addEventListener('enterframe', function(e) {
                    var x = Math.min((game.width  - 16) / 2 - player.x, 0);
                    var y = Math.min((game.height - 16) / 2 - player.y, 0);
                    x = Math.max(game.width,  x + map.width)  - map.width;
                    y = Math.max(game.height, y + map.height) - map.height;
                    stage.x = x;
                    stage.y = y;
                });
//Event which takes in the players updated positions recieved from the server.
//It creates a new player instance for new players joijning the game.

                ws.on('message_to_client', function(msg) {
                    console.log("Recieved message from serever.", msg)
                    var parsed = JSON.parse( msg );
                    switch ( parsed.id ) {
                        case 1:
                        //New user connected
                        console.log("message id was 1");
                            currentPlayers[parsed.cID] = createPlayer(msg);
                            players.addChild(currentPlayers[parsed.cID]);
                        break;
                        case 2:
                        //Update user postion
                            if ( currentPlayers[parsed.cID]) {
                                console.log("Existing Player");
                                currentPlayers[parsed.cID].x = parsed.x;
                                currentPlayers[parsed.cID].y = parsed.y;
                                currentPlayers[parsed.cID].direction = parsed.d;
                            } else {
                                
                                console.log("New Player Created");
                                currentPlayers[parsed.cID] = createPlayer(msg);
                                players.addChild(currentPlayers[parsed.cID]);
                                currentPlayers[parsed.cID].x = parsed.x;
                                currentPlayers[parsed.cID].y = parsed.y;
                                currentPlayers[parsed.cID].direction = parsed.d;                           
                            }
                        break;
                    }
                });     
            });

            ws.on('updatePeople', function(people){
                //currentPlayers = people;
                console.log("Current players are: ", people);
                //console.log("CurrentPlayers array:", currentPlayers);
            });

            ws.on('updateRooms', function(rooms){
                console.log("Current active games:", rooms);
                for(var i = 0; i < rooms.length; i++){
                    if(rooms[i]){
                        console.log("Room " + i + " has people in it.")
                        var update = document.createElement('div');
                        update.id = "update";
                        update.innerHTML = "Current active rooms: Room owner: " + rooms[i].name + ". RoomID: " + rooms[i].roomID;
                        gameManager.appendChild(update);
                    }
                }
                games = rooms;
            });

            ws.on('chat', function(chatObject){
                var update = document.createElement('div');
                update.id = "update";
                update.innerHTML = chatObject.id + ": " + chatObject.message;
                gameManager.appendChild(update);        
            });
            
            game.rootScene.addChild(stage);            
                var pad = new Pad();
                pad.x = 0;
                pad.y = 220;
                game.rootScene.addChild(pad);
            });

    };

    var enchantStage = document.getElementById("enchant-stage");
    enchantStage.appendChild(gameManager);

    game.start();
};
