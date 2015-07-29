var socket = io();
var perfgraph;
var opt, labels;
var data, pgData, mdbData, cData;
var xPos, pgXPos, mdbXPos, cXPos;
var pgTimer, mdbTimer, cTimer, interTimer;
var totalSeconds = 0;
var cols, rows, chunks;
var counter = 0;
var pgCache = 0, cCache = 0, mdbCache = 0;
var treeData = [{name:"null"}];
var tree, root, svg, iTree, duration, diagonal; //d3tree variables

function enterTest(){

	$('#splash-container').remove();
	$('#test-container').show();
	$('#demo-container').remove();
	$('.thumb').addClass('blue');

}
function startClick(){
	
	pgTimer = new Stopwatch(document.getElementById('pg-time'));
	mdbTimer = new Stopwatch(document.getElementById('mdb-time'));
	cTimer = new Stopwatch(document.getElementById('c++-time'));

	pgTimer.start();
	mdbTimer.start();
	cTimer.start();

	$('#start-btn').text('Reset');
	$('#start-btn').attr('onclick', 'resetClick()');
	//Turn into reset

	$('#perf-graph-row').show();

	$("input").prop('disabled', true);

	$('html, body').animate({
        scrollTop: $("#perf-data").offset().top - 30
    }, 1000);

	var rows = parseInt($('#row-slide').val());
	cols = parseInt($("#col-slide").val());
	var chunks = parseInt($("#chunk-slide").val());

	//console.log(rows, cols, chunks);

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
			},
			{
				fillColor : "rgba(0,187,0,0.5)",
				strokeColor : "rgba(0,187,0,1)",
				pointColor : "rgba(0,187,0,1)",
				pointstrokeColor : "green",
				data : cData,
				xPos : [0],
				title : "C++"
			}
		]
	}

	opt = {
		animationLeftToRight : false,
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
function resetClick(){

	$('#start-btn').text('Start');
	$('#start-btn').attr('onclick', 'startClick()');

	$("input").prop('disabled', false);

	pgTimer.reset();
	mdbTimer.reset();
	cTimer.reset();
	pgTimer.stop();
	mdbTimer.stop();
	cTimer.stop();

	totalSeconds = 0;

	socket.emit('reset');

	pgData = [0], mdbData = [0], cData = [0];
	pgXPos = [0], mdbXPos = [0], cXPos = [0];
	pgCache = 0, cCache = 0, mdbCache = 0;

	$('#pg-prog').css('width', "0%");
	$('#mdb-prog').css('width', "0%");
	$('#c++-prog').css('width', "0%");

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
			},
			{
				fillColor : "rgba(0,187,0,0.5)",
				strokeColor : "rgba(0,187,0,1)",
				pointColor : "rgba(0,187,0,1)",
				pointstrokeColor : "green",
				data : cData,
				xPos : [0],
				title : "C++"
			}
		]
	}

	opt = {
		animationLeftToRight : false,
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

	pgXPos.push(String(msg['percent']));
	$('#pg-prog').css('width', String(msg['percent']) + "%");
	//console.log("pg", pgXPos);
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
			},
			{
				fillColor : "rgba(0,187,0,0.5)",
				strokeColor : "rgba(0,187,0,1)",
				pointColor : "rgba(0,187,0,1)",
				pointstrokeColor : "green",
				data : cData,
				xPos : cXPos,
				title : "C++"
			}
		]
	}
	updateChart(document.getElementById("perfgraph").getContext("2d"),mydata,opt,false,false);
	//console.log("Updated", pgData);
	//console.log(msg);

	pgCache+=parseInt(msg['cache']);
	//console.log(pgCache);

	$('#pg-cache').html(pgCache);

});
socket.on('pgDone', function (msg){

	$('#pg-prog').css('width', "100%");
	pgTimer.stop();

});
socket.on('mdbNews', function (msg){

	mdbData.push(totalSeconds);
	mdbXPos.push(String(msg['percent']));
	$('#mdb-prog').css('width', String(msg['percent']) + "%");

	//console.log("monet", mdbXPos);
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
			},
			{
				fillColor : "rgba(0,187,0,0.5)",
				strokeColor : "rgba(0,187,0,1)",
				pointColor : "rgba(0,187,0,1)",
				pointstrokeColor : "green",
				data : cData,
				xPos : cXPos,
				title : "C++"
			}
		]
	}
	updateChart(document.getElementById("perfgraph").getContext("2d"),mydata,opt,false,false);
	//console.log("Updated", mdbData);
	//console.log(msg);

	mdbCache+=parseInt(msg['cache']);

	$('#mdb-cache').html(mdbCache);

});
socket.on('mdbDone', function (msg){

	mdbTimer.stop();
	$('#mdb-prog').css('width', "100%");

});
socket.on('cNews', function (msg){

	cData.push(totalSeconds);
	cXPos.push(String(msg['percent']));
	$('#c++-prog').css('width', String(msg['percent']) + "%");

	//console.log("monet", mdbXPos);
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
			},
			{
				fillColor : "rgba(0,187,0,0.5)",
				strokeColor : "rgba(0,187,0,1)",
				pointColor : "rgba(0,187,0,1)",
				pointstrokeColor : "green",
				data : cData,
				xPos : cXPos,
				title : "C++"
			}
		]
	}
	updateChart(document.getElementById("perfgraph").getContext("2d"),mydata,opt,false,false);
	console.log("Updated", cData);
	console.log(msg);

	mdbCache+=parseInt(msg['cache']);

	$('#c++-cache').html(mdbCache);

});
socket.on('cDone', function (msg){

	cTimer.stop();
	$('#c++-prog').css('width', "100%");

});
function enterDemo(){

	$('#splash-container').remove();
	$('#test-container').remove();
	$('#demo-container').show();

	rows = 100, cols = 6, chunks = 5;

	//PRE-CREATE CHUNKS (with levels) BUT DONT SHOW

	for(i = 1; i <= chunks; i++){
		$('#inter-accordion').append(
			"<li id='lichunk" + i + "' style='display: none;'><div class='collapsible-header'>Chunk " + i 
			+ "</div><div id='chunk" + i + "' class='chunk collapsible-body'>"
			+ "<ul class='collapsible' data-collapsible='accordion'></ul></div></li>"
		);
		for(j = 1; j <= cols; j++){
			$('#chunk' + i + ' ul').prepend('<li><div class="collapsible-header">Level ' + j + '</div><div class="collapsible-body"  style="overflow-x: auto; text-align: center;"><table class="centered"><tbody><tr id="trlevel' + j + '"></tr></tbody></table></div></li>');
		}
	}

	$('.collapsible').collapsible();

	socket.emit('interStart', [rows, cols, chunks]);

	//TIMER
	interTimer = new Stopwatch(document.getElementById('inter-time'));

	interTimer.start();

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
		animationLeftToRight : false,
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

	// ************** Generate the d3tree diagram  *****************
	var margin = {top: 40, right: 50, bottom: 20, left: 50},
		width = 300 - margin.right - margin.left,
		height = 300 - margin.top - margin.bottom;

	iTree = 0, duration = 450;

	tree = d3.layout.tree()
		.size([height, width]);

	diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.x, d.y]; });

	svg = d3.select("main #node-modal #modalTree").append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(0," + margin.top + ")");

	root = treeData[0];
	root.x0 = 0;
	root.y0 = 0;

	update(root);

	d3.select(self.frameElement).style("height", "300px");

}

