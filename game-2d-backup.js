// =====================================================
// CANVAS
// =====================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);


// =====================================================
// KEYBOARD
// =====================================================

const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.code === "Space") {
        e.preventDefault();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

const up = () =>
    keys["w"] || keys["arrowup"];

const down = () =>
    keys["s"] || keys["arrowdown"];

const left = () =>
    keys["a"] || keys["arrowleft"];

const right = () =>
    keys["d"] || keys["arrowright"];

const space = () =>
    keys[" "] ||
    keys["space"] ||
    keys["spacebar"];


// =====================================================
// PLAYER
// =====================================================

const player = {
    x: 500,
    y: 180,

    angle: 0,

    speed: 0,

    maxSpeed: 4,

    acceleration: 0.12,

    braking: 0.18,

    turnSpeed: 0.03,

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

const checkpoints = [
    {
        x: 710,
        y: 235,
        width: 190,
        height: 230,
        color: "#4caf50",
        label: "1"
    },

    {
        x: 290,
        y: 460,
        width: 420,
        height: 140,
        color: "#2196f3",
        label: "2"
    },

    {
        x: 100,
        y: 235,
        width: 190,
        height: 230,
        color: "#2196f3",
        label: "3"
    }
];

const finishLine = {
    x: 290,
    y: 100,
    width: 420,
    height: 140
};


// =====================================================
// RACE
// =====================================================

const TOTAL_LAPS = 3;

let currentLap = 1;

let nextCheckpoint = 0;

// 0 = CP1
// 1 = CP2
// 2 = CP3
// 3 = finish

let raceFinished = false;

let raceStartTime = performance.now();

let finishTime = 0;


// =====================================================
// RECTANGLE COLLISION
// =====================================================

function isInsideRectangle(x, y, rect) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
    );
}


// =====================================================
// TRACK COLLISION
// =====================================================

function isOnTrack(x, y) {

    const outerLeft =
        track.centerX -
        track.outerWidth / 2;

    const outerRight =
        track.centerX +
        track.outerWidth / 2;

    const outerTop =
        track.centerY -
        track.outerHeight / 2;

    const outerBottom =
        track.centerY +
        track.outerHeight / 2;


    const insideOuter =
        x >= outerLeft &&
        x <= outerRight &&
        y >= outerTop &&
        y <= outerBottom;


    if (!insideOuter) {
        return false;
    }


    const innerLeft =
        track.centerX -
        track.innerWidth / 2;

    const innerRight =
        track.centerX +
        track.innerWidth / 2;

    const innerTop =
        track.centerY -
        track.innerHeight / 2;

    const innerBottom =
        track.centerY +
        track.innerHeight / 2;


    const insideInner =
        x >= innerLeft &&
        x <= innerRight &&
        y >= innerTop &&
        y <= innerBottom;


    // Track is the area inside the
    // outer rectangle but outside
    // the inner hole.

    return !insideInner;
}


// =====================================================
// UPDATE PLAYER
// =====================================================

