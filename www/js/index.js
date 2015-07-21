var socket = io();
var perfgraph;
var opt, labels;
var data, pgData, mdbData, cData;
var xPos, pgXPos, mdbXPos, cXPos;
var totalSeconds = 0;
var cols, rows, chunks;
var pgCache = 0, cCache = 0, mdbCache = 0;

function enterTest(){

	$('#splash-container').remove();
	$('#test-container').show();
	$('#demo-container').remove();

}
function startClick(){
	var timer = document.getElementsByClassName('timer'),
	seconds = 0, minutes = 0, hours = 0, t;

	function add() {
	    seconds++;
	    totalSeconds++;
	    if (seconds >= 60) {
	        seconds = 0;
	        minutes++;
	        if (minutes >= 60) {
	            minutes = 0;
	            hours++;
	        }
	    }
	    
	    for (i = 0, len = timer.length; i < len; ++i) {
	    	timer[i].textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
	    }
	    timeIt();
	}
	function timeIt() {
	    t = setTimeout(add, 1000);
	}
	timeIt();

	$('#start-btn').attr('disabled', 'true');

	var rows = parseInt($('#row-slide').val());
	cols = parseInt($("#col-slide").val());
	var chunks = parseInt($("#chunk-slide").val());

	console.log(rows, cols, chunks);

	socket.emit('start', [rows, cols, chunks]);

	pgData = [0], mdbData = [0], cData = [0];
	pgXPos = [0], mdbXPos = [0], cXPos = [0];
	mydata = {
		labels : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
		xBegin : 0,
		xEnd : 100,
		datasets : [
			{
				fillColor : "rgba(220,220,220,0.5)",
				strokeColor : "rgba(220,220,220,1)",
				pointColor : "rgba(220,220,220,1)",
				pointstrokeColor : "yellow",
				data : pgData,
				xPos : [0],
				title : "Postgres"
			},
			{
				fillColor : "rgba(151,187,205,0.5)",
				strokeColor : "rgba(151,187,205,1)",
				pointColor : "rgba(151,187,205,1)",
				pointstrokeColor : "blue",
				data : mdbData,
				xPos : [0],
				title : "MonetDB"
			}
		]
	}

	opt = {
		animationLeftToRight : true,
		animationSteps : 5,
		animationEasing: "linear",
		canvasBorders : false,
		legend : true,
		annotateDisplay : true,
		graphTitleFontSize: 18, 
		responsive : true,
		fmtXLabel : "fmttime hh:mm:ss",
		animationCount: 1,
		animationPauseTime : 0,
		animationBackward: true,
		xAxisLabel : "Percent Built (%)",
		yAxisLabel : "Time (sec)"
	};

	new Chart(document.getElementById("perfgraph").getContext("2d")).Line(mydata,opt);

}

