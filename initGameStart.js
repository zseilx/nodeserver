
const room_test = 'room1';

const totalGameTime = 180; // 게임 총 시간
const sideTime = 15; // 게임 양 끝의 대기 시간? (게임 시작 대기, 게임 종료 전 진행을 위한 시간)

// 2018_02_15
// 게임 시작 시 유저와 NPC의 자리를 랜덤 생성 후 전달
// deeps level 1
function sendInit(socket, roomStatus, chair, io) {
	//socket.on('sendInit', function(roomName) {
	socket.on('reqPosition', function() {
		// console.log('reqPosition : socket get event');

		roomStatus[room_test]['gameStatus'] = 'go';


		if(roomStatus[room_test]['characterPosition'] == null) {
			console.log('sendInit : if = ' + '방생성');
			var playerNum = roomStatus[room_test]['users'].length;

			console.log("플레이어 수 : " + playerNum);

			// 위치 랜덤 생성 배열 가져오기
			var arr = initPosition(playerNum, chair);

			roomStatus[room_test]['characterPosition'] = new Array();

			for(var i=0; i < chair; i++) {
				if(i < playerNum) {
					roomStatus[room_test]['characterPosition'][arr[i]] = roomStatus[room_test]['users'][i][0];
				} else {
					roomStatus[room_test]['characterPosition'][arr[i]] = 'NPC';
				}
			}

			// console.log('reqPosition : socket send event = resPosition');

			socket.emit('resPosition', roomStatus[room_test]['characterPosition']);

		} else {
			console.log('sendInit : else = ' + '방생성 되있음, 포지션 정보만 전송');
			socket.emit('resPosition', roomStatus[room_test]['characterPosition']);
		}
	});
}

// 인게임에서 유저가 준비동작을 갖추었을 때
// deeps level 1
function handReady(socket, roomStatus, io) {

	socket.on('handReady', function(data) {

		console.log('handReady!!!');

		if(roomStatus[room_test]['handReady'] == null)
			roomStatus[room_test]['handReady'] = new Array();
		
		//손 하나를 지정위치에 올려놓은 유저의 이름 받아옴
		var userId = data;
		//방에 있는 유저 수
		var userNum = roomStatus[room_test]['users'].length;
		//Ready한 사람의 수
		var readyNum = 0;

		//손이 들어 올때마다 배열 값 변경
		// if(roomStatus[room_test]['handReady'][userId]==null){
		// 	console.log('손 하나 들어간 상태');
		// 	roomStatus[room_test]['handReady'][userId] = 'oneIn';
		// }else if(roomStatus[room_test]['handReady'][userId]=='oneIn'){
		// 	console.log('손 두개 들어간 상태');
		// 	roomStatus[room_test]['handReady'][userId] = 'twoIn';
		// }

		roomStatus[room_test]['handReady'][userId] = 'twoIn';

		for (const key in roomStatus[room_test]['handReady']) {
			if(roomStatus[room_test]['handReady'][key] == 'twoIn'){
				readyNum++;

				console.log('ready한 사람 수 : ',readyNum);
			}
		}

		if(readyNum==userNum){
			console.log('유저 모두 인게임 완료!!! 젠부사쓰!!!!!!!!!!!!!!!');
			console.log('타이머 3초!!!');
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
		if(roomStatus[room_test]['gameStatus']=='handReady'){

			if(roomStatus[room_test]['handReady'][userId] == 'twoIn'){
				delete roomStatus[room_test]['handReady'][userId];
			}
			
			//방 상태 go로 바꿈
			roomStatus[room_test]['gameStatus']=='go';
			//settimeout 정지
			console.log('3초 세고 있는데 누가 손뺏다능!!!');
			clearTimeout(handReadyTime);
			

			io.to(room_test).emit('handNotReady', 'handNotReady');

		}else if(roomStatus[room_test]['gameStatus']=='go'){
			
			if(roomStatus[room_test]['handReady'][userId] == 'twoIn'){
				delete roomStatus[room_test]['handReady'][userId];
			}
			io.to(room_test).emit('handNotReady', 'handNotReady');
		}
	});
}


// 2018_03_17
// 한명의 npc가 실제로 퇴장하는 이벤트
// deeps level 2
function npcOut(roomStatus, npcNum, io){
	console.log('npc퇴장 이벤트 발생함' + '   npcNum = ' + npcNum);

	roomStatus[room_test]['characterPosition'][npcNum] = 'empty';

	io.to(room_test).emit('npcOut', npcNum);
}



// 2018_02_15
// npc 및 player 위치 랜덤생성
// deeps level 2
function initPosition(playerNum, chair) {

	var position = new Array(chair);

	for (var i = 0; i < chair; i++) {
		position[i] = i;
	}

	var temp = 0;
	for (var i = 0; i < chair; i++) {
		var num = Math.floor((Math.random() * chair - i) + i);

		temp = position[i];
		position[i] = position[num];
		position[num] = temp;
	}

	return position;
};


// npc가 퇴장하는 랜덤 시간 배열 return
// deeps level 2
function randomTimeNpcOut(npcCnt) {
    var averOutTime = (totalGameTime - sideTime * 2) / npcCnt;

    var outTimeArray = new Array();
    for(var i=0; i<npcCnt; i++) {
       var randomNum = Math.floor(Math.random() * 6); // 0~5의 값을 뽑아내기 위함 맞는지 체크 필요
       outTimeArray[i] = averOutTime - randomNum;
    }
    outTimeArray[npcCnt] = averOutTime;

   return outTimeArray;
};

// npc 랜덤 퇴장 자리 선정
// deeps level 2
function randomPositionNpc(npcPosition) {

    var temp = 0;
    var arrayCnt = 0;
    var random = new Array();
    
    for(var i=0; i<npcPosition.length; i++) {
        if(npcPosition[i] == 'NPC') {
            random[arrayCnt] = i;
            arrayCnt++;
        }
    }

	for (var i = 0; i < random.length; i++) {
        var num = Math.floor((Math.random() * random.length - i) + i);

		temp = random[i];
		random[i] = random[num];
        random[num] = temp;
    }

    return random;
}

// 플레이어 핸드레디 전부 확인 시 게임 시작 및 npc 자리 셋팅 등 실제 게임 시작
// deeps level 2
function handReadyTime(roomStatus, room_test, io) {
	console.log('오케이 3초동안 준비 잘했어 진짜 게임 시작할께');
	roomStatus[room_test]['gameStatus']=='handAllReady';
	io.to(room_test).emit('timeUp', 'timeUp');
	
	//게임 타이머 설정
	setTimeout(gameTime, 180000 , roomStatus, io);

	var npcCnt = 8-roomStatus[room_test]['users'].length;//npc 수

	var eventNpcOut = randomTimeNpcOut(npcCnt);

	var npcPosition = randomPositionNpc(roomStatus[room_test]['characterPosition']);

	var j=0;

	//방 상태확인 추가
	while(npcPosition.length > 0) {
		setTimeout(npcOut, 
			(eventNpcOut[j] + (eventNpcOut[npcCnt] * j) + sideTime) * 1000, 
			roomStatus, npcPosition[0], io);

		npcPosition.splice(0,1);
		j++;
	}

}

// 게임 타이머 함수
// deeps level 3
function gameTime(roomStatus, io){
		console.log('게임 타임 끝');
		
		//방 배열 삭제
		delete roomStatus[room_test];
		//게임 끝 정보 서버에 전송
		io.to(room_test).emit('timeOver', 'timeOver'); 	
}



exports.sendInit = sendInit;
exports.handReady = handReady;
exports.handNotReady = handNotReady;
