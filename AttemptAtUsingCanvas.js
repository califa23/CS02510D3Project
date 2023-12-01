const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const moveObject = async (x, y, radius, color) => {
    //ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    await delay(0.1); // Adjust the delay as needed
};

const moveTenCars = async (carData, startIndex) => {
    const endIndex = Math.min(startIndex + 100, carData.length);

    // Create an array of promises for 10 car movements
    const movePromises = [];
    for (let i = startIndex; i < endIndex; i++) {
        const carIdWithMove = carData[i];
        const coords = JSON.parse(carIdWithMove['Combined_Cord']);
        const [startX, startY] = coords[0];
        movePromises.push(moveObject(startX, startY, 10, carIdWithMove.color));

        // Move the car along its path
        for (let j = 1; j < coords.length; j++) {
            const [x, y] = coords[j];
            movePromises.push(moveObject(x, y, 10, carIdWithMove.color));
        }
    }

    // Wait for all 10 car movements to complete
    await Promise.all(movePromises);
};

const moveAllCars = async (carData) => {
    ctx.globalAlpha = 0.2;

    // Move cars in batches of 10
    for (let i = 0; i < carData.length; i += 10) {
        await moveTenCars(carData, i);
    }
};

const loadData = async () => {
    const data = await d3.csv('test2.csv');
    const carTypeColorMap = {
        '1': 'cyan',
        '2': 'blue',
        '3': 'yellow',
        '4': 'pink',
        '5': 'orange',
        '6': 'purple',
        '2P': 'green'
    };

    const filteredData = data;

    // Assign colors to each car ID
    const carData = filteredData.map((carIdWithMove) => ({
        ...carIdWithMove,
        color: carTypeColorMap[carIdWithMove['car-type']]
    }));

    await moveAllCars(carData);
};

loadData();
