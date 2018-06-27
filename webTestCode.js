// 캐릭터 랜덤 위치 생성 및 배치, 재배치 관련 함수 파일
const setPosition = require('./game/setPosition');

const room_test = 'room1';

function webNpcOut(socket, roomStatus, io) {
	
	socket.on('webNpcOut', function(num) {
		if(typeof roomStatus[room_test] === 'undefined') {
			return;
		}
		if(typeof roomStatus[room_test]['characterPosition'] === 'undefined') {
			return;
		}
		if(roomStatus[room_test]['characterPosition'][num] === 'NPC') {
			console.log('파싱 전 ' + typeof num);
			num = parseInt(num, 10);
			console.log('파싱 후' + typeof num);
			console.log(num + " 번 웹으로 NPC 퇴장");
			roomStatus[room_test]['characterPosition'][num] = 'empty';
			
			io.to(room_test).emit('npcOut', num);
		}
		else {
			console.log(num + " 번 이미 퇴장 했거나 유저임(웹요청)");
		}
	});
	
};

function webLightOut(socket, roomStatus, io) {
	socket.on('webLightOut', function(log) {
		console.log("신호는 날라옴");
		if(typeof roomStatus[room_test] === 'undefined') {
			return;
		}
		if(typeof roomStatus[room_test]['characterPosition'] === 'undefined') {
			return;
		}

		console.log('웹 정전신호 호출')
		io.to(room_test).emit('lightOut', 'lightOut'); 	
	});
}

exports.webNpcOut = webNpcOut;
exports.webLightOut = webLightOut;