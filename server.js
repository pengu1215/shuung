

// 웹소켓으로 서버 셋업 (포트: 8000)
var WebSocketServer = require('websocket').server;
var http = require('http');

var port = 8000;

var server = http.createServer(function (req, res) {
	console.log('Received request for ' + req.url);
	res.writeHead(404);
	res.end();
});

server.listen(port, function () {
  	console.log('Server is listening on port ' + port);
});

wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});
wsServer.setMaxListeners(0);

// 클라이언트 배열 선언 (여기서는 스마트폰들)
var connectionArray = [];

// 리시버 변수 선언 (여기서는 파사드PC)
var reciever;

// 리스너 함수들
wsServer.on('request', function (request) {

	var connection = request.accept(null, request.origin);

    // 클라이언트의 메세지 리스너
	connection.on('message', function (message) {
        
	    if (message.type === 'utf8') {
	        //console.log('Received message: ' + message.utf8Data);

	        console.log('message : ' + message.utf8Data);
	        var str = message.utf8Data;
	        str = str.substring(0, 1);  // 메세지의 첫번째 글자
	        
            if (str == '{' || str == '[') { // 첫번째 글자를 이용해서 json타입인지 검사
                packet = JSON.parse(message.utf8Data);
                    switch (packet.PacketID) {  //패킷의 아이디를 이용해서 스마트폰과 파사드PC를 구분함
	                case 0:
                        // 패킷아이디가 0이라면 리시버가 아님으로 판단, 배열에 추가
                        // (현재 이 기능은 사용하지 않음 스마트폰으로 메세지를 다시 보내기 않기 떄문)
	                    connection.isReceiver = false;
	                    connectionArray.push(connection);
	                    Send(connection, message.utf8Data); // 클라이언트로 메세지 다시 응답함
	                    console.log('connection : ' + connection.remoteAddress);
	                    break;
	                case 1:
                        // 패킷아이디가 1이라면 리시버로 판단, 리시버 변수에 추가
	                    connection.isReceiver = true;
	                    reciever = connection;
	                    console.log('connection receiver : ' + connection.remoteAddress);
	                    Send(connection, message.utf8Data); // 클라이언트로 메세지 다시 응답함
	                    break;
	                case 2:
                        // 패킷아이디가 2라면 스마트폰이므로 메세지를 리시버로 넘겨줌
	                    broadReceiver(message.utf8Data);
	                    break;
	            }
	        } else {
	            //console.log('not PacketID');
	        }
		}
		else if (message.type === 'binary') {
			connection.sendBytes(message.binaryData);
		}
	});
            
    //--- 클라이언트의 연결이 끊겼을 경우 리스너 ---//
	connection.on('close', function (reasonCode, description) {
        // 연결이 끊겼을 경우 변수에서 제거함
		if (connection.isReceiver == true) {
			reciever = null;
			console.log('Receiver Closed');
		} else {
			for (var i = 0; i < connectionArray.length; i++) {
	    		if (connectionArray[i] == connection) {
	    			connectionArray.splice(i, 1);
	    			break;
	    		}
	    	}
		}	

		console.log('Peer ' + connection.remoteAddress + ' disconnected.');
	});

});

// 리시버로 메세지 보내는 함수
function broadReceiver(stringMessage) {
	if (reciever != null)
		reciever.sendUTF(stringMessage);
}

// 연결된 스마트폰들에게 메세지 보내는 함수 (현재 사용안함)
function broadCast(stringMessage) {
	for (var i = 0; i < connectionArray.length; i++) {
		connectionArray[i].sendUTF(stringMessage);
	}
}

// 지정된 커넥션에게 메세지 보내는 함수
function Send(connection, stringMessage) {
	connection.sendUTF(stringMessage);
}