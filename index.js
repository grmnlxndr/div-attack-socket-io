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

// Responder con el html cuando se accede a la ruta '/'
app.get('/credits', function(req, res) {
	res.sendFile(__dirname + '/credits.html');
});

//Constantes del juego
var SCORE = 100;
var HITSCORE = 10;
var GAMELENGTH = 30000;

// iniciar arreglos de usuarios, posición X e Y y las vidas
var left = [];
var top = [];
var users = [];
var lifes = [];
var scores = [];

// iniciar arreglo de sockets
var sockets = [];

// variable de tiempo inicio de juego
var gameStart;

// captura de eventos por parte del server
io.on('connection', function(socket) {

	// mostrar mje por pantalla del evento
	console.log('[INFO - CONNECT] un usuario se ha conectado');
	
	// cuando el usuario se registro con su nickname
	socket.on('ingresar', function(name) {
		
		// ahora
		var timeNow;

		// tiempo restante
		var timeLeft;

		// calcular tiempo restante de juego
		if (gameStart) {
			timeNow = new Date().getTime();
			timeLeft = gameStart + GAMELENGTH - timeNow;
		}

		// cuando alguien se conecta, se envía todas las ubicaciones de los usuarios conectados y tiempo restante de juego
		socket.emit('inicio', users, left, top, lifes, scores, timeLeft);
		
		// agregar al usuario en el arreglo
		users.push(name);
		// iniciar vida en 100
		lifes.push(100);
		// iniciarlizar scores
		scores.push(0);
		// iniciar coordenadas 300-300
		top.push('300px');
		left.push('300px');

		// agregar al socket en el arreglo
		sockets.push(socket);

		// mostrar mje por consola del evento
		console.log('[INFO - CONNECT] "' + name + '" se ha conectado!');

		// difundir evento de nuevo usuario conectado a todos los demas usuarios
		socket.broadcast.emit('nuevo user', name);

		// inicio juego
		if (users.length === 2) {
			console.log('[INFO] Partida Iniciada');
			gameStart = new Date().getTime();
			var gameTime = setTimeout(function(){
				users = [];
				lifes = [];
				scores = [];
				top = [];
				left = [];
				sockets = [];
				gameStart = "";
				io.sockets.emit('finJuego');
				console.log('[INFO] Partida Terminada');
			}, GAMELENGTH); // editar tiempo de juego en línea 18

			timeNow = new Date().getTime();
			timeLeft = gameStart + GAMELENGTH - timeNow;
			
			io.sockets.emit('begin game', timeLeft);

		}
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
		    scores.splice(index, 1);
		    left.splice(index, 1);
		    top.splice(index, 1);
		}
	});

	// cuando un jugador realiza un disparo
	socket.on('disparo', function(code,left,top,agresor) {
		var direc; // Dirección de la bala
		var sent; // Sentido de la bala

		//Obtener posiciones iniciales según código
		//Izquierda
		if(code === 37) {
			left = left - 20;
			top = top + 45;
			direc = "left";
			sent = -1;
		}
		
		//Arriba
		if(code === 38) {
			left = left + 45;
			top = top - 20;
			direc = "top";
			sent = -1;
		}
		
		//Derecha
		if(code === 39) {
			left = left + 110;
			top = top + 45;
			direc = "left";
			sent = 1;
		}
		
		//Abajo
		if(code === 40) {
			left = left + 45;
			top = top + 110;
			direc = "top";
			sent = 1;
		}

		// Emitir un mje que diga que cree un div bala
		// con agresor y un data que es único, basado en un new Date() y .getTime()
		var d = new Date();
		var data = d.getTime();
		var baladatatype = agresor + '-' + data;
		// Emit para generar en los clientes un div bala
		io.sockets.emit("dispararbala",code,left,top,baladatatype);

		// Mover la bala
		// cada 50ms se manda la nueva ubicación
		// Asignarle movimiento a la bala
		var movBala = setInterval(
			function() {
				// Si la bala no ha colisionado con algún div, mover la bala
				//Ver la forma de implementarlo de este lado!
				//if (bala) {

					// Se envia la posicion x,y, agresor y la identificacion de la bala
					io.sockets.emit("moverbala",baladatatype,direc,sent,agresor);
				//};
			}, 50);

		// con un timeout poner un evento de morir bala
		// Detener y desaparecer la bala luego de 5 segundos
		var stop = setTimeout(
			function() {
				//Borra el temporizador setInterval 
				clearInterval(movBala);
				//Emite evento a todos los usuarios para matar la bala
				io.sockets.emit('matarbala',baladatatype,agresor); 
			}, 4000); //Bajado período de vida de la bala
	});

	// cuando un jugador recibe un impacto de bala
	socket.on('herido', function(herido,agresor) {

		// cuando se hiere alguien, emitir un evento de desaparecer bala
		//Capaz q no es necesario, pero vemos

		// obtener el jugador herido
		var i = users.indexOf(herido);

		// disminuir la vida en un numero aleatorio entre 5 y 15
		lifes[i] = lifes[i] - (Math.round(Math.random() * 10) + 5);
		
		//searching for the agresor
		var j = users.indexOf(agresor);
		
		// en caso de que la vida sea cero o no
		if (lifes[i] <= 0) {

			// SI LA VIDA QUEDA EN CERO
			// asignar la vida en el arreglo a 0 
			lifes[i] = 0;
			scores[i] = scores[i] - SCORE;

			//Si la vida es cero, quiere decir que agresor mató a herido
			scores[j] = scores[j] + SCORE;

			//emitir un evento de que un jugador ha quedado sin vida, pasando los puntajes
			io.sockets.emit('0hp', herido, agresor, scores[i], scores[j]);
		} else {

			// SI LA VIDA NO QUEDA EN CERO
			// asignar score
			scores[j] = scores[j] + HITSCORE;

			// emitir un evento que un jugador ha sido herido
			io.sockets.emit('heridolife', herido, agresor, lifes[i], scores[j]);
		}
	});

	//Reviviendo usuario
	socket.on('reviviendo',function(username){
		var i = users.indexOf(username);
		lifes[i] = 100;
		io.sockets.emit('reviviendo',username,left[i],top[i],scores[i]);
	});

	//Verificando ping
	socket.on('ping',function(seconds,milliseconds){
		socket.emit('ping',seconds,milliseconds);
	});
});

// iniciar el server en el puerto designado
http.listen(3000, function() {
	console.log('[INFO] escuchando en *:3000');
});
