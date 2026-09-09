import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ============================================================
// KART RACER 3D
// REAL-TIME / FPS-INDEPENDENT PHYSICS
// ============================================================

const canvas = document.getElementById("gameCanvas");
const container = document.getElementById("gameCanvasContainer");

if (!canvas || !container) {
    throw new Error("gameCanvas or gameCanvasContainer was not found.");
}

// ============================================================
// SCENE
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    100,
    230
);

// ============================================================
// CAMERA
// ============================================================

const camera = new THREE.PerspectiveCamera(
    65,
    container.clientWidth / container.clientHeight,
    0.1,
    500
);

camera.position.set(0, 7, 12);

// ============================================================
// RENDERER
// ============================================================

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ============================================================
// LIGHTING
// ============================================================

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x557755,
    2
);

scene.add(ambientLight);

const sun = new THREE.DirectionalLight(
    0xffffff,
    2.5
);

sun.position.set(40, 80, 30);
sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;

scene.add(sun);

// ============================================================
// GRASS
// ============================================================

const grassGeometry = new THREE.PlaneGeometry(
    220,
    180
);

const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f8f3f,
    roughness: 1
});

const grass = new THREE.Mesh(
    grassGeometry,
    grassMaterial
);

grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;

scene.add(grass);

// ============================================================
// TRACK SETTINGS
// ============================================================

const TRACK_WIDTH = 14;

const TRACK_HALF_X = 42;
const TRACK_HALF_Z = 27;
const CORNER_RADIUS = 11;

// ============================================================
// TRACK CENTER POINTS
// ============================================================

function roundedRectanglePoints() {

    const points = [];

    const sections = [

        // Bottom-right corner
        {
            cx: TRACK_HALF_X - CORNER_RADIUS,
            cz: -TRACK_HALF_Z + CORNER_RADIUS,
            start: -Math.PI / 2,
            end: 0
        },

        // Top-right corner
        {
            cx: TRACK_HALF_X - CORNER_RADIUS,
            cz: TRACK_HALF_Z - CORNER_RADIUS,
            start: 0,
            end: Math.PI / 2
        },

        // Top-left corner
        {
            cx: -TRACK_HALF_X + CORNER_RADIUS,
            cz: TRACK_HALF_Z - CORNER_RADIUS,
            start: Math.PI / 2,
            end: Math.PI
        },

        // Bottom-left corner
        {
            cx: -TRACK_HALF_X + CORNER_RADIUS,
            cz: -TRACK_HALF_Z + CORNER_RADIUS,
            start: Math.PI,
            end: Math.PI * 1.5
        }
    ];

    const stepsPerCorner = 30;

    for (const section of sections) {

        for (let i = 0; i < stepsPerCorner; i++) {

            const t = i / stepsPerCorner;

            const angle =
                section.start +
                (section.end - section.start) * t;

            points.push({
                x:
                    section.cx +
                    Math.cos(angle) * CORNER_RADIUS,

                z:
                    section.cz +
                    Math.sin(angle) * CORNER_RADIUS
            });
        }
    }

    return points;
}

const trackPoints = roundedRectanglePoints();

// ============================================================
// ROAD
// ============================================================

