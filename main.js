import allPathCoordinatesMap from './coordinates.js';
const mapSvg = d3.select('#map-container');
const clockSvg = d3.select('#clock-container');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateClockText(timestamp) {
    // Remove the previous text
    clockSvg.select('text').remove();

    // Append a new text element
    clockSvg.append('text')
        .attr('x', 20)
        .attr('y', 100)
        .text( d3.timeFormat('%Y-%m-%d %H:%M:%S')(new Date(timestamp)))
        .attr('fill', 'black')
        .style('font-size', '100px');
}

d3.csv('data/7-1-2015.csv').then(async data => {
    data = data.sort((a, b) => new Date(a['Timestamp']).getTime() - new Date(b['Timestamp']).getTime());
    //const filteredData = data;
    const filteredData = data.filter(entry => entry['car-type'].includes('2P'));
    //const filteredData = data.filter(entry => entry['car-id'].includes('20150201040237-719'));
    //const filteredData = data.filter(entry => entry['car-id'].includes('20155801035840-804'));

    const uniqueCarIds = [...new Set(filteredData.map(d => d['car-id']))];
    const carTypeColorMap = {
        '1': 'cyan',
        '2': 'blue',
        '3': 'yellow',
        '4': 'pink',
        '5': 'orange',
        '6': 'purple',
        '2P': 'green'
    };

    // Create a circle for each unique car-id and append it to the SVG
    uniqueCarIds.forEach(carId => {
        const carData = filteredData.find(d => d['car-id'] === carId);

        mapSvg.append('circle')
            .attr('cx', -100) 
            .attr('cy', -100) 
            .attr('r', 10) 
            .style('fill', carTypeColorMap[carData['car-type']])
            .attr('id', `car-${carId}`); // Set a unique id for each circle
    });

    const nestedData = d3.nest()
        .key(d => d['car-id'])
        .entries(filteredData);

        console.log(nestedData);

    const carMovements = nestedData.map(async carData => {
        let endTime;
        let nextGate;
        

        for (let i = 0; i < carData.values.length; i++) {
            const val = carData.values[i];
            const timestamp = new Date(val['Timestamp']).getTime();
            const gate = val['gate-name'].replace(/-/g, '~');
            nextGate = i < carData.values.length - 1 ? carData.values[i + 1]['gate-name'].replace(/-/g, '~'): '';
            endTime = i < carData.values.length - 1 ? new Date(carData.values[i + 1]['Timestamp']).getTime() : timestamp;

            updateClockText(timestamp);

            if (nextGate !== '' && gate != nextGate) {
                //console.log(gate +'-'+ nextGate);
                const coords = allPathCoordinatesMap[gate + "-" + nextGate]
                if(coords == undefined)
                    console.log('MISSING: ' + gate +'-'+ nextGate);
                if(nextGate.includes('entrance')){
                    coords.push([-100,-100]);
                }
                await moveAlongCoordinates(`#car-${carData.key}`, coords, endTime-timestamp);
            }
        }
    });

    // Wait for all cars to finish their movements before continuing
    await Promise.all(carMovements);
});

// Function to move the object to new coordinates
function moveObject(selector, newX, newY) {
    if(newX == -100 && newY == -100){ // hide circle when it hits an entrance (leaving)
        d3.select(selector).style("opacity", 0);
    }
    d3.select(selector)
        .transition()
        .duration(300) // Duration of the transition in milliseconds
        .attr("cx", newX)
        .attr("cy", newY);
    

}

async function moveAlongCoordinates(selector, coordinates, timeToTravel) {
    const distance = coordinates.length
    const t = timeToTravel/60000;
    const del = t/distance * 1000;
    for (const coordinate of coordinates) {
        moveObject(selector, coordinate[0], coordinate[1]);
        await delay(del); // Wait before the next move
    }
}