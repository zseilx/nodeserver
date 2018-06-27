// 게임 초기 설정 관련된 파일로서, 게임 엔드시 작업 처리 관련해서 불러옴
const initGameStart = require('./initGameStart');

// 방 생성 관련 테스트
const room_test = 'room1';


// 2018_02_08
// 유저가 방 생성 시
// deeps level 1
function createRoom(socket, roomStatus) {
	socket.on('createRoom', function(roomName, userId) {
		socket.join(roomName);
		
		// 2018-02_12
		// room 배열에 유저의 아이디를 집어넣는 부분이 필요
		roomStatus[roomName]['users'] = new Array();
		roomStatus[roomName]['users'][0] = new Array();

		roomStatus[roomName]['users'][0][0] = userId;
		roomStatus[roomName]['users'][0][1] = 'notReady';
	});
}

// 2018_02_05 
// 유저별 room 젒속
// 추후에 처리해야함. 현재는 테스트 상 임시로 room1 로 통일
// deeps level 1
function joinRoom(socket, roomStatus, io) {
//	socket.on('joinRoom', function(roomName, userId) {
	socket.on('join', function(userId) {
		console.log('roomController.joinRoom function (joinRoom) socketEventt on'); // debug
		
		// 현재 소켓(클라이언트)이 접속해 있는 방이 있을 경우
		if(typeof socket.roomName !== 'undefined') {
			socket.emit('joinRoomError','다중 접속은 허용되지 않습니다. 기존의 방 입장 정보와 아이디를 삭제하고, 새로운 아이디로 접속합니다.');
			console.log('socket 하나에서 다중 접속 시도');

			socket.leave(socket.roomName);
			for(var key in roomStatus[room_test]['users']) {
				if(roomStatus[room_test]['users'][key][0] == socket.gameId) {
					roomStatus[room_test]['users'].splice(key, 1);
				}
			}
		}
		socket.gameId = userId;
		socket.roomName = room_test;
		socket.join(room_test);
		
		// 2018_02_12
		// room 배열에 유저의 아이디를 집어 넣는 부분
		/*
		var userCnt = roomList[roomName].length;

		roomList[roomName][userCnt] = new Array();
	
		roomList[roomname][userCnt][0].push(userId);
		roomList[roomname][userCnt][1].push('notReady');
		*/
		// 테스트용 코드 방 생성
		if(typeof roomStatus[room_test] === 'undefined') {
			roomStatus[room_test] = new Array();
			roomStatus[room_test]['gameStatus'] = 'robie';
		}

		if(roomStatus[room_test]['gameStatus'] != 'robie') {
			console.log('방입장 불가(게임이 시작했거나 방이 존재하지 않음)');
			return;
		}
		// 테스트용 코드
		// 방에 입장 시 새로운 방 생성  및 유저의 정보를 방 정보에 삽입
		if(typeof roomStatus[room_test]['users'] === 'undefined') {
			console.log("라스트 원 체어 유저 배열 생성");
			roomStatus[room_test]['users'] = new Array(); // 이 코드는 현재 테스트 용으로 실제 createRoom이 동작시 필요 없어짐.
		}
		if(typeof roomStatus[room_test]['timeEvent'] === 'undefined'){
			roomStatus[room_test]['timeEvent'] = new Array();
		}

		var userCnt = roomStatus[room_test]['users'].length;
		// console.log('joinRoom : userCnt = ' + userCnt);
		
		// 입장한 유저의 번호를 할당, 및 유저 정보 삽입
		roomStatus[room_test]['users'][userCnt] = new Array();

		roomStatus[room_test]['users'][userCnt][0] = userId;
		roomStatus[room_test]['users'][userCnt][1] = 'notReady';


		// 방에 입장 시 방 안에 존재하는 사람들에게 현재 입장한 유저의 아이디를 전송
		//socket.broadcast.to(room_test).emit('joinUser', userId);

		// 방금 입장한 사람에게 방 안에 존재하는 사람들의 아이디를 보내줌
		var roomUserList = new Array();
		for (var i = 0; i <= userCnt; i++) {
			roomUserList[i] = roomStatus[room_test]['users'][i][0];
		}

		console.log('유저배열 전송'+roomUserList[0]);
		io.to(room_test).emit('userIndex', roomUserList);
		

		// console.log('user is join the ' + room_test + ' userId = ' + userId);
	});
}

