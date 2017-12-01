// This example adds a user-editable rectangle to the map.
// When the user changes the bounds of the rectangle,
// an info window pops up displaying the new bounds.


///// Data Object

let dataObject = [],
    isInitialized = false,
    colorScale;

///// Google Maps

let rowNum = 5,
    sampleSize = 30,
    rowLoadCount, rectangle, map, elevator, currentDistance;


///// D3

// Set the dimensions of the canvas / graph
let margin = { top: 30, right: 20, bottom: 50, left: 70 },
    width = 600 - margin.left - margin.right,
    height = 270 - margin.top - margin.bottom;

// Set the ranges
let x = d3.scaleLinear().range([0, width]);
let y = d3.scaleLinear().range([height, 0]);

// Define the fill area
var area = d3.area()
    .x(function(d, i) { return x(i * (currentDistance / sampleSize)); })
    .y0(height)
    .y1(function(d) { return y(d.elevation); });

// Define the line
let valueline = d3.line()
    .x(function(d, i) { return x(i * (currentDistance / sampleSize)); })
    .y(function(d) { return y(d.elevation); });

// Adds the svg canvas
let svg = d3.select("#graph-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");


////// GOOGLE MAPS FUNCTIONS

// generic spherical distance function
// from http://www.geodatasource.com/developers/javascript
function distance(lat1, lon1, lat2, lon2, unit = "K") {
    let radlat1 = Math.PI * lat1 / 180
    let radlat2 = Math.PI * lat2 / 180
    let theta = lon1 - lon2
    let radtheta = Math.PI * theta / 180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180 / Math.PI
    dist = dist * 60 * 1.1515
    if (unit == "K") { dist = dist * 1.609344 }
    if (unit == "N") { dist = dist * 0.8684 }
    return dist
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 44.5452, lng: -78.5389 },
        zoom: 9
    });
    elevator = new google.maps.ElevationService;


    let bounds = {
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
    rectangle.addListener('dragend', showNewRect);

    // Define an info window on the map.
    // infoWindow = new google.maps.InfoWindow();
}
// Show the new coordinates for the rectangle in an info window.

/** @this {google.maps.Rectangle} */
function showNewRect(event) {
    let ne = rectangle.getBounds().getNorthEast();
    let sw = rectangle.getBounds().getSouthWest();


    // construct path request
    let bounds = {
        north: ne.lat(),
        west: sw.lng(),
        south: sw.lat(),
        east: ne.lng()
    };

    updateElevation(bounds);
}


function updateElevation(bounds) {


    let b = bounds;

    let interval = (b.south - b.north) / (rowNum - 1);

    for (let i = 0; i < rowNum; i++) {

        // construct path
        let path = [{
            lat: b.north + (interval * i),
            lng: b.west
        }, {
            lat: b.north + (interval * i),
            lng: b.east
        }];

        rowLoadCount = 0;

        elevator.getElevationAlongPath({
            'path': path,
            'samples': sampleSize
        }, function(data, status) {
            dataObject[i] = data;

            rowLoadCount++;

            // make sure to only call the graph function when the data update is complete
            if (rowLoadCount === rowNum) {

                currentDistance = distance(path[0].lat, path[0].lng, path[1].lat, path[1].lng);

                !isInitialized ? initGraph(dataObject) : updateGraph(dataObject);
            }
        });
    }
}


function initGraph(data) {

    isInitialized = true;
    colorScale = d3.interpolateRgb("blue", "red");

    let flatData = [].concat.apply([], data);
    // Scale the range of the data
    x.domain([0, currentDistance]);
    y.domain([
        d3.min(flatData, function(d) { return d.elevation; }),
        d3.max(flatData, function(d) { return d.elevation; })
    ]);

    for (let i = 0; i < data.length; i++) {

        // add the area
        svg.append("path")
            .data([data[i]])
            .attr("class", `area area${i + 1}`)
            .style("fill", `${colorScale((i + 1) / data.length)}`)
            .attr("d", area(data[i]));

        // add the line
        svg.append("path")
            .data([data[i]])
            .attr("class", `line line${i + 1}`)
            .style("stroke", `${colorScale((i + 1) / data.length)}`)
            .attr("d", valueline(data[i]));
    }

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));


    // text label for the x axis
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.top)
        .style("text-anchor", "middle")
        .text("Distance (meters)");

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Elevation (meters)");

    // add the Y gridlines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat("")
        )
}


function updateGraph(data) {


    let flatData = [].concat.apply([], data);
    // Scale the range of the data
    x.domain([0, currentDistance]);
    y.domain([
        d3.min(flatData, function(d) { return d.elevation; }),
        d3.max(flatData, function(d) { return d.elevation; })
    ]);


    let svg = d3.select("#graph-container").transition();
    // Add the valueline path.

    for (var i = 0; i < data.length; i++) {

        // add the area
        svg.select(`.area${i + 1}`)
            .duration(750)
            .attr("d", area(data[i]));

        svg.select(`.line${i + 1}`)
            .duration(750)
            .attr("d", valueline(data[i]));
    }

    // Add the X Axis
    svg.select(".x.axis")
        .duration(750)
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.select(".y.axis")
        .duration(750)
        .call(d3.axisLeft(y));

    svg.select(".grid")
        .duration(750)
        .call(d3.axisLeft(y)
            .tickSize(-width)
            .tickFormat(""));
}