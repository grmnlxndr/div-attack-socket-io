// Iniciar el server con express y socketIO
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Agregar una carpeta como carpeta pública
app.use(express.static(__dirname + '/public'));

// Responder con el html cuando se accede a la ruta '/'
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

// iniciar arreglos de usuarios, posición X e Y y las vidas
var left = [];
var top = [];
var users = [];
var lifes = [];

// iniciar arreglo de sockets
var sockets = []

// captura de eventos por parte del server
io.on('connection', function(socket) {

	// cuando alguien se conecta, se envía todas las ubicaciones de los usuarios conectados
	socket.emit('inicio', users, left, top, lifes);

	// mostrar mje por pantalla del evento
	console.log('[INFO - CONNECT] un usuario se ha conectado');
	
	// cuando el usuario se registro con su nickname
	socket.on('ingresar', function(name) {
		
		// agregar al usuario en el arreglo
		users.push(name);
		// iniciar vida en 100
		lifes.push(100);
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
		    lifes.splice(index, 1);
		    left.splice(index, 1);
		    top.splice(index, 1);
		}
	});

	// cuando un jugador realiza un disparo
	socket.on('disparo', function(code,left,top,agresor) {

		// difundir el evento a todos los clientes
		io.sockets.emit('disparo',code,left,top,agresor);
	});

	// cuando un jugador recibe un impacto de bala
	socket.on('herido', function(herido,agresor) {

		// obtener el jugador herido
		var i = users.indexOf(herido);

		// disminuir la vida en un numero aleatorio entre 5 y 15
		lifes[i] = lifes[i] - (Math.round(Math.random() * 10) + 5);

		// en caos de que la vida sea cero o no

		if (lifes[i] <= 0) {

			// SI LA VIDA QUEDA EN CERO
			// asignar la vida en el arreglo a 0 y emitir un evento de que
			// un jugador ha quedado sin vida
			lifes[i] = 0;
			io.sockets.emit('0hp', herido, agresor);
		} else {

			// SI LA VIDA NO QUEDA EN CERO
			// emitir un evento que un jugador ha sido herido
			io.sockets.emit('heridolife',herido,agresor, lifes[i]);
		};
	});

	//Reviviendo usuario
	socket.on('reviviendo',function(username){
		var i = users.indexOf(username);
		lifes[i] = 100;
		io.sockets.emit('reviviendo',username,left[i],top[i]);
	});
});

// iniciar el server en el puerto designado
http.listen(3000, function() {
	console.log('[INFO] escuchando en *:3000');
});