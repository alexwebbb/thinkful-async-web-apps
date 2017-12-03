'use strict';

const App = (() => {


    ///// DATA STATE VARIABLE SECTION

    // variables used specifically 
    // for storing the state of the graph
    const dataObject = [];
    let isInitialized = false,
        rowNum = 5,
        sampleSize = 30,
        currentRotation = 0,
        currentDistance;


    ///// GOOGLE MAPS VARIABLE SECTION

    // variables used to store the map and the state
    // of ajax requests from the google API, aside
    // from the elevation data result itself.
    const iconStrings = ['rot0.png', 'rot90.png', 'rot180.png', 'rot270.png'],
        center = { lat: 43.85, lng: -79.03 };
    let rowLoadCount, rectangle, icons,
        map, elevator, boxMarker;


    ///// GOOGLE MAPS FUNCTION SECTION 
    // -> pure functions used as helpers

    // generic spherical distance function
    // from http://www.geodatasource.com/developers/javascript
    const distance = (lat1, lon1, lat2, lon2, unit = "K") => {
        const radlat1 = Math.PI * lat1 / 180,
            radlat2 = Math.PI * lat2 / 180,
            theta = lon1 - lon2,
            radtheta = Math.PI * theta / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) +
            Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180 / Math.PI
        dist = dist * 60 * 1.1515
        if (unit == "K") { dist = dist * 1.609344 }
        if (unit == "N") { dist = dist * 0.8684 }
        return dist;
    }

    // shorthand function which returns the 
    // current bounds of the google maps rect
    const getRectBounds = () => {
        return {
            north: rectangle.getBounds().getNorthEast().lat(),
            west: rectangle.getBounds().getSouthWest().lng(),
            south: rectangle.getBounds().getSouthWest().lat(),
            east: rectangle.getBounds().getNorthEast().lng()
        };
    }

    // get the center of an arbitrary rect, 
    // using the format from above
    const getCenter = (bounds) => {
        return {
            lat: bounds.north - ((bounds.north - bounds.south) / 2),
            lng: bounds.east - ((bounds.east - bounds.west) / 2)
        };
    }

    // construct path using the nDistance value
    // nDistance stands for negative distance.
    // keep in mind the view is constructed from
    // the back to the front, so we are subtracting
    // from the furthest point until we reach the 
    // closest point, in terms of the D3 plane of view.
    const constructPath = (b, rotation, nDistance) => {

        let path;

        switch (rotation) {
            case 0:
                path = [{
                    lat: b.north + nDistance,
                    lng: b.west
                }, {
                    lat: b.north + nDistance,
                    lng: b.east
                }];
                break;
            case 1:
            case 90:
                path = [{
                    lat: b.north,
                    lng: b.east + nDistance
                }, {
                    lat: b.south,
                    lng: b.east + nDistance
                }];
                break;
            case 2:
            case 180:
                path = [{
                    lat: b.south - nDistance,
                    lng: b.east
                }, {
                    lat: b.south - nDistance,
                    lng: b.west
                }];
                break;
            case 3:
            case 270:
                path = [{
                    lat: b.south,
                    lng: b.west - nDistance
                }, {
                    lat: b.north,
                    lng: b.west - nDistance
                }];
                break;
        }

        return path;
    }

    const setCenterControlCss = (controlUI, controlText) => {

        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '22px';
        controlUI.style.marginLeft = '10px';
        controlUI.style.marginRight = '10px';
        controlUI.style.textAlign = 'center';

        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '16px';
        controlText.style.lineHeight = '38px';
        controlText.style.paddingLeft = '5px';
        controlText.style.paddingRight = '5px';

    }

    const CenterControlLeft = function(controlDiv, map) {

        let controlUI = document.createElement('div');
        let controlText = document.createElement('div');

        // Set CSS for the control border and control interior.
        setCenterControlCss(controlUI, controlText);
        // Set CSS for the .

        controlUI.title = 'Click to rotate the graph view to the left';
        controlDiv.appendChild(controlUI);

        controlText.innerHTML = 'Rotate Left';
        controlUI.appendChild(controlText);

        // Setup the click event listeners: simply set the map to Chicago.
        controlUI.addEventListener('click', function() {
            currentRotation = (currentRotation + 1) % 4;
            boxMarker.setIcon(icons[currentRotation]);
            updateElevation();
        });

    }

    const CenterControlRight = function(controlDiv, map) {

        let controlUI = document.createElement('div');
        let controlText = document.createElement('div');

        // Set CSS for the control border and control interior.
        setCenterControlCss(controlUI, controlText);
        // Set CSS for the .

        controlUI.title = 'Click to rotate the graph view to the right';
        controlDiv.appendChild(controlUI);

        controlText.innerHTML = 'Rotate Right';
        controlUI.appendChild(controlText);

        // Setup the click event listeners: simply set the map to Chicago.
        controlUI.addEventListener('click', function() {
            currentRotation = (currentRotation + 3) % 4;
            boxMarker.setIcon(icons[currentRotation]);
            updateElevation();
        });

    }



    ///// D3 VARIABLE SECTION

    // Set the dimensions of the canvas / graph
    let margin, wMax, width, height, x, y, colorScale, svg;


    ///// D3 FUNCTION AREA 
    // -> pure functions using native D3 classes


    const resetD3 = function() {
        d3.select("svg").remove();


        margin = { top: 30, right: 20, bottom: 50, left: 70 };
        wMax = Math.min($('#graph-container').parent().width(), 800);
        width = wMax - margin.left - margin.right;
        height = 270 - margin.top - margin.bottom;
        // Set the ranges of the graph based on the size of the
        // space we will be displaying in.
        x = d3.scaleLinear().range([0, width]);
        y = d3.scaleLinear().range([height, 0]);


        // Adds the svg canvas on which we will be drawing the graph
        svg = d3.select("#graph-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    }

    // Define the fill area function, which computes the space under a curve
    // by drawing from the x axis to the curve
    const area = d3.area()
        .x((d, i) => { return x(i * (currentDistance / sampleSize)); })
        .y0(height)
        .y1((d) => { return y(d.elevation); });

    // Define the line function which generates our aforementioned curve 
    const valueline = d3.line()
        .x((d, i) => { return x(i * (currentDistance / sampleSize)); })
        .y((d) => { return y(d.elevation); });



    ///// RUNTIME FUNCTIONS
    // -> functions that utilize state

    // this is our entry function, this is actually called
    // externally in the script tag via callback once the google
    // maps API is loaded. It is the only public function
    const initMap = () => {

        // create our map instance
        map = new google.maps.Map(document.getElementById('map'), {
            center: center,
            zoom: 9
        });

        // create an instance of the google elevation API which
        // will handle our AJAX requests for elevation data
        elevator = new google.maps.ElevationService;

        // our initial bounds on page load
        const b = {
            north: 44.025138001587756,
            south: 43.65531331667984,
            east: -78.75061718749998,
            west: -79.29444677734375
        };

        // Create an instance of the draggable rectangle
        rectangle = new google.maps.Rectangle({
            bounds: b,
            editable: true,
            draggable: true,
            strokeColor: 'DarkSlateGray',
            fillColor: 'SpringGreen'
        });

        // place our rectangle on the map we already created
        rectangle.setMap(map);

        // construct sprite style array of  pre-rotated marker 
        // icons to be swapped when rotating the query direction
        icons = iconStrings.reduce((a, c) => {
            a.push({
                url: c,
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20)
            });
            return a;
        }, []);

        // create an instance of our marker icon and place 
        // it in the center of our initial bounding box
        boxMarker = new google.maps.Marker({
            position: getCenter(b),
            map: map,
            icon: icons[0]
        });


        // Add an event listener for the drag end event.
        // for performance reasons, cant use 'bounds changed'
        // which runs every frame.
        rectangle.addListener('dragend', updateElevation);

        // Add an event listener on the rectangle for the icon.
        rectangle.addListener('bounds_changed', setIconPosition);

        // Create the DIV to hold the control and call the CenterControl()
        // constructor passing in this DIV.
        const centerControlLeftDiv = document.createElement('div'),
            centerControlLeft = new CenterControlLeft(centerControlLeftDiv, map),
            centerControlRightDiv = document.createElement('div'),
            centerControlRight = new CenterControlRight(centerControlRightDiv, map);

        centerControlLeftDiv.index = 1;
        centerControlRightDiv.index = 1;


        if ($(window).width() > 1024) {

            map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlLeftDiv);
            map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlRightDiv);
        } else {

            map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(centerControlLeftDiv);
            map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(centerControlRightDiv);
        }


        updateElevation();
    }

    // this function sets the position of the icon each 
    // frame that the position or bounds of the rect change
    const setIconPosition = (event) => {

        const b = getRectBounds(),
            center = getCenter(b);

        boxMarker.setPosition(center);
    }

    // here is where the ajax request for 
    // our elevation data is performed
    const updateElevation = (event) => {

        const b = getRectBounds(),
            // our interval is the discrete distance 
            // between each row of data
            interval = (b.south - b.north) / (rowNum - 1);

        // set our row state variable to zero
        // this basically restarts the ajax request cycle
        // whenever this function is called
        rowLoadCount = 0;

        // construct a path request for each row we want,
        // based on the row num we have selected
        for (let i = 0; i < rowNum; i++) {

            // see function definition for detailed explanation
            const path = constructPath(b, currentRotation, (interval * i));

            // the actual ajax request
            elevator.getElevationAlongPath({
                'path': path,
                'samples': sampleSize
            }, (data, status) => {

                // assign our returned data to the appropriate row
                dataObject[i] = data;

                // increment our counter. the data set is only valid once we have all the rows
                rowLoadCount++;

                // make sure to only call the graph function when the data update is complete
                if (rowLoadCount === rowNum) {

                    // calaculate the distance our graph covers
                    currentDistance = distance(path[0].lat, path[0].lng, path[1].lat, path[1].lng);

                    // call either the update or our graph init
                    !isInitialized ? initGraph(dataObject) : updateGraph(dataObject);
                }
            });
        }
    }


    ///// D3 RUNTIME
    // creates our graph
    const initGraph = (data) => {

        resetD3();

        if (!isInitialized) {
            $(window).resize(initGraph);
            isInitialized = true;
        }


        // this creates an enumerated scale of colors 
        // that interpolates between the two specified
        colorScale = d3.interpolateRgb("blue", "red");

        // flattens our 3d array into a 2d array 
        // so that our domain function can consider it
        const flatData = [].concat.apply([], data);

        // domain function maps the calculated scale of 
        // our graph to match, you guessed it, the domain 
        // of the data. this is utilized to map the values 
        // of our data set to positional values whenever 
        // the x and y functions are called
        x.domain([0, currentDistance]);
        y.domain([
            d3.min(flatData, (d) => { return d.elevation; }),
            d3.max(flatData, (d) => { return d.elevation; })
        ]);

        // create a line and area under line for each row of the data set
        for (let i = 0; i < data.length; i++) {

            // add the area. d3 always draws on top, so draw order matters
            svg.append("path")
                .data([data[i]])
                .attr("class", `area area${i + 1}`)
                .style("fill", `${colorScale((i + 1) / data.length)}`)
                .attr("d", area(data[i]));

            // now we can add the line, which sits on top of the filled area
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
            .attr("class", "axis-label")
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
            .attr("class", "axis-label")
            .text("Elevation (meters)");

        // add the Y gridlines
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-width)
                .tickFormat("")
            )
    }

    // updates the state of the graph
    const updateGraph = (data) => {

        // remember this from the init function?
        const flatData = [].concat.apply([], data);

        // Scale the domain of the data. x and y map to 
        // positional values. see initGraph explanation
        x.domain([0, currentDistance]);
        y.domain([
            d3.min(flatData, (d) => { return d.elevation; }),
            d3.max(flatData, (d) => { return d.elevation; })
        ]);

        // grab our prexisiting graph
        let svg = d3.select("#graph-container").transition();

        // loop through our existing elements and 
        // update them based on the current data state
        for (let i = 0; i < data.length; i++) {

            // update fill area
            svg.select(`.area${i + 1}`)
                .duration(750)
                .attr("d", area(data[i]));

            // update our line
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

        // update our grid lines
        svg.select(".grid")
            .duration(750)
            .call(d3.axisLeft(y)
                .tickSize(-width)
                .tickFormat(""));
    }

    return {
        initMap: initMap
    }

})();

// our entry point
function init() {
    App.initMap();
}