socket.on('interNews', function (msg){

	$(".preloader-wrapper").hide();
	$("#inter-accordion").show();

	counter++;
	data.push(totalSeconds);
	xPos.push(100*((counter)/(cols*chunks)));
	//console.log("inter", xPos);
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
	
	//console.log("Updated", data);
	//console.log(msg);

	//console.log('lichunk' + msg['chunk']);

	$('#lichunk' + msg['chunk']).show();

	if(parseInt(msg['level']) == 1)
		$('#chunk' + msg['chunk'] + ' #trlevel' + msg['level']).append("<td><button class='nodeone btn-floating btn-large waves-effect waves-light' value=" + msg['stat'] + " onclick='nodeClick(" + msg['stat'] + "," + msg['childs'] + ")'><i class='material-icons'>data_usage</i></button></td>");
	else
		$('#chunk' + msg['chunk'] + ' #trlevel' + msg['level']).append("<td><button class='node btn-floating btn-large waves-effect waves-light' value=" + msg['stat'] + " onclick='nodeClick(" + msg['stat'] + "," + msg['childs'] + ")'><i class='material-icons'>data_usage</i></button></td>");

	$('.collapsible').collapsible();


	$(".node").heatcolor(
		function() { return $(this).val(); },
		{	lightness: 0,colorStyle: 'greentored' }
	);
	
});

