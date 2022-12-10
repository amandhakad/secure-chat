/* need peer.js */
function buildLobby(lobbyKey) {
	var lpeer = new Peer(lobbyKey);

	lpeer.on('open', function(id) {
		console.log("lobby id", id);
		var connArr = {};
		var lobbyMessages = [];
		lpeer.on('connection', function(lconn) {

			lconn.on('data', function(data) {
				// console.log("Lobby received this", data);

				if(data["type"]==="new_peer") {
					connArr[lconn.peer] = { connectionRef: lconn, updatedAt: (new Date()).getTime()};
					// console.log("conArr init", connArr);
				}

				if(data["type"]==="ALIVE") {
					connArr[lconn.peer] = { connectionRef: lconn, updatedAt: (new Date()).getTime()};
					// console.log("conArr update", connArr);
				}

				lconn.send({type: "LOBBY_DATA", data: Object.keys(connArr)});

				// catch peer message and send to all peer
				if(data["type"]==="p2lmessage") {
					// console.log("Lobby received this", data["data"]);
					//send to all
					for(let con of Object.values(connArr)) {
						console.log("trying con", con["connectionRef"]);
						con["connectionRef"].send({ type: "l2pmessage", data: data["data"]})
					}
				}

			});

			lconn.on("close", function() {
				console.log("closed");
			});

			expire(connArr);

		});
	});
}

function buildPeer(lobbyKey, resolve, callbackPeerInit, callbackPeerListUpdate, callbackMessageReceived) {
	var peer = new Peer();
	peer.on('open', function(id) {
		callbackPeerInit(id);
		connectPeerToLobby(peer, lobbyKey, callbackPeerListUpdate, callbackMessageReceived, resolve);
	});
}

function connectPeerToLobby(peer, lobbyKey, callbackPeerListUpdate, callbackMessageReceived, resolve) {

	var conn = peer.connect(lobbyKey);
	conn.on('open', function() {
		console.log("conn", conn);

		conn.on('data', function(data) {
		 	if(data["type"]==="LOBBY_DATA") {
		 		callbackPeerListUpdate(data["data"]);
		 	}
		 	if(data["type"]==="l2pmessage") {
		 		callbackMessageReceived(data["data"]);
		 	}
		});

		conn.send({type: "new_peer"});
		remindAlive(conn);

		resolve(conn);
	});

}

function remindAlive(conn) {
	conn.send({type: "ALIVE"});
	window.setTimeout(() => remindAlive(conn), 2000);
}

function expire(connArr) {
	for(let i in connArr) {
		if((new Date()).getTime() - connArr[i]["updatedAt"] > 5000) {
			// connArr[i]["connectionRef"].send("must close");
			connArr[i]["connectionRef"].close();
			delete connArr[i];
		}
	}
	window.setTimeout(() => expire(connArr), 2000);
}