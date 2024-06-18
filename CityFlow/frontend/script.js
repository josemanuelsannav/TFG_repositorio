
/**
 * Draw Road Network
 */
id = Math.random().toString(36).substring(2, 15);

BACKGROUND_COLOR = 0xe8ebed;
LANE_COLOR = 0x586970;
LANE_BORDER_WIDTH = 1;
LANE_BORDER_COLOR = 0x82a8ba;
LANE_INNER_COLOR = 0xbed8e8;
LANE_DASH = 10;
LANE_GAP = 12;
TRAFFIC_LIGHT_WIDTH = 3;
MAX_TRAFFIC_LIGHT_NUM = 100000;
ROTATE = 90;

CAR_LENGTH = 5;
CAR_WIDTH = 2;
CAR_COLOR = 0xe8bed4;

CAR_COLORS = [0xf2bfd7, // pink
    0xb7ebe4,   // cyan
    0xdbebb7,   // blue
    0xf5ddb5,
    0xd4b5f5];
CAR_COLORS_NUM = CAR_COLORS.length;

NUM_CAR_POOL = 150000;

LIGHT_RED = 0xdb635e;
LIGHT_GREEN = 0x85ee00;

TURN_SIGNAL_COLOR = 0xFFFFFF;
TURN_SIGNAL_WIDTH = 1;
TURN_SIGNAL_LENGTH = 5;

var simulation, roadnet, steps;
var nodes = {};
var edges = {};
var lista_cebras = [];
var lista_stops = [];
var lista_notSignals = [];
var lista_cedas = [];
var logs;
var gettingLog = false;

let Application = PIXI.Application,
    Sprite = PIXI.Sprite,
    Graphics = PIXI.Graphics,
    Container = PIXI.Container,
    ParticleContainer = PIXI.particles.ParticleContainer,
    Texture = PIXI.Texture,
    Rectangle = PIXI.Rectangle
    ;

var controls = new function () {
    this.replaySpeedMax = 1;
    this.replaySpeedMin = 0.01;
    this.replaySpeed = 0.5;
    this.paused = false;
};

var trafficLightsG = {};

var app, viewport, renderer, simulatorContainer, carContainer, trafficLightContainer;
var turnSignalContainer;
var carPool;

var cnt = 0;
var frameElapsed = 0;
var totalStep;

var nodeCarNum = document.getElementById("car-num");
var nodeProgressPercentage = document.getElementById("progress-percentage");
var nodeTotalStep = document.getElementById("total-step-num");
var nodeCurrentStep = document.getElementById("current-step-num");
var nodeSelectedEntity = document.getElementById("selected-entity");

var SPEED = 3, SCALE_SPEED = 1.01;
var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
var MINUS = 189, EQUAL = 187, P = 80;
var LEFT_BRACKET = 219, RIGHT_BRACKET = 221;
var ONE = 49, TWO = 50;
var SPACE = 32;

var keyDown = new Set();

var turnSignalTextures = [];

let pauseButton = document.getElementById("pause");
let nodeCanvas = document.getElementById("simulator-canvas");
let replayControlDom = document.getElementById("replay-control");
let replaySpeedDom = document.getElementById("replay-speed");

let loading = false;
let infoDOM = document.getElementById("info");
let selectedDOM = document.getElementById("selected-entity");

function infoAppend(msg) {
    infoDOM.innerText += "- " + msg + "\n";
}

function infoReset() {
    infoDOM.innerText = "";
}

/**
 * Upload files
 */
let ready = false;

let roadnetData = [];
let replayData = [];
let chartData = [];

function handleChooseFile(v, label_dom) {
    return function (evt) {
        let file = evt.target.files[0];
        label_dom.innerText = file.name;
    }
}

function uploadFile(v, file, callback) {
    let reader = new FileReader();
    reader.onloadstart = function () {
        infoAppend("Loading " + file.name);
    };
    reader.onerror = function () {
        infoAppend("Loading " + file.name + "failed");
    }
    reader.onload = function (e) {
        infoAppend(file.name + " loaded");
        v[0] = e.target.result;
        callback();
    };
    try {
        reader.readAsText(file);
    } catch (e) {
        infoAppend("Loading failed");
        console.error(e.message);
    }
}

let debugMode = false;
let chartLog;
let showChart = false;
let chartConainterDOM = document.getElementById("chart-container");
function start() {
    if (loading) return;
    loading = true;
    infoReset();
    uploadFile(roadnetData, RoadnetFileDom.files[0], function () {
        uploadFile(replayData, ReplayFileDom.files[0], function () {
            let after_update = function () {
                infoAppend("drawing roadnet");
                ready = false;
                document.getElementById("guide").classList.add("d-none");
                hideCanvas();
                try {
                    simulation = JSON.parse(roadnetData[0]);
                } catch (e) {
                    infoAppend("Parsing roadnet file failed");
                    loading = false;
                    return;
                }
                try {
                    logs = replayData[0].split('\n');
                    logs.pop();
                } catch (e) {
                    infoAppend("Reading replay file failed");
                    loading = false;
                    return;
                }

                totalStep = logs.length;
                if (showChart) {
                    chartConainterDOM.classList.remove("d-none");
                    let chart_lines = chartData[0].split('\n');
                    if (chart_lines.length == 0) {
                        infoAppend("Chart file is empty");
                        showChart = false;
                    }
                    chartLog = [];
                    for (let i = 0; i < totalStep; ++i) {
                        step_data = chart_lines[i + 1].split(/[ \t]+/);
                        chartLog.push([]);
                        for (let j = 0; j < step_data.length; ++j) {
                            chartLog[i].push(parseFloat(step_data[j]));
                        }
                    }
                    chart.init(chart_lines[0], chartLog[0].length, totalStep);
                } else {
                    chartConainterDOM.classList.add("d-none");
                }

                controls.paused = false;
                cnt = 0;
                debugMode = document.getElementById("debug-mode").checked;
                setTimeout(function () {
                    try {
                        drawRoadnet();
                    } catch (e) {
                        infoAppend("Drawing roadnet failed");
                        console.error(e.message);
                        loading = false;
                        return;
                    }
                    ready = true;
                    loading = false;
                    infoAppend("Start replaying");
                }, 200);
            };


            if (ChartFileDom.value) {
                showChart = true;
                uploadFile(chartData, ChartFileDom.files[0], after_update);
            } else {
                showChart = false;
                after_update();
            }

        }); // replay callback
    }); // roadnet callback
}

