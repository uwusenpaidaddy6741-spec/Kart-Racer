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

    const key = event.key.toLowerCase();

    keys[key] = true;

    if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
    ) {
        event.preventDefault();
    }

    // Restart race
    if (key === "r" && race.finished) {
        restartRace();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// =====================================================
// RACE SETTINGS
// =====================================================

const TOTAL_LAPS = 3;

const race = {
    lap: 1,
    checkpoint: 0,
    finished: false,
    startTime: performance.now(),
    finishTime: 0
};

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
// CHECKPOINTS
// =====================================================

// The player must pass these in order:
//
// 0 = Start
// 1 = Right side
// 2 = Bottom
// 3 = Left side
//
// Then crossing the start line completes a lap.

const checkpoints = [

    {
        x: 880,
        y: 350,
        width: 40,
        height: 180
    },

    {
        x: 500,
        y: 580,
        width: 180,
        height: 40
    },

    {
        x: 120,
        y: 350,
        width: 40,
        height: 180
    }
];

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

        player.speed += player.acceleration;

    } else {

        player.speed *= 0.985;
    }

    // =================================================
    // BRAKING
    // =================================================

    if (braking) {

        player.speed -= player.braking;
    }

    // =================================================
    // SPEED LIMIT
    // =================================================

    player.speed = Math.max(
        -2,
        Math.min(player.speed, player.maxSpeed)
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

        // =================================================
        // DRIFT BOOST
        // =================================================

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
    // MOVEMENT
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

    checkCheckpoints();
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

    // Outside track

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

    // Center grass

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
// CHECKPOINT DETECTION
// =====================================================

function checkCheckpoints() {

    const nextCheckpoint =
        checkpoints[race.checkpoint];

    if (!nextCheckpoint) {
        return;
    }

    const inside =
        player.x >
            nextCheckpoint.x -
            nextCheckpoint.width / 2 &&

        player.x <
            nextCheckpoint.x +
            nextCheckpoint.width / 2 &&

        player.y >
            nextCheckpoint.y -
            nextCheckpoint.height / 2 &&

        player.y <
            nextCheckpoint.y +
            nextCheckpoint.height / 2;

    if (inside) {

        race.checkpoint++;

        // Completed all checkpoints
        if (race.checkpoint >= checkpoints.length) {

            race.checkpoint = checkpoints.length;
        }
    }

    // =================================================
    // FINISH LINE
    // =================================================

    const startLineX = track.centerX;

    const startLineTop =
        track.centerY -
        track.outerHeight / 2;

    const startLineBottom =
        startLineTop + 55;

    const crossedStart =
        player.x > startLineX - 12 &&
        player.x < startLineX + 12 &&
        player.y > startLineTop &&
        player.y < startLineBottom;

    if (
        crossedStart &&
        race.checkpoint >= checkpoints.length &&
        player.speed > 0
    ) {

        completeLap();
    }
}

// =====================================================
// COMPLETE LAP
// =====================================================

function completeLap() {

    // Prevent multiple triggers
    race.checkpoint = -1;

    race.lap++;

    if (race.lap > TOTAL_LAPS) {

        race.finished = true;

        race.finishTime =
            performance.now();

        player.speed = 0;

        return;
    }

    // Reset checkpoint sequence
    race.checkpoint = 0;
}

// =====================================================
// RESTART
// =====================================================

function restartRace() {

    player.x = 500;

    player.y = 200;

    player.angle = 0;

    player.speed = 0;

    player.drifting = false;

    player.driftCharge = 0;

    player.boostTimer = 0;

    race.lap = 1;

    race.checkpoint = 0;

    race.finished = false;

    race.startTime =
        performance.now();

    race.finishTime = 0;
}

// =====================================================
// DRAW TRACK
// =====================================================

function drawTrack() {

    // =================================================
    // GRASS
    // =================================================

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // =================================================
    // TRACK
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
    // OUTER BORDER
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
    // INNER BORDER
    // =================================================

    ctx.strokeRect(

        track.centerX -
            track.innerWidth / 2,

        track.centerY -
            track.innerHeight / 2,

        track.innerWidth,

        track.innerHeight
    );

    // =================================================
    // CHECKERED START / FINISH LINE
    // =================================================

    const startX =
        track.centerX - 12;

    const startY =
        track.centerY -
        track.outerHeight / 2;

    const squareSize = 12;

    for (let row = 0; row < 5; row++) {

        for (let col = 0; col < 2; col++) {

            if ((row + col) % 2 === 0) {

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

    // =================================================
    // CHECKPOINTS
    // =================================================

    checkpoints.forEach((checkpoint, index) => {

        // Only show the next checkpoint
        if (index !== race.checkpoint) {
            return;
        }

        ctx.fillStyle =
            "rgba(255, 220, 0, 0.35)";

        ctx.fillRect(

            checkpoint.x -
                checkpoint.width / 2,

            checkpoint.y -
                checkpoint.height / 2,

            checkpoint.width,

            checkpoint.height
        );

        ctx.strokeStyle =
            "#ffd000";

        ctx.lineWidth = 4;

        ctx.strokeRect(

            checkpoint.x -
                checkpoint.width / 2,

            checkpoint.y -
                checkpoint.height / 2,

            checkpoint.width,

            checkpoint.height
        );
    });
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

    ctx.rotate(player.angle);

    // =================================================
    // BOOST FLAMES
    // =================================================

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
// TIMER
// =====================================================

function getRaceTime() {

    const endTime =
        race.finished
            ? race.finishTime
            : performance.now();

    return (
        (endTime - race.startTime) /
        1000
    );
}

// =====================================================
// DRAW UI
// =====================================================

function drawUI() {

    // =================================================
    // UI PANEL
    // =================================================

    ctx.fillStyle =
        "rgba(0,0,0,0.72)";

    ctx.fillRect(
        20,
        20,
        260,
        170
    );

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 20px Arial";

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
        Math.min(
            race.lap,
            TOTAL_LAPS
        ) +
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

    // Timer

    ctx.fillText(

        "TIME: " +
        getRaceTime().toFixed(2),

        35,
        140
    );

    // Boost

    if (player.boostTimer > 0) {

        ctx.fillStyle = "#ffd000";

        ctx.font =
            "bold 24px Arial";

        ctx.fillText(
            "BOOST!",
            35,
            175
        );
    }

    // =================================================
    // FINISH SCREEN
    // =================================================

    if (race.finished) {

        ctx.fillStyle =
            "rgba(0,0,0,0.82)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.textAlign = "center";

        ctx.fillStyle = "#ffd000";

        ctx.font =
            "bold 52px Arial";

        ctx.fillText(
            "🏆 RACE FINISHED!",
            canvas.width / 2,
            canvas.height / 2 - 70
        );

        ctx.fillStyle = "#fff";

        ctx.font =
            "bold 28px Arial";

        ctx.fillText(

            "TIME: " +
            getRaceTime().toFixed(2) +
            " seconds",

            canvas.width / 2,

            canvas.height / 2
        );

        ctx.font =
            "20px Arial";

        ctx.fillText(

            "Press R to race again",

            canvas.width / 2,

            canvas.height / 2 + 50
        );

        ctx.textAlign = "left";
    }
}

// =====================================================
// GAME LOOP
// =====================================================

function gameLoop() {

    updatePlayer();

    drawTrack();

    drawPlayer();

    drawUI();

    requestAnimationFrame(gameLoop);
}

gameLoop();