function updatePlayer() {

    // =================================================
    // ACCELERATION
    // =================================================

    if (up()) {

        player.speed += player.acceleration;

        if (player.speed > player.maxSpeed) {
            player.speed = player.maxSpeed;
        }
    }


    // =================================================
    // BRAKE / REVERSE
    // =================================================

    if (down()) {

        player.speed -= player.braking;

        if (player.speed < -player.maxSpeed * 0.5) {
            player.speed =
                -player.maxSpeed * 0.5;
        }
    }


    // =================================================
    // NATURAL SLOWDOWN
    // =================================================

    if (!up() && !down()) {

        player.speed *= 0.97;
    }


    // =================================================
    // DRIFT ACTIVATION
    // =================================================

    if (
        space() &&
        Math.abs(player.speed) > 0.5 &&
        (left() || right())
    ) {

        player.drifting = true;

    } else {

        player.drifting = false;
    }


    // =================================================
    // STEERING
    // =================================================

    if (Math.abs(player.speed) > 0.1) {

        const direction =
            player.speed >= 0 ? 1 : -1;

        let steeringAmount =
            player.turnSpeed *
            direction;


        // Normal steering

        if (!player.drifting) {

            if (left()) {
                player.angle -= steeringAmount;
            }

            if (right()) {
                player.angle += steeringAmount;
            }

        }


        // Stronger steering while drifting

        else {

            steeringAmount *= 1.8;

            if (left()) {
                player.angle -= steeringAmount;
            }

            if (right()) {
                player.angle += steeringAmount;
            }
        }
    }


    // =================================================
    // DRIFT CHARGE
    // =================================================

    if (player.drifting) {

        // Build drift charge
        player.driftCharge += 1;


        // Maximum drift charge
        if (player.driftCharge > 120) {

            player.driftCharge = 120;
        }

    } else {


        // =============================================
        // RELEASE DRIFT = BOOST
        // =============================================

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


    // =================================================
    // BOOST
    // =================================================

    if (player.boostTimer > 0) {

        player.boostTimer--;


        // Extra acceleration
        player.speed += 0.18;


        // Allow speed above normal maximum
        if (
            player.speed >
            player.maxSpeed + 4
        ) {

            player.speed =
                player.maxSpeed + 4;
        }
    }


    // =================================================
    // MOVEMENT
    // =================================================

    let moveX = 0;
    let moveY = 0;


    // =================================================
    // NORMAL MOVEMENT
    // =================================================

    if (!player.drifting) {

        moveX =
            Math.cos(player.angle) *
            player.speed;

        moveY =
            Math.sin(player.angle) *
            player.speed;
    }


    // =================================================
    // DRIFT MOVEMENT
    // =================================================

    else {

        let driftDirection = 0;


        if (left()) {
            driftDirection = -1;
        }

        if (right()) {
            driftDirection = 1;
        }


        // Forward movement
        const forwardAmount =
            player.speed * 0.82;


        // Sideways sliding
        const sidewaysAmount =
            Math.abs(player.speed) * 0.38;


        const sidewaysAngle =
            player.angle +
            driftDirection * Math.PI / 2;


        // Forward movement

        moveX =
            Math.cos(player.angle) *
            forwardAmount;

        moveY =
            Math.sin(player.angle) *
            forwardAmount;


        // Sideways movement

        moveX +=
            Math.cos(sidewaysAngle) *
            sidewaysAmount;

        moveY +=
            Math.sin(sidewaysAngle) *
            sidewaysAmount;
    }


    // =================================================
    // SAFE MOVEMENT / WALL COLLISION
    // =================================================

    // Try horizontal movement first

    const newX =
        player.x + moveX;


    if (isOnTrack(newX, player.y)) {

        player.x = newX;

    } else {

        // Hit wall / grass

        player.speed *= 0.35;
    }


    // Try vertical movement

    const newY =
        player.y + moveY;


    if (isOnTrack(player.x, newY)) {

        player.y = newY;

    } else {

        // Hit wall / grass

        player.speed *= 0.35;
    }


    // =================================================
    // CHECKPOINTS
    // =================================================

    updateCheckpoints();
}


// =====================================================
// CHECKPOINT SYSTEM
// =====================================================

function updateCheckpoints() {

    if (raceFinished) {
        return;
    }


    // =================================================
    // CHECKPOINT 1
    // =================================================

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


    // =================================================
    // CHECKPOINT 2
    // =================================================

    if (
        nextCheckpoint === 1 &&
        isInsideRectangle(
            player.x,
            player.y,
            checkpoints[1]
        )
    ) {

        nextCheckpoint = 2;
    }


    // =================================================
    // CHECKPOINT 3
    // =================================================

    if (
        nextCheckpoint === 2 &&
        isInsideRectangle(
            player.x,
            player.y,
            checkpoints[2]
        )
    ) {

        nextCheckpoint = 3;
    }


    // =================================================
    // FINISH LINE
    // =================================================

    if (
        nextCheckpoint === 3 &&
        isInsideRectangle(
            player.x,
            player.y,
            finishLine
        )
    ) {


        // Final lap

        if (currentLap >= TOTAL_LAPS) {

            raceFinished = true;

            finishTime =
                (performance.now() -
                    raceStartTime) / 1000;

        }


        // Next lap

        else {

            currentLap++;

            nextCheckpoint = 0;
        }
    }
}


// =====================================================
// DRAW TRACK
// =====================================================

function drawTrack() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // =================================================
    // GRASS / BACKGROUND
    // =================================================

    ctx.fillStyle = "#4caf50";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // =================================================
    // TRACK
    // =================================================

    const outerLeft =
        track.centerX -
        track.outerWidth / 2;

    const outerTop =
        track.centerY -
        track.outerHeight / 2;


    ctx.fillStyle = "#555";

    ctx.fillRect(
        outerLeft,
        outerTop,
        track.outerWidth,
        track.outerHeight
    );


    // =================================================
    // INNER GRASS
    // =================================================

    const innerLeft =
        track.centerX -
        track.innerWidth / 2;

    const innerTop =
        track.centerY -
        track.innerHeight / 2;


    ctx.fillStyle = "#4caf50";

    ctx.fillRect(
        innerLeft,
        innerTop,
        track.innerWidth,
        track.innerHeight
    );


    // =================================================
    // TRACK BORDER
    // =================================================

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 8;

    ctx.strokeRect(
        outerLeft,
        outerTop,
        track.outerWidth,
        track.outerHeight
    );


    ctx.strokeRect(
        innerLeft,
        innerTop,
        track.innerWidth,
        track.innerHeight
    );
}


