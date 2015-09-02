var socket = io();
var chart;
var pgTimer, mdbTimer, cTimer, interTimer;
var totalSeconds = 0;
var cols, rows, chunks;
var conceptCols, conceptLevels, conceptThresh, conceptChunk;
var counter = 0;
var pgCache = 0, cCache = 0, mdbCache = 0;
var treeData = [{name:"null"}];
var conceptData;
var tree, root, svg, iTree, duration, diagonal; //d3tree variables

$(document).ready(function(){
	$('.parallax').parallax();
	$('.scrollspy').scrollSpy();
});
function scrollHead() {
	$('html, body').animate({
        scrollTop: $("#intro-cont").offset().top - 30
    }, 1000);
}

function showVal(param, val){
	$("#" + param + "Val").html(val);
}

function enterTest(){

	$('#splash-page').remove();
	$('#test-container').show();
	$('#demo-container').remove();
	$('#nav-mobile').remove();
	$('#concept-container').remove();
	$('.thumb').addClass('cyan darken-4');

}
function startClick(){
	
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
	$('#start-btn').attr('onclick', 'resetClick()');
	//Turn into reset

	$('#perf-graph-row').show();
	$('#perf-data').show();

	$("input").prop('disabled', true);

	$('html, body').animate({
        scrollTop: $("#perf-data").offset().top - 30
    }, 1000);

	var rows = parseInt($('#row-slide').val());
	cols = parseInt($("#col-slide").val());
	var chunks = parseInt($("#chunk-slide").val());

	socket.emit('start', [rows, cols, chunks]);

	chart = new CanvasJS.Chart("perfgraph", { 

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
	$('#c-prog').css('width', "0%");

	chart.options.data[0].dataPoints = {x: 0, y: 0};
	chart.options.data[1].dataPoints = {x: 0, y: 0};
	chart.options.data[2].dataPoints = {x: 0, y: 0};

	chart.render();

}
socket.on('pgNews', function (msg){

	$('#pg-prog').css('width', String(msg['percent']) + "%");
	
	chart.options.data[2].dataPoints.push({ x: parseInt(msg['percent']), y: totalSeconds});
	chart.render();

	pgCache+=parseInt(msg['cache']);

	$('#pg-cache').html(pgCache);

});
socket.on('pgDone', function (msg){

	$('#pg-prog').css('width', "100%");
	pgTimer.stop();
	chart.options.data[2].dataPoints.push({ x: 100, y: totalSeconds});
	chart.render();

});
socket.on('mdbNews', function (msg){

	$('#mdb-prog').css('width', String(msg['percent']) + "%");

	chart.options.data[0].dataPoints.push({ x: parseInt(msg['percent']), y: totalSeconds});
	chart.render();
	mdbCache+=parseInt(msg['cache']);

	//console.log(mdbCache);

	$('#mdb-cache').html(mdbCache);

});
socket.on('mdbDone', function (msg){

	mdbTimer.stop();
	$('#mdb-prog').css('width', "100%");
	chart.options.data[0].dataPoints.push({ x: 100, y: totalSeconds});
	chart.render();

});
socket.on('cNews', function (msg){

	$('#c-prog').css('width', String(msg['percent']) + "%");

	chart.options.data[1].dataPoints.push({ x: parseInt(msg['percent']), y: totalSeconds});
	chart.render();

	cCache+=parseInt(msg['cache']);

	$('#c-cache').html(cCache);

});
socket.on('cDone', function (msg){

	cTimer.stop();
	$('#c-prog').css('width', "100%");
	chart.options.data[1].dataPoints.push({ x: 100, y: totalSeconds});
	chart.render();

});
function enterDemo(){

	$('#splash-page').remove();
	$('#test-container').remove();
	$('#nav-mobile').remove();
	$('#demo-container').show();
	$('#concept-container').remove();

	rows = 100, cols = 6, chunks = 5;

	//PRE-CREATE CHUNKS (with levels) BUT DONT SHOW

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

	socket.emit('interStart', [rows, cols, chunks]);

	//TIMER
	interTimer = new Stopwatch(document.getElementById('inter-time'));

	interTimer.start();

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

socket.on('interDone', function (msg){
	interTimer.stop();
	$("#inter-time").remove();
	$('#inter-prog').css('width', "100%");
});


socket.on('interNews', function (msg){

	$(".preloader-wrapper").hide();
	$("#inter-accordion").show();

	percent = msg[0];

	js = msg[1];

	$('#inter-prog').css('width', String(percent) + "%");

	for (var i = js.length - 1; i >= 0; i--) {
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

function enterConcept() {

	$('#splash-page').remove();
	$('#test-container').remove();
	$('#demo-container').remove();
	$('#concept-container').show();
	$('#nav-mobile').remove();

	conceptLevels = 5, conceptThresh = 0, conceptCols = ["0","1","2","3", "4"], conceptChunk = 1;

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

	console.log(msg);
	conceptData = msg;

	console.log(conceptData);

	updateConcept();

});

function changeLevel(value){

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

function updateConcept(){
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
		var max = 0, min = conceptData[0][0];

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
		$('#threshold-slider').val(max);
		$('#threshold-slider').removeClass("disabled");
	} else {
		$('#threshold-slider').addClass("disabled");
	}
	var data = {
	  inner: inner,
	  outer: outer.values(),
	  links: links
	}

	// sort the data -- TODO: have multiple sort options
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

	// from d3 colorbrewer: 
	// This product includes color specifications and designs developed by Cynthia Brewer (http://colorbrewer.org/).
	var colors = ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"]
	var color = d3.scale.linear()
	  .domain([min, max])
	  .range([colors.length - 1, 0])
	  .clamp(true);

	var diameter = 600;
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
		  .on("mouseover", function(d){
		  	console.log("banana");
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
	  for (var i = 0; i < d.related_nodes.length; i++) {
	    d3.select('#' + d.related_nodes[i]).classed('highlight', false);
	    d3.select('#' + d.related_nodes[i] + '-txt').attr("font-weight", 'normal');
	  }

	  for (var i = 0; i < d.related_links.length; i++)
	    d3.select('#' + d.related_links[i]).attr('stroke-width', link_width);
	}
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
    totalSeconds /= 1000
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