function createTrack() {

    const positions = [];
    const indices = [];

    const outer = [];
    const inner = [];

    for (let i = 0; i < trackPoints.length; i++) {

        const current = trackPoints[i];

        const next =
            trackPoints[
                (i + 1) % trackPoints.length
            ];

        const dx = next.x - current.x;
        const dz = next.z - current.z;

        const length = Math.hypot(dx, dz);

        if (length === 0) {
            continue;
        }

        const nx = -dz / length;
        const nz = dx / length;

        outer.push({
            x: current.x + nx * TRACK_WIDTH / 2,
            z: current.z + nz * TRACK_WIDTH / 2
        });

        inner.push({
            x: current.x - nx * TRACK_WIDTH / 2,
            z: current.z - nz * TRACK_WIDTH / 2
        });
    }

    for (let i = 0; i < trackPoints.length; i++) {

        const o = outer[i];
        const inn = inner[i];

        positions.push(
            o.x,
            0.05,
            o.z,

            inn.x,
            0.05,
            inn.z
        );
    }

    for (let i = 0; i < trackPoints.length; i++) {

        const next =
            (i + 1) % trackPoints.length;

        const a = i * 2;
        const b = i * 2 + 1;

        const c = next * 2;
        const d = next * 2 + 1;

        indices.push(
            a,
            b,
            c,

            b,
            d,
            c
        );
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0x3b3b3b,
        roughness: 0.9
    });

    const road = new THREE.Mesh(
        geometry,
        material
    );

    road.receiveShadow = true;

    scene.add(road);
}

createTrack();

// ============================================================
// CURBS
// ============================================================

function createCurbs() {

    const redMaterial = new THREE.MeshStandardMaterial({
        color: 0xd92727,
        roughness: 0.8
    });

    const whiteMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8
    });

    for (
        let i = 0;
        i < trackPoints.length;
        i += 2
    ) {

        const p = trackPoints[i];

        const next =
            trackPoints[
                (i + 1) % trackPoints.length
            ];

        const dx = next.x - p.x;
        const dz = next.z - p.z;

        const length = Math.hypot(dx, dz);

        const curb = new THREE.Mesh(
            new THREE.BoxGeometry(
                Math.max(length + 0.15, 1),
                0.25,
                0.7
            ),
            (i / 2) % 2 === 0
                ? redMaterial
                : whiteMaterial
        );

        curb.position.set(
            (p.x + next.x) / 2,
            0.2,
            (p.z + next.z) / 2
        );

        curb.rotation.y =
            -Math.atan2(dz, dx);

        curb.castShadow = true;

        scene.add(curb);
    }
}

createCurbs();

// ============================================================
// TRACK BORDERS
// ============================================================

function createTrackBorders() {

    const borderMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8
        });

    for (
        let i = 0;
        i < trackPoints.length;
        i += 2
    ) {

        const p = trackPoints[i];

        const next =
            trackPoints[
                (i + 1) % trackPoints.length
            ];

        const dx = next.x - p.x;
        const dz = next.z - p.z;

        const length = Math.hypot(dx, dz);

        if (length === 0) {
            continue;
        }

        const nx = -dz / length;
        const nz = dx / length;

        for (const side of [-1, 1]) {

            const border = new THREE.Mesh(
                new THREE.BoxGeometry(
                    Math.max(length + 0.15, 1),
                    0.35,
                    0.35
                ),
                borderMaterial
            );

            border.position.set(
                (p.x + next.x) / 2 +
                    nx * side * TRACK_WIDTH / 2,

                0.25,

                (p.z + next.z) / 2 +
                    nz * side * TRACK_WIDTH / 2
            );

            border.rotation.y =
                -Math.atan2(dz, dx);

            border.castShadow = true;

            scene.add(border);
        }
    }
}

createTrackBorders();

// ============================================================
// FINISH LINE
// ============================================================

function createFinishLine() {

    const group = new THREE.Group();

    const width = TRACK_WIDTH;
    const length = 3;
    const squares = 8;

    const whiteMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });

    const blackMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });

    for (let i = 0; i < squares; i++) {

        const square = new THREE.Mesh(
            new THREE.BoxGeometry(
                length,
                0.08,
                width / squares
            ),
            i % 2 === 0
                ? whiteMaterial
                : blackMaterial
        );

        square.position.z =
            -width / 2 +
            (i + 0.5) *
            width /
            squares;

        group.add(square);
    }

    const start = trackPoints[0];
    const next = trackPoints[1];

    group.position.set(
        start.x,
        0.16,
        start.z
    );

    group.rotation.y =
        -Math.atan2(
            next.z - start.z,
            next.x - start.x
        );

    scene.add(group);
}