// =====================================================
// DRAW CHECKPOINTS
// =====================================================

function drawCheckpoints() {

    checkpoints.forEach((checkpoint, index) => {

        ctx.fillStyle =
            checkpoint.color;

        ctx.globalAlpha = 0.25;

        ctx.fillRect(
            checkpoint.x,
            checkpoint.y,
            checkpoint.width,
            checkpoint.height
        );

        ctx.globalAlpha = 1;


        ctx.fillStyle = "#ffffff";

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
    });


    // =================================================
    // FINISH LINE
    // =================================================

    ctx.fillStyle = "#ffffff";

    ctx.globalAlpha = 0.35;

    ctx.fillRect(
        finishLine.x,
        finishLine.y,
        finishLine.width,
        finishLine.height
    );

    ctx.globalAlpha = 1;
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
    // BOOST EFFECT
    // =================================================

    if (player.boostTimer > 0) {

        ctx.fillStyle = "#ff9800";

        ctx.beginPath();

        ctx.moveTo(-20, 0);

        ctx.lineTo(-38, -7);

        ctx.lineTo(-32, 0);

        ctx.lineTo(-38, 7);

        ctx.closePath();

        ctx.fill();
    }


    // =================================================
    // KART
    // =================================================

    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        -16,
        -9,
        32,
        18
    );


    // =================================================
    // KART FRONT
    // =================================================

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        6,
        -6,
        7,
        12
    );


    // =================================================
    // DRIFT EFFECT
    // =================================================

    if (player.drifting) {

        ctx.fillStyle = "#ffd54f";

        ctx.beginPath();

        ctx.arc(
            -10,
            -10,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            -10,
            10,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    ctx.restore();
}


// =====================================================
// DRAW HUD
// =====================================================

function drawHUD() {

    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 20px Arial";

    ctx.textAlign = "left";

    ctx.textBaseline = "top";


    // Lap

    ctx.fillText(
        "Lap: " +
        currentLap +
        "/" +
        TOTAL_LAPS,
        20,
        20
    );


    // Speed

    ctx.fillText(
        "Speed: " +
        Math.round(
            Math.abs(player.speed) * 20
        ),
        20,
        50
    );


    // Drift charge

    if (player.drifting) {

        ctx.fillText(
            "Drift: " +
            player.driftCharge,
            20,
            80
        );
    }


    // Boost

    if (player.boostTimer > 0) {

        ctx.fillText(
            "BOOST!",
            20,
            110
        );
    }


    // =================================================
    // FINISH SCREEN
    // =================================================

    if (raceFinished) {

        ctx.fillStyle =
            "rgba(0, 0, 0, 0.7)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 48px Arial";

        ctx.textAlign = "center";

        ctx.textBaseline = "middle";


        ctx.fillText(
            "FINISH!",
            canvas.width / 2,
            canvas.height / 2 - 30
        );


        ctx.font =
            "bold 28px Arial";


        ctx.fillText(
            "Time: " +
            finishTime.toFixed(2) +
            " seconds",
            canvas.width / 2,
            canvas.height / 2 + 25
        );
    }
}


// =====================================================
// GAME LOOP
// =====================================================

function gameLoop() {

    updatePlayer();

    drawTrack();

    drawCheckpoints();

    drawPlayer();

    drawHUD();


    requestAnimationFrame(
        gameLoop
    );
}


// =====================================================
// START GAME
// =====================================================

gameLoop();
