var summarydata = [];
var parent_types = {};
var max_value = 0;

if(tag.meta) {
	for(var q=0; q<3; q++) {
		var bucket = ['cannot', 'can', 'must'][q];
		var freq_list = tag.meta.summary.counts[bucket];
		if(freq_list) {
			var keys = Object.keys(freq_list);
			for(var i=0; i<keys.length; i++) {
				var base = Math.round(255 * (i / keys.length));
				var color = [base, base, base];
				color[q] = 255;

				var value = freq_list[keys[i]].count;
				parent_types[bucket] = (parent_types[bucket] || 0) + value;
				max_value += value;
				summarydata.push({
					value: value,
					label: freq_list[keys[i]].title,
					color: 'rgb(' + color.join(',') + ')'
				});
			}
		}
	}
}

var pie = d3.layout.pie()
	.value(function(d, i) {
		return d.value;
	})
    .sort(null);

var arc = d3.svg.arc()
    .innerRadius(130)
    .outerRadius(80);

var svg = d3.select("#tag-summary-chart").append("svg")
    .attr("width", 300)
    .attr("height", 300)
    .append("g")
    .attr("transform", "translate(" + 150 + "," + 150 + ")");;

var path = svg.selectAll("path")
    .data(pie(summarydata))
  	.enter();

path.append("path")
    .attr("fill", function(d, i) { return d.data.color; })
    .attr("d", arc)
    .attr("stroke", "#fff")
    .on("mouseover", function(d, i) {
     	svg.selectAll("path").attr('fill-opacity', '.7');
     	d3.select(this).attr('stroke', d.data.color).attr('stroke-width', '5').attr('fill-opacity', '1');
     	label.text(d.data.label + ' (' + d.value + ')');
	})
	.on("mouseout", function(d, i) {  
		svg.selectAll("path").attr('fill-opacity', '1');
     	d3.select(this).attr('stroke-width', '1').attr('stroke', "#fff");
     	label.text('');
	}).transition().duration(1000).attrTween("d", function(b) {
	  var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
	  return function(t) { return arc(i(t)); };
	});

var label = path.append('text').attr('text-anchor', 'middle');

/*path.append("text").text(function(d) {
	return d.data.label;
}).attr('text-anchor', 'middle').attr('x', function(d) {
	console.log(d);
	return Math.sin(d.startAngle) * 100;
}).attr('y', function(d) {
	return Math.cos(d.startAngle) * 100;
});*/