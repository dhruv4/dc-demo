var express = require('express');
var app = express();
var spawn = require('child_process').spawn;
var http = require('http').Server(app);
var io = require('socket.io')(http);
var pg = require('pg');
var postgres;
var monet;

process.stdin.resume();//so the program will not close instantly

app.use(express.static('www'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/www/index.html');
});

io.on('connection', function(socket){

    postgres = spawn('sudo', ['-u', 'postgres', '/usr/lib/postgresql/9.1/bin/pg_ctl', '-D', '/var/lib/postgresql/9.1/main/', 'start']);
    monet = spawn('/usr/local/bin/mserver5', ['--dbpath=/home/gupta/mydbfarm/test', '--set', 'merovingian_uri=mapi:monetdb://adama:50000/test', '--set', 'mapi_open=false', '--set', 'mapi_port=50000', '--set', 'mapi_usock=/home/gupta/mydbfarm/test/.mapi.sock', '--set', 'monet_vault_key=/home/gupta/mydbfarm/test/.vaultkey', '--set', 'gdk_nr_threads=1', '--set', 'max_clients=64', '--set', 'sql_optimizer=default_pipe', '--set', 'monet_daemon=yes']);

    var pgPerf, mdbPerf, cPerf;

    console.log('a user connected');
    socket.on('start', function (params) {
        console.log('client sent ' + params);

        mdbPerf = spawn('python3', ["mdbperf.py", params[0], params[1], params[2]]);
        pgPerf = spawn('python3', ["pgperf.py", params[0], params[1], params[2]]);
        cPerf = spawn('./demo_performance', [params[1], params[0], params[0]/params[2], 1]);

        pgPerf.stdout.on('data', function (output) { 
            

            var loop = String(output).split('&');
            //console.log("loop", loop);

            for (var i = 0; i < loop.length; i++) {

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
        
        mdbPerf.stdout.on('data', function (output) { 
            

            var loop = String(output).split('&');
            //console.log("loop", loop);

            for (var i = 0; i < loop.length; i++) {

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
        cPerf.stdout.on('data', function (output) { 
            
            
            var loop = String(output).split('&');
            //console.log("loop", loop);

            for (var i = 0; i < loop.length; i++) {

                if(loop[i].indexOf('|') < 0)
                    continue;

                var temp = String(loop[i]).split('|');
                //console.log("mdb", temp);
                if(temp[0].trim() == "100"){
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
        //var interDem = spawn('python3', ["pgdc.py", params[0], params[1], params[2]]);
        var interDem = spawn('./demo_interact', [params[1], params[0], params[0]/params[2], 1]);
        interDem.stdout.on('data', function (output) { 

            //console.log(String(output));

            if(String(output).trim() == "done"){
                io.sockets.emit('interDone', "done");
                console.log("done");
            } else {
                
                //SPLIT OUTPUT BY '\n' THEN LOOP THROUGH
                //console.log("output", String(output));
                var loop = String(output).split('&');

                //console.log(loop);

                for (var i = 0; i < loop.length; i++) {

                    if(loop[i].indexOf('{') < 0)
                        continue;

                    //console.log("loop", loop[i]);

                    arr = loop[i].trim().split("|");

                    //console.log(arr);

                    //arr[1] = arr[1].slice(0,-2);

                    //arr[1] += "]";

                    arr[1] = arr[1].replace(/,]/g, ']');

                    arr[1] = JSON.parse(arr[1].trim());

                    //console.log("inter", arr);
                    io.sockets.emit('interNews', arr);
                
                }
            }
        });
    });

    socket.on('conceptmap', function (params){

        console.log('concept map');

        //same thing as before expect just send back children stat + children!
        //level, threshold, Cols, chunk#

        var pgConcept = spawn('python3', ["pgconcept.py", params[0], params[1], String(params[2]), params[3]]);

        var conceptData = [];

        pgConcept.stdout.on('data', function (output) { 
            

            var loop = String(output).split('&');
            //console.log("loop", loop);

            for (var i = 0; i < loop.length; i++) {

                if(loop[i].indexOf('done') > 0)
                    io.sockets.emit('conceptDone', conceptData);

                if(loop[i].indexOf('|') < 0)
                    continue;

                var temp = String(loop[i]).split('|');
                conceptData.push([JSON.parse(temp[0]), JSON.parse(temp[1])]);
            
            }
        });

    });

});

http.listen(8000, function(){
    console.log('listening on *:8000');
});

function exitHandler() {
    postgres.kill();
    monet.kill();
    spawn('sudo -u postgres killall postgres');
}

//do something when app is closing
process.on('exit', exitHandler.bind());

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind());





