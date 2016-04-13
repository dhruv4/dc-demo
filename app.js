var express = require('express'); //The Express Node module simplifies setting up Node into just a few commands - it's really simple
var app = express();
var spawn = require('child_process').spawn; //The Child Process Module lets us spawn external processes on the server
var exec = require('child_process').exec; //Spawn and Exec have slightly different uses - spawn returns and object and exec returns a buffer - so if you care about output, use Spawn.
var sudo = require('sudo'); //This module makes running Sudo easier, theoretically
var http = require('http').Server(app); //This is a necessary and standard statement to start the app
var io = require('socket.io')(http); //Socket.io uses web sockets to allow users to pass info between the frontend and the server - we use this a lot
var postgres;
var monet;

process.stdin.resume();//so the program will not close instantly

app.use(express.static('www')); //This tells the Express App where the web files are

app.get('/', function(req, res){ //This sets index.html to the homepage
    res.sendFile(__dirname + '/www/index.html');
});

http.listen(8000, function(){
    console.log('listening on *:8000');
});

io.on('connection', function(socket){ //This fires as soon as someone connects to the server with a browser

    exec('sudo service postgresql start');

    monet = spawn('/usr/local/bin/mserver5', ['--dbpath=/home/gupta/mydbfarm/test', '--set', 'merovingian_uri=mapi:monetdb://adama:50000/test', 
        '--set', 'mapi_open=false', '--set', 'mapi_port=50000', '--set', 'mapi_usock=/home/gupta/mydbfarm/test/.mapi.sock', '--set', 
        'monet_vault_key=/home/gupta/mydbfarm/test/.vaultkey', '--set', 'gdk_nr_threads=1', '--set', 'max_clients=64', '--set', 'sql_optimizer=default_pipe', '--set', 'monet_daemon=yes']);
    
    //^^The above statements start instances of Postgres and Monet

    var pgPerf, mdbPerf, cPerf;

    console.log('a user connected'); //This outputs to the server console
    socket.on('start', function (params) { //This function waits for the "start" message from the front-end and gets an array in params from the front-end. The "start" message comes when the user starts the performanace demo.
        console.log('client sent ' + params);

        mdbPerf = spawn('python3', ["mdbperf.py", params[0], params[1], params[2]]);
        pgPerf = spawn('python3', ["pgperf.py", params[0], params[1], params[2]]);
        cPerf = spawn('./demo_performance', [params[1], params[0], params[0]/params[2], 1]);
        //^^Python programs to interact with Monet and Postgres & the Canopy System are started

        pgPerf.stdout.on('data', function (output) { //This function fires when any data is printed to console from the Postgres, which is why the Spawn function is useful
            

            var loop = String(output).split('&'); //The output is then looped through, seeking characters to delineate breaks with.
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
                io.sockets.emit('pgNews', {cache: temp[0].trim(), percent: temp[1].trim()}); //This statement sends information back to the front-end
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
        socket.on('reset', function () { //When the "Reset" button is clicked on the Performance Demo, this is called and kills the instances
            pgPerf.kill();
            mdbPerf.kill();
            cPerf.kill();
        });
    });
    socket.on('interStart', function (params){ //This function is called when the Data Structure demo is started.

        var interDem = spawn('./demo_interact', [params[1], params[0], params[0]/params[2], 1]); //This starts the Canopy system optimized for this part of the demo
        interDem.stdout.on('data', function (output) { 

            if(String(output).trim() == "done"){ //If a "done" is found, the process stops and tells the front-end that it's done.
                io.sockets.emit('interDone', "done");
                console.log("done");
            } else {
                
                var loop = String(output).split('&'); //Because of the fast output of data, we loop through it using the & as a deliminator

                for (var i = 0; i < loop.length; i++) {

                    if(loop[i].indexOf('{') < 0)
                        continue;

                    arr = loop[i].trim().split("|");

                    arr[1] = arr[1].replace(/,]/g, ']');

                    arr[1] = JSON.parse(arr[1].trim());

                    io.sockets.emit('interNews', arr); //This sends the received and parsed data to the front-end.
                
                }
            }
        });
    });

    socket.on('conceptmap', function (params){ //This starts when the Concept Map is opened in the Demo

        console.log('concept map');

        //Params: level, threshold, cols[], chunk#
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

function exitHandler() { //Upon closing the app, this function is called to cleanly kill the monet and postgres instances.

    sudo(['pkill','mserver5']);

    exec('sudo service postgresql stop');
    process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind());

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind());





