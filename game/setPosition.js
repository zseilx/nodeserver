/** 2018_03_31
 * 이 페이지의 함수들은 initGameStart.js와 playGame에서 사용함
 * 게임 내 캐릭터들을 재 배치하기 위한 함수들로 구성 되어 있음
 * 
 */

const room_test = 'room1';

const CHAIR = 8; // 총 캐릭터 숫자 ( USER + NPC + empty포함 )

// 2018_02_15
// npc 및 player 위치 랜덤생성
// deeps level 2
function createRandomPosition() {

	var position = new Array();

	for (var i = 0; i < CHAIR; i++) {
		position[i] = i;
	}

	var temp = 0;
	for (var i = 0; i < CHAIR; i++) {
		var num = Math.floor((Math.random() * CHAIR - i) + i);

		temp = position[i];
		position[i] = position[num];
		position[num] = temp;
	}

	return position;
};
/*
// 2018_03_31
// 게임 시작 시 캐릭터 위치 배치, 및 도중 위치 변경 시 처리하는 함수
// deeps level 2
function setRandomPosition(roomStatus, randomPosition) {
	console.log('setPosition.setRandomPosition function loding'); // debug
	// 초기 캐릭터 배치 이벤트
	if( typeof roomStatus[room_test]['characterPosition'] === 'undefined') {

		roomStatus[room_test]['characterPosition'] = new Array();

		var userNum = roomStatus[room_test]['users'].length;
		var i=0;
		// user 수만큼 자리 배치를 먼저 한 후
		for(; i < userNum ; i++) {
			roomStatus[room_test]['characterPosition'][randomPosition[i]] = roomStatus[room_test]['users'][i][0];
		}
		// 나머지는 NPC로 차리를 채움
		for(; i < CHAIR; i++) {
			roomStatus[room_test]['characterPosition'][randomPosition[i]] = 'NPC';
		}

	// 이미 배치 된 상태를 바꾸는 형태
	} else {
		var temp = '';
		
		for(var i=0; i < CHAIR; i++) {
			temp = roomStatus[room_test]['characterPosition'][i];
			roomStatus[room_test]['characterPosition'][i] = roomStatus[room_test]['characterPosition'][randomPosition[i]];
			roomStatus[room_test]['characterPosition'][randomPosition[i]] = temp;
		}
	}
}
*/

// 데모용
function setRandomPosition(roomStatus, randomPosition) {
	console.log('setPosition.setRandomPosition function(demo mode) loding'); // debug
	// 초기 캐릭터 배치 이벤트
	if( typeof roomStatus[room_test]['characterPosition'] === 'undefined') {

		roomStatus[room_test]['characterPosition'] = new Array();

		var userNum = roomStatus[room_test]['users'].length;
		var i=0;
		// user 수만큼 자리 배치를 먼저 한 후
		roomStatus[room_test]['characterPosition'][0] = 'NPC';
		roomStatus[room_test]['characterPosition'][1] = 'NPC';
		roomStatus[room_test]['characterPosition'][2] = 'NPC';
		roomStatus[room_test]['characterPosition'][3] = roomStatus[room_test]['users'][0][0];
		roomStatus[room_test]['characterPosition'][4] = 'NPC';
		roomStatus[room_test]['characterPosition'][5] = 'NPC';
		roomStatus[room_test]['characterPosition'][6] = 'NPC';
		roomStatus[room_test]['characterPosition'][7] = roomStatus[room_test]['users'][1][0];
		

	// 이미 배치 된 상태를 바꾸는 형태
	} else {
	}

}

exports.createRandomPosition = createRandomPosition;
exports.setRandomPosition = setRandomPosition;