createFinishLine();

// ============================================================
// TREES
// ============================================================

function createTree(x, z) {

    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.7,
            0.9,
            3,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x6b3e20
        })
    );

    trunk.position.y = 1.5;
    trunk.castShadow = true;

    tree.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(
            2.8,
            10,
            10
        ),
        new THREE.MeshStandardMaterial({
            color: 0x176b2b
        })
    );

    leaves.position.y = 4;
    leaves.castShadow = true;

    tree.add(leaves);

    tree.position.set(
        x,
        0,
        z
    );

    scene.add(tree);
}

const treeLocations = [

    [-70, -45],
    [-60, 45],
    [-25, -48],
    [20, -50],
    [60, -45],
    [70, 45],
    [30, 48],
    [-30, 47]

];

for (const [x, z] of treeLocations) {
    createTree(x, z);
}

// ============================================================
// KART
// ============================================================

const kart = new THREE.Group();

// ------------------------------------------------------------
// BODY
// ------------------------------------------------------------

const kartBody = new THREE.Mesh(
    new THREE.BoxGeometry(
        2.8,
        0.7,
        4.2
    ),
    new THREE.MeshStandardMaterial({
        color: 0x2196f3,
        roughness: 0.7
    })
);

kartBody.position.y = 0.75;
kartBody.castShadow = true;

kart.add(kartBody);

// ------------------------------------------------------------
// HOOD
// ------------------------------------------------------------

const hood = new THREE.Mesh(
    new THREE.BoxGeometry(
        2.5,
        0.45,
        1.5
    ),
    new THREE.MeshStandardMaterial({
        color: 0x1976d2
    })
);

hood.position.set(
    0,
    1.1,
    -1.1
);

hood.castShadow = true;

kart.add(hood);

// ------------------------------------------------------------
// SEAT
// ------------------------------------------------------------

const seat = new THREE.Mesh(
    new THREE.BoxGeometry(
        1.3,
        1.2,
        1.3
    ),
    new THREE.MeshStandardMaterial({
        color: 0x222222
    })
);

seat.position.set(
    0,
    1.25,
    0.5
);

seat.castShadow = true;

kart.add(seat);

// ------------------------------------------------------------
// WHEELS
// ------------------------------------------------------------

const wheels = [];

function createWheel(x, z) {

    const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.65,
            0.65,
            0.45,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 1
        })
    );

    wheel.rotation.z = Math.PI / 2;

    wheel.position.set(
        x,
        0.55,
        z
    );

    wheel.castShadow = true;

    kart.add(wheel);

    wheels.push(wheel);
}

createWheel(-1.5, -1.35);
createWheel(1.5, -1.35);
createWheel(-1.5, 1.35);
createWheel(1.5, 1.35);

scene.add(kart);

// ============================================================
// BOOST FLAME
// ============================================================

const boostFlame = new THREE.Mesh(
    new THREE.ConeGeometry(
        0.45,
        1.5,
        12
    ),
    new THREE.MeshBasicMaterial({
        color: 0xff7b00
    })
);

boostFlame.rotation.x = Math.PI / 2;

boostFlame.position.set(
    0,
    0.7,
    2.5
);

boostFlame.visible = false;

kart.add(boostFlame);

// ============================================================
// PLAYER PHYSICS
// ============================================================

const player = {

    x: trackPoints[0].x,
    z: trackPoints[0].z,

    speed: 0,

    // KEEPING ALL ORIGINAL NUMBERS
    maxSpeed: 36,
    acceleration: 18,
    braking: 30,
    reverseAcceleration: 10,
    reverseSpeed: 8,
    turnSpeed: 2.4,

    angle: 0,

    drifting: false,

    driftCharge: 0,

    boostTimer: 0,

    boostAcceleration: 100,

    boostMaxSpeed: 300,

    lap: 1,

    nextCheckpoint: 1,

    finished: false,

    finishTime: 0,

    lastDrifting: false
};