socket.on('pgNews', function (msg){

	pgData.push(totalSeconds);
	pgXPos.push(100*(parseInt(msg['level'])/cols));
	console.log("pg", pgXPos);
	mydata = {
		labels : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
		xBegin : 0,
		xEnd : 100,
		datasets : [
			{
				fillColor : "rgba(220,220,220,0.5)",
				strokeColor : "rgba(220,220,220,1)",
				pointColor : "rgba(220,220,220,1)",
				pointstrokeColor : "yellow",
				data : pgData,
				xPos : pgXPos,
				title : "Postgres"
			},
			{
				fillColor : "rgba(151,187,205,0.5)",
				strokeColor : "rgba(151,187,205,1)",
				pointColor : "rgba(151,187,205,1)",
				pointstrokeColor : "blue",
				data : mdbData,
				xPos : mdbXPos,
				title : "MonetDB"
			}
		]
	}
	updateChart(document.getElementById("perfgraph").getContext("2d"),mydata,opt,true,true);
	console.log("Updated", pgData);
	console.log(msg);

	pgCache+=parseInt(msg['cache']);
	console.log(pgCache);

	$('#pg-cache').html(pgCache);

});
socket.on('pgDone', function (msg){

	$('#pg-time').removeClass('timer');

});
socket.on('mdbNews', function (msg){

	mdbData.push(totalSeconds);
	mdbXPos.push(100*(parseInt(msg['level'])/cols));
	console.log("monet", mdbXPos);
	mydata = {
		labels : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
		xBegin : 0,
		xEnd : 100,
		datasets : [
			{
				fillColor : "rgba(220,220,220,0.5)",
				strokeColor : "rgba(220,220,220,1)",
				pointColor : "rgba(220,220,220,1)",
				pointstrokeColor : "yellow",
				data : pgData,
				xPos : pgXPos,
				title : "Postgres"
			},
			{
				fillColor : "rgba(151,187,205,0.5)",
				strokeColor : "rgba(151,187,205,1)",
				pointColor : "rgba(151,187,205,1)",
				pointstrokeColor : "blue",
				data : mdbData,
				xPos : mdbXPos,
				title : "MonetDB"
			}
		]
	}
	updateChart(document.getElementById("perfgraph").getContext("2d"),mydata,opt,true,true);
	console.log("Updated", mdbData);
	console.log(msg);

	mdbCache+=parseInt(msg['cache']);
	console.log(mdbCache);

	$('#mdb-cache').html(mdbCache);

});
socket.on('mdbDone', function (msg){

	$('#mdb-time').removeClass('timer');

});
function enterDemo(){

	$('#splash-container').remove();
	$('#test-container').remove();
	$('#demo-container').show();

	rows = 100, cols = 5, chunks = 10;

	socket.emit('interStart', [rows, cols, chunks]);

	var timer = document.getElementsByClassName('timer'),
	seconds = 0, minutes = 0, hours = 0, t;

	function add() {
	    seconds++;
	    totalSeconds++;
	    if (seconds >= 60) {
	        seconds = 0;
	        minutes++;
	        if (minutes >= 60) {
	            minutes = 0;
	            hours++;
	        }
	    }
	    
	    for (i = 0, len = timer.length; i < len; ++i) {
	    	timer[i].textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
	    }
	    timeIt();
	}
	function timeIt() {
	    t = setTimeout(add, 1000);
	}
	timeIt();

	data = [0];
	xPos = [0];
	mydata = {
		labels : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
		xBegin : 0,
		xEnd : 100,
		datasets : [
			{
				fillColor : "rgba(220,220,220,0.5)",
				strokeColor : "rgba(220,220,220,1)",
				pointColor : "rgba(220,220,220,1)",
				pointstrokeColor : "yellow",
				data : data,
				xPos : [],
				title : "2014"
			}
		]
	}

	opt = {
		animationLeftToRight : true,
		animationSteps : 20,
		animationEasing: "linear",
		canvasBorders : false,
		legend : true,
		annotateDisplay : true,
		graphTitleFontSize: 18, 
		responsive : true,
		fmtXLabel : "fmttime hh:mm:ss",
		animationCount: 1,
		animationPauseTime : 0,
		animationBackward: true,
		xAxisLabel : "Time (sec)",
		yAxisLabel : "Percent Built (%)"
	};

	new Chart(document.getElementById("perfgraph").getContext("2d")).Line(mydata,opt);

}
socket.on('interNews', function (msg){

	data.push(totalSeconds);
	xPos.push(100*(parseInt(msg['level'])/cols));
	console.log("monet", xPos);
	mydata = {
		labels : [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
		xBegin : 0,
		xEnd : 100,
		datasets : [
			{
				fillColor : "rgba(220,220,220,0.5)",
				strokeColor : "rgba(220,220,220,1)",
				pointColor : "rgba(220,220,220,1)",
				pointstrokeColor : "yellow",
				data : data,
				xPos : xPos,
				title : "Postgres"
			}
		]
	}
	updateChart(document.getElementById("perfgraph").getContext("2d"),mydata,opt,true,true);
	console.log("Updated", mdbData);
	console.log(msg);

	/*interCache+=parseInt(msg['cache']);
	console.log(interCache);

	$('#inter-cache').html(interCache);*/

});




