var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var express = require('express');
var app = express();
var spawn = require('child_process').spawn;
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('www'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/www/index.html');
});

io.on('connection', function(socket){

    console.log('a user connected');
    socket.on('start', function (params) {
        console.log('client sent ' + params);
        // do something useful
        var pgDummy = spawn('python3', ["pgDummy.py", params[0], params[1], params[2]]);
        pgDummy.stdout.on('data', function (output) { 
            
            if(String(output).trim() == "done"){
                io.sockets.emit('pgDone', "done");
            } else {
                var temp = String(output).split(' ');
                console.log("pg", temp);
                io.sockets.emit('pgNews', {cache: temp[0], level: temp[1].trim()});
            }
        });
        var mdbDummy = spawn('python3', ["mdbDummy.py", params[0], params[1], params[2]]);
        mdbDummy.stdout.on('data', function (output) { 
            
            if(String(output).trim() == "done"){
                io.sockets.emit('mdbDone', "done");
            } else {
                var temp = String(output).split(' ');
                console.log("monet", temp);
                io.sockets.emit('mdbNews', {cache: temp[0], level: temp[1].trim()});
            }
        });
    });

    socket.on('interStart', function (params){

        console.log("interaction started");

        var interDummy = spawn('python3', ["interDummy.py", params[0], params[1], params[2]]);
        interDummy.stdout.on('data', function (output) { 
            
            if(String(output).trim() == "done"){
                io.sockets.emit('interDone', "done");
            } else {
                var temp = String(output).split('|');
                console.log("inter", temp);
                io.sockets.emit('interNews', {cache: temp[0], level: temp[1].trim(), stat: temp[2].trim()});
            }
        });

    });


});

http.listen(server_port, server_ip_address, function(){
    console.log( "Listening on " + server_ip_address + ", server_port " + port );
});