// ============================================================
// INITIAL KART DIRECTION
// ============================================================

const initialDx =
    trackPoints[1].x -
    trackPoints[0].x;

const initialDz =
    trackPoints[1].z -
    trackPoints[0].z;

player.angle =
    -Math.atan2(
        initialDz,
        initialDx
    );

kart.position.set(
    player.x,
    0,
    player.z
);

// The kart model faces local -Z.
kart.rotation.y =
    player.angle -
    Math.PI / 2;

// ============================================================
// CHECKPOINTS
// ============================================================

const checkpointIndices = [
    30,
    60,
    90
];

function createCheckpoint(index, number) {

    if (
        index < 0 ||
        index >= trackPoints.length
    ) {

        console.warn(
            "Invalid checkpoint index:",
            index
        );

        return;
    }

    const p = trackPoints[index];

    const next =
        trackPoints[
            (index + 1) %
            trackPoints.length
        ];

    if (!p || !next) {

        console.warn(
            "Checkpoint track point does not exist:",
            index
        );

        return;
    }

    const angle =
        -Math.atan2(
            next.z - p.z,
            next.x - p.x
        );

    const group =
        new THREE.Group();

    const material =
        new THREE.MeshStandardMaterial({

            color:
                number === 1
                    ? 0x00ff00
                    : 0x00aaff,

            transparent: true,

            opacity: 0.35
        });

    const gate =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.4,
                5,
                TRACK_WIDTH
            ),
            material
        );

    gate.position.y = 2.5;

    group.add(gate);

    group.position.set(
        p.x,
        0,
        p.z
    );

    group.rotation.y =
        angle;

    scene.add(group);
}

checkpointIndices.forEach(
    (index, i) => {

        createCheckpoint(
            index,
            i + 1
        );
    }
);

// ============================================================
// INPUT
// ============================================================

const keys = {};

window.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;

        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "Space"
            ].includes(event.code)
        ) {

            event.preventDefault();
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.code] = false;
    }
);

function forward() {

    return (
        keys["KeyW"] ||
        keys["ArrowUp"]
    );
}

function backward() {

    return (
        keys["KeyS"] ||
        keys["ArrowDown"]
    );
}

function left() {

    return (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    );
}

function right() {

    return (
        keys["KeyD"] ||
        keys["ArrowRight"]
    );
}

function space() {

    return keys["Space"];
}

// ============================================================
// TRACK DETECTION
// ============================================================

function closestTrackPoint(x, z) {

    let bestIndex = 0;
    let bestDistanceSquared = Infinity;

    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const p = trackPoints[i];

        const dx = x - p.x;
        const dz = z - p.z;

        const distanceSquared =
            dx * dx +
            dz * dz;

        if (
            distanceSquared <
            bestDistanceSquared
        ) {

            bestDistanceSquared =
                distanceSquared;

            bestIndex = i;
        }
    }

    return {

        index: bestIndex,

        distance:
            Math.sqrt(
                bestDistanceSquared
            )
    };
}

// ============================================================
// DISTANCE FROM POINT TO TRACK SEGMENT
// ============================================================

function distanceToSegment(
    px,
    pz,
    ax,
    az,
    bx,
    bz
) {

    const abx = bx - ax;
    const abz = bz - az;

    const apx = px - ax;
    const apz = pz - az;

    const abLengthSquared =
        abx * abx +
        abz * abz;

    if (
        abLengthSquared === 0
    ) {

        return Math.hypot(
            px - ax,
            pz - az
        );
    }

    let t =
        (
            apx * abx +
            apz * abz
        ) /
        abLengthSquared;

    t =
        Math.max(
            0,
            Math.min(1, t)
        );

    const closestX =
        ax +
        abx * t;

    const closestZ =
        az +
        abz * t;

    return Math.hypot(
        px - closestX,
        pz - closestZ
    );
}

// ============================================================
// ACCURATE TRACK COLLISION
// ============================================================

