// Inicializar sockets
var socket = io();

var nickname; // Nombre propio
var conectados = []; // Nombre de los jugadores

// Ocultar error y pantalla principal
$('div#display').hide();
$('#error').hide();

// Cuando se ingresa el nombre de usuario en el formulario de la pantalla principal
$('form#login').submit(function() {
	
	// Obtener nickname y eliminar los espacios
	var nickname = $('input#nickInput').val();
	nickname = nickname.replace(/ /g,'-');
	
	// Controlar que no exista nadie con el mismo nickname y mostrar error
	if (conectados.indexOf(nickname) !== -1) {
		$('#error').slideDown(200);
		return false;
	};

	// Pasar a pantalla principal (quitando el error si corresponde)
	$('#error').slideUp(200)
	$('div#nickname').slideUp(200);
	$('div#display').slideDown(200);
	
	// Avisar al server que se ingreso al juego
	socket.emit('ingresar', nickname);

	// Agregar el div propio para jugar
	$('div#display').append($('<div style="z-index:999; background:darkcyan;" class="divcito" id="'+ nickname +'"><div id="text"><h3>'+nickname+'</h3><p>Haceme clic</p><p>y arrastrá</p></div></div>'));

	// Darle movimiento con el click y arrastrar
	$('#'+nickname).mousemove(function(e) {
		if (e.which === 1) {
			$('.divcito#'+nickname).css('left',e.pageX - 100).css('top',e.pageY - 100);
			
			// emitir evento de movimiento
			socket.emit('moviendo div', nickname,$('#'+nickname).css('left'), $('#'+nickname).css('top'));
		};

	});

	// Agregarse a sí mismo a la lista de usuarios conectados
	$('ul#usuariosUl').append($('<li id="tu"></li>').text(nickname));

	// Para que no realize el post
	return false;
});

// Recepción de todos los otros jugadores por parte del servidor
socket.on('inicio', function(users, left, top) {
	
	// Llenar la lista de demás jugadores
	conectados = users;

	// Agregar un div por cada jugador y posicionarlo en la ubicación actual
	for (var i = 0; i < users.length; i++) {
		$('div#display').append($('<div class="divcito" id="'+ users[i] +'"><div id="text"><h3>'+users[i]+'</h3><p>Se mueve solo</p><p>:)</p></div></div>'));
		$('.divcito#'+users[i]).css('left',left[i]).css('top',top[i]);

		//agregar a la lista de conectados
		$('ul#usuariosUl').append($('<li></li>').text(users[i]));
	};
});

//nuevo usuario conectado
socket.on('nuevo user', function(user) {
	
	// Agregar nuevo usuario a la lista de conectados
	conectados.push(user);

	// Agregar div de nuevo usuario
	$('div#display').append($('<div class="divcito" id="'+ user +'"><div id="text"><h3>'+user+'</h3><p>Se mueve solo</p><p>:)</p></div></div>'));
	$('.divcito#'+user).css('left','50px').css('top','50px');

	// Agregar a la lista de usuarios conectados
	$('ul#usuariosUl').append($('<li></li>').text(user));
});

// Evento de movimientos de otros usuarios
socket.on('moviendo div', function(user, left,top) {
	
	// asignar la nueva posición del div correspondiente
	$('.divcito#'+user).css('left',left).css('top',top);
});

// Desconexión de un usuario
socket.on('div muerto', function(user) {
	
	// Quitar div de usuario desconectado
	$('.divcito#'+user).remove();

	// Quitar usuario de la lista de usuarios conectados
	$('ul#usuariosUl li').filter(function(index){ return $(this).text() === user; }).remove();
	
	// Eliminar el usuario de la lista interna de usuarios
	var index = conectados.indexOf(user);
	if (index > -1) {
	    conectados.splice(index, 1);
    }
});