function nodeClick(val, list){

	if(val instanceof Array){
		var tbl = "<table class='centered responsive-table'><thead><tr>"
		+ "<th>Mode</th><th>Mean</th><th>Median</th><th>Standard Deviation</th><th>Variance</th>"
		+ "</tr></thead><tbody><tr>"
		for (i = 0, len = val.length; i < len; ++i){

			tbl += "<td>" + val[i] + "</td>";

		}
		tbl += "</tr></tbody></table>"
		$("#node-modal p").html(tbl);
		$("#node-modal h5").hide();
	} else {
		$("#node-modal p").html([val]);
		$("#node-modal h5").show();
	}

	treeData[0] = {children:[]};

	for (i = 0, len = list.length; i < len; ++i){

		treeData[0].children[i] = {name: "col " + String(list[i])};
		//treeData[0].children[i] = {name: "col " + Math.random()};
	}

	root = treeData[0];
	root.x0 = 0;
	root.y0 = 0;

	$('#node-modal #modalTree svg g').empty();

	update(root);

	//console.log("treeData", treeData);

	$('#node-modal').openModal();
}

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
    links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
    .on("click", click);

  nodeEnter.append("circle")
    .attr("r", 1e-6)
    .style("fill", function(d) { return d._children ? "rgba(213, 0, 0, 0.5)" : "#fff"; });

  /*nodeEnter.append("text")
    .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    .text(function(d) { return d.name; })
    .style("fill-opacity", 1e-6);*/

	nodeEnter.append("text")
		.attr("y", function(d) { 
		return d.children || d._children ? -18 : 18; })
		.attr("dy", ".35em")
		.attr("text-anchor", "middle")
		.text(function(d) { return d.name; })
		.style("fill-opacity", 1);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  nodeUpdate.select("circle")
    .attr("r", 10)
    .style("fill", function(d) { return d._children ? "rgba(213, 0, 0, 0.5)" : "#fff"; });

  nodeUpdate.select("text")
    .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
    .remove();

  nodeExit.select("circle")
    .attr("r", 1e-6);

  nodeExit.select("text")
    .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
    .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
    var o = {x: source.x0, y: source.y0};
    return diagonal({source: o, target: o});
    });

  // Transition links to their new position.
  link.transition()
    .duration(duration)
    .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(duration)
    .attr("d", function(d) {
    var o = {x: source.x, y: source.y};
    return diagonal({source: o, target: o});
    })
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
  d.x0 = d.x;
  d.y0 = d.y;
  });

}

function click(d) {
  if (d.children) {
  d._children = d.children;
  d.children = null;
  } else {
  d.children = d._children;
  d._children = null;
  }
  update(d);
}

var Stopwatch = function(elem, options) {

  var timer       = createTimer(),
      offset,
      clock,
      interval;

  // default options
  options = options || {};
  options.delay = options.delay || 1;

  // append elements     
  elem.appendChild(timer);

  // initialize
  reset();

  // private functions
  function createTimer() {
    return document.createElement("span");
  }

  function start() {
    if (!interval) {
      offset   = Date.now();
      interval = setInterval(update, options.delay);
    }
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function reset() {
    clock = 0;
    render();
  }

  function update() {
  	d = delta()
    clock += d;
    totalSeconds += d;
    render();
  }

  function render() {
    timer.innerHTML = clock/1000; 
  }

  function delta() {
    var now = Date.now(),
        d   = now - offset;

    offset = now;
    return d;
  }

  // public API
  this.start  = start;
  this.stop   = stop;
  this.reset  = reset;
};