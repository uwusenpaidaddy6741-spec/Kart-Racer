const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// =========================
// INPUT
// =========================

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
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// =========================
// PLAYER
// =========================

const player = {
    // START ON THE TRACK
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
// UPDATE PLAYER
// =========================

function updatePlayer() {

    const accelerating =
        keys["w"] || keys["arrowup"];

    const braking =
        keys["s"] || keys["arrowdown"];

    const left =
        keys["a"] || keys["arrowleft"];

    const right =
        keys["d"] || keys["arrowright"];

    const drifting = keys[" "];

    // =========================
    // ACCELERATION
    // =========================

    if (accelerating) {
        player.speed += player.acceleration;
    } else {
        player.speed *= 0.985;
    }

    // =========================
    // BRAKE / REVERSE
    // =========================

    if (braking) {
        player.speed -= player.braking;
    }

    // =========================
    // LIMIT SPEED
    // =========================

    player.speed = Math.max(
        -2,
        Math.min(player.speed, player.maxSpeed)
    );

    // =========================
    // STEERING
    // =========================

    if (Math.abs(player.speed) > 0.1) {

        const direction =
            player.speed >= 0 ? 1 : -1;

        const steeringAmount =
            player.turnSpeed *
            direction *
            (Math.abs(player.speed) / player.maxSpeed + 0.3);

        if (left) {
            player.angle -= steeringAmount;
        }

        if (right) {
            player.angle += steeringAmount;
        }
    }

    // =========================
    // DRIFTING
    // =========================

    player.drifting =
        drifting && Math.abs(player.speed) > 1;

    if (player.drifting) {

        player.driftCharge += 0.5;

        // Reduce grip while drifting
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

    // =========================
    // BOOST
    // =========================

    if (player.boostTimer > 0) {

        player.speed += 0.15;
        player.boostTimer--;

        if (player.speed > player.maxSpeed + 3) {
            player.speed = player.maxSpeed + 3;
        }
    }

    // =========================
    // MOVE
    // =========================

    player.x +=
        Math.cos(player.angle) * player.speed;

    player.y +=
        Math.sin(player.angle) * player.speed;

    keepPlayerOnTrack();
}

// =========================
// TRACK COLLISION
// =========================

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

    // =========================
    // OUTSIDE TRACK
    // =========================

    if (
        Math.abs(dx) > outerX ||
        Math.abs(dy) > outerY
    ) {

        player.x -=
            Math.cos(player.angle) * player.speed;

        player.y -=
            Math.sin(player.angle) * player.speed;

        player.speed *= 0.5;
    }

    // =========================
    // CENTER GRASS / ISLAND
    // =========================

    if (
        Math.abs(dx) < innerX &&
        Math.abs(dy) < innerY
    ) {

        player.x -=
            Math.cos(player.angle) * player.speed;

        player.y -=
            Math.sin(player.angle) * player.speed;

        player.speed *= 0.7;
    }
}

// =========================
// DRAW TRACK
// =========================

function drawTrack() {

    // Grass background
    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // =========================
    // TRACK
    // =========================

    ctx.fillStyle = "#444";

    ctx.fillRect(
        track.centerX - track.outerWidth / 2,
        track.centerY - track.outerHeight / 2,
        track.outerWidth,
        track.outerHeight
    );

    // =========================
    // CENTER GRASS
    // =========================

    ctx.fillStyle = "#397a32";

    ctx.fillRect(
        track.centerX - track.innerWidth / 2,
        track.centerY - track.innerHeight / 2,
        track.innerWidth,
        track.innerHeight
    );

    // =========================
    // TRACK OUTLINE
    // =========================

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;

    ctx.strokeRect(
        track.centerX - track.outerWidth / 2,
        track.centerY - track.outerHeight / 2,
        track.outerWidth,
        track.outerHeight
    );

    // =========================
    // CENTER OUTLINE
    // =========================

    ctx.strokeRect(
        track.centerX - track.innerWidth / 2,
        track.centerY - track.innerHeight / 2,
        track.innerWidth,
        track.innerHeight
    );

    // =========================
    // START LINE
    // =========================

    ctx.fillStyle = "#fff";

    ctx.fillRect(
        track.centerX - 8,
        track.centerY - track.outerHeight / 2,
        16,
        55
    );
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

    // =========================
    // BOOST FLAMES
    // =========================

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

    // =========================
    // KART BODY
    // =========================

    ctx.fillStyle = "#e53935";

    ctx.fillRect(
        -16,
        -9,
        32,
        18
    );

    // =========================
    // DRIVER
    // =========================

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

    // =========================
    // WHEELS
    // =========================

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

// =========================
// UI
// =========================

function drawUI() {

    ctx.fillStyle = "rgba(0,0,0,0.65)";

    ctx.fillRect(
        20,
        20,
        220,
        110
    );

    ctx.fillStyle = "#fff";

    ctx.font = "18px Arial";

    // Speed
    ctx.fillText(
        "SPEED: " +
        Math.round(Math.abs(player.speed) * 20),
        35,
        50
    );

    // Drift
    ctx.fillText(
        "DRIFT: " +
        Math.round(player.driftCharge) +
        "%",
        35,
        80
    );

    // Boost
    if (player.boostTimer > 0) {

        ctx.fillStyle = "#ffd000";

        ctx.font = "bold 24px Arial";

        ctx.fillText(
            "BOOST!",
            35,
            115
        );
    }
}

// =========================
// GAME LOOP
// =========================

function gameLoop() {

    updatePlayer();

    drawTrack();

    drawPlayer();

    drawUI();

    requestAnimationFrame(gameLoop);
}

gameLoop();
