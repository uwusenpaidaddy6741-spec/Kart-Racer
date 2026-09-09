const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// =====================================================
// CANVAS
// =====================================================

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// =====================================================
// INPUT
// =====================================================

const keys = {};

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    keys[key] = true;

    if (
        [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            " "
        ].includes(key)
    ) {
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// =====================================================
// GAME SETTINGS
// =====================================================

const TOTAL_LAPS = 3;

// =====================================================
// TRACK
// =====================================================

const track = {
    centerX: 500,
    centerY: 350,

    outerWidth: 800,
    outerHeight: 500,

    innerWidth: 420,
    innerHeight: 220
};

// =====================================================
// PLAYER
// =====================================================

const player = {
    // Start near the bottom of the track
    x: 500,
    y: 520,

    // Facing upward
    angle: -Math.PI / 2,

    speed: 0,

    maxSpeed: 6,
    acceleration: 0.12,
    braking: 0.18,

    turnSpeed: 0.045,

    width: 32,
    height: 18,

    drifting: false,
    driftCharge: 0,
    boostTimer: 0
};

// =====================================================
// RACE STATE
// =====================================================

let currentLap = 1;

// Checkpoints:
// 0 = checkpoint 1
// 1 = checkpoint 2
// 2 = checkpoint 3
// 3 = finish line
let nextCheckpoint = 0;

let raceFinished = false;

let raceStartTime = performance.now();
let finishTime = 0;

// =====================================================
// CHECKPOINTS
// =====================================================
//
// The checkpoints completely cross the ROAD.
// They are NOT placed on the grass or in the center.
//
// 1 = right side
// 2 = bottom
// 3 = left side
//
// After 3, the finish line at the top becomes active.
// =====================================================

const checkpoints = [

    // CHECKPOINT 1
    {
        x: 710,
        y: 235,
        width: 190,
        height: 230,
        color: "#4caf50",
        label: "1"
    },

    // CHECKPOINT 2
    {
        x: 290,
        y: 460,
        width: 420,
        height: 140,
        color: "#2196f3",
        label: "2"
    },

    // CHECKPOINT 3
    {
        x: 100,
        y: 235,
        width: 190,
        height: 230,
        color: "#2196f3",
        label: "3"
    }
];

// Finish line
const finishLine = {
    x: 290,
    y: 100,
    width: 420,
    height: 140
};

// =====================================================
// RECTANGLE COLLISION
// =====================================================

function carTouchesRect(rect) {

    const halfW = player.width / 2;
    const halfH = player.height / 2;

    return (
        player.x + halfW > rect.x &&
        player.x - halfW < rect.x + rect.width &&
        player.y + halfH > rect.y &&
        player.y - halfH < rect.y + rect.height
    );
}

// =====================================================
// CHECKPOINT SYSTEM
// =====================================================

function updateCheckpoints() {

    // Race already finished
    if (raceFinished) {
        return;
    }

    // -------------------------------------------------
    // CHECKPOINT 1
    // -------------------------------------------------

    if (
        nextCheckpoint === 0 &&
        carTouchesRect(checkpoints[0])
    ) {
        nextCheckpoint = 1;
    }

    // -------------------------------------------------
    // CHECKPOINT 2
    // -------------------------------------------------

    if (
        nextCheckpoint === 1 &&
        carTouchesRect(checkpoints[1])
    ) {
        nextCheckpoint = 2;
    }

    // -------------------------------------------------
    // CHECKPOINT 3
    // -------------------------------------------------

    if (
        nextCheckpoint === 2 &&
        carTouchesRect(checkpoints[2])
    ) {
        nextCheckpoint = 3;
    }

    // -------------------------------------------------
    // FINISH LINE
    // -------------------------------------------------

    if (
        nextCheckpoint === 3 &&
        carTouchesRect(finishLine)
    ) {

        // Completed the current lap
        if (currentLap >= TOTAL_LAPS) {

            raceFinished = true;

            finishTime =
                (performance.now() - raceStartTime) / 1000;

            player.speed = 0;

        } else {

            // Move to next lap
            currentLap++;

            // Reset checkpoint order
            nextCheckpoint = 0;
        }
    }
}

// =====================================================
// UPDATE PLAYER
// =====================================================

function updatePlayer() {

    if (raceFinished) {
        return;
    }

    const accelerating =
        keys["w"] || keys["arrowup"];

    const braking =
        keys["s"] || keys["arrowdown"];

    const left =
        keys["a"] || keys["arrowleft"];

    const right =
        keys["d"] || keys["arrowright"];

    const drifting =
        keys[" "];

    // =================================================
    // ACCELERATION
    // =================================================

    if (accelerating) {

        player.speed += player.acceleration;

    } else {

        player.speed *= 0.985;
    }

    // =================================================
    // BRAKE / REVERSE
    // =================================================

    if (braking) {
        player.speed -= player.braking;
    }

    // =================================================
    // SPEED LIMIT
    // =================================================

    player.speed = Math.max(
        -2,
        Math.min(
            player.speed,
            player.maxSpeed
        )
    );

    // =================================================
    // STEERING
    // =================================================

    if (Math.abs(player.speed) > 0.1) {

        const direction =
            player.speed >= 0 ? 1 : -1;

        const steeringAmount =
            player.turnSpeed *
            direction *
            (
                Math.abs(player.speed) /
                player.maxSpeed +
                0.3
            );

        if (left) {
            player.angle -= steeringAmount;
        }

        if (right) {
            player.angle += steeringAmount;
        }
    }

    // =================================================
    // DRIFT
    // =================================================

    player.drifting =
        drifting &&
        Math.abs(player.speed) > 1;

    if (player.drifting) {

        player.driftCharge += 0.5;

        if (right) {
            player.angle += 0.012;
        }

        if (left) {
            player.angle -= 0.012;
        }

        if (player.driftCharge > 100) {
            player.driftCharge = 100;
        }

    } else if (player.driftCharge > 0) {

        // Release drift = boost

        if (player.driftCharge > 70) {

            player.boostTimer = 90;

        } else if (player.driftCharge > 35) {

            player.boostTimer = 50;

        } else if (player.driftCharge > 10) {

            player.boostTimer = 25;
        }

        player.driftCharge = 0;
    }

    // =================================================
    // BOOST
    // =================================================

    if (player.boostTimer > 0) {

        player.speed += 0.15;

        player.boostTimer--;

        if (
            player.speed >
            player.maxSpeed + 3
        ) {
            player.speed =
                player.maxSpeed + 3;
        }
    }

    // =================================================
    // MOVE
    // =================================================

    player.x +=
        Math.cos(player.angle) *
        player.speed;

    player.y +=
        Math.sin(player.angle) *
        player.speed;

    // =================================================
    // TRACK COLLISION
    // =================================================

    keepPlayerOnTrack();

    // =================================================
    // CHECKPOINTS
    // =================================================

    updateCheckpoints();
}

// =====================================================
// TRACK COLLISION
// =====================================================

function keepPlayerOnTrack() {

    const dx =
        player.x - track.centerX;

    const dy =
        player.y - track.centerY;

    const outerX =
        track.outerWidth / 2;

    const outerY =
        track.outerHeight / 2;

    const innerX =
        track.innerWidth / 2;

    const innerY =
        track.innerHeight / 2;

    // -------------------------------------------------
    // OUTSIDE TRACK
    // -------------------------------------------------

    if (
        Math.abs(dx) > outerX ||
        Math.abs(dy) > outerY
    ) {

        player.x -=
            Math.cos(player.angle) *
            player.speed;

        player.y -=
            Math.sin(player.angle) *
            player.speed;

        player.speed *= 0.5;
    }

    // -------------------------------------------------
    // CENTER GRASS
    // -------------------------------------------------

    if (
        Math.abs(dx) < innerX &&
        Math.abs(dy) < innerY
    ) {

        player.x -=
            Math.cos(player.angle) *
            player.speed;

        player.y -=
            Math.sin(player.angle) *
            player.speed;

        player.speed *= 0.7;
    }
}

// =====================================================
// DRAW CHECKER PATTERN
// =====================================================

function drawCheckerPattern(rect) {

    const squareSize = 20;

    const columns =
        Math.ceil(rect.width / squareSize);

    const rows =
        Math.ceil(rect.height / squareSize);

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < columns; col++) {

            if ((row + col) % 2 === 0) {
                ctx.fillStyle = "#fff";
            } else {
                ctx.fillStyle = "#111";
            }

            ctx.fillRect(
                rect.x + col * squareSize,
                rect.y + row * squareSize,
                squareSize,
                squareSize
            );
        }
    }
}

