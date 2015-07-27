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

        //var interDem = spawn('python3', ["interDummy.py", params[0], params[1], params[2]]);
        var interDem = spawn('python3', ["pgdc.py", params[0], params[1], params[2]]);
        interDem.stdout.on('data', function (output) { 

            if(String(output).trim() == "done"){
                io.sockets.emit('interDone', "done");
                console.log("done");
            } else {
                
                //SPLIT OUTPUT BY '\n' THEN LOOP THROUGH
                console.log(String(output));
                var loop = String(output).split('\n');

                for (var i = loop.length - 1; i >= 0; i--) {

                    if(loop[i] == '')
                        continue;

                    console.log("loop", loop);
                    var temp = loop[i].split('|');
                    console.log("inter", {cache: temp[0], level: temp[1].trim(), chunk: temp[2], stat: temp[3], childs: temp[4].trim()});
                    io.sockets.emit('interNews', {cache: temp[0], level: temp[1].trim(), chunk: temp[2], stat: temp[3], childs: temp[4].trim()});
                
                }
            }
        });

    });


});

http.listen(8000, function(){
    console.log('listening on *:8000');
});








