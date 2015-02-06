// Iniciar el server con express y socketIO
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Agregar una carpeta como carpeta pública
app.use(express.static(__dirname + '/public'));

// Responder con el html cuando se accede a la ruta '/'
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

// iniciar arreglos de usuarios, posición X e Y
var left = [];
var top = [];
var users = [];

// iniciar arreglo de sockets
var sockets = []

// captura de eventos por parte del server
io.on('connection', function(socket){

	// cuando alguien se conecta, se envía todas las ubicaciones de los usuarios conectados
	socket.emit('inicio', users, left, top);

	// mostrar mje por pantalla del evento
	console.log('[INFO - CONNECT] un usuario se ha conectado');
	
	// cuando el usuario se registro con su nickname
	socket.on('ingresar', function(name) {
		
		// agregar al usuario en el arreglo
		users.push(name);
		
		// iniciar coordenadas 50-50
		top.push('50px');
		left.push('50px');

		// agregar al socket en el arreglo
		sockets.push(socket);

		// mostrar mje por consola del evento
		console.log('[INFO - CONNECT] "' + name + '" se ha conectado!');

		// difundir evento de nuevo usuario conectado a todos los demas usuarios
		socket.broadcast.emit('nuevo user', name);
	});

	// cuando un usuario se mueve guardar las nuevas coordenadas
	socket.on('moviendo div', function(user, rLeft, rTop) {
		var j = users.indexOf(user);
		left[j] = rLeft;
		top[j] = rTop;

		// difundir las coordenadas a los demás usuarios
		socket.broadcast.emit('moviendo div', user, rLeft, rTop);
	});

	// cuando un usuario se desconecta
	socket.on('disconnect', function() {

		// obtener usuario desconectado
		var index = sockets.indexOf(socket);
		var muerto = users[index];

		// mostrar por consola el mje de desconexión
		console.log('[INFO - DISCONNECT] "' + muerto +'" desconectado');

		// difundir mje a todos los usuarios que se ha desconectado el usuario
		socket.broadcast.emit('div muerto', muerto);
		
		// quitar usuario de todos los arreglos
		if (index > -1) {
		    sockets.splice(index, 1);
		    users.splice(index, 1);
		    left.splice(index, 1);
		    top.splice(index, 1);
		}
	})
});

// iniciar el server en el puerto designado
http.listen(3000, function(){
	console.log('[INFO] escuchando en *:3000');
});