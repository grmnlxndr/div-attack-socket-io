// Inicializar sockets
var socket = io();

var nickname; // Nombre propio
var conectados = []; // Nombre de los jugadores
var disparos = 5; // Disparos permitidos

// Ocultar error y pantalla principal
$('div#display').hide();
$('#error').hide();

// Cuando se ingresa el nombre de usuario en el formulario de la pantalla principal
$('form#login').submit(function() {
	
	// Obtener nickname y eliminar los espacios
	nickname = $('input#nickInput').val();
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
	$('div#display').append($('<div style="z-index:999; background:darkcyan; cursor:pointer" class="divcito" id="'+ nickname +'"><div id="text"><h3>'+nickname+'</h3><p>Haceme clic</p><p>y arrastrá</p></div></div>'));

	// Darle movimiento con el click y arrastrar
	$('#'+nickname).mousemove(function(e) {
		if (e.which === 1) {
			$('.divcito#'+nickname).css('left',e.pageX - 100).css('top',e.pageY - 100);
			
			// emitir evento de movimiento
			socket.emit('moviendo div', nickname,$('.divcito#'+nickname).css('left'), $('.divcito#'+nickname).css('top'));
		};
	});

	// Darle opción de disparo
	$(document).keydown(function(e){
		if (disparos > 0){
			if(e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40){
				disparos = disparos - 1;
				var lft = parseInt($('.divcito#'+nickname).css('left').replace("px",""));
				var tp = parseInt($('.divcito#'+nickname).css('top').replace("px",""));
				socket.emit('disparo',e.keyCode,lft,tp,nickname); 
				disparar(e.keyCode,lft,tp,nickname);
			}
		}
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

//Disparar una flecha
function disparar(code,left,top,agresor){
	var fondo = $('div#display');
	var bala = $('<div class="flecha"></div>');
	var direc = "";
	var sent = 1;
	//Izquierda
	if(code === 37){
		bala.css("left",(left-20)+'px').css("top",(top+95)+'px');
		direc = "left";
		sent = -1;
	}
	//Arriba
	if(code === 38){
		bala.css("left",(left+95)+'px').css("top",(top-20)+'px');
		direc = "top";
		sent = -1;
	}
	//Derecha
	if(code === 39){
		bala.css("left",(left+210)+'px').css("top",(top+95)+'px');
		direc = "left";
		sent = 1;
	}
	//Abajo
	if(code === 40){
		bala.css("left",(left+95)+'px').css("top",(top+210)+'px');
		direc = "top";
		sent = 1;
	}
	fondo.append(bala);
	var movBala = setInterval(function(){ if (bala) {mover(bala,direc,sent,agresor)} }, 50);
	var stop = setTimeout(
		function(){ 
			window.clearInterval(movBala); 
			bala.remove(); 
			if(agresor === nickname){ 
				disparos=disparos+1; 
			};
		}, 5000);
}

function mover(bala,direccion,sentido,agresor){
	//var yo = nickname;
	var valor = parseInt(bala.css(direccion).replace("px"));
	bala.css(direccion,(valor + (sentido * 10) + 'px'));
	//var collides = $('.divcito#'+yo).overlaps(bala);
	var collides = $('.divcito:not(#'+agresor+')').overlaps(bala);
	if (collides.hits.length != 0) {
		var herido = $(collides.targets[0]).attr('id');
		console.log('chocado '+agresor+ ' el herido es '+herido);
		bala.remove();
	}
}

socket.on('disparo',function(code,left,top,agresor){
	disparar(code,left,top,agresor);
});