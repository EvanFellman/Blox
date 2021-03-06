// Dependencies
let express = require('express');
let http = require('http');
let path = require('path');
let socketIO = require('socket.io');
let fs = require('fs');
let writeSafe = true;

let app = express();
let server = http.Server(app);
let io = socketIO(server);

let leaderboard = [];

fs.readFile("leaderboard.ranking", function(error, contents) {
	leaderboard = contents.toString().split('\n').map(e => {
		for(let i = e.length - 1; i >= 0; i--){
			if(e.substring(i, i+1) === '-'){
				return [e.substring(0,i), parseInt(e.substring(i+1, e.length))];
			}
		}
	});
});

app.set('port', 0);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/OnePlayerGame', function(request, response){
	response.sendFile(path.join(__dirname, 'OnePlayerGame.html'));
});

// Starts the server.
server.listen(0, function() {
  console.log('Starting server on port ' + server.address().port);
});

// Add the WebSocket handlers
io.on('connection', function(socket) {
	const clientId = socket.id;
	socket.on('leaderboardScore', function(score) {
		let idx = -1;
		for(let i = 0; i < leaderboard.length; i++){
			if(score > leaderboard[i][1]){
				//newRecord!
				idx = i;
				break;
			}
		}
		io.sockets.to(clientId).emit("leaderboardSend", leaderboard, idx);
		socket.on('leaderboardname', function(name){
			if(name === '' || name === 'null'){
				//we don't take empty names
				return;
			} else {
				while (!writeSafe){1+1}
				writeSafe = false;
			    //avoiding race condition (only one client writing to master leaderboard at a time)
				const contents = fs.readFileSync("leaderboard.ranking");
				leaderboard = contents.split('\n').map(e => {
					//cut leaderboard into names and scores (a-#)
					let t = e.split('-');
					return [t[0],parseInt(t[1])];
				});
				for(let j = leaderboard.length - 1; j > idx; j--){
					leaderboard[j] = leaderboard[j-1];
				}
				leaderboard[idx] = [name, score];
				fileStr = "";
				for(let i = 0; i < leaderboard.length; i++){
					fileStr += `${leaderboard[i][0]}-${leaderboard[i][1]}`;
					if(i < leaderboard.length - 1){
						fileStr += `\n`;
					}
				}
				fs.writeFile('leaderboard.ranking', fileStr, () => {});
				writeSafe = true;
			}
		});
	});
});


// setInterval(function() {
//   io.sockets.emit('message', 'Baa');
// }, 1000);


// const app = http.createServer((request, response) => {
// 	response.writeHead(200, {'Content-Type': 'text/html'});
// 	response.write(`<h1>IT WORKEDDDDDD</h1>`);
// 	setTimeout(() => {
// 		response.write('<br>hi<br>hello');
// 		response.end();
// 	}, 3000);
// }).listen(3000);