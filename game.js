const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ============================================================
// CANVAS
// ============================================================

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
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

    // Press R to restart after finishing
    if (key === "r" && race.finished) {
        resetRace();
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

const race = {
    totalLaps: 3,

    // 0 = checkpoint 1
    // 1 = checkpoint 2
    // 2 = checkpoint 3
    // 3 = finish line
    nextCheckpoint: 0,

    currentLap: 1,

    startTime: performance.now(),
    finishTime: 0,

    finished: false
};

// ============================================================
// PLAYER
// ============================================================

const player = {
    // Start near the top of the track
    x: 500,
    y: 200,

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
//
// These are placed ACROSS the road.
//
// 1 = right side
// 2 = bottom
// 3 = left side
// Finish = top
// ============================================================

const checkpoints = [

    // ========================================================
    // CHECKPOINT 1 - RIGHT SIDE
    // ========================================================

    {
        name: "CHECKPOINT 1",
        x: track.centerX + track.innerWidth / 2,
        y: track.centerY,

        // Spans from inner edge to outer edge
        width: (track.outerWidth - track.innerWidth) / 2,
        height: 32,

        type: "checkpoint"
    },

    // ========================================================
    // CHECKPOINT 2 - BOTTOM
    // ========================================================

    {
        name: "CHECKPOINT 2",
        x: track.centerX,
        y: track.centerY + track.innerHeight / 2,

        // Spans from inner edge to outer edge
        width: 32,
        height: (track.outerHeight - track.innerHeight) / 2,

        type: "checkpoint"
    },

    // ========================================================
    // CHECKPOINT 3 - LEFT SIDE
    // ========================================================

    {
        name: "CHECKPOINT 3",
        x: track.centerX - track.innerWidth / 2,
        y: track.centerY,

        // Spans from inner edge to outer edge
        width: (track.outerWidth - track.innerWidth) / 2,
        height: 32,

        type: "checkpoint"
    },

    // ========================================================
    // FINISH LINE - TOP
    // ========================================================

    {
        name: "FINISH",
        x: track.centerX,
        y: track.centerY - track.innerHeight / 2,

        // Spans from inner edge to outer edge
        width: 32,
        height: (track.outerHeight - track.innerHeight) / 2,

        type: "finish"
    }
];

// ============================================================
// RESET RACE
// ============================================================

function resetRace() {

    player.x = 500;
    player.y = 200;

    player.angle = 0;
    player.speed = 0;

    player.drifting = false;
    player.driftCharge = 0;
    player.boostTimer = 0;

    race.nextCheckpoint = 0;
    race.currentLap = 1;

    race.startTime = performance.now();
    race.finishTime = 0;

    race.finished = false;
}

// ============================================================
// UPDATE PLAYER
// ============================================================

function updatePlayer() {

    if (race.finished) {
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
    // BRAKING / REVERSE
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
            player.angle -= steeringAmount;
        }

        if (right) {
            player.angle += steeringAmount;
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

    keepPlayerOnTrack();

    checkCheckpoints();
}

// ============================================================
// TRACK COLLISION
// ============================================================

function keepPlayerOnTrack() {

    const dx =
        player.x -
        track.centerX;

    const dy =
        player.y -
        track.centerY;

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
        Math.abs(dx) >
            outerX - player.width / 2 ||
        Math.abs(dy) >
            outerY - player.height / 2
    ) {

        player.x -=
            Math.cos(player.angle) *
            player.speed;

        player.y -=
            Math.sin(player.angle) *
            player.speed;

        player.speed *= 0.45;
    }

    // ========================================================
    // CENTER GRASS
    // ========================================================

    if (
        Math.abs(dx) <
            innerX + player.width / 2 &&
        Math.abs(dy) <
            innerY + player.height / 2
    ) {

        // Only push back if the kart is actually
        // inside the grass island.

        if (
            Math.abs(dx) <
                innerX &&
            Math.abs(dy) <
                innerY
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
}

// ============================================================
// RECTANGLE COLLISION
// ============================================================

function isPlayerTouching(rect) {

    const playerRadius =
        Math.max(
            player.width,
            player.height
        ) / 2;

    return (
        player.x + playerRadius >
            rect.x - rect.width / 2 &&

        player.x - playerRadius <
            rect.x + rect.width / 2 &&

        player.y + playerRadius >
            rect.y - rect.height / 2 &&

        player.y - playerRadius <
            rect.y + rect.height / 2
    );
}

// ============================================================
// CHECKPOINT SYSTEM
// ============================================================

function checkCheckpoints() {

    if (race.finished) {
        return;
    }

    const checkpoint =
        checkpoints[race.nextCheckpoint];

    if (!checkpoint) {
        return;
    }

    if (
        isPlayerTouching(checkpoint)
    ) {

        // ====================================================
        // CHECKPOINT 1
        // ====================================================

        if (race.nextCheckpoint === 0) {

            race.nextCheckpoint = 1;

            return;
        }

        // ====================================================
        // CHECKPOINT 2
        // ====================================================

        if (race.nextCheckpoint === 1) {

            race.nextCheckpoint = 2;

            return;
        }

        // ====================================================
        // CHECKPOINT 3
        // ====================================================

        if (race.nextCheckpoint === 2) {

            race.nextCheckpoint = 3;

            return;
        }

        // ====================================================
        // FINISH LINE
        // ====================================================

        if (race.nextCheckpoint === 3) {

            // Make sure all three checkpoints
            // were completed first.

            if (
                race.currentLap <
                race.totalLaps
            ) {

                race.currentLap++;

                // Start the checkpoint sequence again
                race.nextCheckpoint = 0;

            } else {

                // ==================================================
                // RACE COMPLETE
                // ==================================================

                race.finished = true;

                race.finishTime =
                    performance.now();
            }
        }
    }
}

// ============================================================
// DRAW TRACK
// ============================================================

function drawTrack() {

    // ========================================================
    // GRASS
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
    // OUTER BORDER
    // ========================================================

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

    // ========================================================
    // INNER BORDER
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
    // DRAW CHECKPOINTS
    // ========================================================

    drawCheckpoint(
        checkpoints[0],
        0
    );

    drawCheckpoint(
        checkpoints[1],
        1
    );

    drawCheckpoint(
        checkpoints[2],
        2
    );

    // ========================================================
    // FINISH LINE
    // ========================================================

    drawFinishLine(
        checkpoints[3]
    );
}

// ============================================================
// DRAW CHECKPOINT
// ============================================================

function drawCheckpoint(
    checkpoint,
    index
) {

    const active =
        race.nextCheckpoint === index;

    // Active checkpoint is brighter
    if (active) {

        ctx.fillStyle =
            "rgba(255, 210, 0, 0.45)";

        ctx.strokeStyle =
            "#ffd000";

    } else {

        ctx.fillStyle =
            "rgba(60, 150, 255, 0.22)";

        ctx.strokeStyle =
            "rgba(100, 180, 255, 0.65)";
    }

    ctx.lineWidth = 4;

    ctx.fillRect(
        checkpoint.x -
            checkpoint.width / 2,

        checkpoint.y -
            checkpoint.height / 2,

        checkpoint.width,
        checkpoint.height
    );

    ctx.strokeRect(
        checkpoint.x -
            checkpoint.width / 2,

        checkpoint.y -
            checkpoint.height / 2,

        checkpoint.width,
        checkpoint.height
    );

    // ========================================================
    // NUMBER
    // ========================================================

    ctx.fillStyle = "#fff";

    ctx.font = "bold 20px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        String(index + 1),
        checkpoint.x,
        checkpoint.y
    );

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

// ============================================================
// DRAW FINISH LINE
// ============================================================

function drawFinishLine(
    finish
) {

    const squareSize = 18;

    const columns =
        Math.max(
            1,
            Math.floor(
                finish.width /
                squareSize
            )
        );

    const rows =
        Math.max(
            1,
            Math.floor(
                finish.height /
                squareSize
            )
        );

    const startX =
        finish.x -
        (columns * squareSize) / 2;

    const startY =
        finish.y -
        (rows * squareSize) / 2;

    // ========================================================
    // CHECKERBOARD
    // ========================================================

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let col = 0;
            col < columns;
            col++
        ) {

            if (
                (row + col) % 2 === 0
            ) {

                ctx.fillStyle = "#fff";

            } else {

                ctx.fillStyle = "#111";
            }

            ctx.fillRect(
                startX +
                    col * squareSize,

                startY +
                    row * squareSize,

                squareSize,
                squareSize
            );
        }
    }

    // ========================================================
    // FINISH BORDER
    // ========================================================

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;

    ctx.strokeRect(
        finish.x -
            finish.width / 2,

        finish.y -
            finish.height / 2,

        finish.width,
        finish.height
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

    if (
        player.boostTimer > 0
    ) {

        ctx.fillStyle = "#ff8c00";

        ctx.beginPath();

        ctx.moveTo(-22, 0);

        ctx.lineTo(-42, -8);

        ctx.lineTo(-33, 0);

        ctx.lineTo(-42, 8);

        ctx.closePath();

        ctx.fill();

        ctx.fillStyle = "#ffe600";

        ctx.beginPath();

        ctx.moveTo(-22, 0);

        ctx.lineTo(-35, -4);

        ctx.lineTo(-29, 0);

        ctx.lineTo(-35, 4);

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
    // FRONT
    // ========================================================

    ctx.fillStyle = "#ff5555";

    ctx.fillRect(
        10,
        -7,
        6,
        14
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
        270,
        175
    );

    ctx.fillStyle = "#fff";

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
        race.currentLap +
        " / " +
        race.totalLaps,
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
    // CHECKPOINT
    // ========================================================

    let checkpointText;

    if (
        race.nextCheckpoint < 3
    ) {

        checkpointText =
            "CHECKPOINT: " +
            (race.nextCheckpoint + 1) +
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

    // ========================================================
    // TIME
    // ========================================================

    let elapsedTime;

    if (race.finished) {

        elapsedTime =
            (race.finishTime -
                race.startTime) /
            1000;

    } else {

        elapsedTime =
            (performance.now() -
                race.startTime) /
            1000;
    }

    ctx.fillText(
        "TIME: " +
        elapsedTime.toFixed(2),
        35,
        170
    );

    // ========================================================
    // BOOST
    // ========================================================

    if (
        player.boostTimer > 0
    ) {

        ctx.fillStyle =
            "#ffd000";

        ctx.font =
            "bold 26px Arial";

        ctx.fillText(
            "BOOST!",
            35,
            205
        );
    }
}

// ============================================================
// FINISH SCREEN
// ============================================================

function drawFinishScreen() {

    if (!race.finished) {
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
    // PANEL
    // ========================================================

    const panelWidth = 420;
    const panelHeight = 180;

    const panelX =
        canvas.width / 2 -
        panelWidth / 2;

    const panelY =
        canvas.height / 2 -
        panelHeight / 2;

    ctx.fillStyle =
        "rgba(5,25,5,0.95)";

    ctx.fillRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight
    );

    ctx.strokeStyle =
        "#ffd000";

    ctx.lineWidth = 4;

    ctx.strokeRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight
    );

    // ========================================================
    // TITLE
    // ========================================================

    ctx.textAlign = "center";

    ctx.fillStyle =
        "#ffd000";

    ctx.font =
        "bold 34px Arial";

    ctx.fillText(
        "RACE FINISHED!",
        canvas.width / 2,
        panelY + 65
    );

    // ========================================================
    // TIME
    // ========================================================

    const finalTime =
        (
            race.finishTime -
            race.startTime
        ) / 1000;

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 22px Arial";

    ctx.fillText(
        "TIME: " +
        finalTime.toFixed(2) +
        " seconds",
        canvas.width / 2,
        panelY + 105
    );

    // ========================================================
    // RESTART
    // ========================================================

    ctx.font =
        "18px Arial";

    ctx.fillText(
        "Press R to race again",
        canvas.width / 2,
        panelY + 145
    );

    ctx.textAlign = "left";
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

resetRace();

gameLoop();
