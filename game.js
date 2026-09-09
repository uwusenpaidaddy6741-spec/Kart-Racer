const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ============================================================
// CANVAS
// ============================================================

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Keep the track centered if the canvas changes size
    track.centerX = canvas.width / 2;
    track.centerY = canvas.height / 2;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);


// ============================================================
// INPUT
// ============================================================

const keys = {};

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    keys[key] = true;

    if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
    ) {
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});


// ============================================================
// TRACK
// ============================================================

const track = {
    centerX: 500,
    centerY: 350,

    outerWidth: 800,
    outerHeight: 500,

    innerWidth: 420,
    innerHeight: 220
};


// ============================================================
// RACE SETTINGS
// ============================================================

const TOTAL_LAPS = 3;

let currentLap = 1;

// 0 = waiting for checkpoint 1
// 1 = waiting for checkpoint 2
// 2 = waiting for checkpoint 3
// 3 = waiting for finish line
let checkpointProgress = 0;

let raceFinished = false;

let raceStartTime = performance.now();
let finishTime = 0;


// ============================================================
// PLAYER
// ============================================================

const player = {
    // Start on the bottom section of the track
    x: 500,
    y: 530,

    // Facing right
    angle: 0,

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


// ============================================================
// CHECKPOINTS
// ============================================================
//
// The checkpoints span the ROAD, not the grass.
//
// Track:
//   Outer: 800 x 500
//   Inner: 420 x 220
//
// Road sections:
//
//   TOP    = y 100 -> 240
//   RIGHT  = x 710 -> 900
//   BOTTOM = y 460 -> 600
//   LEFT   = x 100 -> 290
//
// ============================================================

function getCheckpoints() {

    const cx = track.centerX;
    const cy = track.centerY;

    const outerLeft =
        cx - track.outerWidth / 2;

    const outerRight =
        cx + track.outerWidth / 2;

    const outerTop =
        cy - track.outerHeight / 2;

    const outerBottom =
        cy + track.outerHeight / 2;

    const innerLeft =
        cx - track.innerWidth / 2;

    const innerRight =
        cx + track.innerWidth / 2;

    const innerTop =
        cy - track.innerHeight / 2;

    const innerBottom =
        cy + track.innerHeight / 2;

    return {

        // ====================================================
        // CHECKPOINT 1 — RIGHT
        // ====================================================

        checkpoint1: {
            x: innerRight,
            y: innerTop,
            width: outerRight - innerRight,
            height: innerBottom - innerTop
        },

        // ====================================================
        // CHECKPOINT 2 — BOTTOM
        // ====================================================

        checkpoint2: {
            x: innerLeft,
            y: innerBottom,
            width: innerRight - innerLeft,
            height: outerBottom - innerBottom
        },

        // ====================================================
        // CHECKPOINT 3 — LEFT
        // ====================================================

        checkpoint3: {
            x: outerLeft,
            y: innerTop,
            width: innerLeft - outerLeft,
            height: innerBottom - innerTop
        },

        // ====================================================
        // FINISH LINE — TOP
        // ====================================================

        finish: {
            x: innerLeft,
            y: outerTop,
            width: innerRight - innerLeft,
            height: innerTop - outerTop
        }
    };
}


// ============================================================
// RECTANGLE COLLISION
// ============================================================

function playerTouchesGate(gate) {

    // Give the kart a little collision size
    const padding = 12;

    return (
        player.x + padding > gate.x &&
        player.x - padding < gate.x + gate.width &&
        player.y + padding > gate.y &&
        player.y - padding < gate.y + gate.height
    );
}


// ============================================================
// CHECKPOINT SYSTEM
// ============================================================

function checkRaceProgress() {

    if (raceFinished) {
        return;
    }

    const gates = getCheckpoints();

    // ========================================================
    // CHECKPOINT 1
    // ========================================================

    if (
        checkpointProgress === 0 &&
        playerTouchesGate(gates.checkpoint1)
    ) {

        checkpointProgress = 1;

        return;
    }


    // ========================================================
    // CHECKPOINT 2
    // ========================================================

    if (
        checkpointProgress === 1 &&
        playerTouchesGate(gates.checkpoint2)
    ) {

        checkpointProgress = 2;

        return;
    }


    // ========================================================
    // CHECKPOINT 3
    // ========================================================

    if (
        checkpointProgress === 2 &&
        playerTouchesGate(gates.checkpoint3)
    ) {

        checkpointProgress = 3;

        return;
    }


    // ========================================================
    // FINISH LINE
    // ========================================================

    if (
        checkpointProgress === 3 &&
        playerTouchesGate(gates.finish)
    ) {

        // Final lap
        if (currentLap >= TOTAL_LAPS) {

            raceFinished = true;

            finishTime =
                (performance.now() - raceStartTime) / 1000;

            player.speed = 0;

        }

        // Next lap
        else {

            currentLap++;

            // Start looking for checkpoint 1 again
            checkpointProgress = 0;
        }
    }
}


// ============================================================
// UPDATE PLAYER
// ============================================================

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


    // ========================================================
    // ACCELERATION
    // ========================================================

    if (accelerating) {

        player.speed += player.acceleration;

    } else {

        player.speed *= 0.985;
    }


    // ========================================================
    // BRAKE / REVERSE
    // ========================================================

    if (braking) {

        player.speed -= player.braking;
    }


    // ========================================================
    // SPEED LIMIT
    // ========================================================

    player.speed = Math.max(
        -2,
        Math.min(
            player.speed,
            player.maxSpeed
        )
    );


    // ========================================================
    // STEERING
    // ========================================================

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

            player.angle -=
                steeringAmount;
        }

        if (right) {

            player.angle +=
                steeringAmount;
        }
    }


    // ========================================================
    // DRIFTING
    // ========================================================

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

        // ====================================================
        // RELEASE DRIFT = BOOST
        // ====================================================

        if (player.driftCharge > 70) {

            player.boostTimer = 90;

        } else if (player.driftCharge > 35) {

            player.boostTimer = 50;

        } else if (player.driftCharge > 10) {

            player.boostTimer = 25;
        }

        player.driftCharge = 0;
    }


    // ========================================================
    // BOOST
    // ========================================================

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


    // ========================================================
    // MOVE
    // ========================================================

    player.x +=
        Math.cos(player.angle) *
        player.speed;

    player.y +=
        Math.sin(player.angle) *
        player.speed;


    // ========================================================
    // TRACK COLLISION
    // ========================================================

    keepPlayerOnTrack();


    // ========================================================
    // CHECKPOINTS
    // ========================================================

    checkRaceProgress();
}


