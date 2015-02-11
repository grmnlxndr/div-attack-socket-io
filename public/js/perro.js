// Inicializar sockets
var socket = io();

var nickname; // Nombre propio
var conectados = []; // Nombre de los jugadores
var disparos = 5; // Disparos permitidos

// Ocultar error y pantalla principal
$('div#display').hide();
$('#error').hide();
$('#revivirbtn').hide();

//Funcion para crear divs
function creaDivs(username, life, left, top){
	if(username === nickname){
		$('div#display').append($('<div style="z-index:999; background:darkcyan; cursor:pointer" class="divcito" id="'+ nickname +'"><div id="text"><h3>'+nickname+'</h3><p class="life">100</p><p>Haceme clic</p><p>y arrastrá</p></div></div>'));
	}
	else{
		$('div#display').append($('<div class="divcito" id="'+ username +'"><div id="text"><h3>'+username+'</h3><p class="life">' + life + '</p><p>Se mueve solo</p><p>:)</p></div></div>'));
	}
	$('.divcito#'+username).css('left',left).css('top',top);
}

//Agregar Funcionalidad al div
function addMouseFunction(){
	// Darle movimiento con el click y arrastrar
	$('.divcito#'+nickname).mousedown(function() {
		$(document).mousemove(function(e) {
			if (e.which === 1) {
				$('.divcito#'+nickname).css('left',e.pageX - 50).css('top',e.pageY - 50);
				
				// emitir evento de movimiento
				socket.emit('moviendo div', nickname,$('.divcito#'+nickname).css('left'), $('.divcito#'+nickname).css('top'));
			};
		})
		.mouseup(function() {
			$(document).off('mousemove');
		});
	});
}

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
	
	//Verificar lag
	var d = new Date();
	socket.emit('ping',d.getSeconds(),d.getMilliseconds());

	// Avisar al server que se ingreso al juego
	socket.emit('ingresar', nickname);

	// Agregar el div propio para jugar
	//$('div#display').append($('<div style="z-index:999; background:darkcyan; cursor:pointer" class="divcito" id="'+ nickname +'"><div id="text"><h3>'+nickname+'</h3><p class="life">100</p><p>Haceme clic</p><p>y arrastrá</p></div></div>'));
	creaDivs(nickname,100,50,50);
	
	// Darle movimiento con el click y arrastrar
	addMouseFunction();

	// Darle opción de disparo para las 4 direcciones
	$(document).keydown(function(e) {
		
		// Consultar si se tienen disparos disponibles
		if (disparos > 0) {

			// Consultar si tecla izquierda, arriba, derecha o abajo esta siendo presionada
			if(e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40) {
				
				// Decrementar cantidad de disparos disponibles
				disparos = disparos - 1;

				// Obtener coordenadas del div
				var lft = parseInt($('.divcito#'+nickname).css('left').replace("px",""));
				var tp = parseInt($('.divcito#'+nickname).css('top').replace("px",""));
				
				// emitir evento de disparo, con coordenadas y dirección
				socket.emit('disparo',e.keyCode,lft,tp,nickname);
				
				// Renderizar en pantalla el disparo 
				//disparar(e.keyCode,lft,tp,nickname);
			}
		}
	});

	// Agregarse a sí mismo a la lista de usuarios conectados
	$('ul#usuariosUl').append($('<li id="tu"></li>').text(nickname));

	// Para que no realize el post
	return false;
});

// Recepción de todos los otros jugadores por parte del servidor
socket.on('inicio', function(users, left, top, lifes) {
	
	// Llenar la lista de demás jugadores
	conectados = users;

	// Agregar un div por cada jugador y posicionarlo en la ubicación actual
	for (var i = 0; i < users.length; i++) {
		//$('div#display').append($('<div class="divcito" id="'+ users[i] +'"><div id="text"><h3>'+users[i]+'</h3><p class="life">'+ lifes[i] +'</p><p>Se mueve solo</p><p>:)</p></div></div>'));
		creaDivs(users[i],lifes[i],left[i],top[i]);
		

		//agregar a la lista de conectados
		$('ul#usuariosUl').append($('<li></li>').text(users[i]));
	};
});

//nuevo usuario conectado
socket.on('nuevo user', function(user) {
	
	// Agregar nuevo usuario a la lista de conectados
	conectados.push(user);

	// Agregar div de nuevo usuario
	//$('div#display').append($('<div class="divcito" id="'+ user +'"><div id="text"><h3>'+user+'</h3><p class="life">100</p><p>Se mueve solo</p><p>:)</p></div></div>'));
	creaDivs(user,100,50,50);
	//$('.divcito#'+user).css('left','50px').css('top','50px');

	// Agregar a la lista de usuarios conectados
	$('ul#usuariosUl').append($('<li></li>').text(user));
});

