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
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
            .includes(event.key.toLowerCase())
    ) {
        event.preventDefault();
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
// RACE
// =====================================================

// 0 = waiting for checkpoint 1
// 1 = waiting for checkpoint 2
// 2 = waiting for checkpoint 3
// 3 = waiting for finish line

let nextCheckpoint = 0;

let currentLap = 1;
const totalLaps = 3;

let raceFinished = false;

let raceTime = 0;

// =====================================================
// CHECKPOINTS
// =====================================================

// These are deliberately large and placed in the
// CENTER of the road.

const checkpoints = [

    // CHECKPOINT 1 - RIGHT SIDE
    {
        x: 850,
        y: 350,
        width: 90,
        height: 130
    },

    // CHECKPOINT 2 - BOTTOM
    {
        x: 500,
        y: 550,
        width: 150,
        height: 80
    },

    // CHECKPOINT 3 - LEFT SIDE
    {
        x: 150,
        y: 350,
        width: 90,
        height: 130
    }
];

// =====================================================
// FINISH LINE
// =====================================================

const finishLine = {
    x: 500,
    y: 170,

    // Much larger than before
    width: 40,
    height: 130
};

// =====================================================
// COLLISION HELPERS
// =====================================================

function isInsideRectangle(object, zone) {

    return (
        object.x > zone.x - zone.width / 2 &&
        object.x < zone.x + zone.width / 2 &&
        object.y > zone.y - zone.height / 2 &&
        object.y < zone.y + zone.height / 2
    );
}

// =====================================================
// CHECKPOINT / LAP SYSTEM
// =====================================================

function updateRaceProgress() {

    if (raceFinished) {
        return;
    }

    // ---------------------------------------------
    // CHECKPOINT
    // ---------------------------------------------

    if (nextCheckpoint < checkpoints.length) {

        const checkpoint = checkpoints[nextCheckpoint];

        if (isInsideRectangle(player, checkpoint)) {

            nextCheckpoint++;

        }
    }

    // ---------------------------------------------
    // FINISH LINE
    // ---------------------------------------------

    // Only allow the finish line to count AFTER
    // all 3 checkpoints have been collected.

    if (nextCheckpoint === checkpoints.length) {

        if (isInsideRectangle(player, finishLine)) {

            // Completed a lap
            currentLap++;

            // Reset checkpoint sequence
            nextCheckpoint = 0;

            // Finished the race
            if (currentLap > totalLaps) {

                currentLap = totalLaps;

                raceFinished = true;

                player.speed = 0;
            }
        }
    }
}

// =====================================================
// UPDATE PLAYER
// =====================================================

function updatePlayer() {

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

    // ---------------------------------------------
    // ACCELERATION
    // ---------------------------------------------

    if (accelerating) {

        player.speed += player.acceleration;

    } else {

        player.speed *= 0.985;
    }

    // ---------------------------------------------
    // BRAKING / REVERSE
    // ---------------------------------------------

    if (braking) {

        player.speed -= player.braking;
    }

    // ---------------------------------------------
    // SPEED LIMIT
    // ---------------------------------------------

    player.speed = Math.max(
        -2,
        Math.min(
            player.speed,
            player.maxSpeed
        )
    );

    // ---------------------------------------------
    // STEERING
    // ---------------------------------------------

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

    // ---------------------------------------------
    // DRIFT
    // ---------------------------------------------

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

        // -----------------------------------------
        // RELEASE DRIFT = BOOST
        // -----------------------------------------

        if (player.driftCharge > 70) {

            player.boostTimer = 90;

        } else if (player.driftCharge > 35) {

            player.boostTimer = 50;

        } else if (player.driftCharge > 10) {

            player.boostTimer = 25;
        }

        player.driftCharge = 0;
    }

    // ---------------------------------------------
    // BOOST
    // ---------------------------------------------

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

    // ---------------------------------------------
    // MOVE
    // ---------------------------------------------

    if (!raceFinished) {

        player.x +=
            Math.cos(player.angle) *
            player.speed;

        player.y +=
            Math.sin(player.angle) *
            player.speed;
    }

    // ---------------------------------------------
    // TRACK COLLISION
    // ---------------------------------------------

    keepPlayerOnTrack();

    // ---------------------------------------------
    // RACE PROGRESS
    // ---------------------------------------------

    updateRaceProgress();
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

    // ---------------------------------------------
    // OUTSIDE TRACK
    // ---------------------------------------------

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

    // ---------------------------------------------
    // CENTER GRASS
    // ---------------------------------------------

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

    // ---------------------------------------------
    // GRASS BACKGROUND
    // ---------------------------------------------

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // ---------------------------------------------
    // TRACK
    // ---------------------------------------------

    ctx.fillStyle = "#444";

    ctx.fillRect(
        track.centerX -
            track.outerWidth / 2,

        track.centerY -
            track.outerHeight / 2,

        track.outerWidth,
        track.outerHeight
    );

    // ---------------------------------------------
    // CENTER GRASS
    // ---------------------------------------------

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        track.centerX -
            track.innerWidth / 2,

        track.centerY -
            track.innerHeight / 2,

        track.innerWidth,
        track.innerHeight
    );

    // ---------------------------------------------
    // OUTER BORDER
    // ---------------------------------------------

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

    // ---------------------------------------------
    // INNER BORDER
    // ---------------------------------------------

    ctx.strokeRect(
        track.centerX -
            track.innerWidth / 2,

        track.centerY -
            track.innerHeight / 2,

        track.innerWidth,
        track.innerHeight
    );

    // ---------------------------------------------
    // CHECKERED FINISH LINE
    // ---------------------------------------------

    drawFinishLine();

    // ---------------------------------------------
    // CHECKPOINTS
    // ---------------------------------------------

    drawCheckpoints();
}