function isOnTrack(x, z) {

    const allowedDistance =
        TRACK_WIDTH / 2 + 1.8;

    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const a =
            trackPoints[i];

        const b =
            trackPoints[
                (i + 1) %
                trackPoints.length
            ];

        const distance =
            distanceToSegment(
                x,
                z,
                a.x,
                a.z,
                b.x,
                b.z
            );

        if (
            distance <=
            allowedDistance
        ) {

            return true;
        }
    }

    return false;
}

// ============================================================
// DECELERATION HELPER
// ============================================================

function moveToward(
    current,
    target,
    amount
) {

    if (current < target) {

        return Math.min(
            current + amount,
            target
        );
    }

    if (current > target) {

        return Math.max(
            current - amount,
            target
        );
    }

    return target;
}

// ============================================================
// PLAYER PHYSICS
// ============================================================

function updatePlayer(deltaTime) {

    if (player.finished) {
        return;
    }

    // --------------------------------------------------------
    // ACCELERATION
    // --------------------------------------------------------

    if (forward()) {

        player.speed +=
            player.acceleration *
            deltaTime;

        player.speed =
            Math.min(
                player.speed,
                player.maxSpeed
            );
    }

    // --------------------------------------------------------
    // BRAKING / REVERSE
    // --------------------------------------------------------

    if (backward()) {

        if (player.speed > 0) {

            player.speed =
                moveToward(
                    player.speed,
                    0,
                    player.braking *
                    deltaTime
                );

        } else {

            player.speed -=
                player.reverseAcceleration *
                deltaTime;

            player.speed =
                Math.max(
                    player.speed,
                    -player.reverseSpeed
                );
        }
    }

    // --------------------------------------------------------
    // NATURAL DECELERATION
    // --------------------------------------------------------

    if (
        !forward() &&
        !backward()
    ) {

        const naturalDeceleration =
            7.0 *
            deltaTime;

        player.speed =
            moveToward(
                player.speed,
                0,
                naturalDeceleration
            );
    }

    // --------------------------------------------------------
    // DRIFT
    // --------------------------------------------------------

    const wantsDrift =
        space() &&
        Math.abs(player.speed) > 5 &&
        (left() || right());

    player.drifting =
        wantsDrift;

    // --------------------------------------------------------
    // STEERING
    // --------------------------------------------------------

    if (
        left() ||
        right()
    ) {

        const direction =
            right()
                ? -1
                : 1;

        const speedRatio =
            Math.min(
                Math.abs(player.speed) /
                player.maxSpeed,
                1
            );

        const steeringStrength =
            0.35 +
            speedRatio * 0.65;

        const driftMultiplier =
            player.drifting
                ? 1.35
                : 1;

        player.angle +=
            direction *
            player.turnSpeed *
            steeringStrength *
            driftMultiplier *
            deltaTime;
    }

    // --------------------------------------------------------
    // DRIFT CHARGE
    // --------------------------------------------------------

    if (player.drifting) {

        player.driftCharge +=
            deltaTime;

        player.driftCharge =
            Math.min(
                player.driftCharge,
                2.5
            );

    } else {

        if (
            player.lastDrifting &&
            player.driftCharge >= 0.35
        ) {

            if (
                player.driftCharge < 0.8
            ) {

                // MINI BOOST
                player.boostTimer = 0.45;

            } else if (
                player.driftCharge < 1.5
            ) {

                // MEDIUM BOOST
                player.boostTimer = 0.8;

            } else {

                // MAX BOOST
                player.boostTimer = 1.25;
            }
        }

        player.driftCharge = 0;
    }

    player.lastDrifting =
        player.drifting;

    // --------------------------------------------------------
    // BOOST
    // --------------------------------------------------------

    if (
        player.boostTimer > 0
    ) {

        player.boostTimer -=
            deltaTime;

        player.speed +=
            player.boostAcceleration *
            deltaTime;

        player.speed =
            Math.min(
                player.speed,
                player.boostMaxSpeed
            );

        boostFlame.visible = true;

    } else {

        boostFlame.visible = false;
    }

    // --------------------------------------------------------
    // DRIFT MOVEMENT
    // --------------------------------------------------------

    let moveAngle =
        player.angle;

    if (
        player.drifting
    ) {

        const driftDirection =
            right()
                ? -1
                : 1;

        moveAngle +=
            driftDirection *
            0.28;
    }

    // --------------------------------------------------------
    // REAL-TIME MOVEMENT
    // --------------------------------------------------------

    const distance =
        player.speed *
        deltaTime;

    const moveX =
        Math.cos(moveAngle) *
        distance;

    const moveZ =
        -Math.sin(moveAngle) *
        distance;

    const newX =
        player.x +
        moveX;

    const newZ =
        player.z +
        moveZ;

    // --------------------------------------------------------
    // TRACK COLLISION
    // --------------------------------------------------------

    if (
        isOnTrack(
            newX,
            newZ
        )
    ) {

        player.x =
            newX;

        player.z =
            newZ;

    } else {

        // Try X movement separately.

        if (
            isOnTrack(
                newX,
                player.z
            )
        ) {

            player.x =
                newX;
        }

        // Try Z movement separately.

        if (
            isOnTrack(
                player.x,
                newZ
            )
        ) {

            player.z =
                newZ;
        }

        // Slow down against edge.

        player.speed =
            moveToward(
                player.speed,
                0,
                20 *
                deltaTime
            );
    }

    // --------------------------------------------------------
    // KART POSITION
    // --------------------------------------------------------

    kart.position.x =
        player.x;

    kart.position.z =
        player.z;

    kart.rotation.y =
        player.angle -
        Math.PI / 2;

    // --------------------------------------------------------
    // WHEEL ROTATION
    // --------------------------------------------------------

    const wheelRadius = 0.65;

    const wheelRotation =
        distance /
        wheelRadius;

    for (
        const wheel of wheels
    ) {

        wheel.rotation.x +=
            wheelRotation;
    }

    // --------------------------------------------------------
    // RACE
    // --------------------------------------------------------

    updateRace();
}

