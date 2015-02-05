var socket = io();

var nickname;

var conectados = [];

$('div#display').hide();
$('#error').hide();

$('form#login').submit(function() {
	var nickname = $('input#nickInput').val();
	nickname = nickname.replace(/ /g,'-');
	if (conectados.indexOf(nickname) !== -1) {
		$('#error').slideDown(200);
		return false;
	};
	$('#error').slideUp(200)
	$('div#nickname').slideUp(200);
	$('div#display').slideDown(200);
	socket.emit('ingresar', nickname);

	$('div#display').append($('<div style="z-index:999; background:darkcyan;" class="divcito" id="'+ nickname +'"><div id="text"><h3>'+nickname+'</h3><p>Haceme clic</p><p>y arrastrá</p></div></div>'));

	$('#'+nickname).mousemove(function(e) {
		if (e.which === 1) {
			$('#'+nickname).css('left',e.pageX - 100).css('top',e.pageY - 100);
			socket.emit('moviendo div', nickname,$('#'+nickname).css('left'), $('#'+nickname).css('top'));
		};

	});

	return false;
});


socket.on('inicio', function(users, left, top) {
	conectados = users;
	for (var i = 0; i < users.length; i++) {
		$('div#display').append($('<div class="divcito" id="'+ users[i] +'"><div id="text"><h3>'+users[i]+'</h3><p>Se mueve solo</p><p>:)</p></div></div>'));
		$('#'+users[i]).css('left',left[i]).css('top',top[i]);
	};
});

//nuevo usuario conectado
socket.on('nuevo user', function(user) {
	conectados.push(user);
	$('div#display').append($('<div class="divcito" id="'+ user +'"><div id="text"><h3>'+user+'</h3><p>Se mueve solo</p><p>:)</p></div></div>'));
	$('#'+user).css('left','50px').css('top','50px');
});


//moviendo div
socket.on('moviendo div', function(user, left,top) {
	$('#'+user).css('left',left).css('top',top);
});

//capturar quien sigue conectado
socket.on('div muerto', function(user) {
	conectados.pull(user);
	$('#'+user).remove();
});
