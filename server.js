var express = require('express')
, app = express()
, server = require('http').createServer(app)
, io = require("socket.io").listen(server)
, fs = require('fs');

var people = {};

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

/*
io.sockets.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
  	console.log("Connected to client");
	socket.on('message',function(event){ 
		console.log('Received message from client!',event);
	});
});
*/


io.sockets.on('connection', function (client) {

			console.log("Connected to client");

			client.on('join', function(name) {
				console.log(client.id);
				newPlayer = {};
				newPlayer.id = 1;
				newPlayer.cID = client.id;
				newPlayerString = JSON.stringify(newPlayer);
				client.emit("message_to_client",newPlayerString);
			});

			client.on('message_to_server', function(data) {
				parsedObject = JSON.parse(data);
				parsedObject.cID = client.id;
				parsedObject.id = 2;
				console.log("Received message from client",data);
				console.log("Returning string: ", parsedObject);
				data = JSON.stringify(parsedObject);
				io.sockets.emit("message_to_client", data);
			});

});
