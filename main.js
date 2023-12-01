import allPathCoordinatesMap from './coordinates.js';
const mapSvg = d3.select('#map-container');
const startButton = document.getElementById('startButton');

startButton.addEventListener('click', async () => {
    d3.csv('data/fullpath.csv').then(async data => {
        //const filteredData = data;
        //const filteredData = data.filter(entry => entry['car-type'].includes('1'));
        const carTypeCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const selectedCarTypes = Array.from(carTypeCheckboxes).map(checkbox => checkbox.value);

        console.log(selectedCarTypes)
        console.log(startDate)
        console.log(endDate)

    
        const filteredData = data.filter(entry => 
            selectedCarTypes.includes(entry['car-type']) &&
            entry['Start Timestamp'] >= startDate &&
            entry['End Timestamp'] <= endDate
        );

        const carTypeColorMap = {
            '1': 'cyan',
            '2': 'blue',
            '3': 'yellow',
            '4': 'pink',
            '5': 'orange',
            '6': 'purple',
            '2P': 'green'
        };
    
        // Create an array to store all created circles
        const circles = [];
    
        // Function to create a circle and push it to the array
        const createCircle = (carIdWithMove) => {
            const coords = JSON.parse(carIdWithMove['Combined_Cord']);
            const [startX, startY] = coords[0];
    
            const circle = mapSvg.append('circle')
                .attr('cx', startX)
                .attr('cy', startY)
                .attr('r', 10)
                .style('fill', carTypeColorMap[carIdWithMove['car-type']])
                .attr('id', `car-${carIdWithMove['car-id']}`);
    
            circles.push(circle);
        };
    
        // Create all circles first
        filteredData.forEach(createCircle);
    
        // Move all circles along coordinates simultaneously
        const movePromises = circles.map((circle, i) => moveAlongCoordinates(circle, filteredData[i]));
    
        // Wait for all movements to complete
        await Promise.all(movePromises);
    
        // Optional: Remove circles after they reach the end
        circles.forEach(circle => circle.remove());
    });

});

// Function to move the object to new coordinates
function moveObject(circle, newX, newY) {
    return new Promise(resolve => {
        circle.transition()
            .duration(1) // Adjust the duration as needed
            .attr('cx', newX)
            .attr('cy', newY)
            .on('end', resolve);
    });
}

// Function to move along coordinates
async function moveAlongCoordinates(circle, carIdWithMove) {
    const coordinates = JSON.parse(carIdWithMove['Combined_Cord']);
    for (const [x, y] of coordinates) {
        await moveObject(circle, x, y);
    }
    // Optionally remove the circle after reaching the end
    circle.remove();
}
