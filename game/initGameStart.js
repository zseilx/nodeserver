

// 캐릭터 랜덤 위치 생성 및 배치, 재배치 관련 함수 파일
const setPosition = require('./setPosition');


const room_test = 'room1';
const TOTAL_GAME_TIME = 18000; // 게임 총 시간
const FRONT_SIDE_TIME = 5; // 게임 시작 대기 시간
const BACK_SIDE_TIME = 30; // 게임 종료 전 진행을 위한 시간
const PLUS_TIME = 5; // NPC 랜덤 퇴장 + 시간 간격
const MINUS_TIME = -5; // NPC 랜덤 퇴장 - 시간 간격
const CHAIR = 8; // 총 캐릭터 숫자 ( USER + NPC + empty포함 )

// 2018_02_15
// 게임 시작 시 유저와 NPC의 자리를 랜덤 생성 후 전달
// deeps level 1
function sendInit(socket, roomStatus, io) {
	//socket.on('sendInit', function(roomName) {
	socket.on('reqPosition', function() {
		console.log('initGameStart.sendInit function (reqPosition) socketEventt on'); // debug
		// console.log('reqPosition : socket get event');

		roomStatus[room_test]['gameStatus'] = 'go';


		if(typeof roomStatus[room_test]['characterPosition'] === 'undefined') {
			// console.log('sendInit : if = ' + '방생성');
			var playerNum = roomStatus[room_test]['users'].length;

			// console.log("플레이어 수 : " + playerNum);

			// 위치 랜덤 생성 배열 가져오기
			var randomPositionArrar = setPosition.createRandomPosition();

			// 전체 캐릭터 위치 지정
			setPosition.setRandomPosition(roomStatus, randomPositionArrar);

			// console.log('reqPosition : socket send event = resPosition');

			socket.emit('resPosition', roomStatus[room_test]['characterPosition']);

		} else {
			// console.log('sendInit : else = ' + '방생성 되있음, 포지션 정보만 전송');
			socket.emit('resPosition', roomStatus[room_test]['characterPosition']);
		}
	});
}

// 인게임에서 유저가 준비동작을 갖추었을 때
// deeps level 1
function handReady(socket, roomStatus, io) {

	socket.on('handReady', function(data) {

		console.log('handReady!!!');

		if(typeof roomStatus[room_test]['handReady'] === 'undefined')
			roomStatus[room_test]['handReady'] = new Array();
		
		//손 하나를 지정위치에 올려놓은 유저의 이름 받아옴
		var userId = data;
		//방에 있는 유저 수
		var userNum = roomStatus[room_test]['users'].length;
		//Ready한 사람의 수
		var readyNum = 0;

		
		roomStatus[room_test]['handReady'][userId] = 'twoIn';

		for (const key in roomStatus[room_test]['handReady']) {
			if(roomStatus[room_test]['handReady'][key] == 'twoIn'){
				readyNum++;
			}
		}

		if(readyNum==userNum){
			console.log('initGameStart.handReady function inGameStart 타이머 3초'); // debug

			roomStatus[room_test]['timeEvent']['handReadyTime'] =
				setTimeout(handReadyTime, 3000 , roomStatus, room_test, io);
			
			io.to(room_test).emit('handAllReady', 'handAllReady');
		}
	});
}

// 2018_03_24 
// 핸드 레디를 풀었을 경우 수신하는 이벤트
// deeps level 1
function handNotReady(socket, roomStatus, io){
	
	socket.on('handNotReady', function(data) {
		
		console.log('handNotReady!!!');


		//손을 지정위치에서 뺀 유저이름을 받아옴
		var userId = data;


		//게임시작 타이머를 세는중에 손을 지정위치에서 뺀 경우
		//if(roomStatus[room_test]['gameStatus'] == 'handReady'){
		if(typeof roomStatus[room_test]['handReady'] !== 'undefined') {
			
			if(roomStatus[room_test]['handReady'][userId] == 'twoIn'){
				delete roomStatus[room_test]['handReady'][userId];
			}
			
			//방 상태 go로 바꿈
			roomStatus[room_test]['gameStatus'] == 'go';
			//settimeout 정지
			console.log('3초 세고 있는데 누가 손뺏다능!!!');
			clearTimeout(roomStatus[room_test]['timeEvent']['handReadyTime']);
			

			io.to(room_test).emit('handNotReady', 'handNotReady');

		}else if(roomStatus[room_test]['gameStatus'] == 'go'){
			
			if(roomStatus[room_test]['handReady'][userId] == 'twoIn'){
				delete roomStatus[room_test]['handReady'][userId];
			}
			io.to(room_test).emit('handNotReady', 'handNotReady');
		}
	});
}


