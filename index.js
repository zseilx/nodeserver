
/* 제목 : webRTC 테스트용 코드들
 * 작성자 : 정영화
 * 작성일 : 2018_05_07
 * 내용 : unity 게임에 음성 채팅을 구현하기 위한 예시 소스코드들로 구성
 *       
 */

var config = require("./voicechat/config.json");
var http = require("http");
//var socket = require("socket.io");
var ws = require('ws');
var wns = require('./voicechat/WebsocketNetworkServer');


var httpServer = null;
if (config.httpConfig) {
    httpServer = http.createServer();
    httpServer.listen(
        config.httpConfig.port 
        ,function () { console.log('Listening on ' + httpServer.address().port); }
    );
}

var websocketSignalingServer = new wns.WebsocketNetworkServer();
if (httpServer) {
    //perMessageDeflate: false needs to be set to false turning off the compression. if set to true
    //the websocket library crashes if big messages are received (eg.128mb) no matter which payload is set!!!
    var webSocket = new ws.Server({ server: httpServer, path: config.app.path, maxPayload: config.maxPayload, perMessageDeflate: false });
    websocketSignalingServer.addSocketServer(webSocket, config.app);
}


/******************************************************************************************************/
/****************************************** External Module *******************************************/
/******************************************************************************************************/
const port = 5000;

const express = require('express');

const app = express();

const server = require('http').createServer(app);

server.listen(port, function() {
	// 2018_01_28 
	// Server 시작을 알리는 부분
	console.log('Server Started!');
});

// socket.io 서버 생성
// const io = require('socket.io').listen(port);
const io = require('socket.io').listen(server);

io.set('heartbeat timeout', 10000); 
io.set('heartbeat interval', 10000);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/testWeb/serverTestWeb.html');
});


/******************************************************************************************************/
/****************************************** Internal Module *******************************************/
/******************************************************************************************************/

// DB 커넥션 및 익스큐트 전부 포함
const conn = require('./db/DBConnection');

// 방 관리의 주요 기능들을 모아놓은 것
const roomController = require('./game/roomController');
// 게임 시작 시 초기 셋팅
const initGameStart = require('./game/initGameStart');
// 유저가 서버에 접속 및 해제했을 때의 처리
// const serverController = require('./serverController'); // 현재 사용안함
// 게임 내부에서 동작하는 이벤트들을 처리
const playGame = require('./game/playGame');
// 로비 부분
const lobbyController = require('./game/lobbyController');


// 웹에서 게임을 컨트롤 하기 위한 부분
const webTestCode = require('./webTestCode');

// 접속해 있는 유저들 정보
// 키 값으로 유저 아이디가 들어가며, 밸류값으로 소켓 아이디 저장
// userList['userId'] = socket.id;
// var userList = new Array();


// 2018_04_12
// 현재 socket 목록
// clientList[index] = socket;
var clientList = new Array();

/*
	roomSetting['방이름']['설정명']['설정정보']
	방의 설정 정보 및 오브젝트 상태들을 저장 해놓는 공간
	['설정명']
	characterPosition, gameStatus, timeEvent, handReady, gameStartTime
	users
*/
var roomStatus = new Array();

var lobbyStatus = new Array();
/******************************************************************************************************/
/*******************************************     Cycle     ********************************************/
/******************************************************************************************************/



// serverController.errtest();

