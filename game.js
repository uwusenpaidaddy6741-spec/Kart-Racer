const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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
    keys[event.key.toLowerCase()] = true;

    if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(
            event.key.toLowerCase()
        )
    ) {
        event.preventDefault();
    }

    // Restart after finishing
    if (
        event.key.toLowerCase() === "r" &&
        race.finished
    ) {
        resetRace();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// =====================================================
// PLAYER
// =====================================================

const player = {
    x: 500,
    y: 200,

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
// RACE SETTINGS
// =====================================================

const race = {
    totalLaps: 3,

    // 0 = checkpoint 1
    // 1 = checkpoint 2
    // 2 = checkpoint 3
    // 3 = ready for finish line
    checkpoint: 0,

    lap: 1,

    finished: false,

    startTime: performance.now(),
    finishTime: 0
};

// =====================================================
// CHECKPOINTS
// =====================================================
//
// The checkpoints now stretch from one side of the
// road to the other.
//
// 1 = RIGHT SIDE
// 2 = BOTTOM
// 3 = LEFT SIDE
//
// Finish = TOP
// =====================================================

const checkpoints = [

    // CHECKPOINT 1
    // Horizontal line across the right side of the road
    {
        x: 710,
        y: 300,
        width: 190,
        height: 40,
        color: "#ffd400",
        label: "1"
    },

    // CHECKPOINT 2
    // Vertical line across the bottom of the road
    {
        x: 580,
        y: 600,
        width: 40,
        height: 100,
        color: "#4da6ff",
        label: "2"
    },

    // CHECKPOINT 3
    // Horizontal line across the left side of the road
    {
        x: 100,
        y: 300,
        width: 190,
        height: 40,
        color: "#4da6ff",
        label: "3"
    }
];

// =====================================================
// FINISH LINE
// =====================================================
//
// Spans the entire road at the top.
// =====================================================

const finishLine = {
    x: 290,
    y: 100,
    width: 420,
    height: 40
};

// =====================================================
// RESET RACE
// =====================================================

function resetRace() {

    player.x = 500;
    player.y = 200;

    player.angle = 0;

    player.speed = 0;

    player.drifting = false;
    player.driftCharge = 0;
    player.boostTimer = 0;

    race.checkpoint = 0;
    race.lap = 1;
    race.finished = false;

    race.startTime = performance.now();
    race.finishTime = 0;
}

// =====================================================
// RECTANGLE COLLISION
// =====================================================

function rectangleCollision(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

// =====================================================
// CHECKPOINT COLLISION
// =====================================================

function checkCheckpointCollision() {

    if (race.finished) {
        return;
    }

    if (race.checkpoint >= checkpoints.length) {
        return;
    }

    const checkpoint = checkpoints[race.checkpoint];

    // Give the kart a little collision box
    const kartBox = {
        x: player.x - 14,
        y: player.y - 10,
        width: 28,
        height: 20
    };

    if (rectangleCollision(kartBox, checkpoint)) {

        race.checkpoint++;

        console.log(
            "Checkpoint reached:",
            race.checkpoint
        );
    }
}

// =====================================================
// FINISH LINE COLLISION
// =====================================================

function checkFinishLine() {

    if (race.finished) {
        return;
    }

    // You MUST complete all 3 checkpoints first
    if (race.checkpoint < checkpoints.length) {
        return;
    }

    const kartBox = {
        x: player.x - 14,
        y: player.y - 10,
        width: 28,
        height: 20
    };

    if (rectangleCollision(kartBox, finishLine)) {

        // Finished the final lap
        if (race.lap >= race.totalLaps) {

            race.finished = true;
            race.finishTime = performance.now();

            player.speed = 0;

            return;
        }

        // Next lap
        race.lap++;

        // Start looking for checkpoint 1 again
        race.checkpoint = 0;

        console.log(
            "Lap complete! Starting lap:",
            race.lap
        );
    }
}

// =====================================================
// UPDATE PLAYER
// =====================================================

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

    // =================================================
    // ACCELERATION
    // =================================================

    if (accelerating) {

        player.speed +=
            player.acceleration;

    } else {

        player.speed *= 0.985;
    }

    // =================================================
    // BRAKE / REVERSE
    // =================================================

    if (braking) {

        player.speed -=
            player.braking;
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
            player.angle -=
                steeringAmount;
        }

        if (right) {
            player.angle +=
                steeringAmount;
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

    keepPlayerOnTrack();

    // =================================================
    // CHECKPOINTS
    // =================================================

    checkCheckpointCollision();

    // =================================================
    // FINISH
    // =================================================

    checkFinishLine();
}

// =====================================================
// TRACK COLLISION
// =====================================================

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

    // =================================================
    // OUTSIDE TRACK
    // =================================================

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

    // =================================================
    // CENTER GRASS
    // =================================================

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
// DRAW TRACK
// =====================================================

function drawTrack() {

    // Grass
    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // =================================================
    // ROAD
    // =================================================

    ctx.fillStyle = "#444";

    ctx.fillRect(
        track.centerX -
            track.outerWidth / 2,

        track.centerY -
            track.outerHeight / 2,

        track.outerWidth,
        track.outerHeight
    );

    // =================================================
    // CENTER GRASS
    // =================================================

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        track.centerX -
            track.innerWidth / 2,

        track.centerY -
            track.innerHeight / 2,

        track.innerWidth,
        track.innerHeight
    );

    // =================================================
    // OUTER ROAD BORDER
    // =================================================

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

    // =================================================
    // INNER ROAD BORDER
    // =================================================

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
// DRAW CHECKERED FINISH LINE
// =====================================================

function drawFinishLine() {

    const squareSize = 20;

    const columns =
        Math.floor(
            finishLine.width /
            squareSize
        );

    const rows =
        Math.floor(
            finishLine.height /
            squareSize
        );

    for (let row = 0; row < rows; row++) {

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
                finishLine.x +
                    col * squareSize,

                finishLine.y +
                    row * squareSize,

                squareSize,
                squareSize
            );
        }
    }
}

// =====================================================
// DRAW CHECKPOINTS
// =====================================================

function drawCheckpoints() {

    checkpoints.forEach(
        (checkpoint, index) => {

            // Completed checkpoints
            if (
                index <
                race.checkpoint
            ) {

                ctx.fillStyle =
                    "rgba(80, 200, 120, 0.45)";

                ctx.strokeStyle =
                    "#50c878";

            // Current checkpoint
            } else if (
                index ===
                race.checkpoint
            ) {

                ctx.fillStyle =
                    "rgba(255, 210, 0, 0.45)";

                ctx.strokeStyle =
                    "#ffd400";

            // Future checkpoints
            } else {

                ctx.fillStyle =
                    "rgba(70, 150, 220, 0.30)";

                ctx.strokeStyle =
                    "#4da6ff";
            }

            ctx.lineWidth = 4;

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
            ctx.fillStyle = "#fff";

            ctx.font =
                "bold 22px Arial";

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(
                checkpoint.label,
                checkpoint.x +
                    checkpoint.width / 2,

                checkpoint.y +
                    checkpoint.height / 2
            );

            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
        }
    );
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

    // =================================================
    // BOOST FLAMES
    // =================================================

    if (
        player.boostTimer > 0
    ) {

        ctx.fillStyle = "#ff8c00";

        ctx.beginPath();

        ctx.moveTo(-22, 0);

        ctx.lineTo(
            -38,
            -7
        );

        ctx.lineTo(
            -32,
            0
        );

        ctx.lineTo(
            -38,
            7
        );

        ctx.closePath();

        ctx.fill();
    }

    // =================================================
    // KART BODY
    // =================================================

    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        -16,
        -9,
        32,
        18
    );

    // =================================================
    // DRIVER
    // =================================================

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

    // =================================================
    // WHEELS
    // =================================================

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
        "rgba(0,0,0,0.65)";

    ctx.fillRect(
        20,
        20,
        260,
        175
    );

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 18px Arial";

    // Speed
    ctx.fillText(
        "SPEED: " +
            Math.round(
                Math.abs(
                    player.speed
                ) * 20
            ),

        35,
        50
    );

    // Lap
    ctx.fillText(
        "LAP: " +
            race.lap +
            " / " +
            race.totalLaps,

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
    ctx.fillText(
        "CHECKPOINT: " +
            Math.min(
                race.checkpoint,
                3
            ) +
            " / 3",

        35,
        140
    );

    // Time
    let elapsed;

    if (race.finished) {

        elapsed =
            (
                race.finishTime -
                race.startTime
            ) / 1000;

    } else {

        elapsed =
            (
                performance.now() -
                race.startTime
            ) / 1000;
    }

    ctx.fillText(
        "TIME: " +
            elapsed.toFixed(2),

        35,
        170
    );

    // =================================================
    // BOOST
    // =================================================

    if (
        player.boostTimer > 0
    ) {

        ctx.fillStyle = "#ffd000";

        ctx.font =
            "bold 24px Arial";

        ctx.fillText(
            "BOOST!",
            35,
            205
        );
    }
}

// =====================================================
// FINISH SCREEN
// =====================================================

function drawFinishScreen() {

    if (!race.finished) {
        return;
    }

    // Dark overlay
    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Box
    const boxWidth = 420;
    const boxHeight = 190;

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
        "#ffd400";

    ctx.lineWidth = 4;

    ctx.strokeRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight
    );

    // Finished
    ctx.fillStyle =
        "#ffd400";

    ctx.font =
        "bold 32px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "RACE FINISHED!",
        canvas.width / 2,
        boxY + 60
    );

    // Time
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
        boxY + 105
    );

    ctx.font =
        "18px Arial";

    ctx.fillText(
        "Great driving!",
        canvas.width / 2,
        boxY + 140
    );

    ctx.font =
        "15px Arial";

    ctx.fillText(
        "Press R to race again",
        canvas.width / 2,
        boxY + 170
    );

    ctx.textAlign = "left";
}

// =====================================================
// GAME LOOP
// =====================================================

function gameLoop() {

    updatePlayer();

    drawTrack();

    drawFinishLine();

    drawCheckpoints();

    drawPlayer();

    drawUI();

    drawFinishScreen();

    requestAnimationFrame(
        gameLoop
    );
}

// =====================================================
// START
// =====================================================

resetRace();
gameLoop();