// 2018_03_17
// 한명의 npc가 실제로 퇴장하는 이벤트
// deeps level 3
// Recursive function 재귀 함수
function npcOutSocket(roomStatus, io){
	console.log('initGameStart.npcOutSocket function'); // debug
	var callTime = BACK_SIDE_TIME * 1000; // 다음 재귀 함수 호출 시간
	// 캐릭터 포지션 값중 NPC들의 위치 번호를 저장하는 Array
	var npcArray = getNpcPosition(roomStatus[room_test]['characterPosition']);

	// 초기 npcOutSocket 함수 호출시 실행 됨
	if(typeof roomStatus[room_test]['gameStartTime'] === 'undefined') {
		console.log('초기 npcOutSocket 함수 게임시작시간 셋팅'); // debug
		roomStatus[room_test]['gameStartTime'] = new Date().getTime(); // 초기 게임 시작 시간 저장

		// 가장 처음 이 함수가 시작 될 경우 게임이 갓 시작된 상태임.
		// 이 상태에서 초기 프론트 대기시간을 재귀함수 callTime에 1000을 곱한 상태로 더함으로써
		// 프론트 콜 타임을 적용 해줌
		callTime = callTime + (FRONT_SIDE_TIME * 1000);

	} else if(npcArray.length > 0) {
		var random = Math.floor(Math.random() * npcArray.length);
		var outNpcNum = npcArray[random];

		roomStatus[room_test]['characterPosition'][outNpcNum] = 'empty';
	
		console.log('npc퇴장 이벤트 발생함' + '   npcNum = ' + outNpcNum);
		io.to(room_test).emit('npcOut', outNpcNum)

	// NPC 배열에 아무것도 없을 시 모든 NPC가 나갔거나 사망했으므로 재귀 호출 없이 리턴 해버림
	} else {
		console.log('npc가 아무도 없어서 끝남');
		return ;
	}

	// 게임시간 = 총 게임시간에서 뒤 마무리 시간 제외한 값
	// (총 게임시간 - 마무리시간)
	var gameTime = TOTAL_GAME_TIME - BACK_SIDE_TIME;
	
	// 남은 게임 시간 계산
	// 게임시간 - (현재시간 - 게임 시작시간)
	remainingPlayTime = (gameTime * 1000) - (new Date().getTime() - roomStatus[room_test]['gameStartTime']);
	console.log('initGameStart.npcOutSocket function : remainingPlayTime = ' + remainingPlayTime); // debug
	

	// 재귀
	if(remainingPlayTime > 0 && roomStatus[room_test]['gameStatus'] == 'handAllReady') {
		console.log('npc out event 아직 더 실행해야함');

		var nextNpcOutTime = remainingPlayTime / npcArray.length; // 다음 NPC퇴장 시간을 남은 NPC수만큼 나눔
		var randomTime = Math.floor(Math.random() * (PLUS_TIME - MINUS_TIME)) + MINUS_TIME; // npc퇴장 시간 랜덤부여
		randomTime *= 1000;
	
		// 다음 함수 호출 시간
		callTime += nextNpcOutTime;
		callTime += randomTime;

		roomStatus[room_test]['timeEvent']['npcOutSocket'] =	setTimeout(function() {
																	npcOutSocket(roomStatus, io)
																}, callTime);
	}
}






