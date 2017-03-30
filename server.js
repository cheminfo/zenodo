var http = require('http');
http.createServer(function(req, res){
	console.log(req.headers);
req.on('data', function(data) { console.log(data.toString()) });
	res.end('OK');
}).listen(2000)