// ============================================================
// RACE SYSTEM
// ============================================================

const TOTAL_LAPS = 3;

function circularDistance(
    a,
    b,
    length
) {

    const direct =
        Math.abs(a - b);

    const wrapped =
        length - direct;

    return Math.min(
        direct,
        wrapped
    );
}

function updateRace() {

    const nearest =
        closestTrackPoint(
            player.x,
            player.z
        );

    const index =
        nearest.index;

    const checkpointWindow = 5;

    // --------------------------------------------------------
    // CHECKPOINT 1
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 1 &&
        circularDistance(
            index,
            checkpointIndices[0],
            trackPoints.length
        ) <= checkpointWindow
    ) {

        player.nextCheckpoint = 2;
    }

    // --------------------------------------------------------
    // CHECKPOINT 2
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 2 &&
        circularDistance(
            index,
            checkpointIndices[1],
            trackPoints.length
        ) <= checkpointWindow
    ) {

        player.nextCheckpoint = 3;
    }

    // --------------------------------------------------------
    // CHECKPOINT 3
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 3 &&
        circularDistance(
            index,
            checkpointIndices[2],
            trackPoints.length
        ) <= checkpointWindow
    ) {

        player.nextCheckpoint = 4;
    }

    // --------------------------------------------------------
    // FINISH LINE
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 4
    ) {

        const finishPoint =
            trackPoints[0];

        const finishDistance =
            Math.hypot(
                player.x -
                    finishPoint.x,

                player.z -
                    finishPoint.z
            );

        const finishWindow =
            TRACK_WIDTH / 2 + 1.5;

        if (
            finishDistance <=
            finishWindow
        ) {

            if (
                player.lap <
                TOTAL_LAPS
            ) {

                player.lap++;

                player.nextCheckpoint = 1;

            } else {

                player.finished = true;

                player.finishTime =
                    raceElapsedTime;

                boostFlame.visible =
                    false;

                showFinish();
            }
        }
    }
}