// npc 위치 받아오기
// deeps level 4
function getNpcPosition(characterPosition) {
	var npcArray = new Array(); // NPC들의 번호를 배열에 저장

	// NPC가 살아 있는 자리의 번호들을 배열에 저장
	idx = characterPosition.indexOf('NPC');
	while(idx != -1) {
		npcArray.push(idx);
		idx = characterPosition.indexOf('NPC', idx + 1);
	}

    return npcArray;
}


// 플레이어 핸드레디 전부 확인 시 게임 시작 및 npc 자리 셋팅 등 실제 게임 시작
// deeps level 2
function handReadyTime(roomStatus, room_test, io) {
	console.log('오케이 3초동안 준비 잘했어 진짜 게임 시작할께');
	roomStatus[room_test]['gameStatus'] = 'handAllReady';
	io.to(room_test).emit('timeUp', 'timeUp');

	//정전변수
	var lightList = new Array();

	lightList[0] = Math.floor(Math.random() * (10 - 5))+5;
	lightList[1] = Math.floor(Math.random() * (75 - 45))+45;
	lightList[2] = Math.floor(Math.random() * (105 - 75))+75;
	lightList[3] = Math.floor(Math.random() * (135 - 105))+105;
	lightList[4] = Math.floor(Math.random() * (180 - 135))+135;

	console.log('첫번째 정전시간'+lightList[0]);
	
	//게임 타이머 설정
	roomStatus[room_test]['timeEvent']['gameTime'] = setTimeout(gameTime, TOTAL_GAME_TIME * 1000 , roomStatus, io);
	
	//정전 타이머 설정
	roomStatus[room_test]['timeEvent']['lightTime'] = new Array();

	for( var i = 0 ; i < 5 ; i++){
		roomStatus[room_test]['timeEvent']['lightTime'][i] =
			setTimeout(lightTime, lightList[i] * 5000000 , roomStatus, io);
	}

	// Recursive function 재귀 함수
	// npc 나가는 이벤트
	// 시연용으로 주석처리 해논거임.
	//npcOutSocket(roomStatus, io);
}

// 게임 타이머 함수
// deeps level 3
function gameTime(roomStatus, io) {
		console.log('게임 타임 끝');

		gameEndClear(roomStatus, room_test);
		
		//게임 끝 정보 서버에 전송
		io.to(room_test).emit('timeOver', 'timeOver'); 	
}

function lightTime(roomStatus, io) {
	console.log('정전신호 보냄');

	io.to(room_test).emit('lightOut', 'lightOut'); 	
}


// 2018_04_12
// 한 방에서의 게임 종료시 배열 정리 및 데이터 삭제
// deeps level 2~4
function gameEndClear(roomStatus, roomName) {
	console.log('방 정보 초기화');

	if(typeof roomStatus[roomName]['timeEvent'] !== 'undefined') {
		//실행중인 settimeout 모두 삭제
		for(var key in roomStatus[roomName]['timeEvent']){
			clearTimeout(roomStatus[roomName]['timeEvent'][key]);
		}
		if(typeof roomStatus[roomName]['timeEvent']['lightTime'] !== 'undefined') {
			for(var i = 0 ; i < 5 ; i++){
				clearTimeout(roomStatus[roomName]['timeEvent']['lightTime'][i]);
			}
		}
	}
	
	// 게임이 종료되고 로비상태로 진입 했다고 설정
	roomStatus[room_test]['gameStatus'] = 'robie';
	
	delete roomStatus[roomName]['characterPosition'];
	delete roomStatus[roomName]['handReady'];
	delete roomStatus[roomName]['gameStartTime'];
	

	//게임상태 변경
	/*
    delete roomStatus[room_test];
	roomStatus[room_test] = new Array();
	*/
}

function lobbyEndClear(lobbyStatus, lobby_test) {
	console.log('로비 정보 초기화');

	lobbyStatus[lobby_test]['gameStatus'] = 'endRobie';
}


exports.sendInit = sendInit;
exports.handReady = handReady;
exports.handNotReady = handNotReady;
exports.gameEndClear = gameEndClear;
exports.lobbyEndClear = lobbyEndClear;
