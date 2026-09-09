const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// =========================
// CANVAS
// =========================

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);


// =========================
// KEYBOARD CONTROLS
// =========================

const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;

    // Prevent Space from scrolling the page
    if (e.code === "Space") {
        e.preventDefault();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

const up = () => keys["w"] || keys["arrowup"];
const down = () => keys["s"] || keys["arrowdown"];
const left = () => keys["a"] || keys["arrowleft"];
const right = () => keys["d"] || keys["arrowright"];
const space = () => keys[" "] || keys["space"] || keys["spacebar"];


// =========================
// PLAYER
// =========================

const player = {
    x: 500,
    y: 180,

    angle: 0,

    // Actual forward speed
    speed: 0,

    maxSpeed: 4,

    acceleration: 0.12,
    braking: 0.18,

    // Normal steering
    turnSpeed: 0.03,

    width: 32,
    height: 18,

    // Drift
    drifting: false,
    driftCharge: 0,

    // Boost
    boostTimer: 0
};


// =========================
// TRACK
// =========================

const track = {
    centerX: 500,
    centerY: 350,

    outerWidth: 800,
    outerHeight: 500,

    innerWidth: 420,
    innerHeight: 220
};


// =========================
// CHECKPOINTS
// =========================

const checkpoints = [

    // CP1 - RIGHT
    {
        x: 710,
        y: 235,
        width: 190,
        height: 230,
        color: "#4caf50",
        label: "1"
    },

    // CP2 - BOTTOM
    {
        x: 290,
        y: 460,
        width: 420,
        height: 140,
        color: "#2196f3",
        label: "2"
    },

    // CP3 - LEFT
    {
        x: 100,
        y: 235,
        width: 190,
        height: 230,
        color: "#2196f3",
        label: "3"
    }
];


// =========================
// FINISH LINE
// =========================

const finishLine = {
    x: 290,
    y: 100,
    width: 420,
    height: 140
};


// =========================
// RACE
// =========================

const TOTAL_LAPS = 3;

let currentLap = 1;
let nextCheckpoint = 0;

// 0 = CP1
// 1 = CP2
// 2 = CP3
// 3 = Finish

let raceFinished = false;

let raceStartTime = performance.now();
let finishTime = 0;


// =========================
// COLLISION
// =========================

function isOnTrack(x, y) {

    const outerLeft =
        track.centerX - track.outerWidth / 2;

    const outerRight =
        track.centerX + track.outerWidth / 2;

    const outerTop =
        track.centerY - track.outerHeight / 2;

    const outerBottom =
        track.centerY + track.outerHeight / 2;


    const innerLeft =
        track.centerX - track.innerWidth / 2;

    const innerRight =
        track.centerX + track.innerWidth / 2;

    const innerTop =
        track.centerY - track.innerHeight / 2;

    const innerBottom =
        track.centerY + track.innerHeight / 2;


    const insideOuter =
        x > outerLeft &&
        x < outerRight &&
        y > outerTop &&
        y < outerBottom;


    const insideInner =
        x > innerLeft &&
        x < innerRight &&
        y > innerTop &&
        y < innerBottom;


    return insideOuter && !insideInner;
}


// =========================
// CHECKPOINT COLLISION
// =========================

function isInsideRectangle(x, y, rect) {

    return (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
    );
}


function updateCheckpoints() {

    if (raceFinished) {
        return;
    }


    // Checkpoint 1
    if (
        nextCheckpoint === 0 &&
        isInsideRectangle(
            player.x,
            player.y,
            checkpoints[0]
        )
    ) {
        nextCheckpoint = 1;
    }


    // Checkpoint 2
    else if (
        nextCheckpoint === 1 &&
        isInsideRectangle(
            player.x,
            player.y,
            checkpoints[1]
        )
    ) {
        nextCheckpoint = 2;
    }


    // Checkpoint 3
    else if (
        nextCheckpoint === 2 &&
        isInsideRectangle(
            player.x,
            player.y,
            checkpoints[2]
        )
    ) {
        nextCheckpoint = 3;
    }


    // Finish line
    else if (
        nextCheckpoint === 3 &&
        isInsideRectangle(
            player.x,
            player.y,
            finishLine
        )
    ) {

        if (currentLap >= TOTAL_LAPS) {

            raceFinished = true;

            finishTime =
                (performance.now() - raceStartTime) / 1000;

        } else {

            currentLap++;

            nextCheckpoint = 0;
        }
    }
}


// =========================
// DRIVING
// =========================

function updatePlayer() {

    if (raceFinished) {
        return;
    }


    // =========================
    // ACCELERATION
    // =========================

    if (up()) {

        player.speed += player.acceleration;

        if (player.speed > player.maxSpeed) {
            player.speed = player.maxSpeed;
        }
    }


    // =========================
    // BRAKING / REVERSE
    // =========================

    if (down()) {

        player.speed -= player.braking;

        if (player.speed < -player.maxSpeed * 0.5) {
            player.speed = -player.maxSpeed * 0.5;
        }
    }


    // =========================
    // NATURAL SLOWDOWN
    // =========================

    if (!up() && !down()) {
        player.speed *= 0.97;
    }


    // =========================
    // DRIFT ACTIVATION
    // =========================

    if (
        space() &&
        Math.abs(player.speed) > 0.5 &&
        (left() || right())
    ) {

        player.drifting = true;

    } else {

        player.drifting = false;
    }


    // =========================
    // STEERING
    // =========================

    if (Math.abs(player.speed) > 0.1) {

        const direction =
            player.speed >= 0 ? 1 : -1;


        let steeringAmount =
            player.turnSpeed * direction;


        // =========================
        // NORMAL TURNING
        // =========================

        if (!player.drifting) {

            if (left()) {
                player.angle -= steeringAmount;
            }

            if (right()) {
                player.angle += steeringAmount;
            }
        }


        // =========================
        // DRIFT TURNING
        // =========================

        else {

            // Stronger steering while drifting
            steeringAmount *= 1.8;


            if (left()) {
                player.angle -= steeringAmount;
            }

            if (right()) {
                player.angle += steeringAmount;
            }
        }
    }


   // =========================
// DRIFT CHARGE
// =========================

if (player.drifting) {

    // Build up drift charge
    player.driftCharge += 1;

    // Maximum drift charge
    if (player.driftCharge > 120) {
        player.driftCharge = 120;
    }

} else {

    // =========================
    // RELEASE DRIFT = BOOST
    // =========================

    if (player.driftCharge >= 20) {

        // Small boost
        if (player.driftCharge < 50) {

            player.boostTimer = 20;

        }

        // Medium boost
        else if (player.driftCharge < 90) {

            player.boostTimer = 35;

        }

        // Large boost
        else {

            player.boostTimer = 55;
        }
    }

    // Reset drift charge
    player.driftCharge = 0;
}


// =========================
// BOOST
// =========================

if (player.boostTimer > 0) {

    // Count down boost
    player.boostTimer--;

    // Give the kart extra acceleration
    player.speed += 0.18;

    // Allow boosted speed to go above normal max speed
    if (player.speed > player.maxSpeed + 4) {

        player.speed =
            player.maxSpeed + 4;
    }
}

    // =========================
    // CALCULATE MOVEMENT
    // =========================

    let moveAngle = player.angle;


    // =========================
    // SIDEWAYS DRIFT
    // =========================

    if (player.drifting) {

        let driftDirection = 0;


        if (left()) {
            driftDirection = -1;
        }

        if (right()) {
            driftDirection = 1;
        }


        // Sideways movement
        const sidewaysAngle =
            player.angle +
            driftDirection * Math.PI / 2;


        const forwardAmount =
            player.speed * 0.82;


        const sidewaysAmount =
            Math.abs(player.speed) * 0.38;


        player.x +=
            Math.cos(player.angle) *
            forwardAmount;


        player.y +=
            Math.sin(player.angle) *
            forwardAmount;


        player.x +=
            Math.cos(sidewaysAngle) *
            sidewaysAmount;


        player.y +=
            Math.sin(sidewaysAngle) *
            sidewaysAmount;

    } else {

        // Normal movement
        player.x +=
            Math.cos(moveAngle) *
            player.speed;

        player.y +=
            Math.sin(moveAngle) *
            player.speed;
    }


    // =========================
    // WALL COLLISION
    // =========================

    if (!isOnTrack(player.x, player.y)) {

        // Push the kart back
        player.x -=
            Math.cos(player.angle) *
            player.speed;

        player.y -=
            Math.sin(player.angle) *
            player.speed;


        // Slow down
        player.speed *= 0.5;
    }


    // =========================
    // CHECKPOINTS
    // =========================

    updateCheckpoints();
}


// =========================
// DRAW TRACK
// =========================

function drawTrack() {

    const outerLeft =
        track.centerX -
        track.outerWidth / 2;

    const outerTop =
        track.centerY -
        track.outerHeight / 2;


    const innerLeft =
        track.centerX -
        track.innerWidth / 2;

    const innerTop =
        track.centerY -
        track.innerHeight / 2;


    // Outside grass
    ctx.fillStyle = "#3d8f3d";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Road
    ctx.fillStyle = "#555";

    ctx.fillRect(
        outerLeft,
        outerTop,
        track.outerWidth,
        track.outerHeight
    );


    // Grass island
    ctx.fillStyle = "#3d8f3d";

    ctx.fillRect(
        innerLeft,
        innerTop,
        track.innerWidth,
        track.innerHeight
    );


    // Road markings
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.setLineDash([25, 20]);


    ctx.strokeRect(
        outerLeft + 20,
        outerTop + 20,
        track.outerWidth - 40,
        track.outerHeight - 40
    );


    ctx.setLineDash([]);
}


// =========================
// DRAW CHECKPOINTS
// =========================

function drawCheckpoints() {

    checkpoints.forEach((checkpoint, index) => {

        // Only make the next checkpoint bright
        if (index === nextCheckpoint) {

            ctx.globalAlpha = 0.45;

        } else {

            ctx.globalAlpha = 0.12;
        }


        ctx.fillStyle = checkpoint.color;

        ctx.fillRect(
            checkpoint.x,
            checkpoint.y,
            checkpoint.width,
            checkpoint.height
        );


        ctx.globalAlpha = 1;


        // Label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";


        ctx.fillText(
            checkpoint.label,
            checkpoint.x +
                checkpoint.width / 2,
            checkpoint.y +
                checkpoint.height / 2
        );
    });
}


// =========================
// DRAW FINISH LINE
// =========================

function drawCheckerPattern() {

    const size = 20;

    for (
        let y = finishLine.y;
        y < finishLine.y + finishLine.height;
        y += size
    ) {

        for (
            let x = finishLine.x;
            x < finishLine.x + finishLine.width;
            x += size
        ) {

            const row =
                Math.floor(
                    (y - finishLine.y) / size
                );

            const col =
                Math.floor(
                    (x - finishLine.x) / size
                );


            if ((row + col) % 2 === 0) {
                ctx.fillStyle = "#ffffff";
            } else {
                ctx.fillStyle = "#222222";
            }


            ctx.fillRect(
                x,
                y,
                size,
                size
            );
        }
    }
}


// =========================
// DRAW PLAYER
// =========================

function drawPlayer() {

    ctx.save();


    ctx.translate(
        player.x,
        player.y
    );


    ctx.rotate(player.angle);


    // Drift effect
    if (player.drifting) {

        ctx.fillStyle = "#ffcc00";

        ctx.globalAlpha = 0.7;


        ctx.beginPath();

        ctx.arc(
            -18,
            8,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            -18,
            -8,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.globalAlpha = 1;
    }


    // Kart body
    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
    );


    // Front
    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        5,
        -5,
        8,
        10
    );


    // Wheels
    ctx.fillStyle = "#111111";


    ctx.fillRect(
        -10,
        -11,
        8,
        5
    );


    ctx.fillRect(
        -10,
        6,
        8,
        5
    );


    ctx.fillRect(
        7,
        -11,
        8,
        5
    );


    ctx.fillRect(
        7,
        6,
        8,
        5
    );


    ctx.restore();
}


