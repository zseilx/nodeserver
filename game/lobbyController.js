const initGameStart = require('./initGameStart');

const lobby_test = 'lobby1';


function joinLobby(socket, lobbyStatus, io) {
    socket.on('joinLobby', function(userId) {
        console.log('로비 입장');
        //로비 생성 테스트 코드
        if(typeof lobbyStatus[lobby_test] === 'undefined') {
            lobbyStatus[lobby_test] = new Array();
            lobbyStatus[lobby_test]['gameStatus'] = 'playing';
        }
        
        //로비 유저 배열 생성
        if(typeof lobbyStatus[lobby_test]['users'] === 'undefined') {
            console.log("로비 유저 배열 생성");
            lobbyStatus[lobby_test]['users'] = new Array(); 
        }

        if(typeof socket.lobbyName !== 'undefined') {
			socket.emit('joinLobbyError','다중 접속은 허용되지 않습니다. 기존의 방 입장 정보와 아이디를 삭제하고, 새로운 아이디로 접속합니다.');
			console.log('socket 하나에서 다중 접속 시도');

			socket.leave(socket.lobbyName);
			for(var key in lobbyStatus[lobby_test]['users']) {
				if(lobbyStatus[lobby_test]['users'][key][0] == socket.gameId) {
					lobbyStatus[lobby_test]['users'].splice(key, 1);
				}
			}
		}
		socket.gameId = userId;
		socket.lobbyName = lobby_test;
		socket.join(lobby_test);
		

        //로비에 있는 유저수 체크
        var userCnt = lobbyStatus[lobby_test]['users'].length;
        
        lobbyStatus[lobby_test]['users'][userCnt] = new Array();
        lobbyStatus[lobby_test]['users'][userCnt][0] = userId;

		// 방금 입장한 사람에게 방 안에 존재하는 사람들의 아이디를 보내줌
		var lobbyUserList = new Array();
		for (var i = 0; i < userCnt+1; i++) {
            console.log(lobbyStatus[lobby_test]['users'][i][0]);
            lobbyUserList[i] = lobbyStatus[lobby_test]['users'][i][0];
        }
        

        io.to(lobby_test).emit('lobbyUserList', lobbyUserList);
    
    });
}


function exitLobby(socket, lobbyStatus, io){
	//유저id받아옴
	socket.on('exitLobby', function(nick) {
		console.log('로비 퇴장');
		if(typeof lobbyStatus[lobby_test]['users'] !== 'undefined') {
			var userCnt = lobbyStatus[lobby_test]['users'].length;
			var userId  = nick;

			for(var i=0 ; i < userCnt ; i++){
				
				if(lobbyStatus[lobby_test]['users'][i][0] == userId){
					
					lobbyStatus[lobby_test]['users'].splice(i,1);
					
					socket.broadcast.to(lobby_test).emit('exitUser', userId);

                    if(lobbyStatus[lobby_test]['users'].length  <= 1 && lobbyStatus[lobby_test]['gameStatus'] != 'playing') {
						io.to(lobby_test).emit('endLobby', 'endLobby');    
						initGameStart.lobbyEndClear(lobbyStatus, lobby_test);
					}

					break;
				}	
			}
		}
		delete socket.lobbyName;	// 게임 나갈시 소켓에 로비 이름 삭제
		delete socket.gameId;	// 현재 입장시 게임 아이디 셋팅을 하므로 지워줌 추후 로그인 추가 될 시 필요 없음
	});
}

function teleport(socket, lobbyStatus, io){
	socket.on('tpNow', function(data) {
        
        socket.broadcast.to(lobby_test).emit('tpData', data);
    
	});
}

//씬 연결 부분
function setIndex(socket){
	socket.on('index', function(index){
        console.log("인덱스 요청 받고 resIndex 보냄");
		socket.emit('resIndex', 'sendIndex');
	});
}

//낚시 시작 했을 때
function fishing(socket, lobbyStatus, io){
    socket.on('fishing', function(){
        console.log("낚시 시작");

		// var fishNum = Math.floor(Math.random() * (7 - 0)) + 0;
		//시연용
		var fishNum = 1;

		console.log(fishNum);

		io.to(lobby_test).emit('getFish', fishNum); 	
    });
}

function getBus(socket, lobbyStatus, io){
    socket.on('getBus', function(data){
        console.log("버스 탑승");

		io.to(lobby_test).emit('getBusRes', data); 	
    });
}

function outBus(socket, lobbyStatus, io){
    socket.on('outBus', function(data){
        console.log("버스 오리루");

		io.to(lobby_test).emit('outBusRes', data);
	});
}

function moveBus(socket, lobbyStatus, io){
	socket.on("moveBus", function(data){
		console.log("버스 움직임");

		io.to(lobby_test).emit('moveBusRes', data);
	});
}

function lobbyMove(socket, lobbyStatus, io) {
    socket.on('lobbyNow', function(jsonStr) {

		// 같은 방에 존재하는 유저들에게 본인의 위치 정보를 전송함
		socket.broadcast.to(lobby_test).emit('lobbyResult', jsonStr);
	});
};


exports.joinLobby = joinLobby;
exports.exitLobby = exitLobby;
exports.teleport = teleport;   
exports.setIndex = setIndex;
exports.fishing = fishing;
exports.getBus = getBus;
exports.outBus = outBus;
exports.moveBus = moveBus;
exports.lobbyMove = lobbyMove;