// 2018_02_19
// 방 입장 후 로비에서의 유저가 레디 하는 것을 수신 및, 전체 유저의 레디 상황 체크, 게임 타이머
// deeps level 1
function userReadyChk(socket, roomStatus, io) {

	socket.on('checkReady', function(jsonObj) {
		// console.log('roomController.userReadyChk function (checkReady) socketEventt on'); // debug
		
		// 레디 한 유저를 찾는 for문
		for(var i=0; i<roomStatus[room_test]['users'].length; i++) {
			// -- if 레디한 유저를 찾음
			if(roomStatus[room_test]['users'][i][0] == jsonObj.nick) {
				// 보낸 상태가 레디 일 경우
				if(jsonObj.ready == 'True') {
					// 해당 유저의 상태를 ready로 변환
					roomStatus[room_test]['users'][i][1] = 'ready';
					// console.log('user is ready  userId = ' + jsonObj.nick);
					// 방 내에 존재하는 사람들에게 레디 했다는 것을 전송
					socket.broadcast.to(room_test).emit('ready', jsonObj.nick);

					// console.log('allReadyChk 전의 상황');
					// 방 안에 존재하는 모든 사람들이 레디를 했는지 체크
					if( allReady(roomStatus) ) {
						// console.log('allReadyChk 완료 : emit 신호가 날아가야함');
						// 모두 레디 했다는 것을 나를 포함한 방안에 있는 모든 유저들에게
					
						socket.broadcast.to(room_test).emit('allReady','broadcastAllReady');
						socket.emit('allReady','emitAllReady');
					}
				} else { // 아닐 경우
					// 해당 유저의 상태를 notReady로 변환
					roomStatus[room_test]['users'][i][1] = 'notReady';
					// console.log('user cancel ready  userId = ' + jsonObj.nick);
					// 방 내에 존재하는 사람들에게 레디를 풀었다는 것을 전송
					socket.broadcast.to(room_test).emit('notReady', jsonObj.nick);
				}
			}
		}
		
	});
}

// 2018_02_19
// userReadyChk 안에서 실행 되는 함수 ( 모든 유저들의 레디를 검사해서 start 신호를 던져줌)
// deeps level 2
function allReady(roomStatus) {
	var cnt = 0;

	const userNum = roomStatus[room_test]['users'].length;

	// console.log('allReady : userNum = ' + userNum);

	for(var i=0; i<userNum; i++) {
		if(roomStatus[room_test]['users'][i][1] == 'ready') {
			cnt++;
		}
	}

	// 두명 이상일 경우
	if(cnt == userNum && cnt >= 2) {
		// console.log('allReady : return = true의 상황  cnt = ' + cnt);
		return true;
	} else {
		// console.log('allReady : return = false의 상황  cnt = ' + cnt);
		return false;
	}
}

// 2018_02_20
// 유저가 방 나가기를 눌렀을때 방퇴장 처리
// deeps level 1
function exitRoom(socket, roomStatus, io){
	//유저id받아옴
	socket.on('exit', function(nick) {
		console.log('게임 퇴장 함수 실행');
		if(typeof roomStatus[room_test] === 'undefined') {

		}else{
			var userCnt = roomStatus[room_test]['users'].length;
			var userId  = nick;

			// console.log('exit userId = ' + userId);

			for(var i=0 ; i < userCnt ; i++){
				
				if(roomStatus[room_test]['users'][i][0] == userId){
					
					roomStatus[room_test]['users'].splice(i,1);
					
					var roomUserList = new Array();



					var nowUserCnt = roomStatus[room_test]['users'].length;

					if(nowUserCnt == 0){

						roomUserList[0] = "0";

					}else{	
						for (var i = 0; i <= nowUserCnt; i++) {
							roomUserList[i] = roomStatus[room_test]['users'][i][0];
						}
					}


					io.to(room_test).emit('userIndex', roomUserList);

					if(roomStatus[room_test]['users'].length  <= 1 && roomStatus[room_test]['gameStatus'] != 'robie') {
						io.to(room_test).emit('endGame', 'endGame');    
						initGameStart.gameEndClear(roomStatus, room_test);
					}

					break;
				}	
			}
		}
		delete socket.roomName;	// 게임 나갈시 소켓에 저장한 방 이름 삭제
		delete socket.gameId;	// 현재 입장시 게임 아이디 셋팅을 하므로 지워줌 추후 로그인 추가 될 시 필요 없음
	});
}

function startGame(socket, roomStatus, io) {
	socket.on('start', function() {
		
		console.log('게임 시작');

		if(typeof roomStatus[room_test] === 'undefined') {
			
		}else{
			var userCnt = roomStatus[room_test]['users'].length;

			var roomUserList = new Array();
			for (var i = 0; i < userCnt; i++) {
				roomUserList[i] = roomStatus[room_test]['users'][i][0];
			}
		}


        io.to(room_test).emit('startGame', roomUserList);
	});
};

exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
exports.userReadyChk = userReadyChk;
exports.exitRoom = exitRoom;
exports.startGame = startGame;

