var socket = io(); //This is the Socket instance that connects to the Node middleware
var chart; //This is the global variable for the charts
var pgTimer, mdbTimer, cTimer, interTimer; //These are the global stopwatch variables.
var cols, rows, chunks; //These are the global variables for the performance demo
var pgCache = 0, cCache = 0, mdbCache = 0; //These are the global cache variables for the performance demo.
var treeData = [{name:"null"}]; //This sets the TreeData for the Data Structure demo
var tree, root, svg, iTree, duration, diagonal; //d3tree variables
var conceptData; //This sets the global variable for the Concept Map
var conceptCols, conceptLevels, conceptThresh, conceptChunk; //These are the universal variables for the concept map

$(document).ready(function(){ //This sets the visual effects for the main page
	$('.parallax').parallax();
	$('.scrollspy').scrollSpy();
});
function scrollHead() {
	$('html, body').animate({
        scrollTop: $("#intro-cont").offset().top - 30
    }, 1000);
}
function showVal(param, val){ //This displays the slider values in the performance demo
	$("#" + param + "Val").html(val);
}
function enterTest(){ //This opens when the performance demo is started - it closes and removes irrelevant stuff and starts the demo.

	$('#splash-page').remove();
	$('#test-container').show();
	$('#demo-container').remove();
	$('#nav-mobile').remove();
	$('#concept-container').remove();
	$('.thumb').addClass('cyan darken-4');
	$('#home-icon').show();
	$('#perf-intro-modal').openModal();
	$('.slider').slider({full_width: true});

}
function enterStat(){ //This opens when the statistics demo is started - it closes and removes irrelevant stuff and starts the demo.

	$('#splash-page').remove();
	$('#stat-container').show();
	$('#test-container').remove();
	$('#demo-container').remove();
	$('#nav-mobile').remove();
	$('#concept-container').remove();
	$('.thumb').addClass('cyan darken-4');
	$('#home-icon').show();
	//$('#perf-intro-modal').openModal();
	$('.slider').slider({full_width: true});
	$("#chartContainer").CanvasJSChart({
		title: {
			text: "Canopy vs Other Systems",
			fontSize: 22
		},
		axisY: {
          title: "Time (seconds)"
		},
		toolTip: {
		  content: "{label} <br/> {name}: {y} seconds"
		},
		data: [
		{
			type: "stackedBar",
			name: "Sum",
			showInLegend: true,
			dataPoints: [
				{ label: "Canopy",		   y: 157},
				{ label: "Postgres + NumPy",y: 287},
				{ label: "MonetDB.R",        y: 190},
				{ label: "NumPy",  y: 209}
			]
		},
		{
			type: "stackedBar",
			name: "Sum of Squares",
			showInLegend: true,
			dataPoints: [
				{ label: "Canopy",		   y: 142},
				{ label: "Postgres + NumPy",y: 261},
				{ label: "MonetDB.R",        y: 171},
				{ label: "NumPy",  y: 190}
			]
		},
		{
			type: "stackedBar",
			name: "Mean",
			showInLegend: true,
			dataPoints: [
				{ label: "Canopy",		   y: 160},
				{ label: "Postgres + NumPy",y: 293},
				{ label: "MonetDB.R",        y: 190},
				{ label: "NumPy",  y: 210}
			]
		},
		{
			type: "stackedBar",
			name: "Variance",
			showInLegend: true,
			dataPoints: [
				{ label: "Canopy",		   y: 152},
				{ label: "Postgres + NumPy",y: 285},
				{ label: "MonetDB.R",        y: 183},
				{ label: "NumPy",  y: 206}
			]
		},
		{
			type: "stackedBar",
			name: "Standard Deviation",
			showInLegend: true,
			dataPoints: [
				{ label: "Canopy", 	       y: 156},
				{ label: "Postgres + NumPy",y: 294},
				{ label: "MonetDB.R",	       y: 193},
				{ label: "NumPy",  y: 213}
			]
		}
		]
	});

}
function startClick(){ //This starts when the start button is clicked, setting the timers, starting the processes (by sending data through Sockets), and starting the graph
	
	$('#pg-time span').remove();
	$('#mdb-time span').remove();
	$('#c-time span').remove();

	pgTimer = new Stopwatch(document.getElementById('pg-time'));
	mdbTimer = new Stopwatch(document.getElementById('mdb-time'));
	cTimer = new Stopwatch(document.getElementById('c-time'));

	pgTimer.start();
	mdbTimer.start();
	cTimer.start();

	$('#start-btn').text('Reset');
	$('#start-btn').attr('onclick', 'resetClick()'); //Turn into Reset Button

	$('#perf-graph-row').show();
	$('#perf-data').show();

	$("input").prop('disabled', true);

	$('html, body').animate({ //This scrolls down to the data
        scrollTop: $("#perf-data").offset().top - 30
    }, 1000);

	var rows = parseInt($('#row-slide').val());
	cols = parseInt($("#col-slide").val());
	var chunks = parseInt($("#chunk-slide").val());

	socket.emit('start', [rows, cols, chunks]);

	chart = new CanvasJS.Chart("perfgraph", { //This starts the graph

		axisX:{
			minimum: 0,
			maximum: 100,
			title: "Percent Completeted",
			labelFontSize: 12,
			titleFontSize: 18,
		},
		axisY:{
			minimum: 0,
			title: "Time (sec)",
			labelFontSize: 12,
			titleFontSize: 18,
		},
		data: [
		{
			type: "spline",
			showInLegend: true,
			legendText: "MonetDB",
			dataPoints: [
				{ x: 0, y: 0 }	
			]
		}, 
		{
			type: "spline",
			showInLegend: true,
			legendText: "Canopy",
			dataPoints: [
			  { x: 0, y: 0 }
			]
		},
		{
			type: "spline",
			showInLegend: true,
			legendText: "Postgres",
			dataPoints: [
				{ x: 0, y: 0 }	
			]
		}, 
		]
	});
	chart.render();	

}
function resetClick(){ //This starts when the Reset button is clicked, setting the data back to zero, stopping the timers, and resetting the grpah

	$('#start-btn').text('Start');
	$('#start-btn').attr('onclick', 'startClick()');

	$("input").prop('disabled', false);

	pgTimer.stop();
	mdbTimer.stop();
	cTimer.stop();
	pgTimer.reset(); //These reset and stop the timers
	mdbTimer.reset();
	cTimer.reset();

	socket.emit('reset');

	$('#pg-prog').css('width', "0%");
	$('#mdb-prog').css('width', "0%");
	$('#c-prog').css('width', "0%");

	chart.options.data[0].dataPoints = {x: 0, y: 0}; //This resets the graph data
	chart.options.data[1].dataPoints = {x: 0, y: 0};
	chart.options.data[2].dataPoints = {x: 0, y: 0};

	chart.render();

}
socket.on('pgNews', function (msg){ //While the Performance Demo is running, this receives data from Node and updates the graph as data comes in

	$('#pg-prog').css('width', String(msg['percent']) + "%");
	
	chart.options.data[2].dataPoints.push({ x: parseInt(msg['percent']), y: parseFloat($('#pg-time').text())});
	chart.render();

	pgCache+=parseInt(msg['cache']);

	$('#pg-cache').html(pgCache);

});
socket.on('pgDone', function (msg){ //This stops the updating and sets the graph to 100%

	$('#pg-prog').css('width', "100%");
	pgTimer.stop();
	chart.options.data[2].dataPoints.push({ x: 100, y: parseFloat($('#pg-time').text())});
	chart.render();

});
socket.on('mdbNews', function (msg){

	$('#mdb-prog').css('width', String(msg['percent']) + "%");

	chart.options.data[0].dataPoints.push({ x: parseInt(msg['percent']), y: parseFloat($('#mdb-time').text())});
	chart.render();
	mdbCache+=parseInt(msg['cache']);

	//console.log(mdbCache);

	$('#mdb-cache').html(mdbCache);

});
socket.on('mdbDone', function (msg){

	mdbTimer.stop();
	$('#mdb-prog').css('width', "100%");
	chart.options.data[0].dataPoints.push({ x: 100, y: parseFloat($('#mdb-time').text())});
	chart.render();

});
socket.on('cNews', function (msg){

	$('#c-prog').css('width', String(msg['percent']) + "%");

	chart.options.data[1].dataPoints.push({ x: parseInt(msg['percent']), y: parseFloat($('#c-time').text())});
	chart.render();

	cCache+=parseInt(msg['cache']);

	$('#c-cache').html(cCache);

});
socket.on('cDone', function (msg){

	cTimer.stop();
	$('#c-prog').css('width', "100%");
	chart.options.data[1].dataPoints.push({ x: 100, y: parseFloat($('#c-time').text())});
	chart.render();

});
function enterDemo(){ //This starts when the Data Structure Demo is started.

	$('#splash-page').remove();
	$('#test-container').remove();
	$('#nav-mobile').remove();
	$('#demo-container').show();
	$('#concept-container').remove();
	$('#home-icon').show();
	$('#inter-intro-modal').openModal();
	$('.slider').slider({full_width: true});

	rows = 100, cols = 6, chunks = 5; //The Data Structure is built on preset parameters

	//Pre-create chunks and levels, but hide.

	for(i = 0; i < chunks; i++){
		$('#inter-accordion').append(
			"<li id='lichunk" + i + "' style='display: none;'><div class='collapsible-header'>Chunk " + i 
			+ "</div><div id='chunk" + i + "' class='chunk collapsible-body'>"
			+ "<ul class='collapsible' data-collapsible='accordion'></ul></div></li>"
		);
		for(j = 1; j <= cols; j++){
			$('#chunk' + i + ' ul').prepend('<li><div class="collapsible-header">Level ' 
				+ j + '</div><div class="collapsible-body"  style="overflow-x: auto; text-align: center;"><table class="centered"><tbody><tr id="trlevel' 
				+ j + '"></tr></tbody></table></div></li>');
		}
	}

	$('.collapsible').collapsible();

	$('#circle-inter-prog').circleProgress({ //This starts the circle progress bar
        value: 0,
        size: 80,
        fill: {
            gradient: ["green", "red"]
        }
    });

	socket.emit('interStart', [rows, cols, chunks]);

	//TIMER
	interTimer = new Stopwatch(document.getElementById('inter-time'));

	interTimer.start();

	// ************** Generate the d3tree diagram  ***************** This pre-generates the trees for the nodes without data.
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
socket.on('interDone', function interDone(){ //This starts when it recieves the message that all the data has been sent for the Data Structure Demo.
	interTimer.stop();
	$("#inter-time").remove();
	$('#circle-inter-prog').circleProgress('value', 1);
	setTimeout(function(){
		$("#side-wrap").hide('slide',{direction:'right'},1000);
		$("#inter-wrap").removeClass("s9");
		$("#inter-wrap").addClass("s12");
	}, 1000);
});
socket.on('interNews', function (msg){ //Everytime more of the Data is sent, this updates the progress bar, sets the data, and adds the collections.

	$(".preloader-wrapper").hide();
	$("#inter-accordion").show();

	percent = msg[0];
	js = msg[1];

	$('#circle-inter-prog').circleProgress('value', percent/100);

	for (var i = js.length - 1; i >= 0; i--) { //This loops through all the sent data and builds the chunks and nodes.
		console.log(js[i]);
		console.log(js[i]['childs']);
		$('#lichunk' + js[i]['chunk']).show();

		if(parseInt(js[i]['level']) == 1)
			$('#chunk' + js[i]['chunk'] + ' #trlevel' + js[i]['level']).append("<td><button class='nodeone btn-floating btn-large waves-effect waves-light' value=" 
				+ js[i]['stat'] + " onclick='nodeClick([" + js[i]['stat'] + "],[" + js[i]['childs'] + "])'><i class='material-icons'>data_usage</i></button></td>");
		else
			$('#chunk' + js[i]['chunk'] + ' #trlevel' + js[i]['level']).append("<td><button class='node btn-floating btn-large waves-effect waves-light' value=" 
				+ js[i]['stat'] + " onclick='nodeClick(" + js[i]['stat'] + ",[" + js[i]['childs'] + "])'><i class='material-icons'>data_usage</i></button></td>");
	}

	$('.collapsible').collapsible();

	$(".node").heatcolor( //This heatmaps the node circles based on their values.
		function() { return $(this).val(); },
		{	lightness: 0,colorStyle: 'greentored' }
	);
	
	if(percent == 100){
		interDone();
		return;
	}
});
function nodeClick(val, list){ //This fires when a Data Structure Node is clicked.

	if(val instanceof Array){ //If the data is an array, it's a level 1 node, which means it'll need a table for data.
		var tbl = "<table class='centered responsive-table'><thead><tr>"
		+ "<th>Mode</th><th>Mean</th><th>Median</th><th>Standard Deviation</th><th>Variance</th>"
		+ "</tr></thead><tbody><tr>"
		for (i = 0, len = val.length; i < len; ++i){

			tbl += "<td>" + val[i] + "</td>";

		}
		tbl += "</tr></tbody></table>"
		$("#node-modal p").html(tbl);
		$("#node-modal h5").hide();
	} else { //Otherwise, it just needs to show a single value
		$("#node-modal p").html([val]);
		$("#node-modal h5").show();
	}

	treeData[0] = {children:[]}; //This resets the data, just in case.

	for (i = 0, len = list.length; i < len; ++i){ //This loops through the data and adds the tree values.

		treeData[0].children[i] = {name: "Col " + String(list[i])};
	}

	root = treeData[0];
	root.x0 = 0;
	root.y0 = 0;

	$('#node-modal #modalTree svg g').empty(); //This deletes the current tree, just in case.

	update(root); //This starts the function to reset the tree with the new data.

	$('#node-modal').openModal();
}

function update(source) { //This function is taken from the d3 tutorial (and slightly modified) to show the tree

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

function enterConcept() { //This starts when the Concept Map demo is entered, removing stuff, and adding the Concept Map stuff.

	//NOTE: CONCEPT MAP IS A WORK IN PROGRESS!!

	$('#splash-page').remove();
	$('#test-container').remove();
	$('#demo-container').remove();
	$('#concept-container').show();
	$('#nav-mobile').remove();
	$('#home-icon').show();
	$('#concept-intro-modal').openModal();
	$('.slider').slider({full_width: true});

	conceptLevels = 5, conceptThresh = 0, conceptCols = ["0","1","2","3", "4"], conceptChunk = 1; //This sets the default parameters for the Concept Map.

	var html = '';

	for (var i = 0; i < conceptCols.length; i++) {
		html += '<tr><td><p><input type="checkbox" class="concept-check" id="check-col' 
		+ i + '" value=' + i + ' checked="checked" onchange="checkchanged(this)"/><label for="check-col' 
		+ i + '">Col' + conceptCols[i] + '</label></p></td></tr>';
	};

	$('#checkbox-body').append(html);

	$('#level-slider').attr('max', conceptLevels);
	$('#level-slider').val(conceptLevels);

	socket.emit('conceptmap', [conceptLevels, conceptThresh, conceptCols, conceptChunk]);

}

socket.on('conceptDone', function (msg){

	//console.log(msg);
	conceptData = msg;
	//console.log(conceptData);
	updateConcept();

});

function changeLevel(value){ //The following functions fire when sliders are changed and rebuild the concept map as needed.

	//TEMP
	console.log(value);
	for (var i = conceptData.length - 1; i >= 0; i--) {
		if(conceptData[i][1].length != value){
			conceptData.splice(i, 1);
		}
	};

	conceptLevels = value;
	$("#conceptLevelVal").text(value);

	socket.emit('conceptmap', [conceptLevels, conceptThresh, conceptCols, conceptChunk]);

}
function changeThresh(value){
	
	//TEMP
	console.log(value);
	for (var i = conceptData.length - 1; i >= 0; i--) {
		if(conceptData[i][0] < value){
			conceptData.splice(i, 1);
		}
	};

	conceptThresh = value;

	$("#conceptThreshVal").text(value);

	socket.emit('conceptmap', [conceptLevels, conceptThresh, conceptCols, conceptChunk]);

}
function changeChunk(value){
	
	conceptChunk = value;

	$("#conceptChunkVal").text(value);

	socket.emit('conceptmap', [conceptLevels, conceptThresh, conceptCols, conceptChunk]);

}
function checkchanged(self) {
	console.log(self.checked);
	console.log(self.value);
    if(self.checked) {
    	conceptCols.push(self.value);
    } else {
    	conceptCols.splice(conceptCols.indexOf(self.value), 1);
    }

    console.log(conceptCols);

    socket.emit('conceptmap', [conceptLevels, conceptThresh, conceptCols, conceptChunk]);

}

function updateConcept(){ //This is a d3 representation of a relational concept map with a few modifications.
	// transform the data into a useful representation
	// 1 is inner, 2, is outer

	// need: inner, outer, links
	//
	// inner: 
	// links: { inner: outer: }

	$('#concept-map svg').remove();

	var outer = d3.map();
	var inner = [];
	var links = [];
	
	if(conceptLevels != 1)
		var max = -100, min = conceptData[0][0];

	var outerId = [0];

	conceptData.forEach(function(d) {

	  if (d == null)
	    return;

	  //find values for threshold slider
	  if(conceptLevels != 1){

		  if(d[0] > max)
		  	max = d[0];
		  if(d[0] < min)
		  	min = d[0];

		  i = {
		    id: 'i' + inner.length,
		    name: d[0],
		    related_links: []
		  };

	  }else{
	  	i = {
		    id: 'i' + inner.length,
		    name: "o",
		    related_links: [],
		    data: d[0]
		};
	  }

	  i.related_nodes = [i.id];
	  inner.push(i);

	  if (!Array.isArray(d[1]))
	    d[1] = [d[1]];

	  d[1].forEach(function(d1) {
	  	
	  	//PUT IN col# FORMAT

	  	d1 = "col" + d1;

	    o = outer.get(d1);

	    if (o == null) {
	      o = {
	        name: d1,
	        id: 'o' + outerId[0],
	        related_links: []
	      };
	      o.related_nodes = [o.id];
	      outerId[0] = outerId[0] + 1;

	      outer.set(d1, o);
	    }

	    // create the links
	    l = {
	      id: 'l-' + i.id + '-' + o.id,
	      inner: i,
	      outer: o
	    }
	    links.push(l);

	    // and the relationships
	    i.related_nodes.push(o.id);
	    i.related_links.push(l.id);
	    o.related_nodes.push(i.id);
	    o.related_links.push(l.id);
	  });
	});
	if(conceptLevels != 1){
		$('#threshold-slider').attr('min', min-1);
		$('#threshold-slider').attr('max', max);
		$('#threshold-slider').prop('disabled', false);
	} else {
		$('#threshold-slider').prop('disabled', true);
	}
	var data = {
	  inner: inner,
	  outer: outer.values(),
	  links: links
	}

	outer = data.outer;
	data.outer = Array(outer.length);

	var i1 = 0;
	var i2 = outer.length - 1;

	for (var i = 0; i < data.outer.length; ++i) {
	  if (i % 2 == 1)
	    data.outer[i2--] = outer[i];
	  else
	    data.outer[i1++] = outer[i];
	}

	data.outer.reduce(function(a, b) {
	  return a + b.related_links.length;
	}, 0) / data.outer.length;

	var colors = ["#00FF00", "#35FF00", "#58FF00", "#7CFF00", "#B0FF00", "#E5FF00", "#FFE400", "#FFAF00", "#FF6900", "#FF3400", "#FF0000"]
	var color = d3.scale.linear()
	  .domain([min, max])
	  .range([colors.length - 1, 0])
	  .clamp(true);

	var diameter = 800;
	var rect_width = 40;
	var rect_height = 14;

	var link_width = "1px";

	var il = data.inner.length;
	var ol = data.outer.length;

	var inner_y = d3.scale.linear()
	  .domain([0, il])
	  .range([-(il * rect_height) / 2, (il * rect_height) / 2]);

	mid = (data.outer.length / 2.0)
	var outer_x = d3.scale.linear()
	  .domain([0, mid, mid, data.outer.length])
	  .range([15, 170, 190, 355]);

	var outer_y = d3.scale.linear()
	  .domain([0, data.outer.length])
	  .range([0, diameter / 2 - 120]);

	// setup positioning
	data.outer = data.outer.map(function(d, i) {
	  d.x = outer_x(i);
	  d.y = diameter / 3;
	  return d;
	});

	data.inner = data.inner.map(function(d, i) {
	  d.x = -(rect_width / 2);
	  d.y = inner_y(i);
	  return d;
	});

	function get_color(name) {
	  var c = Math.round(color(name));
	  if (isNaN(c))
	    return '#dddddd'; // fallback color

	  return colors[c];
	}

	// Can't just use d3.svg.diagonal because one edge is in normal space, the
	// other edge is in radial space. Since we can't just ask d3 to do projection
	// of a single point, do it ourselves the same way d3 would do it.  

	function projectX(x) {
	  return ((x - 90) / 180 * Math.PI) - (Math.PI / 2);
	}

	var diagonal = d3.svg.diagonal()
	  .source(function(d) {
	    return {
	      "x": d.outer.y * Math.cos(projectX(d.outer.x)),
	      "y": -d.outer.y * Math.sin(projectX(d.outer.x))
	    };
	  })
	  .target(function(d) {
	    return {
	      "x": d.inner.y + rect_height / 2,
	      "y": d.outer.x > 180 ? d.inner.x : d.inner.x + rect_width
	    };
	  })
	  .projection(function(d) {
	    return [d.y, d.x];
	  });

	var svg = d3.select("#concept-map").append("svg")
	  .attr("width", diameter)
	  .attr("height", diameter)
	  .append("g")
	  .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

	// links
	var link = svg.append('g').attr('class', 'links').selectAll(".link")
	  .data(data.links)
	  .enter().append('path')
	  .attr('class', 'link')
	  .attr('id', function(d) {
	    return d.id
	  })
	  .attr("d", diagonal)
	  .attr('stroke', function(d) {
	    return get_color(d.inner.name);
	  })
	  .attr('stroke-width', link_width);

	// outer nodes

	var onode = svg.append('g').selectAll(".outer_node")
	  .data(data.outer)
	  .enter().append("g")
	  .attr("class", "outer_node")
	  .attr("transform", function(d) {
	    return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
	  })
	  .on("mouseover", mouseover)
	  .on("mouseout", mouseout);

	onode.append("circle")
	  .attr('id', function(d) {
	    return d.id
	  })
	  .attr("r", 4.5);

	onode.append("circle")
	  .attr('r', 20)
	  .attr('visibility', 'hidden');

	onode.append("text")
	  .attr('id', function(d) {
	    return d.id + '-txt';
	  })
	  .attr("dy", ".31em")
	  .attr("text-anchor", function(d) {
	    return d.x < 180 ? "start" : "end";
	  })
	  .attr("transform", function(d) {
	    return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)";
	  })
	  .text(function(d) {
	    return d.name;
	  });

	// inner nodes

	var inode = svg.append('g').selectAll(".inner_node")
	  .data(data.inner)
	  .enter().append("g")
	  .attr("class", "inner_node")
	  .attr("transform", function(d, i) {
	    return "translate(" + d.x + "," + d.y + ")"
	  })
	  .on("mouseover", mouseover)
	  .on("mouseout", mouseout);

	if(conceptLevels == 1){
		inode.append('rect')
		  .attr('width', rect_width)
		  .attr('height', rect_height)
		  .attr('id', function(d) {
		    return d.id;
		  })
		  .on("click", function(d){

		  	var tbl = "<table class='centered responsive-table'><thead><tr>"
			+ "<th>Mode</th><th>Mean</th><th>Median</th><th>Standard Deviation</th><th>Variance</th>"
			+ "</tr></thead><tbody><tr>"

		  	for (var i = 0; i < d.data.length; i++) {
		  		tbl += "<td>" + d.data[i] + "</td>";
		  	}

		  	tbl += "</tr></table>";

		  	$("#concept-modal .modal-content div").html(tbl);
		  	$("#concept-modal").openModal();
		  	return;
		  })
		  .attr('fill', function(d) {
		    return get_color(d.name);
		  });
	}else {
		inode.append('rect')
		  .attr('width', rect_width)
		  .attr('height', rect_height)
		  .attr('id', function(d) {
		    return d.id;
		  })
		  .attr('fill', function(d) {
		    return get_color(d.name);
		  });
	}

	inode.append("text")
	  .attr('id', function(d) {
	    return d.id + '-txt';
	  })
	  .attr('text-anchor', 'middle')
	  .attr("transform", "translate(" + rect_width / 2 + ", " + rect_height * .75 + ")")
	  .text(function(d) {
	    return d.name;
	  });
	// need to specify x/y/etc
	d3.select(self.frameElement).style("height", diameter - 150 + "px");

	function mouseover(d) {
	  // bring to front
	  $('rect').css( 'cursor', 'pointer' );
	  d3.selectAll('.links .link').sort(function(a, b) {
	    return d.related_links.indexOf(a.id);
	  });

	  for (var i = 0; i < d.related_nodes.length; i++) {
	    d3.select('#' + d.related_nodes[i]).classed('highlight', true);
	    d3.select('#' + d.related_nodes[i] + '-txt').attr("font-weight", 'bold');
	  }

	  for (var i = 0; i < d.related_links.length; i++)
	    d3.select('#' + d.related_links[i]).attr('stroke-width', '5px');
	}

	function mouseout(d) {
	  $('rect').css( 'cursor', 'auto' );
	  for (var i = 0; i < d.related_nodes.length; i++) {
	    d3.select('#' + d.related_nodes[i]).classed('highlight', false);
	    d3.select('#' + d.related_nodes[i] + '-txt').attr("font-weight", 'normal');
	  }

	  for (var i = 0; i < d.related_links.length; i++)
	    d3.select('#' + d.related_links[i]).attr('stroke-width', link_width);
	}
}

var Stopwatch = function(elem, options) { //Stopwatch object found online.
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