// ============================================================
// TRACK COLLISION
// ============================================================

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


    // ========================================================
    // OUTSIDE TRACK
    // ========================================================

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


    // ========================================================
    // CENTER GRASS / ISLAND
    // ========================================================

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


// ============================================================
// DRAW CHECKERED GATE
// ============================================================

function drawCheckerGate(gate) {

    const squareSize = 20;

    ctx.save();

    ctx.beginPath();

    ctx.rect(
        gate.x,
        gate.y,
        gate.width,
        gate.height
    );

    ctx.clip();


    // ========================================================
    // BACKGROUND
    // ========================================================

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        gate.x,
        gate.y,
        gate.width,
        gate.height
    );


    // ========================================================
    // CHECKER PATTERN
    // ========================================================

    ctx.fillStyle = "#111";

    const columns =
        Math.ceil(gate.width / squareSize) + 1;

    const rows =
        Math.ceil(gate.height / squareSize) + 1;

    for (let row = 0; row < rows; row++) {

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            if ((row + column) % 2 === 0) {

                ctx.fillRect(
                    gate.x +
                    column * squareSize,

                    gate.y +
                    row * squareSize,

                    squareSize,
                    squareSize
                );
            }
        }
    }

    ctx.restore();


    // ========================================================
    // OUTLINE
    // ========================================================

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;

    ctx.strokeRect(
        gate.x,
        gate.y,
        gate.width,
        gate.height
    );
}


// ============================================================
// DRAW CHECKPOINT
// ============================================================

function drawCheckpoint(
    gate,
    number,
    active
) {

    ctx.save();

    // Active checkpoint
    if (active) {

        ctx.fillStyle =
            "rgba(255, 210, 0, 0.45)";

        ctx.strokeStyle =
            "#ffd000";

    } else {

        ctx.fillStyle =
            "rgba(60, 130, 190, 0.25)";

        ctx.strokeStyle =
            "rgba(100, 170, 230, 0.65)";
    }

    ctx.fillRect(
        gate.x,
        gate.y,
        gate.width,
        gate.height
    );

    ctx.lineWidth = 4;

    ctx.strokeRect(
        gate.x,
        gate.y,
        gate.width,
        gate.height
    );


    // ========================================================
    // NUMBER
    // ========================================================

    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold 22px Arial";

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillText(
        number,
        gate.x + gate.width / 2,
        gate.y + gate.height / 2
    );

    ctx.restore();
}


// ============================================================
// DRAW TRACK
// ============================================================

function drawTrack() {

    const gates =
        getCheckpoints();


    // ========================================================
    // GRASS BACKGROUND
    // ========================================================

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // ========================================================
    // ROAD
    // ========================================================

    ctx.fillStyle = "#444";

    ctx.fillRect(
        track.centerX -
        track.outerWidth / 2,

        track.centerY -
        track.outerHeight / 2,

        track.outerWidth,
        track.outerHeight
    );


    // ========================================================
    // CENTER GRASS
    // ========================================================

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        track.centerX -
        track.innerWidth / 2,

        track.centerY -
        track.innerHeight / 2,

        track.innerWidth,
        track.innerHeight
    );


    // ========================================================
    // OUTER TRACK BORDER
    // ========================================================

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 5;

    ctx.strokeRect(
        track.centerX -
        track.outerWidth / 2,

        track.centerY -
        track.outerHeight / 2,

        track.outerWidth,
        track.outerHeight
    );


    // ========================================================
    // INNER TRACK BORDER
    // ========================================================

    ctx.strokeRect(
        track.centerX -
        track.innerWidth / 2,

        track.centerY -
        track.innerHeight / 2,

        track.innerWidth,
        track.innerHeight
    );


    // ========================================================
    // FINISH LINE
    // ========================================================

    drawCheckerGate(gates.finish);


    // ========================================================
    // CHECKPOINT 1
    // ========================================================

    drawCheckpoint(
        gates.checkpoint1,
        1,
        checkpointProgress === 0
    );


    // ========================================================
    // CHECKPOINT 2
    // ========================================================

    drawCheckpoint(
        gates.checkpoint2,
        2,
        checkpointProgress === 1
    );


    // ========================================================
    // CHECKPOINT 3
    // ========================================================

    drawCheckpoint(
        gates.checkpoint3,
        3,
        checkpointProgress === 2
    );
}


// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(
        player.angle
    );


    // ========================================================
    // BOOST FLAMES
    // ========================================================

    if (player.boostTimer > 0) {

        ctx.fillStyle = "#ff8c00";

        ctx.beginPath();

        ctx.moveTo(-22, 0);

        ctx.lineTo(-38, -7);

        ctx.lineTo(-32, 0);

        ctx.lineTo(-38, 7);

        ctx.closePath();

        ctx.fill();
    }


    // ========================================================
    // KART BODY
    // ========================================================

    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        -16,
        -9,
        32,
        18
    );


    // ========================================================
    // DRIVER
    // ========================================================

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


    // ========================================================
    // WHEELS
    // ========================================================

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


// ============================================================
// UI
// ============================================================

function drawUI() {

    ctx.fillStyle =
        "rgba(0,0,0,0.72)";

    ctx.fillRect(
        20,
        20,
        260,
        180
    );


    ctx.fillStyle = "#ffffff";

    ctx.font =
        "bold 18px Arial";


    // ========================================================
    // SPEED
    // ========================================================

    ctx.fillText(
        "SPEED: " +
        Math.round(
            Math.abs(player.speed) * 20
        ),

        35,
        50
    );


    // ========================================================
    // LAP
    // ========================================================

    ctx.fillText(
        "LAP: " +
        currentLap +
        " / " +
        TOTAL_LAPS,

        35,
        80
    );


    // ========================================================
    // DRIFT
    // ========================================================

    ctx.fillText(
        "DRIFT: " +
        Math.round(
            player.driftCharge
        ) +
        "%",

        35,
        110
    );


    // ========================================================
    // CHECKPOINT STATUS
    // ========================================================

    if (!raceFinished) {

        if (checkpointProgress < 3) {

            ctx.fillText(
                "CHECKPOINT: " +
                (
                    checkpointProgress + 1
                ) +
                " / 3",

                35,
                140
            );

        } else {

            ctx.fillText(
                "FINISH LINE!",

                35,
                140
            );
        }
    }


    // ========================================================
    // TIME
    // ========================================================

    const elapsedTime =
        raceFinished
            ? finishTime
            : (
                performance.now() -
                raceStartTime
            ) / 1000;

    ctx.fillText(
        "TIME: " +
        elapsedTime.toFixed(2),

        35,
        170
    );


    // ========================================================
    // BOOST
    // ========================================================

    if (player.boostTimer > 0) {

        ctx.fillStyle = "#ffd000";

        ctx.font =
            "bold 24px Arial";

        ctx.fillText(
            "BOOST!",
            35,
            200
        );
    }
}


// ============================================================
// FINISH SCREEN
// ============================================================

function drawFinishScreen() {

    if (!raceFinished) {
        return;
    }


    // ========================================================
    // DARK OVERLAY
    // ========================================================

    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // ========================================================
    // FINISH BOX
    // ========================================================

    const boxWidth = 420;
    const boxHeight = 170;

    const boxX =
        canvas.width / 2 -
        boxWidth / 2;

    const boxY =
        canvas.height / 2 -
        boxHeight / 2;


    ctx.fillStyle =
        "rgba(5,25,5,0.95)";

    ctx.fillRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight
    );


    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight
    );


    // ========================================================
    // TITLE
    // ========================================================

    ctx.fillStyle =
        "#ffd000";

    ctx.font =
        "bold 34px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "RACE FINISHED!",
        canvas.width / 2,
        boxY + 65
    );


    // ========================================================
    // TIME
    // ========================================================

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "20px Arial";

    ctx.fillText(
        "Final Time: " +
        finishTime.toFixed(2) +
        " seconds",

        canvas.width / 2,
        boxY + 105
    );


    ctx.font =
        "16px Arial";

    ctx.fillText(
        "Great driving!",

        canvas.width / 2,
        boxY + 140
    );


    ctx.textAlign =
        "left";
}


// ============================================================
// GAME LOOP
// ============================================================

function gameLoop() {

    updatePlayer();

    drawTrack();

    drawPlayer();

    drawUI();

    drawFinishScreen();

    requestAnimationFrame(
        gameLoop
    );
}


// ============================================================
// START GAME
// ============================================================

gameLoop();