// Evento de movimientos de otros usuarios
socket.on('moviendo div', function(user, left, top) {
	
	// asignar la nueva posición del div correspondiente
	$('.divcito#'+user).css('left',left).css('top',top);
});

// Desconexión de un usuario
socket.on('div muerto', function(user) {
	
	// Quitar div de usuario desconectado
	$('.divcito#'+user).remove();

	// Quitar usuario de la lista de usuarios conectados
	$('ul#usuariosUl li').filter(function(index) { return $(this).text() === user; }).remove();
	
	// Eliminar el usuario de la lista interna de usuarios
	var index = conectados.indexOf(user);
	if (index > -1) {
	    conectados.splice(index, 1);
    }
});

//Disparar una flecha (o bala)
function disparar(code,left,top,baladatatype) {

	var fondo = $('div#display'); // Obtener campo de batalla
	var bala = $('<div class="flecha" data-type="' + baladatatype + '"></div>'); // Nueva bala

	//Cambiar css de la bala. Dibujarla en la posición que corresponda
	bala.css("left", left).css("top", top);

	// Agregar la bala al campo de batalla
	fondo.append(bala);
};

// Mueve las balas
function mover(baladatatype,direccion,sentido,agresor) {

	// Obtener bala que se va a mover
	var bala = $('.flecha[data-type="'+ baladatatype +'"]');

	//Si la bala no se obtuvo, es porq ya no existe más
	if (bala.length != 0){
		// obtener posicion X o Y actual (según direción horizontal o vertical)
		var valor = parseInt(bala.css(direccion).replace("px"));

		// cambiar la posición en 10px
		bala.css(direccion,(valor + (sentido * 50) + 'px'));

		// Controlar la colisión
		var collides = $('.divcito:not(#'+agresor+')').overlaps(bala);

		// en caso de que exista colisión, el número de objetivos será mayor a cero
		if (collides.targets.length != 0) {

			// obtener al que recibió la bala
			var herido = $(collides.targets[0]).attr('id');
			console.log('chocado '+agresor+ ' el herido es '+herido);
			
			//En caso de que la eliminación de la bala sea por servidor, esto no debería ir
			// eliminar la bala
			bala.remove();

			// en caso de que el que recibió la bala sea el jugador, emitir evento al servidor
			if(herido === nickname){
				socket.emit('herido',herido,agresor);
			}

			//en caso de que el agresor sea el que disparo la bala que colisionó con alguien
			//devolverle un disparo
			/*if(agresor === nickname){
				disparos = disparos + 1;
			}*/
		}	
	}
	
};

function morir(baladatatype,agresor){
	var bala = $('.flecha[data-type="'+ baladatatype +'"]');
	bala.remove();
	// en caso de que la bala sea del jugador, aumentar el número de disparos disponibles 
	if (agresor === nickname) { 
		disparos = disparos + 1; 
	};
};

// Escuchar los disparos de los demás jugadores, y renderizar la bala
socket.on('dispararbala',function(code,left,top,baladatatype) {
	disparar(code,left,top,baladatatype);
});

//Escuchar por el movimiento de las balas
socket.on('moverbala',function(baladatatype,direccion,sentido,agresor){
	mover(baladatatype,direccion,sentido,agresor);
});

//Escuchar la muerte de una bala sin colision
socket.on('matarbala',function(baladatatype,agresor){
	morir(baladatatype,agresor);
});

// Escuchar a los heridos de balas y cambiar el indicador de vida del jugador
socket.on('heridolife',function(herido,agresor,life) {
	$('.divcito#' + herido + ' .life').text(life);
});

// Escuchar en caso de que un jugador haya quedado sin vida
socket.on('0hp', function(herido, agresor) {

	// Poner el indicador de vida en 0
	$('.divcito#' + herido + ' .life').text(0);

	// Realizar una animación loca de muerte
	$('.divcito#' + herido).animate({
		left : '-=50px',
		top : '-=50px',
		width : '200px',
		height : '200px',
		'background-color' : 'black',
		opacity : 0,
	},500);

	// Esperar hasta que termine la animación y eliminar el div
	var waitToDeath = setTimeout(function() {
		$('.divcito#' + herido).remove();	
	},500);

	if(herido === nickname){
		$('#revivirbtn').show();
	}
});

function revivir(){
	socket.emit('reviviendo', nickname);
	$('#revivirbtn').hide();
};

socket.on('reviviendo',function(username,left,top){
	creaDivs(username,100,left,top);
	if(username === nickname){
		addMouseFunction();
	}
});

//Escuchar el pong
socket.on('ping',function(seconds,milliseconds){
	var d = new Date();
	var s = d.getSeconds();
	var m = d.getMilliseconds();

	s = s - seconds;
	m = (m + (s*1000)) - milliseconds;

	console.log('Ping: ms=' + m);
});
