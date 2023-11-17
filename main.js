import allPathCoordinatesMap from './coordinates.js';

const svg = d3.select('#map-container');
const clockSvg = d3.select('#clock-container');
const added = new Set();

const speedMultiplier = 150;
let globalClock = new Date("July 1, 2015 01:58:10"); // Initialize global clock as a Date object

const carMovements = [];
const carTypeColorMap = {
    '1': 'cyan',
    '2': 'blue',
    '3': 'yellow',
    '4': 'pink',
    '5': 'orange',
    '6': 'purple',
    '2P': 'green'
};
// Function to check if it's time to start moving a car
function isTimeToMoveCar(timestamp) {
    return globalClock.getTime() >= timestamp;
}

// Function to update the global clock
function updateGlobalClock() {
    globalClock.setSeconds(globalClock.getSeconds() + 1);
    updateClockText();
    if(carMovements.length != 0){   
        const movement = carMovements[0];
        if(isTimeToMoveCar(movement.startTime)){
            if(!added.has(movement.carId)){
                svg.append('circle')
                .attr('cx', movement.coords[0][0])
                .attr('cy', movement.coords[0][1])
                .attr('r', 10)
                .style('fill', carTypeColorMap[movement.carType])
                .attr('id', `car-${movement.carId}`);
                added.add(movement.carId);
            }
            moveAlongCoordinates(`#car-${movement.carId}`, movement.coords, movement.endTime - movement.startTime);
            carMovements.shift();
        }
    }
}

// Function to update the clock text with date and time
function updateClockText() {
    const formattedTime = d3.timeFormat('%Y-%m-%d %H:%M:%S')(globalClock);
    clockSvg.select('text').remove();
    clockSvg.append('text')
        .attr('x', 20)
        .attr('y', 50)
        .text(formattedTime)
        .attr('fill', 'black')
        .style('font-size', '40px');
}

// Periodically update the global clock every second
setInterval(updateGlobalClock, 1000/speedMultiplier);


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function buildCarMovements(sortedData) {

    // Create a dictionary to store gates for each car-id
    const gatesByCarId = {};

    // Populate the dictionary
    sortedData.forEach(val => {
        const carId = val['car-id'];
        const gate = val['gate-name'].replace(/-/g, '~');
        const time = new Date(val['Timestamp']).getTime();

        if (!gatesByCarId[carId]) {
            gatesByCarId[carId] = [];
        }
        gatesByCarId[carId].push([gate, time]);
    });

    for (let i = 0; i < sortedData.length - 1; i++) {
        const val = sortedData[i];
        const carId = val['car-id'];
        const gateAndTime = gatesByCarId[carId].shift();
        const nextGateAndTime = gatesByCarId[carId][0];
        const carType = val['car-type'];

        if(nextGateAndTime != undefined){
            const gate = gateAndTime[0];
            const time = gateAndTime[1];
            const nextGate = nextGateAndTime[0];
            const endTime = nextGateAndTime[1];

            if(gate != nextGate){
                const coords = allPathCoordinatesMap[gate + "-" + nextGate];
                
                if (coords == undefined) {
                    console.log('MISSING: ' + gate + '-' + nextGate);
                }

                if(nextGate.includes('entrance')){
                    coords.push([-100, -100]);
                }

                carMovements.push({
                    carId: carId,
                    coords: coords,
                    startTime: time,
                    endTime: endTime,
                    carType : carType,
                });
            }
        }
    }
}

// Function to move the object to new coordinates
function moveObject(selector, newX, newY) {
    if (newX == -100 && newY == -100) {
        d3.select(selector).style('opacity', 0);
    }
    d3.select(selector)
        .transition()
        .duration(1) // Duration of the transition in milliseconds
        .attr('cx', newX)
        .attr('cy', newY);
}

// Function to move along coordinates with delay
async function moveAlongCoordinates(selector, coordinates, timeToTravel) {
    const distance = coordinates.length;
    const t = timeToTravel;
    const del = t / distance;
    for (const coordinate of coordinates) {
        moveObject(selector, coordinate[0], coordinate[1]);
        await delay(del/speedMultiplier); // Wait before the next move
    }
}

// read data from csv
d3.csv('data/7-1-2015.csv').then(async data => {
    const filteredData = data;

    const sortedData = filteredData.sort((a, b) => new Date(a['Timestamp']).getTime() - new Date(b['Timestamp']).getTime());
    await buildCarMovements(sortedData);
});