// =====================================================
// DRAW TRACK
// =====================================================

function drawTrack() {

    // -------------------------------------------------
    // GRASS BACKGROUND
    // -------------------------------------------------

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // -------------------------------------------------
    // TRACK
    // -------------------------------------------------

    ctx.fillStyle = "#444";

    ctx.fillRect(
        track.centerX -
            track.outerWidth / 2,

        track.centerY -
            track.outerHeight / 2,

        track.outerWidth,
        track.outerHeight
    );

    // -------------------------------------------------
    // CENTER GRASS
    // -------------------------------------------------

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        track.centerX -
            track.innerWidth / 2,

        track.centerY -
            track.innerHeight / 2,

        track.innerWidth,
        track.innerHeight
    );

    // -------------------------------------------------
    // OUTER BORDER
    // -------------------------------------------------

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;

    ctx.strokeRect(
        track.centerX -
            track.outerWidth / 2,

        track.centerY -
            track.outerHeight / 2,

        track.outerWidth,
        track.outerHeight
    );

    // -------------------------------------------------
    // INNER BORDER
    // -------------------------------------------------

    ctx.strokeRect(
        track.centerX -
            track.innerWidth / 2,

        track.centerY -
            track.innerHeight / 2,

        track.innerWidth,
        track.innerHeight
    );
}