// =========================
// UI
// =========================

function drawUI() {

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 20px Arial";

    ctx.textAlign = "left";


    // Speed
    ctx.fillText(
        "Speed: " +
        Math.round(
            Math.abs(player.speed) * 20
        ),
        20,
        30
    );


    // Lap
    ctx.fillText(
        "Lap: " +
        currentLap +
        "/" +
        TOTAL_LAPS,
        20,
        60
    );


    // Checkpoint
    if (!raceFinished) {

        let checkpointText;


        if (nextCheckpoint < 3) {

            checkpointText =
                "Next checkpoint: " +
                (nextCheckpoint + 1);

        } else {

            checkpointText =
                "Next: FINISH";
        }


        ctx.fillText(
            checkpointText,
            20,
            90
        );
    }


    // Drift meter
    if (player.drifting) {

        ctx.fillText(
            "DRIFT: " +
            Math.round(
                player.driftCharge
            ),
            20,
            120
        );
    }
}


// =========================
// FINISH SCREEN
// =========================

function drawFinishScreen() {

    if (!raceFinished) {
        return;
    }


    ctx.fillStyle =
        "rgba(0, 0, 0, 0.7)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle = "#ffffff";

    ctx.textAlign = "center";


    ctx.font = "bold 52px Arial";

    ctx.fillText(
        "RACE FINISHED!",
        canvas.width / 2,
        canvas.height / 2 - 40
    );


    ctx.font = "bold 30px Arial";

    ctx.fillText(
        "Time: " +
        finishTime.toFixed(2) +
        " seconds",
        canvas.width / 2,
        canvas.height / 2 + 20
    );
}


// =========================
// GAME LOOP
// =========================

function gameLoop() {

    updatePlayer();


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawTrack();

    drawCheckerPattern();

    drawCheckpoints();

    drawPlayer();

    drawUI();

    drawFinishScreen();


    requestAnimationFrame(gameLoop);
}


// =========================
// START GAME
// =========================

gameLoop();
