var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

var left = [];
var top = [];
var users = [];

var sockets = []

io.on('connection', function(socket){
	socket.emit('inicio', users, left, top);
	console.log('un usuario se ha conectado');
	socket.on('ingresar', function(name) {
		users.push(name);
		top.push('50px');
		left.push('50px');
		sockets.push(socket);
		console.log(name + ' se ha conectado!');
		socket.broadcast.emit('nuevo user', name);
	});
	socket.on('moviendo div', function(user, rLeft, rTop) {
		var j = users.indexOf(user);
		left[j] = rLeft;
		top[j] = rTop;
		socket.broadcast.emit('moviendo div', user, rLeft, rTop);
	});
	socket.on('disconnect', function() {
		var index = sockets.indexOf(socket);
		var muerto = users[index];
		console.log(muerto +' desconectado');
		socket.broadcast.emit('div muerto', muerto);
		if (index > -1) {
		    sockets.splice(index, 1);
		    users.splice(index, 1);
		    left.splice(index, 1);
		    top.splice(index, 1);
		}
	})
});

http.listen(3000, function(){
	console.log('escuchando en *:3000');
});