// =====================================================
// DRAW CHECKPOINTS
// =====================================================

function drawCheckpoints() {

    for (
        let i = 0;
        i < checkpoints.length;
        i++
    ) {

        const checkpoint =
            checkpoints[i];

        // Only show the next checkpoint brightly
        if (i === nextCheckpoint) {

            ctx.fillStyle =
                checkpoint.color + "55";

            ctx.strokeStyle =
                checkpoint.color;

            ctx.lineWidth = 5;

        } else {

            ctx.fillStyle =
                "rgba(100,140,180,0.15)";

            ctx.strokeStyle =
                "rgba(150,170,190,0.35)";

            ctx.lineWidth = 3;
        }

        ctx.fillRect(
            checkpoint.x,
            checkpoint.y,
            checkpoint.width,
            checkpoint.height
        );

        ctx.strokeRect(
            checkpoint.x,
            checkpoint.y,
            checkpoint.width,
            checkpoint.height
        );

        // Number
        ctx.fillStyle =
            i === nextCheckpoint
                ? "#fff"
                : "rgba(255,255,255,0.6)";

        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            checkpoint.label,
            checkpoint.x +
                checkpoint.width / 2,

            checkpoint.y +
                checkpoint.height / 2
        );
    }

    // -------------------------------------------------
    // FINISH LINE
    // -------------------------------------------------

    if (nextCheckpoint === 3) {

        drawCheckerPattern(
            finishLine
        );

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 5;

        ctx.strokeRect(
            finishLine.x,
            finishLine.y,
            finishLine.width,
            finishLine.height
        );

    } else {

        // Show a subtle outline before it is active
        ctx.strokeStyle =
            "rgba(255,255,255,0.15)";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            finishLine.x,
            finishLine.y,
            finishLine.width,
            finishLine.height
        );
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