// ============================================================
// RACE TIMER
// ============================================================

let raceElapsedTime = 0;

// ============================================================
// RACE COUNTDOWN
// ============================================================

let raceStarted = false;

let countdownTime = 3;

let countdownFinished = false;

let goShown = false;

// ------------------------------------------------------------
// COUNTDOWN DISPLAY
// ------------------------------------------------------------

const countdownDisplay =
    document.createElement("div");

countdownDisplay.style.position =
    "absolute";

countdownDisplay.style.top =
    "50%";

countdownDisplay.style.left =
    "50%";

countdownDisplay.style.transform =
    "translate(-50%, -50%)";

countdownDisplay.style.color =
    "white";

countdownDisplay.style.fontFamily =
    "Arial, sans-serif";

countdownDisplay.style.fontSize =
    "120px";

countdownDisplay.style.fontWeight =
    "bold";

countdownDisplay.style.textShadow =
    "0 5px 15px rgba(0,0,0,0.8)";

countdownDisplay.style.zIndex =
    "30";

countdownDisplay.style.pointerEvents =
    "none";

countdownDisplay.style.textAlign =
    "center";

countdownDisplay.style.width =
    "100%";

container.style.position =
    "relative";

container.appendChild(
    countdownDisplay
);

// ------------------------------------------------------------
// UPDATE COUNTDOWN
// ------------------------------------------------------------

function updateCountdown(deltaTime) {

    if (countdownFinished) {
        return;
    }

    countdownTime -=
        deltaTime;

    if (
        countdownTime > 2
    ) {

        countdownDisplay.textContent =
            "3";

    } else if (
        countdownTime > 1
    ) {

        countdownDisplay.textContent =
            "2";

    } else if (
        countdownTime > 0
    ) {

        countdownDisplay.textContent =
            "1";

    } else if (
        !goShown
    ) {

        goShown = true;

        raceStarted = true;

        countdownDisplay.textContent =
            "GO!";

        setTimeout(
            () => {

                countdownDisplay.textContent =
                    "";

                countdownFinished =
                    true;

            },
            700
        );
    }
}

// ============================================================
// HUD
// ============================================================

const hud =
    document.createElement("div");

hud.style.position =
    "absolute";

hud.style.top =
    "15px";

hud.style.left =
    "15px";

hud.style.padding =
    "12px 18px";

hud.style.background =
    "rgba(0,0,0,0.65)";

hud.style.color =
    "white";

hud.style.fontFamily =
    "Arial, sans-serif";

hud.style.fontSize =
    "18px";

hud.style.borderRadius =
    "8px";

hud.style.zIndex =
    "10";

hud.style.pointerEvents =
    "none";

container.appendChild(
    hud
);

function updateHUD() {

    let boostText = "";

    if (
        player.boostTimer > 0
    ) {

        boostText =
            " 🔥 BOOST!";
    }

    let driftText = "";

    if (
        player.drifting
    ) {

        driftText =
            `<br>Drift: ${player.driftCharge.toFixed(1)}s`;
    }

    hud.innerHTML = `

        <strong>
            🏎️ KART RACER
        </strong>

        <br>

        Lap:
        ${player.lap}
        /
        ${TOTAL_LAPS}

        <br>

        Speed:
        ${Math.round(
            Math.abs(player.speed)
        )}

        ${boostText}

        ${driftText}

        <br>

        Time:
        ${raceElapsedTime.toFixed(1)}s

        <br><br>

        <small>
            W / ↑ Accelerate<br>
            S / ↓ Reverse<br>
            A / ← Turn Left<br>
            D / → Turn Right<br>
            SPACE + Turn = Drift
        </small>
    `;
}

updateHUD();

// ============================================================
// FINISH SCREEN
// ============================================================

