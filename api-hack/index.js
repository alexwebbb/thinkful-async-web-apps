// This example adds a user-editable rectangle to the map.
// When the user changes the bounds of the rectangle,
// an info window pops up displaying the new bounds.


///// Google Maps

var rectangle;
var map;
var infoWindow;


///// D3

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = 600 - margin.left - margin.right,
    height = 270 - margin.top - margin.bottom;

// Set the ranges
var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// Define the line
var valueline = d3.line()
    .x(function(d, i) { return x(i); })
    .y(function(d) { return y(d.elevation); });
    
// Adds the svg canvas
var svg = d3.select("#graph-container")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");




function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 44.5452, lng: -78.5389 },
        zoom: 9
    });

    var bounds = {
        north: 44.599,
        south: 44.490,
        east: -78.443,
        west: -78.649
    };

    // Define the rectangle and set its editable property to true.
    rectangle = new google.maps.Rectangle({
        bounds: bounds,
        editable: true,
        draggable: true
    });

    rectangle.setMap(map);

    // Add an event listener on the rectangle.
    rectangle.addListener('bounds_changed', showNewRect);

    // Define an info window on the map.
    infoWindow = new google.maps.InfoWindow();
}
// Show the new coordinates for the rectangle in an info window.

/** @this {google.maps.Rectangle} */
function showNewRect(event) {
    var ne = rectangle.getBounds().getNorthEast();
    var sw = rectangle.getBounds().getSouthWest();

    var contentString = '<b>Rectangle moved.</b><br>' +
        'New north-east corner: ' + ne.lat() + ', ' + ne.lng() + '<br>' +
        'New south-west corner: ' + sw.lat() + ', ' + sw.lng();

    // Set the info window's content and position.
    infoWindow.setContent(contentString);
    infoWindow.setPosition(ne);

    infoWindow.open(map);
}


// Get the data
d3.json("data2.json", function(error, data) {

    // Scale the range of the data
    x.domain(d3.extent(data, function(d, i) { return i; }));
    y.domain([-500, d3.max(data, function(d) { return d.elevation; })]);

    // Add the valueline path.
    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", valueline);

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

});