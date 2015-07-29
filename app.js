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

    var pgPerf, mdbPerf, cPerf;

    console.log('a user connected');
    socket.on('start', function (params) {
        console.log('client sent ' + params);

        //var pgPerf = spawn('python3', ["pgDummy.py", params[0], params[1], params[2]]);
        pgPerf = spawn('python3', ["pgperf.py", params[0], params[1], params[2]]);
        
        pgPerf.stdout.on('data', function (output) { 
            

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
                io.sockets.emit('pgNews', {cache: temp[0].trim(), percent: temp[1].trim()});
            }
        });

        mdbPerf = spawn('python3', ["mdbperf.py", params[0], params[1], params[2]]);
        
        mdbPerf.stdout.on('data', function (output) { 
            

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
                io.sockets.emit('mdbNews', {cache: temp[0].trim(), percent: temp[1].trim()});
            }
        });

        cPerf = spawn('./demo_performance', [params[1], params[0], params[0]/params[2], 1]);
        
        cPerf.stdout.on('data', function (output) { 
            
            
            var loop = String(output).split('&');
            //console.log("loop", loop);

            for (var i = loop.length - 1; i >= 0; i--) {

                if(loop[i].indexOf('|') < 0)
                    continue;

                var temp = String(loop[i]).split('|');
                //console.log("mdb", temp);
                if(temp[0].trim() == "done"){
                    io.sockets.emit('cDone', "done");
                    console.log("cdone");
                    continue;
                }

                io.sockets.emit('cNews', {percent: temp[0].trim(), cache: temp[1].trim()});
            }

        });


        socket.on('reset', function () {

            pgPerf.kill();
            mdbPerf.kill();
            cPerf.kill();

        });

    });

    socket.on('interStart', function (params){

        console.log("interaction started");

        console.log(params);
        var interDem = spawn('python3', ["pgdc.py", params[0], params[1], params[2]]);
        interDem.stdout.on('data', function (output) { 

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
                    //console.log("inter", {level: temp[0], chunk: temp[1], stat: temp[2], childs: temp[3].trim()});
                    io.sockets.emit('interNews', {level: temp[0].trim(), chunk: temp[1].trim(), stat: temp[2].trim(), childs: temp[3].trim()});
                
                }
            }
        });

    });


});

http.listen(8000, function(){
    console.log('listening on *:8000');
});








