const canvas = document.querySelector('canvas');
canvas.width = innerWidth;
canvas.height = innerHeight;
const context = canvas.getContext('2d');

context.translate(canvas.width/2, canvas.height/2);

var zoom = 32;

addEventListener('mousewheel', function(e) {
    if (e.deltaY > 0) {
        zoom += 2;
    } else {
        zoom -= 2;
    }
});

const data = {
    "isekai-quartet": [
        "Konosuba",
        "Re:Zero",
        "Overlord",
        "The Saga of Tanya The Evil",
        "Cautious Hero",
        "The Rising of The Shield Hero"
    ],
    "Re:Zero": [
        "Konosuba",
        "Tantei Wa Mou Shinderu",
    ],
    "Tantei Wa Mou Shinderu": [
        "Hololive"
    ],
};

async function loadData(name) {
    let response = await fetch(`data/${name}.json`);

    // Return empty array if the file doesn't exist
    if (response.status == 404) {
        return null;
    } else {
        return await response.json();
    }

    //console.log(json);
}

async function createNode(name, x=0, y=0, minDirection=0, maxDirection=Math.PI*2, depth=0, parent, hue=0) {
    let nodeData = await loadData(name);

    let children = nodeData? nodeData.connected : [];

    let node = {
        name: nodeData? nodeData.display : name,
        x: x,
        y: y,
        depth: depth,
        hue: depth*45,
        connected: [],
        parents: parent? [parent]:[]
    };

    nodes.push(node);

    let seperation = Math.PI*2/children.length;
    let realDepth = (depth*0)+4;

    let units = children.length;

    for (i in children) {
        // Check if there is already a node with this name
        let node2 = nodes.find(node => node.name == children[i]);

        // If there is, connect to it

        if (node2) {
            node.connected.push(node2);
            node2.parents.push(node);
        } else {
            // If not, create a new node

            let direction = minDirection + Math.random()*(maxDirection-minDirection);

            let x = node.x + Math.cos(direction)*realDepth;
            let y = node.y + Math.sin(direction)*realDepth;

            node.connected[i] = await createNode(children[i], x, y, direction+seperation/2, direction-seperation/2, depth+1, parent=node, hue=node.hue+45);
        }
    }

    return node;
}

function drawNode(node) {
    context.strokeStyle = `hsl(${node.hue}, 100%, 50%)`;
    context.fillStyle = `hsl(${node.hue}, 100%, 70%)`;

    for (node2 of node.connected) {

        context.beginPath();
        context.moveTo(node.x*zoom, node.y*zoom);
        context.lineTo(node2.x*zoom, node2.y*zoom);
        context.stroke();

    }

    context.beginPath();
    context.arc(node.x*zoom, node.y*zoom, zoom, 0, Math.PI*2);
    context.fill();
    context.stroke();

    context.font = `${zoom/2}px Arial`;
    context.fillStyle = `hsl(${node.hue}, 100%, 30%)`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(node.name, node.x*zoom, node.y*zoom);

    for (node2 of node.connected) {
        drawNode(node2);
    }
}

function updateNode(node) {
    // Move towards parent node at a speed porportional to distance from parent

    for (parent of [...node.parents, ...node.connected]) {
        let dx = node.x - parent.x;
        let dy = node.y - parent.y;
        let distance = Math.sqrt(dx*dx+dy*dy);

        let speed = distance/100;

        node.x -= dx/distance*speed;
        node.y -= dy/distance*speed;
    }

    // Repel from other nodes at a speed proportional to distance from other nodes

    for (node2 of nodes) {
        if (node2 != node) {
            let dx = node.x - node2.x;
            let dy = node.y - node2.y;
            let distance = Math.sqrt(dx*dx+dy*dy);

            let speed = 1/Math.pow(distance, 3);

            node.x += dx/distance*speed;
            node.y += dy/distance*speed;
        }
    }

    for (node2 of node.connected) {
        updateNode(node2);
    }
}

function updateDisplay() {
    context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
    context.lineWidth = zoom/10;

    for (node of nodes) {
        //updateNode(node);
        //drawNode(node);
    }

    updateNode(nodes[0]);
    drawNode(nodes[0]);

    nodes[0].x = 0;
    nodes[0].y = 0;
}

const nodes = [];

createNode("kaguya-sama", 0, 0);

setInterval(()=>{
    updateDisplay();
}, 20);