// 2018_01_28 
// socket io 처리 부분
// deeps level 0
io.sockets.on('connection', function (socket) {

	console.log('connected : ' + socket.id);
	
	// socket 목록 관리
	clientList.push(socket);
	// disconnect 이벤트 처리
	disconnected(socket, clientList, roomStatus, io);

	/**************************************** roomController ****************************************/
	// 방 생성
	// socket.on('createRoom', function(roomName, userId)
	roomController.createRoom(socket, roomStatus);

	// 방 입장
	// socket.on('joinRoom', function(userId)
	roomController.joinRoom(socket, roomStatus, io);

	// 방 퇴장
	// socket.on('exit', function(nick)
	roomController.exitRoom(socket, roomStatus, io);

	// 유저 레디 시 ( 레디 체크 )
	// socket.on('checkReady', function(jsonObj)
	roomController.userReadyChk(socket, roomStatus);

	// 게임 시작 ver.2
	roomController.startGame(socket, roomStatus, io);

	
	/**************************************** serverController ****************************************/
	/*
	// 유저의 서버 접속
	// socket.on('joinServer', function()
	serverController.joinServer(socket, clientList);

	// 유저가 서버에서 나갔을 때 ( 정상적인 게임 종료 )
	// socket.on("exitServer",function(userId)
	serverController.exitServer(socket, clientList);

	// 강제 종료 및, 예외적인 서버와의 연결 끊김 처리
	// socket.on("exitServer",function(userId)
	serverController.disconnected(socket, clientList, roomStatus);
	*/
	/**************************************** playGame ****************************************/
	// 유저 움직임 수신
	// socket.on('now', function(jsonStr)
	playGame.getMovement(socket);

	// 유저가 총 집었을 때
	// socket.on('now', function(jsonStr)
	playGame.getGun(socket);

	// 유저가 총을 숨겼을 때
	// socket.on('hidingGun', function(data)
	playGame.hidingGun(socket);

	// 유저가 총 버렸을 때
	// socket.on('hidingGun', function(data)
	playGame.getDropGun(socket);

	// 유저가 총을 맞았을 때
	// socket.on('hitGun', function(data))
	playGame.getHitGun(socket,io,roomStatus);

	// 유저가 총을 쐈을 때
	// socket.on('shootGun' ,function(data))
	playGame.getShootGun(socket,io,roomStatus);

	/**************************************** initGameStart ****************************************/
	// 맵에서의 각 플레이어들의 위치를 랜덤으로 생성하여 뿌려주는 역할
	// socket.on('reqPosition', function()
	initGameStart.sendInit(socket, roomStatus, io);

	// 인게임에서 유저가 준비동작을 갖추었을 때
	// socket.on('handReady', function(data)
	initGameStart.handReady(socket, roomStatus, io);

	// 인게임에서 유저가 준비동작을 갖추다가 다른 동작을 취했을 때
	// socket.on('handNotReady', function(data)
	initGameStart.handNotReady(socket, roomStatus, io);

	/*************************************** lobbyController ***************************************/

	//유저가 로비에 입장 했을 때
	lobbyController.joinLobby(socket, lobbyStatus, io);
	//유저가 로비에서 퇴장 했을 때
	lobbyController.exitLobby(socket, lobbyStatus, io);
	//유저가 텔레포트를 사용 했을 때
	lobbyController.teleport(socket, lobbyStatus, io);
	//씬 전환 시
	lobbyController.setIndex(socket);
	//로비에서 낚시를 시작 할 때
	lobbyController.fishing(socket, lobbyStatus, io);
	//로비에서 버스탑승 시
	lobbyController.getBus(socket, lobbyStatus, io);
	//로비에서 버스 내림
	lobbyController.outBus(socket, lobbyStatus, io);
	//로비에서 버스 움직임
	lobbyController.moveBus(socket, lobbyStatus, io);
	//로비에서 움직임
	lobbyController.lobbyMove(socket, lobbyStatus, io);


	// 웹에서 게임을 컨트롤 하기위한 부분
	webTestCode.webNpcOut(socket, roomStatus, io);
	webTestCode.webLightOut(socket, roomStatus, io);
});


// socket disconnect 이벤트 처리
// deeps level 1
function disconnected(socket, clientList, roomStatus, io) {
	socket.on('disconnect', function() {
        console.log("dixconnect : " + socket.id);
		var i = clientList.indexOf(socket);
		
		if(typeof socket.gameId !== 'undefined') {

			if(typeof socket.roomName !== 'undefined') {
				for(var key in roomStatus[socket.roomName]['users']) {
					if(roomStatus[socket.roomName]['users'][key][0] == socket.gameId) {
						roomStatus[socket.roomName]['users'].splice(key, 1);
						console.log("playerDisconnect : " + key);
					}
				}
				if(roomStatus[socket.roomName]['users'].length  <= 1) {
					io.to(socket.roomName).emit('endGame', 'endGame');    
					initGameStart.gameEndClear(roomStatus, socket.roomName);
				}
			}
		}
		clientList.splice(i, 1);
    });
}