// =====================================================
// DRAW FINISH LINE
// =====================================================

function drawFinishLine() {

    const squareSize = 20;

    const columns = 2;

    const rows =
        Math.floor(
            finishLine.height /
            squareSize
        );

    for (let row = 0; row < rows; row++) {

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            if (
                (row + column) % 2 === 0
            ) {

                ctx.fillStyle = "#fff";

            } else {

                ctx.fillStyle = "#111";
            }

            ctx.fillRect(
                finishLine.x -
                    finishLine.width / 2 +
                    column * squareSize,

                finishLine.y -
                    finishLine.height / 2 +
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

            const active =
                index === nextCheckpoint;

            const completed =
                index < nextCheckpoint;

            // Completed checkpoints
            if (completed) {

                ctx.fillStyle =
                    "rgba(0,255,80,0.25)";

            // Current checkpoint
            } else if (active) {

                ctx.fillStyle =
                    "rgba(255,220,0,0.35)";

            // Future checkpoint
            } else {

                ctx.fillStyle =
                    "rgba(0,150,255,0.18)";
            }

            ctx.fillRect(
                checkpoint.x -
                    checkpoint.width / 2,

                checkpoint.y -
                    checkpoint.height / 2,

                checkpoint.width,
                checkpoint.height
            );

            // Border

            if (active) {

                ctx.strokeStyle = "#ffd000";
                ctx.lineWidth = 5;

            } else {

                ctx.strokeStyle =
                    "rgba(255,255,255,0.4)";

                ctx.lineWidth = 3;
            }

            ctx.strokeRect(
                checkpoint.x -
                    checkpoint.width / 2,

                checkpoint.y -
                    checkpoint.height / 2,

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
                String(index + 1),
                checkpoint.x,
                checkpoint.y
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

    // ---------------------------------------------
    // BOOST FLAMES
    // ---------------------------------------------

    if (player.boostTimer > 0) {

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

    // ---------------------------------------------
    // KART BODY
    // ---------------------------------------------

    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        -16,
        -9,
        32,
        18
    );

    // ---------------------------------------------
    // DRIVER
    // ---------------------------------------------

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

    // ---------------------------------------------
    // WHEELS
    // ---------------------------------------------

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
// RACE UI
// =====================================================

function drawUI() {

    ctx.fillStyle =
        "rgba(0,0,0,0.7)";

    ctx.fillRect(
        20,
        20,
        260,
        175
    );

    ctx.fillStyle = "#fff";

    ctx.font =
        "bold 18px Arial";

    // SPEED

    ctx.fillText(
        "SPEED: " +
        Math.round(
            Math.abs(player.speed) * 20
        ),
        35,
        50
    );

    // LAP

    ctx.fillText(
        "LAP: " +
        currentLap +
        " / " +
        totalLaps,
        35,
        82
    );

    // DRIFT

    ctx.fillText(
        "DRIFT: " +
        Math.round(
            player.driftCharge
        ) +
        "%",
        35,
        114
    );

    // CHECKPOINT

    ctx.fillText(
        "CHECKPOINT: " +
        Math.min(
            nextCheckpoint + 1,
            3
        ) +
        " / 3",
        35,
        146
    );

    // BOOST

    if (player.boostTimer > 0) {

        ctx.fillStyle = "#ffd000";

        ctx.font =
            "bold 24px Arial";

        ctx.fillText(
            "BOOST!",
            35,
            180
        );
    }

    // ---------------------------------------------
    // FINISH MESSAGE
    // ---------------------------------------------

    if (raceFinished) {

        ctx.fillStyle =
            "rgba(0,0,0,0.8)";

        ctx.fillRect(
            canvas.width / 2 - 200,
            canvas.height / 2 - 70,
            400,
            140
        );

        ctx.fillStyle = "#ffd000";

        ctx.font =
            "bold 36px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "RACE FINISHED!",
            canvas.width / 2,
            canvas.height / 2
        );

        ctx.fillStyle = "#fff";

        ctx.font =
            "18px Arial";

        ctx.fillText(
            "Great driving!",
            canvas.width / 2,
            canvas.height / 2 + 40
        );

        ctx.textAlign = "left";
    }
}

// =====================================================
// GAME LOOP
// =====================================================

function gameLoop() {

    if (!raceFinished) {

        raceTime += 1 / 60;
    }

    updatePlayer();

    drawTrack();

    drawPlayer();

    drawUI();

    requestAnimationFrame(
        gameLoop
    );
}

gameLoop();
