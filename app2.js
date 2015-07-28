//app2.js
var express = require('express');
var app = express();
//var spawn = require('child_process').spawn;
var pyshell = require('python-shell');
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

        //var pgPerf = spawn('python3', ["pgDummy.py", params[0], params[1], params[2]]);
        var pgPerf = new pyshell("pgperf.py", {scriptPath: __dirname, args: [params[0], params[1], params[2]]});
        
        pgPerf.on('message', function (output) { 
            

            var loop = String(output).split('&');
            //console.log("loop", loop);

            for (var i = loop.length - 1; i >= 0; i--) {

                if(loop[i].trim() == "done"){
                    io.sockets.emit('pgDone', "done");
                    console.log("pgdone");
                    continue;
                }

                if(loop[i].indexOf('|') < 0)
                    continue;

                var temp = String(loop[i]).split('|');
                //console.log("pg", temp);
                io.sockets.emit('pgNews', {cache: temp[0].trim(), chunk: temp[1].trim()});
            }
        });

        var mdbPerf = new pyshell("mdbperf.py", {scriptPath: __dirname, args: [params[0], params[1], params[2]]});
        
        mdbPerf.on('message', function (output) { 
            
            console.log(output);

            var loop = String(output).split('&');
            //console.log("loop", loop);

            for (var i = loop.length - 1; i >= 0; i--) {

                if(loop[i].trim() == "done"){
                    io.sockets.emit('mdbDone', "done");
                    console.log("mdbdone");
                    continue;
                }

                if(loop[i].indexOf('|') < 0)
                    continue;

                var temp = String(loop[i]).split('|');
                //console.log("mdb", temp);
                io.sockets.emit('mdbNews', {cache: temp[0].trim(), chunk: temp[1].trim()});
            }
        });

    });

    socket.on('interStart', function (params){

        console.log("interaction started");

        console.log(params);
        var interDem = new pyshell("pgdc.py", {scriptPath: __dirname, args: [params[0], params[1], params[2]]});
        
        interDem.on('message', function (output) { 

        	console.log(output);

            if(String(output).trim() == "done"){
                io.sockets.emit('interDone', "done");
                console.log("done");
            } else {
                
                //SPLIT OUTPUT BY '\n' THEN LOOP THROUGH
                //console.log(String(output));
                var loop = String(output).split('&');

                for (var i = loop.length - 1; i >= 0; i--) {

                    if(loop[i].indexOf('|') < 0)
                        continue;

                    //console.log("loop", loop);
                    var temp = loop[i].split('|');
                    //console.log("inter", {cache: temp[0], level: temp[1], chunk: temp[2], stat: temp[3], childs: temp[4].trim()});
                    io.sockets.emit('interNews', {cache: temp[0].trim(), level: temp[1].trim(), chunk: temp[2].trim(), stat: temp[3].trim(), childs: temp[4].trim()});
                
                }
            }
        });

    });


});

http.listen(8000, function(){
    console.log('listening on *:8000');
});