function showFinish() {

    const finish =
        document.createElement("div");

    finish.id =
        "finishScreen";

    finish.style.position =
        "absolute";

    finish.style.top =
        "50%";

    finish.style.left =
        "50%";

    finish.style.transform =
        "translate(-50%, -50%)";

    finish.style.padding =
        "30px 50px";

    finish.style.background =
        "rgba(0,0,0,0.9)";

    finish.style.color =
        "white";

    finish.style.fontFamily =
        "Arial, sans-serif";

    finish.style.textAlign =
        "center";

    finish.style.borderRadius =
        "15px";

    finish.style.zIndex =
        "20";

    finish.innerHTML = `

        <h1>
            🏆 FINISH!
        </h1>

        <p>
            Race Time:
            ${player.finishTime.toFixed(2)}
            seconds
        </p>

        <br>

        <button
            id="restartButton"
            style="
                padding: 12px 24px;
                font-size: 16px;
                cursor: pointer;
                border-radius: 8px;
                border: none;
            "
        >
            RACE AGAIN
        </button>
    `;

    container.appendChild(
        finish
    );

    document
        .getElementById(
            "restartButton"
        )
        .addEventListener(
            "click",
            () => {
                location.reload();
            }
        );
}

// ============================================================
// CAMERA
// ============================================================

const cameraTarget =
    new THREE.Vector3();

function updateCamera(deltaTime) {

    const cameraDistance = 12;

    const cameraHeight = 7;

    const behindX =
        player.x -
        Math.cos(player.angle) *
        cameraDistance;

    const behindZ =
        player.z +
        Math.sin(player.angle) *
        cameraDistance;

    cameraTarget.set(
        behindX,
        cameraHeight,
        behindZ
    );

    const smoothing =
        1 -
        Math.exp(
            -8 *
            deltaTime
        );

    camera.position.lerp(
        cameraTarget,
        smoothing
    );

    const lookX =
        player.x +
        Math.cos(player.angle) *
        6;

    const lookZ =
        player.z -
        Math.sin(player.angle) *
        6;

    camera.lookAt(
        lookX,
        1.2,
        lookZ
    );
}

// ============================================================
// RESIZE
// ============================================================

function resize() {

    const width =
        container.clientWidth;

    const height =
        container.clientHeight;

    if (
        width <= 0 ||
        height <= 0
    ) {

        return;
    }

    camera.aspect =
        width /
        height;

    camera.updateProjectionMatrix();

    renderer.setSize(
        width,
        height
    );
}

window.addEventListener(
    "resize",
    resize
);

resize();

// ============================================================
// GAME LOOP
// ============================================================

let previousTime =
    performance.now();

function animate(currentTime) {

    requestAnimationFrame(
        animate
    );

    // --------------------------------------------------------
    // REAL ELAPSED TIME
    // --------------------------------------------------------

    let deltaTime =
        (
            currentTime -
            previousTime
        ) / 1000;

    previousTime =
        currentTime;

    // Prevent huge physics jumps
    // if the browser is temporarily paused.

    deltaTime =
        Math.min(
            deltaTime,
            0.05
        );

    // --------------------------------------------------------
    // COUNTDOWN
    // --------------------------------------------------------

    updateCountdown(
        deltaTime
    );

    // --------------------------------------------------------
    // RACE TIMER
    // --------------------------------------------------------

    if (
        raceStarted &&
        !player.finished
    ) {

        raceElapsedTime +=
            deltaTime;
    }

    // --------------------------------------------------------
    // PHYSICS
    // --------------------------------------------------------

    if (
        raceStarted
    ) {

        updatePlayer(
            deltaTime
        );
    }

    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    updateCamera(
        deltaTime
    );

    // --------------------------------------------------------
    // HUD
    // --------------------------------------------------------

    updateHUD();

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    renderer.render(
        scene,
        camera
    );
}

requestAnimationFrame(
    animate
);