let RoadnetFileDom = document.getElementById("roadnet-file");
let ReplayFileDom = document.getElementById("replay-file");
let ChartFileDom = document.getElementById("chart-file");

RoadnetFileDom.addEventListener("change",
    handleChooseFile(roadnetData, document.getElementById("roadnet-label")), false);
ReplayFileDom.addEventListener("change",
    handleChooseFile(replayData, document.getElementById("replay-label")), false);
ChartFileDom.addEventListener("change",
    handleChooseFile(chartData, document.getElementById("chart-label")), false);

document.getElementById("start-btn").addEventListener("click", start);

document.getElementById("slow-btn").addEventListener("click", function () {
    updateReplaySpeed(controls.replaySpeed - 0.1);
})

document.getElementById("fast-btn").addEventListener("click", function () {
    updateReplaySpeed(controls.replaySpeed + 0.1);
})

function updateReplaySpeed(speed) {
    speed = Math.min(speed, 1);
    speed = Math.max(speed, 0);
    controls.replaySpeed = speed;
    replayControlDom.value = speed * 100;
    replaySpeedDom.innerHTML = speed.toFixed(2);
}

updateReplaySpeed(0.5);

replayControlDom.addEventListener('change', function (e) {
    updateReplaySpeed(replayControlDom.value / 100);
});

document.addEventListener('keydown', function (e) {
    if (e.keyCode == P) {
        controls.paused = !controls.paused;
    } else if (e.keyCode == ONE) {
        updateReplaySpeed(Math.max(controls.replaySpeed / 1.5, controls.replaySpeedMin));
    } else if (e.keyCode == TWO) {
        updateReplaySpeed(Math.min(controls.replaySpeed * 1.5, controls.replaySpeedMax));
    } else if (e.keyCode == LEFT_BRACKET) {
        cnt = (cnt - 1) % totalStep;
        cnt = (cnt + totalStep) % totalStep;
        drawStep(cnt);
    } else if (e.keyCode == RIGHT_BRACKET) {
        cnt = (cnt + 1) % totalStep;
        drawStep(cnt);
    } else {
        keyDown.add(e.keyCode)
    }
});

document.addEventListener('keyup', (e) => keyDown.delete(e.keyCode));

nodeCanvas.addEventListener('dblclick', function (e) {
    controls.paused = !controls.paused;
});

pauseButton.addEventListener('click', function (e) {
    controls.paused = !controls.paused;
});

function initCanvas() {
    app = new Application({
        width: nodeCanvas.offsetWidth,
        height: nodeCanvas.offsetHeight,
        transparent: false,
        backgroundColor: BACKGROUND_COLOR
    });

    nodeCanvas.appendChild(app.view);
    app.view.classList.add("d-none");

    renderer = app.renderer;
    renderer.interactive = true;
    renderer.autoResize = true;

    renderer.resize(nodeCanvas.offsetWidth, nodeCanvas.offsetHeight);
    app.ticker.add(run);
}

function showCanvas() {
    document.getElementById("spinner").classList.add("d-none");
    app.view.classList.remove("d-none");
}

function hideCanvas() {
    document.getElementById("spinner").classList.remove("d-none");
    app.view.classList.add("d-none");
}