// =====================================================
// DRAW PLAYER
// =====================================================

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(
        player.angle
    );

    // -------------------------------------------------
    // BOOST FLAMES
    // -------------------------------------------------

    if (player.boostTimer > 0) {

        ctx.fillStyle = "#ff8c00";

        ctx.beginPath();

        ctx.moveTo(-22, 0);

        ctx.lineTo(-42, -8);

        ctx.lineTo(-32, 0);

        ctx.lineTo(-42, 8);

        ctx.closePath();

        ctx.fill();
    }

    // -------------------------------------------------
    // KART
    // -------------------------------------------------

    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        -16,
        -9,
        32,
        18
    );

    // -------------------------------------------------
    // DRIVER
    // -------------------------------------------------

    ctx.fillStyle = "#222";

    ctx.beginPath();

    ctx.arc(
        6,
        0,
        6,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // -------------------------------------------------
    // WHEELS
    // -------------------------------------------------

    ctx.fillStyle = "#111";

    ctx.fillRect(
        -12,
        -12,
        8,
        5
    );

    ctx.fillRect(
        4,
        -12,
        8,
        5
    );

    ctx.fillRect(
        -12,
        7,
        8,
        5
    );

    ctx.fillRect(
        4,
        7,
        8,
        5
    );

    ctx.restore();
}

// =====================================================
// DRAW UI
// =====================================================

function drawUI() {

    ctx.fillStyle =
        "rgba(0,0,0,0.72)";

    ctx.fillRect(
        20,
        20,
        270,
        145
    );

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 18px Arial";

    // Speed
    ctx.fillText(
        "SPEED: " +
        Math.round(
            Math.abs(player.speed) * 20
        ),
        35,
        50
    );

    // Lap
    ctx.fillText(
        "LAP: " +
        currentLap +
        " / " +
        TOTAL_LAPS,
        35,
        80
    );

    // Drift
    ctx.fillText(
        "DRIFT: " +
        Math.round(
            player.driftCharge
        ) +
        "%",
        35,
        110
    );

    // Checkpoint
    if (!raceFinished) {

        let checkpointText;

        if (nextCheckpoint < 3) {

            checkpointText =
                "CHECKPOINT: " +
                (nextCheckpoint + 1) +
                " / 3";

        } else {

            checkpointText =
                "FINISH LINE";
        }

        ctx.fillText(
            checkpointText,
            35,
            140
        );
    }

    // Boost
    if (player.boostTimer > 0) {

        ctx.fillStyle = "#ffd000";

        ctx.font =
            "bold 24px Arial";

        ctx.fillText(
            "BOOST!",
            35,
            170
        );
    }
}

// =====================================================
// FINISH SCREEN
// =====================================================

function drawFinishScreen() {

    if (!raceFinished) {
        return;
    }

    // Dark overlay
    ctx.fillStyle =
        "rgba(0,0,0,0.65)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Box
    const boxWidth = 430;
    const boxHeight = 190;

    const boxX =
        canvas.width / 2 -
        boxWidth / 2;

    const boxY =
        canvas.height / 2 -
        boxHeight / 2;

    ctx.fillStyle =
        "#0b1f0b";

    ctx.fillRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight
    );

    ctx.strokeStyle =
        "#ffd000";

    ctx.lineWidth = 4;

    ctx.strokeRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight
    );

    // Title
    ctx.fillStyle =
        "#ffd000";

    ctx.font =
        "bold 32px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "RACE FINISHED!",
        canvas.width / 2,
        boxY + 60
    );

    // Time
    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 20px Arial";

    ctx.fillText(
        "TIME: " +
        finishTime.toFixed(2) +
        " seconds",
        canvas.width / 2,
        boxY + 105
    );

    ctx.font =
        "18px Arial";

    ctx.fillText(
        "Great driving!",
        canvas.width / 2,
        boxY + 145
    );

    ctx.textAlign = "left";
}

// =====================================================
// DRAW EVERYTHING
// =====================================================

function draw() {

    // Clear screen
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawTrack();

    drawCheckpoints();

    drawPlayer();

    drawUI();

    drawFinishScreen();
}

// =====================================================
// GAME LOOP
// =====================================================

function gameLoop() {

    updatePlayer();

    draw();

    requestAnimationFrame(
        gameLoop
    );
}

// =====================================================
// START GAME
// =====================================================

gameLoop();
