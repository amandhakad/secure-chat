/* need peer.js */
function buildLobby(lobbyKey) {
	var lpeer = new Peer(lobbyKey);

	lpeer.on('open', function(id) {
		console.log("lobby id", id);
		var connArr = {};
		lpeer.on('connection', function(lconn) {

			lconn.on('data', function(data) {
				console.log("Lobby received this", data);

				if(data["type"]==="new_peer") {
					connArr[lconn.peer] = { connectionRef: lconn, updatedAt: (new Date()).getTime()};
					// console.log("conArr init", connArr);
				}

				if(data["type"]==="ALIVE") {
					connArr[lconn.peer] = { connectionRef: lconn, updatedAt: (new Date()).getTime()};
					// console.log("conArr update", connArr);
				}

				lconn.send({type: "PLIST", data: Object.keys(connArr)});
			});

			lconn.on("close", function() {
				console.log("closed");
			});

			expire(connArr);

		});
	});
}

function buildPeer(lobbyKey, callbackPeerInit, callbackPeerListUpdate) {
	var peer = new Peer();
	peer.on('open', function(id) {
		callbackPeerInit(id);
		// document.getElementById("pid_show").innerHTML = (id);
		connectPeerToLobby(peer, lobbyKey, callbackPeerListUpdate);
	});
}

function connectPeerToLobby(peer, lobbyKey, callbackPeerListUpdate) {
	var conn = peer.connect(lobbyKey);

	conn.on('open', function() {
		console.log("conn", conn);

		conn.on('data', function(data) {
		 	if(data["type"]==="PLIST") {
		 		// document.getElementById("all_peers").innerHTML = ((data["data"]).join("<br/>"));
		 		callbackPeerListUpdate(data["data"]);
		 	}
		});

		conn.send({type: "new_peer"});

		remindAlive(conn);

	});
}

function remindAlive(conn) {
	conn.send({type: "ALIVE"});
	window.setTimeout(() => remindAlive(conn), 2000);
}

function expire(connArr) {
	for(let i in connArr) {
		if((new Date()).getTime() - connArr[i]["updatedAt"] > 5000) {
			connArr[i]["connectionRef"].send("must close");
			connArr[i]["connectionRef"].close();
			delete connArr[i];
		}
	}
	window.setTimeout(() => expire(connArr), 2000);
}