function drawRoadnet() {
    if (simulatorContainer) {
        simulatorContainer.destroy(true);
    }
    app.stage.removeChildren();
    viewport = new Viewport.Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        interaction: app.renderer.plugins.interaction
    });
    viewport
        .drag()
        .pinch()
        .wheel()
        .decelerate();
    app.stage.addChild(viewport);
    simulatorContainer = new Container();
    viewport.addChild(simulatorContainer);

    roadnet = simulation.static;
    nodes = [];
    edges = [];
    ///////////////// */////////////////////////////////////////////////////////////////////////////////
    cebras = [];
    stops = [];
    notSignals = [];
    cedas = [];
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    trafficLightsG = {};

    for (let i = 0, len = roadnet.nodes.length; i < len; ++i) { //Aqui se cargan las intersecciones
        node = roadnet.nodes[i];
        node.point = new Point(transCoord(node.point));

        nodes[node.id] = node;
    }

    for (let i = 0, len = roadnet.edges.length; i < len; ++i) {
        edge = roadnet.edges[i];
        edge.from = nodes[edge.from];
        edge.to = nodes[edge.to];
        for (let j = 0, len = edge.points.length; j < len; ++j) {
            edge.points[j] = new Point(transCoord(edge.points[j]));
        }
        edges[edge.id] = edge;
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    for (let i = 0, len = roadnet.cebras.length; i < len; ++i) {
        cebra = roadnet.cebras[i];
        cebra.cont = 24;
        cebras[cebra.id] = cebra;
        cebras[cebra.id].pos_y = cebras[cebra.id].pos_y * -1;
    }
    lista_cebras = cebras;

    for (let i = 0, len = roadnet.stops.length; i < len; ++i) {
        stop = roadnet.stops[i];
        stops[stop.id] = stop;
        stops[stop.id].pos_y = stops[stop.id].pos_y * -1;

    }
    lista_stops = stops;

    for (let i = 0, len = roadnet.notSignals.length; i < len; ++i) {
        notSignal = roadnet.notSignals[i];
        notSignals[notSignal.id] = notSignal;
        notSignals[notSignal.id].pos_y = notSignals[notSignal.id].pos_y * -1;
    }
    lista_notSignals = notSignals;

    for (let i = 0, len = roadnet.cedas.length; i < len; ++i) {
        ceda = roadnet.cedas[i];
        cedas[ceda.id] = ceda;
        cedas[ceda.id].pos_y = cedas[ceda.id].pos_y * -1;
    }
    lista_cedas = cedas;
    ////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Draw Map
     */
    trafficLightContainer = new ParticleContainer(MAX_TRAFFIC_LIGHT_NUM, { tint: true });
    let mapContainer, mapGraphics;
    if (debugMode) {
        mapContainer = new Container();
        simulatorContainer.addChild(mapContainer);
    } else {
        mapGraphics = new Graphics();
        simulatorContainer.addChild(mapGraphics);
    }

    for (nodeId in nodes) {
        if (!nodes[nodeId].virtual) {

            let nodeGraphics;
            if (debugMode) {
                nodeGraphics = new Graphics();
                mapContainer.addChild(nodeGraphics);
            } else {
                nodeGraphics = mapGraphics;
            }
            drawNode(nodes[nodeId], nodeGraphics);
        }
    }

    for (edgeId in edges) {
        let edgeGraphics;
        if (debugMode) {
            edgeGraphics = new Graphics();
            mapContainer.addChild(edgeGraphics);
        } else {
            edgeGraphics = mapGraphics;
        }
        drawEdge(edges[edgeId], edgeGraphics);
    }
    /************************************************************************************************
     * Draw Cebra
     *////////////////////////////////////////////////////////////////////////////////////////////////

    for (cebraId in cebras) {
        if (debugMode) {
            cebraGraphics = new Graphics();
            mapContainer.addChild(cebraGraphics);
        } else {
            cebraGraphics = mapGraphics;
        }

        drawCebra(cebras[cebraId], cebraGraphics, edges);
    }
    /****************************************************************************************************
     * Draw Stop
     *///////////////////////////////////////////////////////////////////////////////////////////////////
    /* for (stopId in stops) {
         let stopGraphics;
         if (debugMode) {
 
             stopGraphics = new Graphics();
             mapContainer.addChild(stopGraphics);
         } else {
             stopGraphics = mapGraphics;
         }
 
         drawStop(stops[stopId], stopGraphics);
     }*/

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    /****************************************************************************************************
     * Draw CEDA
     *///////////////////////////////////////////////////////////////////////////////////////////////////
    /*for (cedaId in cedas) {
        let cedaGraphics;
        if (debugMode) {

            cedaGraphics = new Graphics();
            mapContainer.addChild(cedaGraphics);
        } else {
            cedaGraphics = mapGraphics;
        }

        drawCeda(cedas[cedaId], cedaGraphics);
    }*/

    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    /****************************************************************************************************
     * Draw CEDA y STOP con PNG
     *///////////////////////////////////////////////////////////////////////////////////////////////////
    PIXI.loader
        .add('stopImage', 'sprites/stopImage.png')
        .add('cedaImage', 'sprites/cedaImage.png');

    PIXI.loader.load((loader, resources) => {
        for (let cedaId in cedas) {
            let cedaSprite;
            if (debugMode) {
                cedaSprite = new PIXI.Sprite(resources.cedaImage.texture);
                mapContainer.addChild(cedaSprite);
            } else {
                cedaSprite = new PIXI.Sprite(resources.cedaImage.texture);
                mapGraphics.addChild(cedaSprite);
            }

            // Asegúrate de que la posición del sprite es correcta
            cedaSprite.x = cedas[cedaId].pos_x - 3;
            cedaSprite.y = cedas[cedaId].pos_y - 3;
            cedaSprite.width = 6;  // Cambia esto al ancho deseado
            cedaSprite.height = 6; // Cambia esto a la altura deseada

        }
        for (let stopId in stops) {
            let stopSprite;
            if (debugMode) {
                stopSprite = new PIXI.Sprite(resources.stopImage.texture);
                mapContainer.addChild(stopSprite);
            } else {
                stopSprite = new PIXI.Sprite(resources.stopImage.texture);
                mapGraphics.addChild(stopSprite);
            }

            // Asegúrate de que la posición del sprite es correcta
            stopSprite.x = stops[stopId].pos_x - 3;
            stopSprite.y = stops[stopId].pos_y - 3;
            stopSprite.width = 6;  // Cambia esto al ancho deseado
            stopSprite.height = 6; // Cambia esto a la altura deseada
        }
    });
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    /****************************************************************************************************
     * Draw NOT Stop
     *///////////////////////////////////////////////////////////////////////////////////////////////////
    for (notSignalId in notSignals) {
        let notSignalGraphics;
        if (debugMode) {

            notSignalGraphics = new Graphics();
            mapContainer.addChild(notSignalGraphics);
        } else {
            notSignalGraphics = mapGraphics;
        }

        //drawnotSignal(notSignals[notSignalId], notSignalGraphics);
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////

    let bounds = simulatorContainer.getBounds();
    simulatorContainer.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    simulatorContainer.position.set(renderer.width / 2, renderer.height / 2);
    simulatorContainer.addChild(trafficLightContainer);


    /**
     * Settings for Cars
     */
    TURN_SIGNAL_LENGTH = CAR_LENGTH;
    TURN_SIGNAL_WIDTH = CAR_WIDTH / 2;

    var carG = new Graphics();
    carG.lineStyle(0);
    carG.beginFill(0xFFFFFF, 0.8);
    carG.drawRect(0, 0, CAR_LENGTH, CAR_WIDTH);

    let carTexture = renderer.generateTexture(carG);

    let signalG = new Graphics();
    signalG.beginFill(TURN_SIGNAL_COLOR, 0.7).drawRect(0, 0, TURN_SIGNAL_LENGTH, TURN_SIGNAL_WIDTH)
        .drawRect(0, 3 * CAR_WIDTH - TURN_SIGNAL_WIDTH, TURN_SIGNAL_LENGTH, TURN_SIGNAL_WIDTH).endFill();
    let turnSignalTexture = renderer.generateTexture(signalG);

    let signalLeft = new Texture(turnSignalTexture, new Rectangle(0, 0, TURN_SIGNAL_LENGTH, CAR_WIDTH));
    let signalStraight = new Texture(turnSignalTexture, new Rectangle(0, CAR_WIDTH, TURN_SIGNAL_LENGTH, CAR_WIDTH));
    let signalRight = new Texture(turnSignalTexture, new Rectangle(0, CAR_WIDTH * 2, TURN_SIGNAL_LENGTH, CAR_WIDTH));
    turnSignalTextures = [signalLeft, signalStraight, signalRight];


    carPool = [];
    if (debugMode)
        carContainer = new Container();
    else
        carContainer = new ParticleContainer(NUM_CAR_POOL, { rotation: true, tint: true });


    turnSignalContainer = new ParticleContainer(NUM_CAR_POOL, { rotation: true, tint: true });
    simulatorContainer.addChild(carContainer);
    simulatorContainer.addChild(turnSignalContainer);
    for (let i = 0, len = NUM_CAR_POOL; i < len; ++i) {
        //var car = Sprite.fromImage("images/car.png")
        let car = new Sprite(carTexture);
        let signal = new Sprite(turnSignalTextures[1]);
        car.anchor.set(1, 0.5);

        if (debugMode) {
            car.interactive = true;
            car.on('mouseover', function () {
                selectedDOM.innerText = car.name;
                car.alpha = 0.8;
            });
            car.on('mouseout', function () {
                // selectedDOM.innerText = "";
                car.alpha = 1;
            });
        }
        signal.anchor.set(1, 0.5);
        carPool.push([car, signal]);
    }
    showCanvas();

    return true;
}

function appendText(id, text) {
    let p = document.createElement("span");
    p.innerText = text;
    document.getElementById("info").appendChild(p);
    document.getElementById("info").appendChild(document.createElement("br"));
}

var statsFile = "";
var withRange = false;
var nodeStats, nodeRange;

initCanvas();

//le cambia el signo a la coord Y .
function transCoord(point) {
    return [point[0], -point[1]];
}

PIXI.Graphics.prototype.drawLine = function (pointA, pointB) {
    this.moveTo(pointA.x, pointA.y);
    this.lineTo(pointB.x, pointB.y);
}

PIXI.Graphics.prototype.drawDashLine = function (pointA, pointB, dash = 16, gap = 8) {
    let direct = pointA.directTo(pointB);
    let distance = pointA.distanceTo(pointB);

    let currentPoint = pointA;
    let currentDistance = 0;
    let length;
    let finish = false;
    while (true) {
        this.moveTo(currentPoint.x, currentPoint.y);
        if (currentDistance + dash >= distance) {
            length = distance - currentDistance;
            finish = true;
        } else {
            length = dash
        }
        currentPoint = currentPoint.moveAlong(direct, length);
        this.lineTo(currentPoint.x, currentPoint.y);
        if (finish) break;
        currentDistance += length;

        if (currentDistance + gap >= distance) {
            break;
        } else {
            currentPoint = currentPoint.moveAlong(direct, gap);
            currentDistance += gap;
        }
    }
};

function drawNode(node, graphics) {
    graphics.beginFill(LANE_COLOR);
    let outline = node.outline;
    for (let i = 0; i < outline.length; i += 2) {
        outline[i + 1] = -outline[i + 1];
        if (i == 0)
            graphics.moveTo(outline[i], outline[i + 1]);
        else
            graphics.lineTo(outline[i], outline[i + 1]);
    }
    graphics.endFill();


    if (debugMode) {
        graphics.hitArea = new PIXI.Polygon(outline);
        graphics.interactive = true;
        graphics.on("mouseover", function () {
            selectedDOM.innerText = node.id;
            graphics.alpha = 0.5;
        });
        graphics.on("mouseout", function () {
            graphics.alpha = 1;
        });
    }


}

function drawEdge(edge, graphics) {


    let from = edge.from; //intersection
    let to = edge.to;   //intersection
    let points = edge.points; //de donde a donde . Las pos de las intersecciones

    let pointA, pointAOffset, pointB, pointBOffset;
    let prevPointBOffset = null;

    let roadWidth = 0;
    edge.laneWidths.forEach(function (l) {
        roadWidth += l;
    }, 0);

    let coords = [], coords1 = [];

    for (let i = 1; i < points.length; ++i) {
        if (i == 1) {
            pointA = points[0].moveAlongDirectTo(points[1], from.virtual ? 0 : from.width);
            pointAOffset = points[0].directTo(points[1]).rotate(ROTATE);
        } else {
            pointA = points[i - 1];
            pointAOffset = prevPointBOffset;
        }
        if (i == points.length - 1) {
            pointB = points[i].moveAlongDirectTo(points[i - 1], to.virtual ? 0 : to.width);
            pointBOffset = points[i - 1].directTo(points[i]).rotate(ROTATE);
        } else {
            pointB = points[i];
            pointBOffset = points[i - 1].directTo(points[i + 1]).rotate(ROTATE);
        }
        prevPointBOffset = pointBOffset;

        lightG = new Graphics();
        lightG.lineStyle(TRAFFIC_LIGHT_WIDTH, 0xFFFFFF);
        lightG.drawLine(new Point(0, 0), new Point(1, 0));
        lightTexture = renderer.generateTexture(lightG);

        let encontrado = false;
        for (stopId in stops) {
            if (edge.id == stops[stopId].road) {
                encontrado = true;
            }
        }
        for (notSignalId in notSignals) {
            if (edge.id == notSignals[notSignalId].road) {
                encontrado = true;
            }
        }
        for (cedaId in cedas) {
            if (edge.id == cedas[cedaId].road) {
                encontrado = true;
            }
        }
        if (!encontrado) {
            // Draw Traffic Lights
            if (i == points.length - 1 && !to.virtual) { // Draw traffic lights at the end of the road
                edgeTrafficLights = [];
                prevOffset = offset = 0;
                for (lane = 0; lane < edge.nLane; ++lane) {
                    offset += edge.laneWidths[lane];
                    var light = new Sprite(lightTexture);
                    light.anchor.set(0, 0.5);
                    light.scale.set(offset - prevOffset, 1);
                    point_ = pointB.moveAlong(pointBOffset, prevOffset);
                    light.position.set(point_.x, point_.y);
                    light.rotation = pointBOffset.getAngleInRadians();
                    edgeTrafficLights.push(light);
                    prevOffset = offset;
                    trafficLightContainer.addChild(light);
                }
                trafficLightsG[edge.id] = edgeTrafficLights;
            }
        }


        // Draw Roads
        graphics.lineStyle(LANE_BORDER_WIDTH, LANE_BORDER_COLOR, 1);
        graphics.drawLine(pointA, pointB);

        pointA1 = pointA.moveAlong(pointAOffset, roadWidth);
        pointB1 = pointB.moveAlong(pointBOffset, roadWidth);

        graphics.lineStyle(0);
        graphics.beginFill(LANE_COLOR);

        coords = coords.concat([pointA.x, pointA.y, pointB.x, pointB.y]);
        coords1 = coords1.concat([pointA1.y, pointA1.x, pointB1.y, pointB1.x]);

        graphics.drawPolygon([pointA.x, pointA.y, pointB.x, pointB.y, pointB1.x, pointB1.y, pointA1.x, pointA1.y]);
        graphics.endFill();

        offset = 0;
        for (let lane = 0, len = edge.nLane - 1; lane < len; ++lane) {
            offset += edge.laneWidths[lane];
            graphics.lineStyle(LANE_BORDER_WIDTH, LANE_INNER_COLOR);
            graphics.drawDashLine(pointA.moveAlong(pointAOffset, offset), pointB.moveAlong(pointBOffset, offset), LANE_DASH, LANE_GAP);
        }

        offset += edge.laneWidths[edge.nLane - 1];

        // graphics.lineStyle(LANE_BORDER_WIDTH, LANE_BORDER_COLOR);
        // graphics.drawLine(pointA.moveAlong(pointAOffset, offset), pointB.moveAlong(pointBOffset, offset));
    }

    if (debugMode) {
        coords = coords.concat(coords1.reverse());
        graphics.interactive = true;
        graphics.hitArea = new PIXI.Polygon(coords);
        graphics.on("mouseover", function () {
            graphics.alpha = 0.5;
            selectedDOM.innerText = edge.id;
        });

        graphics.on("mouseout", function () {
            graphics.alpha = 1;
        });
    }

    // ... existing code ...

    graphics.drawPolygon([pointA.x, pointA.y, pointB.x, pointB.y, pointB1.x, pointB1.y, pointA1.x, pointA1.y]);
    graphics.endFill();



}

function drawCebra(cebra, graphics, edges) {

    for (edgeId in edges) {
        let edge = edges[edgeId];
        if (edge.id === cebra.road) {

            let points = edge.points;
            // Initialize pointA and pointB with the first and last points of the road
            let pointA = points[0];
            let pointB = points[points.length - 1];

            let roadWidth = 0;
            edge.laneWidths.forEach(function (l) {
                roadWidth += l;
            }, 0);

            // Calculate the total width of the road
            let roadWidth2 = edge.laneWidths.reduce((a, b) => a + b, 0);

            // Double the road width for the size of the square
            let squareSize = roadWidth2 * 2;
            // Define an offset factor (0 = start of the road, 1 = end of the road)
            let offsetFactor = 0.5; // Change this to move the square along the road

            // Calculate the position of the square
            let squareX = pointA.x + (pointB.x - pointA.x) * offsetFactor;
            let squareY = pointA.y + (pointB.y - pointA.y) * offsetFactor;

            // Draw a pink square at the calculated position
            graphics.beginFill(0xFFC0CB); // Pink color
            graphics.drawRect(squareX - squareSize / 2, squareY - squareSize / 2, squareSize, squareSize);
            graphics.endFill();


            /////////////////
            if (cebra.direccion == "vertical") {
                // Dibujar las franjas blancas
                let numberOfStripes = 6; // Cambia esto para cambiar el número de franjas
                let stripeWidth = squareSize / numberOfStripes;
                for (let i = 0; i < numberOfStripes; i++) {
                    graphics.lineStyle(2, 0xFFFFFF, 1); // Grosor 2, color blanco, alfa 1
                    graphics.moveTo(squareX - (squareSize / 2) + i * stripeWidth, squareY - (squareSize / 2));
                    graphics.lineTo(squareX - (squareSize / 2) + i * stripeWidth, squareY + (squareSize / 2));
                }
            } else {
                // Dibujar las franjas blancas
                let numberOfStripes = 6; // Cambia esto para cambiar el número de franjas
                let stripeWidth = squareSize / numberOfStripes;
                for (let i = 0; i < numberOfStripes; i++) {
                    graphics.lineStyle(2, 0xFFFFFF, 1);
                    graphics.moveTo(squareX - (squareSize / 2), squareY - (squareSize / 2) + i * stripeWidth);
                    graphics.lineTo(squareX + (squareSize / 2), squareY - (squareSize / 2) + i * stripeWidth);
                }
            }


            // Break the loop as we've found and drawn the matching edge
            break;
        }
    }
}

function drawStop(stop, graphics) {
    // Definir las propiedades del octógono
    const x = stop.pos_x; // Centro en el eje x
    const y = stop.pos_y; // Centro en el eje y
    const radius = 5; // Radio del octógono (se calcula para que el octógono encaje en el cuadrado)
    const sides = 8; // Número de lados del octógono
    const angleStep = (2 * Math.PI) / sides; // Ángulo entre los lados

    graphics.lineStyle(1, 0xFF0000); // Grosor de 2, color rojo
    graphics.beginFill(0xFFFFFF); // Color blanco

    // Mover el puntero de dibujo al primer vértice del octógono
    graphics.moveTo(
        x + Math.cos(0) * radius,
        y + Math.sin(0) * radius
    );
    // Dibujar los lados del octógono
    for (let i = 1; i <= sides; i++) {
        const angle = angleStep * i;
        graphics.lineTo(
            x + Math.cos(angle) * radius,
            y + Math.sin(angle) * radius
        );
    }
    // Cerrar el octógono
    graphics.closePath();
    // Establecer el estilo de llenado y trazo
    graphics.endFill(); // Terminar el llenado
}

function drawCeda(ceda, graphics) {
    // Definir los puntos del triángulo
    var triangle = new PIXI.Polygon([
        ceda.pos_x, ceda.pos_y - 5,             // Primer punto
        ceda.pos_x - 5, ceda.pos_y + 5,   // Segundo punto
        ceda.pos_x + 5, ceda.pos_y + 5    // Tercer punto
    ]);

    // Dibujar el borde rojo
    graphics.lineStyle(2, 0xFF0000, 1); // Grosor 2, color rojo, alfa 1
    graphics.drawPolygon(triangle);
    graphics.closePath();
    // Dibujar el relleno blanco
    graphics.beginFill(0xFFFFFF); // Color blanco
    graphics.drawPolygon(triangle);
    graphics.endFill();
}

function drawnotSignal(notSignal, graphics) {

    graphics.beginFill(0x0000ff); // Color azul
    graphics.drawCircle(notSignal.pos_x, notSignal.pos_y, 18); // x, y son las coordenadas del centro del círculo, radius es el radio


    // Terminar el llenado
    graphics.endFill();
}


function run(delta) {
    let redraw = false;

    if (ready && (!controls.paused || redraw)) {
        try {
            drawStep(cnt);
        } catch (e) {
            infoAppend("Error occurred when drawing");
            ready = false;
        }
        if (!controls.paused) {
            frameElapsed += 1;
            if (frameElapsed >= 1 / controls.replaySpeed ** 2) {
                cnt += 1;
                frameElapsed = 0;
                if (cnt == totalStep) cnt = 0;
            }
        }
    }
}

function _statusToColor(status) {
    switch (status) {
        case 'r':
            return LIGHT_RED;
        case 'g':
            return LIGHT_GREEN;
        default:
            return 0x808080;
    }
}

function stringHash(str) {
    let hash = 0;
    let p = 127, p_pow = 1;
    let m = 1e9 + 9;
    for (let i = 0; i < str.length; i++) {
        hash = (hash + str.charCodeAt(i) * p_pow) % m;
        p_pow = (p_pow * p) % m;
    }
    return hash;
}


function drawPeaton(step, peatonGraphics) {
    // Read the data from the txt file
    let data;

    fetch('../examples/replyCebras.txt')
        .then(response => response.text())
        .then(text => {
            data = text;


            const lines = data.split('\n');
            const stepLine = lines[step];
            const stepData = stepLine.split(' ');
            if (stepData.length == 0) {
                //   console.log("No hay peatones en ningun paso");
            }

            for (let i = 0; i < stepData.length; i++) {
                let peaton = stepData[i];
                for (let cebra in lista_cebras) {
                    if (peaton == lista_cebras[cebra].id) {
                        if (lista_cebras[cebra].direccion == "horizontal") {
                            if (lista_cebras[cebra].cont <= 6 && lista_cebras[cebra].cont > 0) {
                                peatonGraphics.beginFill(0x000000); // Color de relleno negro
                                peatonGraphics.drawCircle(lista_cebras[cebra].pos_x, (lista_cebras[cebra].pos_y - 16), 2); // Dibujar un círculo en (100, 100) con radio 50
                                peatonGraphics.endFill();
                                lista_cebras[cebra].cont--;

                            } else if (lista_cebras[cebra].cont > 6 && lista_cebras[cebra].cont <= 12) {
                                peatonGraphics.beginFill(0x000000); // Color de relleno negro
                                peatonGraphics.drawCircle(lista_cebras[cebra].pos_x, (lista_cebras[cebra].pos_y - 8), 2); // Dibujar un círculo en (100, 100) con radio 50
                                peatonGraphics.endFill();
                                lista_cebras[cebra].cont--;

                            } else if (lista_cebras[cebra].cont > 12 && lista_cebras[cebra].cont <= 18) {
                                peatonGraphics.beginFill(0x000000); // Color de relleno negro
                                peatonGraphics.drawCircle(lista_cebras[cebra].pos_x, (lista_cebras[cebra].pos_y + 8), 2); // Dibujar un círculo en (100, 100) con radio 50
                                peatonGraphics.endFill();
                                lista_cebras[cebra].cont--;

                            } else if (lista_cebras[cebra].cont > 18 && lista_cebras[cebra].cont <= 24) {
                                peatonGraphics.beginFill(0x000000); // Color de relleno negro
                                peatonGraphics.drawCircle(lista_cebras[cebra].pos_x, (lista_cebras[cebra].pos_y + 16), 2); // Dibujar un círculo en (100, 100) con radio 50
                                peatonGraphics.endFill();
                                lista_cebras[cebra].cont--;

                            } else if (lista_cebras[cebra].cont == 0) {
                                lista_cebras[cebra].cont = 24;
                            }
                        } else {
                            if (lista_cebras[cebra].cont <= 6 && lista_cebras[cebra].cont > 0) {
                                peatonGraphics.beginFill(0x000000); // Color de relleno negro
                                peatonGraphics.drawCircle(lista_cebras[cebra].pos_x - 16, (lista_cebras[cebra].pos_y), 2); // Dibujar un círculo en (100, 100) con radio 50
                                peatonGraphics.endFill();
                                lista_cebras[cebra].cont--;

                            } else if (lista_cebras[cebra].cont > 6 && lista_cebras[cebra].cont <= 12) {
                                peatonGraphics.beginFill(0x000000); // Color de relleno negro
                                peatonGraphics.drawCircle(lista_cebras[cebra].pos_x - 8, (lista_cebras[cebra].pos_y), 2); // Dibujar un círculo en (100, 100) con radio 50
                                peatonGraphics.endFill();
                                lista_cebras[cebra].cont--;

                            } else if (lista_cebras[cebra].cont > 12 && lista_cebras[cebra].cont <= 18) {
                                peatonGraphics.beginFill(0x000000); // Color de relleno negro
                                peatonGraphics.drawCircle(lista_cebras[cebra].pos_x + 8, (lista_cebras[cebra].pos_y), 2); // Dibujar un círculo en (100, 100) con radio 50
                                peatonGraphics.endFill();
                                lista_cebras[cebra].cont--;

                            } else if (lista_cebras[cebra].cont > 18 && lista_cebras[cebra].cont <= 24) {
                                peatonGraphics.beginFill(0x000000); // Color de relleno negro
                                peatonGraphics.drawCircle(lista_cebras[cebra].pos_x + 16, (lista_cebras[cebra].pos_y), 2); // Dibujar un círculo en (100, 100) con radio 50
                                peatonGraphics.endFill();
                                lista_cebras[cebra].cont--;

                            } else if (lista_cebras[cebra].cont == 0) {
                                lista_cebras[cebra].cont = 24;
                            }
                        }

                    }
                }

            }
        })
        .catch(error => console.error(error));
}

PIXI.loader.add('peatonImage', 'sprites/peatonImage.png');
let peatonSprites = [];

function drawPeatonPng(step,resources) {
    // Read the data from the txt file
    let data;

    fetch('../examples/replyCebras.txt')
        .then(response => response.text())
        .then(text => {
            data = text;


            const lines = data.split('\n');
            const stepLine = lines[step];
            const stepData = stepLine.split(' ');
            if (stepData.length == 0) {
                //   console.log("No hay peatones en ningun paso");
            }

            for (let i = 0; i < stepData.length; i++) {
                let peaton = stepData[i];
                for (let cebra in lista_cebras) {
                    if (peaton == lista_cebras[cebra].id) {
                        if (lista_cebras[cebra].direccion == "horizontal") {
                            if (lista_cebras[cebra].cont <= 6 && lista_cebras[cebra].cont > 0) {

                                let peatonSprite = new PIXI.Sprite(resources.peatonImage.texture);
                                simulatorContainer.addChild(peatonSprite);
                                peatonSprite.x = lista_cebras[cebra].pos_x; // Reemplaza esto con la posición x del peatón
                                peatonSprite.y = lista_cebras[cebra].pos_y - 16; // Reemplaza esto con la posición y del peatón
                                peatonSprite.width = 4;  // Cambia esto al ancho deseado
                                peatonSprite.height = 4; // Cambia esto a la altura deseada
                                lista_cebras[cebra].cont--;
                                peatonSprites.push(peatonSprite);

                            } else if (lista_cebras[cebra].cont > 6 && lista_cebras[cebra].cont <= 12) {
                                let peatonSprite = new PIXI.Sprite(resources.peatonImage.texture);
                                simulatorContainer.addChild(peatonSprite);
                                peatonSprite.x = lista_cebras[cebra].pos_x; // Reemplaza esto con la posición x del peatón
                                peatonSprite.y = lista_cebras[cebra].pos_y - 8; // Reemplaza esto con la posición y del peatón
                                peatonSprite.width = 4;  // Cambia esto al ancho deseado
                                peatonSprite.height = 4; // Cambia esto a la altura deseada
                                lista_cebras[cebra].cont--;
                                peatonSprites.push(peatonSprite);

                            } else if (lista_cebras[cebra].cont > 12 && lista_cebras[cebra].cont <= 18) {
                                let peatonSprite = new PIXI.Sprite(resources.peatonImage.texture);
                                simulatorContainer.addChild(peatonSprite);
                                peatonSprite.x = lista_cebras[cebra].pos_x; // Reemplaza esto con la posición x del peatón
                                peatonSprite.y = lista_cebras[cebra].pos_y + 8; // Reemplaza esto con la posición y del peatón
                                peatonSprite.width = 4;  // Cambia esto al ancho deseado
                                peatonSprite.height = 4; // Cambia esto a la altura deseada
                                lista_cebras[cebra].cont--;
                                peatonSprites.push(peatonSprite);

                            } else if (lista_cebras[cebra].cont > 18 && lista_cebras[cebra].cont <= 24) {
                                let peatonSprite = new PIXI.Sprite(resources.peatonImage.texture);
                                simulatorContainer.addChild(peatonSprite);
                                peatonSprite.x = lista_cebras[cebra].pos_x; // Reemplaza esto con la posición x del peatón
                                peatonSprite.y = lista_cebras[cebra].pos_y + 8; // Reemplaza esto con la posición y del peatón
                                peatonSprite.width = 4;  // Cambia esto al ancho deseado
                                peatonSprite.height = 4; // Cambia esto a la altura deseada
                                lista_cebras[cebra].cont--;
                                peatonSprites.push(peatonSprite);

                            } else if (lista_cebras[cebra].cont == 0) {
                                lista_cebras[cebra].cont = 24;
                            }

                        } else {
                            if (lista_cebras[cebra].cont <= 6 && lista_cebras[cebra].cont > 0) {

                                let peatonSprite = new PIXI.Sprite(resources.peatonImage.texture);
                                simulatorContainer.addChild(peatonSprite);
                                peatonSprite.x = lista_cebras[cebra].pos_x - 16; // Reemplaza esto con la posición x del peatón
                                peatonSprite.y = lista_cebras[cebra].pos_y; // Reemplaza esto con la posición y del peatón
                                peatonSprite.width = 4;  // Cambia esto al ancho deseado
                                peatonSprite.height = 4; // Cambia esto a la altura deseada
                                lista_cebras[cebra].cont--;
                                peatonSprites.push(peatonSprite);

                            } else if (lista_cebras[cebra].cont > 6 && lista_cebras[cebra].cont <= 12) {

                                let peatonSprite = new PIXI.Sprite(resources.peatonImage.texture);
                                simulatorContainer.addChild(peatonSprite);
                                peatonSprite.x = lista_cebras[cebra].pos_x - 8; // Reemplaza esto con la posición x del peatón
                                peatonSprite.y = lista_cebras[cebra].pos_y; // Reemplaza esto con la posición y del peatón
                                peatonSprite.width = 4;  // Cambia esto al ancho deseado
                                peatonSprite.height = 4; // Cambia esto a la altura deseada
                                lista_cebras[cebra].cont--;
                                peatonSprites.push(peatonSprite);

                            } else if (lista_cebras[cebra].cont > 12 && lista_cebras[cebra].cont <= 18) {
                                let peatonSprite = new PIXI.Sprite(resources.peatonImage.texture);
                                simulatorContainer.addChild(peatonSprite);
                                peatonSprite.x = lista_cebras[cebra].pos_x + 8; // Reemplaza esto con la posición x del peatón
                                peatonSprite.y = lista_cebras[cebra].pos_y; // Reemplaza esto con la posición y del peatón
                                peatonSprite.width = 4;  // Cambia esto al ancho deseado
                                peatonSprite.height = 4; // Cambia esto a la altura deseada

                                lista_cebras[cebra].cont--;
                                peatonSprites.push(peatonSprite);

                            } else if (lista_cebras[cebra].cont > 18 && lista_cebras[cebra].cont <= 24) {

                                let peatonSprite = new PIXI.Sprite(resources.peatonImage.texture);
                                simulatorContainer.addChild(peatonSprite);
                                peatonSprite.x = lista_cebras[cebra].pos_x + 16; // Reemplaza esto con la posición x del peatón
                                peatonSprite.y = lista_cebras[cebra].pos_y; // Reemplaza esto con la posición y del peatón
                                peatonSprite.width = 4;  // Cambia esto al ancho deseado
                                peatonSprite.height = 4; // Cambia esto a la altura deseada

                                lista_cebras[cebra].cont--;
                                peatonSprites.push(peatonSprite);

                            } else if (lista_cebras[cebra].cont == 0) {
                                lista_cebras[cebra].cont = 24;
                            }
                        }

                    }
                }

            }
        })
        .catch(error => console.error(error));
}

const peatonGraphics = new Graphics();
let contador_aux = -1;

function drawStep(step) {
    //console.log("step : ", step);
    if (showChart && (step > chart.ptr || step == 0)) {
        if (step == 0) {
            chart.clear();
        }
        chart.ptr = step;
        chart.addData(chartLog[step]);
    }
    //////////////////////

  /*  if (contador_aux != step) {
        peatonGraphics.clear()
        simulatorContainer.addChild(peatonGraphics);
        drawPeaton(step, peatonGraphics);
        contador_aux = step;
    }*/
    try {
        if (contador_aux != step) {
            for (let sprite of peatonSprites) {
                simulatorContainer.removeChild(sprite);
            }
            peatonSprites = [];
            peatonGraphics.clear()
            PIXI.loader.load((loader, resources) => {
                drawPeatonPng(step,resources); 
            });
            contador_aux = step;
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }

    //////////////////////
    let [carLogs, tlLogs] = logs[step].split(';'); //tlLogs = traffic light logs ( road_1_0_1 r r g , road_2_0_1 r r g , road_3_0_1 r r g) 
    tlLogs = tlLogs.split(','); //los separamos por las comas

    carLogs = carLogs.split(',');

    let tlLog, tlEdge, tlStatus;////////////////////////////////////////////////////////////draw trafic light
    for (let i = 0, len = tlLogs.length; i < len; ++i) {
        tlLog = tlLogs[i].split(' '); //road_1_0_1 r r g los separa por espacios
        tlEdge = tlLog[0];//el primero es la carretera
        tlStatus = tlLog.slice(1);//el resto son los estados de los semaforos
        //////////////////////////////////////////////////////////////////////////////////////////////
        let encontrado = false;
        for (stopId in stops) {
            if (tlEdge == stops[stopId].road) {
                encontrado = true;
            }
        }
        for (notSignalId in notSignals) {
            if (tlEdge == notSignals[notSignalId].road) {
                encontrado = true;
            }
        }
        for (cedaId in cedas) {
            if (tlEdge == cedas[cedaId].road) {
                encontrado = true;
            }
        }
        //////////////////////////////////////////////////////////////////////////////////////////////
        if (!encontrado) {
            for (let j = 0, len = tlStatus.length; j < len; ++j) {
                trafficLightsG[tlEdge][j].tint = _statusToColor(tlStatus[j]);
                if (tlStatus[j] == 'i') {
                    trafficLightsG[tlEdge][j].alpha = 0;
                } else {
                    trafficLightsG[tlEdge][j].alpha = 1;
                }
            }
        }
    }

    carContainer.removeChildren();
    turnSignalContainer.removeChildren();
    let carLog, position, length, width;
    for (let i = 0, len = carLogs.length - 1; i < len; ++i) {
        carLog = carLogs[i].split(' ');
        position = transCoord([parseFloat(carLog[0]), parseFloat(carLog[1])]);
        length = parseFloat(carLog[5]);
        width = parseFloat(carLog[6]);
        carPool[i][0].position.set(position[0], position[1]);
        carPool[i][0].rotation = 2 * Math.PI - parseFloat(carLog[2]);
        carPool[i][0].name = carLog[3];
        let carColorId = stringHash(carLog[3]) % CAR_COLORS_NUM;
        carPool[i][0].tint = CAR_COLORS[carColorId];
        carPool[i][0].width = length;
        carPool[i][0].height = width;
        carContainer.addChild(carPool[i][0]);

        let laneChange = parseInt(carLog[4]) + 1;
        carPool[i][1].position.set(position[0], position[1]);
        carPool[i][1].rotation = carPool[i][0].rotation;
        carPool[i][1].texture = turnSignalTextures[laneChange];
        carPool[i][1].width = length;
        carPool[i][1].height = width;
        turnSignalContainer.addChild(carPool[i][1]);
    }
    nodeCarNum.innerText = carLogs.length - 1;
    nodeTotalStep.innerText = totalStep;
    nodeCurrentStep.innerText = cnt + 1;
    nodeProgressPercentage.innerText = (cnt / totalStep * 100).toFixed(2) + "%";
    if (statsFile != "") {
        if (withRange) nodeRange.value = stats[step][1];
        nodeStats.innerText = stats[step][0].toFixed(2);
    }
}

/*
Chart
 */
let chart = {
    max_steps: 3600,
    data: {
        labels: [],
        series: [[]]
    },
    options: {
        showPoint: false,
        lineSmooth: false,
        axisX: {
            showGrid: false,
            showLabel: false
        }
    },
    init: function (title, series_cnt, max_step) {
        document.getElementById("chart-title").innerText = title;
        this.max_steps = max_step;
        this.data.labels = new Array(this.max_steps);
        this.data.series = [];
        for (let i = 0; i < series_cnt; ++i)
            this.data.series.push([]);
        this.chart = new Chartist.Line('#chart', this.data, this.options);
    },
    addData: function (value) {
        for (let i = 0; i < value.length; ++i) {
            this.data.series[i].push(value[i]);
            if (this.data.series[i].length > this.max_steps) {
                this.data.series[i].shift();
            }
        }
        this.chart.update();
    },
    clear: function () {
        for (let i = 0; i < this.data.series.length; ++i)
            this.data.series[i] = [];
    },
    ptr: 0
};
