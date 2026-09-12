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
    color:
        new URLSearchParams(window.location.search).get("track") === "3"
            ? 0xc2a15a
            : 0x3f8f3f,
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
// OASIS WATER
// ============================================================

if (
    new URLSearchParams(window.location.search).get("track") === "3"
) {
    const oasisWater = new THREE.Mesh(
        new THREE.CylinderGeometry(
            8,
            8,
            0.12,
            48
        ),
        new THREE.MeshStandardMaterial({
            color: 0x2aa9d6,
            roughness: 0.25,
            metalness: 0.05
        })
    );

    oasisWater.position.set(
        -10,
        0.08,
        19
    );

    oasisWater.receiveShadow = true;

    scene.add(oasisWater);
}

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

// ============================================================
// TRACK 2 - FOREST RUN
// ============================================================

function forestRunPoints() {

    const controlPoints = [

    // Start / long bottom straight
    { x: -85, z: -55 },
    { x: -45, z: -65 },
    { x: 10, z: -65 },
    { x: 60, z: -55 },
    { x: 80, z: -35 },

    // Right-hand turn
    { x: 85, z: -10 },
    { x: 70, z: 5 },

    // Middle straight
    { x: 35, z: 12 },
    { x: -15, z: 12 },
    { x: -55, z: 8 },

    // Left-hand turn
    { x: -75, z: 20 },
    { x: -70, z: 38 },

    // Upper straight
    { x: -40, z: 52 },
    { x: 10, z: 58 },
    { x: 55, z: 52 },

    // Upper-right turn
    { x: 75, z: 38 },
    { x: 72, z: 20 },

    // Return section
    { x: 50, z: -2 },
    { x: 20, z: -15 },
    { x: -15, z: -25 },
    { x: -50, z: -20 },

    // Final turn back to start
    { x: -75, z: -10 },
    { x: -85, z: -30 }

];

    const curve = new THREE.CatmullRomCurve3(
        controlPoints.map(
            point => new THREE.Vector3(
                point.x,
                0,
                point.z
            )
        ),
        true,
        "centripetal",
        0.5
    );

    const points = [];
    const samples = 120;

    for (let i = 0; i < samples; i++) {

        const point =
            curve.getPoint(i / samples);

        points.push({
            x: point.x,
            z: point.z
        });

    }

    return points;
}

// ============================================================
// TRACK 3 - OASIS
// ============================================================

function oasisPoints() {
    const controlPoints = [
        // Start / short straight
        { x: -75, z: -50 },
        { x: -48, z: -50 },

        // Tight turn
        { x: -30, z: -40 },
        { x: -25, z: -20 },

        // Medium straight toward ramp
        { x: -5, z: -10 },
        { x: 25, z: -10 },
        { x: 45, z: -5 },

        // Top of ramp / small straight
        { x: 60, z: 5 },
        { x: 62, z: 15 },

        // Sharp turn
        { x: 52, z: 25 },

        // Medium straight
        { x: 25, z: 30 },
        { x: 5, z: 30 },

        // Spiral entrance
{ x: -14, z: 38 },
{ x: -30, z: 30 },
{ x: -34, z: 16 },
{ x: -24, z: 5 },
{ x: -7, z: 0 },

// Spiral continues downward
{ x: 14, z: 7 },
{ x: 24, z: 17 },
{ x: 16, z: 30 },
{ x: 0, z: 37 },

// Spiral exit
{ x: -16, z: 31 },
{ x: -27, z: 17 },
{ x: -20, z: 5 },

        // Final straight
        { x: -25, z: -10 },
        { x: -45, z: -25 },
        { x: -65, z: -40 }
    ];

    const curve = new THREE.CatmullRomCurve3(
        controlPoints.map(
            point =>
                new THREE.Vector3(
                    point.x,
                    0,
                    point.z
                )
        ),
        true,
        "centripetal",
        0.5
    );

    const points = [];
    const samples = 120;

    for (let i = 0; i < samples; i++) {
        const point =
            curve.getPoint(i / samples);

        points.push({
            x: point.x,
            z: point.z
        });
    }

    return points;
}

// ============================================================
// TRACK SELECTION
// ============================================================

const selectedTrack =
    new URLSearchParams(window.location.search).get("track");

const trackPoints =
    selectedTrack === "1"
        ? roundedRectanglePoints()
        : selectedTrack === "3"
            ? oasisPoints()
            : forestRunPoints();

// ============================================================
// PLAYER / CONTROL HELPERS
// ============================================================

// PLAYER / CONTROL HELPERS
const keys = {};

document.addEventListener("keydown", (event) => {
    keys[event.code] = true;

    // Prevent the arrow keys and spacebar from scrolling the page
    if (
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight" ||
        event.code === "Space"
    ) {
        event.preventDefault();
    }
});

document.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});

window.addEventListener("blur", () => {
    for (const key in keys) {
        keys[key] = false;
    }
});

function forward() {
    return keys["KeyW"] || keys["ArrowUp"];
}

function backward() {
    return keys["KeyS"] || keys["ArrowDown"];
}

function left() {
    return keys["KeyA"] || keys["ArrowLeft"];
}

function right() {
    return keys["KeyD"] || keys["ArrowRight"];
}

function space() {
    return keys["Space"];
}

function moveToward(current, target, amount) {

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
// TRACK CHECKPOINTS
// ============================================================

const checkpointIndices = [
    30,
    60,
    90
];

// ============================================================
// CLOSEST TRACK POINT
// ============================================================

function closestTrackPoint(x, z) {

    let closestIndex = 0;
    let closestDistance = Infinity;

    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const point = trackPoints[i];

        const distance =
            Math.hypot(
                x - point.x,
                z - point.z
            );

        if (
            distance <
            closestDistance
        ) {

            closestDistance =
                distance;

            closestIndex =
                i;
        }
    }

    return {
        index: closestIndex,
        distance: closestDistance
    };
}

// ============================================================
// TRACK COLLISION
// ============================================================

function isOnTrack(x, z) {

    let closestDistance = Infinity;

    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const current =
            trackPoints[i];

        const next =
            trackPoints[
                (i + 1) %
                trackPoints.length
            ];

        const dx =
            next.x -
            current.x;

        const dz =
            next.z -
            current.z;

        const lengthSquared =
            dx * dx +
            dz * dz;

        let t = 0;

        if (lengthSquared > 0) {

            t =
                (
                    (x - current.x) * dx +
                    (z - current.z) * dz
                ) /
                lengthSquared;

            t =
                Math.max(
                    0,
                    Math.min(1, t)
                );
        }

        const closestX =
            current.x +
            dx * t;

        const closestZ =
            current.z +
            dz * t;

        const distance =
            Math.hypot(
                x - closestX,
                z - closestZ
            );

        closestDistance =
            Math.min(
                closestDistance,
                distance
            );
    }

    return (
        closestDistance <=
        TRACK_WIDTH / 2
    );
}

// ============================================================
// OASIS RAMP HEIGHT
// ============================================================

function getTrackHeight(index) {

    // Only Oasis gets elevation
    if (selectedTrack !== "3") {
        return 0;
    }

    // --------------------------------------------------------
    // RAMP UP
    // --------------------------------------------------------

    const rampStart = 24;
    const rampTopStart = 29;

    if (
        index >= rampStart &&
        index < rampTopStart
    ) {

        const t =
            (index - rampStart) /
            (rampTopStart - rampStart);

        return t * 6;
    }

    // --------------------------------------------------------
    // ELEVATED STRAIGHT
    // --------------------------------------------------------

    const elevatedEnd = 48;

    if (
        index >= rampTopStart &&
        index <= elevatedEnd
    ) {

        return 6;
    }

    // --------------------------------------------------------
    // SPIRAL DOWNHILL
    // --------------------------------------------------------

    const spiralStart = 48;
    const spiralEnd = 88;

    if (
        index >= spiralStart &&
        index <= spiralEnd
    ) {

        const t =
            (index - spiralStart) /
            (spiralEnd - spiralStart);

        return 6 * (1 - t);
    }

    return 0;
}

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

       const height = getTrackHeight(i);

positions.push(
    o.x,
    height + 0.05,
    o.z,

    inn.x,
    height + 0.05,
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
    c,
    b,

    b,
    c,
    d
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

                // Hide borders where another section of the track
        // comes too close, preventing ugly overlaps.
        const midX = (p.x + next.x) / 2;
        const midZ = (p.z + next.z) / 2;

        let nearAnotherSection = false;

        for (let j = 0; j < trackPoints.length; j += 2) {

            const indexDistance =
                Math.abs(j - i);

            const circularDistance =
                Math.min(
                    indexDistance,
                    trackPoints.length - indexDistance
                );

            // Ignore nearby points that belong to this
            // same section of road.
            if (circularDistance < 8) {
                continue;
            }

            const other = trackPoints[j];

            const distanceToOther =
                Math.hypot(
                    midX - other.x,
                    midZ - other.z
                );

            if (distanceToOther < 16) {
                nearAnotherSection = true;
                break;
            }
        }

        if (nearAnotherSection) {
            continue;
        }

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
// OASIS PALM TREES
// ============================================================

if (new URLSearchParams(window.location.search).get("track") === "3") {

    function createPalmTree(x, z) {
        const palm = new THREE.Group();

        // Trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.45,
                0.65,
                5,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x8b5a2b
            })
        );

        trunk.position.y = 2.5;
        trunk.rotation.z = -0.08;
        trunk.castShadow = true;
        palm.add(trunk);

        // Palm leaves
        for (let i = 0; i < 7; i++) {
            const leaf = new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.3,
                    0.12,
                    3.2
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x2f8f3a
                })
            );

            const angle = (i / 7) * Math.PI * 2;

            leaf.position.set(
                Math.sin(angle) * 1.2,
                5.15,
                Math.cos(angle) * 1.2
            );

            leaf.rotation.y = angle;
            leaf.rotation.x = -0.35;

            leaf.castShadow = true;
            palm.add(leaf);
        }

        palm.position.set(x, 0, z);

        scene.add(palm);
    }

    const palmTreeLocations = [
    [-65,-35],
    [35,-35],
    [65,5],
    [35,35],
    [-50,35],
    [-55,5],
    [45,15],
    [-45,20]
];

    for (const [x, z] of palmTreeLocations) {
        createPalmTree(x, z);
    }
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
// AI OPPONENTS
// ============================================================

const aiKarts = [];

const AI_COUNT = 3;

function createAIKart(color) {

    const aiKart = new THREE.Group();

// AI drift sparks
const driftSpark = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshBasicMaterial({
        color: 0xffff00
    })
);

driftSpark.visible = false;
driftSpark.position.set(0, 0.35, 0.9);

aiKart.add(driftSpark);
    
    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.8,
            0.7,
            4.2
        ),
        new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7
        })
    );

    body.position.y = 0.75;
    body.castShadow = true;

    aiKart.add(body);

    // --------------------------------------------------------
    // HOOD
    // --------------------------------------------------------

    const aiHood = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.5,
            0.45,
            1.5
        ),
        new THREE.MeshStandardMaterial({
            color: color
        })
    );

    aiHood.position.set(
        0,
        1.1,
        -1.1
    );

    aiHood.castShadow = true;

    aiKart.add(aiHood);

    // --------------------------------------------------------
    // SEAT
    // --------------------------------------------------------

    const aiSeat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            1.2,
            1.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x222222
        })
    );

    aiSeat.position.set(
        0,
        1.25,
        0.5
    );

    aiSeat.castShadow = true;

    aiKart.add(aiSeat);

    // --------------------------------------------------------
    // WHEELS
    // --------------------------------------------------------

    function addAIWheel(x, z) {

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

        wheel.rotation.z =
            Math.PI / 2;

        wheel.position.set(
            x,
            0.55,
            z
        );

        wheel.castShadow = true;

        aiKart.add(wheel);
    }

    addAIWheel(-1.5, -1.35);
    addAIWheel(1.5, -1.35);
    addAIWheel(-1.5, 1.35);
    addAIWheel(1.5, 1.35);

    scene.add(aiKart);

    aiKart.userData.driftSpark = driftSpark;

    return aiKart;
}

const aiColors = [
    0xff3333,
    0xffff33,
    0x9933ff
];

for (let i = 0; i < AI_COUNT; i++) {

    const aiKart = createAIKart(
        aiColors[i]
    );

    // --------------------------------------------------------
    // STARTING GRID
    // --------------------------------------------------------

    const startingIndices = [
        116,
        112,
        108
    ];

    const startIndex =
        startingIndices[i];

    const startPoint =
        trackPoints[startIndex];

    const nextPoint =
        trackPoints[
            (startIndex + 1) %
            trackPoints.length
        ];

    // Get the direction of the track
    const dx =
        nextPoint.x -
        startPoint.x;

    const dz =
        nextPoint.z -
        startPoint.z;

    const angle =
        -Math.atan2(
            dz,
            dx
        );

    // Put the AI on the starting grid
    aiKart.position.set(
        startPoint.x,
        0,
        startPoint.z
    );

    // The kart model faces local -Z
    aiKart.rotation.y =
        angle -
        Math.PI / 2;

    aiKarts.push({

        kart: aiKart,

        trackIndex:
            startIndex,

        speed: 0,

        maxSpeed:
    i === 0 ? 33 :
    i === 1 ? 33.5 :
    32.5,

        driftLevel:
    i === 0 ? 2 :   // Red: Mini + Medium
    i === 1 ? 1 :   // Yellow: Mini only
    3,              // Purple: Mini + Medium + Max

driftChargeMultiplier:
    i === 0 ? 1 :
    i === 1 ? 0.8 :
    0.9,

driftCharge: 0,
drifting: false,
driftBoostTimer: 0,

        acceleration: 12,

        angle: angle,

        lap: 1,

        // Start the AI behind the player's
        // official race-start position.
        raceProgress:
            startIndex -
            trackPoints.length,

        finished: false

    });
}

// ============================================================
// PLAYER STATE
// ============================================================

const startPoint =
    trackPoints[0];

const nextStartPoint =
    trackPoints[1];

const startDX =
    nextStartPoint.x -
    startPoint.x;

const startDZ =
    nextStartPoint.z -
    startPoint.z;

const playerStartAngle =
    -Math.atan2(
        startDZ,
        startDX
    );

const player = {

    x:
        startPoint.x,

    z:
        startPoint.z,

    speed:
        0,

    maxSpeed:
        40,

    acceleration:
        18,

    braking:
        30,

    reverseAcceleration:
        10,

    reverseSpeed:
        8,

    turnSpeed:
        2.6,

    angle:
        playerStartAngle,

    drifting:
        false,

    driftCharge:
        0,

    boostTimer:
        0,

    boostAcceleration:
        40,

    boostMaxSpeed:
        59,

    currentBoostCap:
        47,

    lap:
        1,

    nextCheckpoint:
        1,

    finished:
        false,

    finishTime:
        0,

    lastDrifting:
        false
};

// ============================================================
// AI MOVEMENT
// ============================================================

function updateAI(deltaTime) {

    for (const ai of aiKarts) {

        if (ai.finished) {
            continue;
        }

        // ----------------------------------------------------
        // TARGET NEXT TRACK POINT
        // ----------------------------------------------------

        const nextIndex =
    (ai.trackIndex + 1) %
    trackPoints.length;

const nextPoint =
    trackPoints[nextIndex];

// Look several points ahead so the AI
// starts preparing for upcoming turns.
const lookAheadIndex =
    (ai.trackIndex + 5) %
    trackPoints.length;

const target =
    trackPoints[lookAheadIndex];

        // Detect how sharply the track is turning ahead.
const cornerLookAhead =
    (ai.trackIndex + 10) %
    trackPoints.length;

const cornerLookAhead2 =
    (ai.trackIndex + 16) %
    trackPoints.length;

const cornerPoint1 =
    trackPoints[cornerLookAhead];

const cornerPoint2 =
    trackPoints[cornerLookAhead2];

const cornerDX =
    cornerPoint2.x -
    cornerPoint1.x;

const cornerDZ =
    cornerPoint2.z -
    cornerPoint1.z;

const cornerAngle =
    Math.abs(
        Math.atan2(
            cornerDZ,
            cornerDX
        )
    );

// Give each AI its own racing line.
// AI 1 = inside
// AI 2 = center
// AI 3 = outside
const lineOffsets = [
    -3,
    0,
    3
];

let lineOffset =
    lineOffsets[
        aiKarts.indexOf(ai)
    ];

// Look for another AI directly ahead.
for (const otherAI of aiKarts) {

    if (otherAI === ai || otherAI.finished) {
        continue;
    }

    const otherDX =
        otherAI.kart.position.x -
        ai.kart.position.x;

    const otherDZ =
        otherAI.kart.position.z -
        ai.kart.position.z;

    const otherDistance =
        Math.hypot(
            otherDX,
            otherDZ
        );

    // Is the other kart in front of this AI?
    const forwardAmount =
        otherDX * Math.cos(ai.angle) +
        otherDZ * -Math.sin(ai.angle);

    if (
        otherDistance < 7 &&
        forwardAmount > 0 &&
        forwardAmount < 7
    ) {

        // Move sideways to try to pass.
        if (aiKarts.indexOf(ai) % 2 === 0) {
            lineOffset -= 2.5;
        } else {
            lineOffset += 2.5;
        }

        // Keep the AI safely inside the track.
        lineOffset =
            Math.max(
                -5.5,
                Math.min(
                    5.5,
                    lineOffset
                )
            );

        break;
    }
}

// Find the direction of the track
// around the look-ahead point.
const beforeIndex =
    (lookAheadIndex - 1 + trackPoints.length) %
    trackPoints.length;

const afterIndex =
    (lookAheadIndex + 1) %
    trackPoints.length;

const beforePoint =
    trackPoints[beforeIndex];

const afterPoint =
    trackPoints[afterIndex];

const tangentX =
    afterPoint.x -
    beforePoint.x;

const tangentZ =
    afterPoint.z -
    beforePoint.z;

const tangentLength =
    Math.hypot(
        tangentX,
        tangentZ
    );

const normalX =
    -tangentZ /
    tangentLength;

const normalZ =
    tangentX /
    tangentLength;

// Move the target sideways from
// the center of the track.
const targetX =
    target.x +
    normalX * lineOffset;

const targetZ =
    target.z +
    normalZ * lineOffset;

// Distance to the immediate next point.
// This is still used to advance the AI's
// official race progress.
const nextDX =
    nextPoint.x -
    ai.kart.position.x;

const nextDZ =
    nextPoint.z -
    ai.kart.position.z;

const nextDistance =
    Math.hypot(
        nextDX,
        nextDZ
    );

// Direction toward the AI's
// individual racing line.
const dx =
    targetX -
    ai.kart.position.x;

const dz =
    targetZ -
    ai.kart.position.z;

        // ----------------------------------------------------
        // UPDATE AI ANGLE
        // ----------------------------------------------------

        const targetAngle =
            -Math.atan2(
                dz,
                dx
            );

        let angleDifference =
            targetAngle -
            ai.angle;

        // Keep angle between -PI and PI
        angleDifference =
            Math.atan2(
                Math.sin(angleDifference),
                Math.cos(angleDifference)
            );

        // KEEPING YOUR ORIGINAL TURN SPEED
        let turnSpeed = 3.5;

// AI steers harder while drifting.
// Purple gets the strongest cornering ability.
if (ai.drifting) {

    if (ai.driftLevel === 3) {
        turnSpeed = 4.5;
    } else if (ai.driftLevel === 2) {
        turnSpeed = 4.1;
    } else {
        turnSpeed = 3.8;
    }
}

ai.angle +=
    angleDifference *
    Math.min(
        1,
        turnSpeed *
        deltaTime
    );

        // ----------------------------------------------------
        // ACCELERATION
        // ----------------------------------------------------

        if (ai.speed < ai.maxSpeed) {

            // KEEPING YOUR ORIGINAL ACCELERATION
            ai.speed +=
                ai.acceleration *
                deltaTime;

            // KEEPING YOUR ORIGINAL SPEED CAP
            ai.speed =
                Math.min(
                    ai.speed,
                    ai.maxSpeed
                );
        }

        // ----------------------------------------------------
// AI DRIFT
// ----------------------------------------------------

if (
    cornerAngle > 0.45 &&
    ai.speed > 12
) {
    ai.drifting = true;

    if (ai.kart.userData.driftSpark) {
    ai.kart.userData.driftSpark.visible = true;
}

    ai.driftCharge +=
        deltaTime *
        ai.driftChargeMultiplier;

    // Each AI has a different maximum drift.
    const maxDriftCharge =
        ai.driftLevel === 1 ? 0.8 :
        ai.driftLevel === 2 ? 1.5 :
        2.5;

    ai.driftCharge =
        Math.min(
            ai.driftCharge,
            maxDriftCharge
        );

} else if (ai.drifting) {

    ai.drifting = false;

    if (ai.kart.userData.driftSpark) {
    ai.kart.userData.driftSpark.visible = false;
}

    // Release the drift and determine the boost.
    if (ai.driftCharge >= 0.35) {

        if (
            ai.driftLevel >= 3 &&
            ai.driftCharge >= 2.2
        ) {
            // PURPLE — MAX BOOST
            ai.driftBoostTimer = 1.0;

        } else if (
            ai.driftLevel >= 2 &&
            ai.driftCharge >= 1.0
        ) {
            // RED — MEDIUM BOOST
            ai.driftBoostTimer = 0.65;

        } else {
            // YELLOW — MINI BOOST
            ai.driftBoostTimer = 0.35;
        }
    }

    ai.driftCharge = 0;
}
  
        // ----------------------------------------------------
        // MOVEMENT
        // ----------------------------------------------------

        // ----------------------------------------------------
// AI BOOST
// ----------------------------------------------------

if (ai.driftBoostTimer > 0) {

    ai.driftBoostTimer -=
        deltaTime;

    ai.speed +=
        40 *
        deltaTime;

    ai.speed =
        Math.min(
            ai.speed,
            ai.maxSpeed + 10
        );
}

        const moveDistance =
            ai.speed *
            deltaTime;

        ai.kart.position.x +=
            Math.cos(ai.angle) *
            moveDistance;

        ai.kart.position.z +=
            -Math.sin(ai.angle) *
            moveDistance;

        // ----------------------------------------------------
        // CHECK IF AI REACHED NEXT POINT
        // ----------------------------------------------------

        if (nextDistance < 5 || (nextDX * Math.cos(ai.angle) + nextDZ * -Math.sin(ai.angle)) < 0) {

            const previousIndex =
                ai.trackIndex;

            ai.trackIndex =
                nextIndex;

            // Move the AI forward one official
            // race-progress point.
            ai.raceProgress++;

            // ------------------------------------------------
            // LAP COMPLETED
            // ------------------------------------------------

            if (
    previousIndex ===
        trackPoints.length - 1 &&
    nextIndex === 0 &&
    ai.raceProgress > 0
) {
    ai.lap++;

                // AI has completed all 3 laps.
                if (
                    ai.lap >
                    TOTAL_LAPS
                ) {

                    ai.finished = true;

                    ai.speed = 0;

                    continue;
                }
            }
        }

        // ----------------------------------------------------
        // ROTATE AI KART
        // ----------------------------------------------------

        ai.kart.rotation.y =
            ai.angle -
            Math.PI / 2;
    }
}

// ============================================================
// PLAYER / AI KART COLLISION
// ============================================================

function updateKartCollisions() {

    const collisionDistance = 2.2;

    for (const ai of aiKarts) {

        if (ai.finished) {
            continue;
        }

        const dx =
            ai.kart.position.x - player.x;

        const dz =
            ai.kart.position.z - player.z;

        const distance =
            Math.hypot(dx, dz);

        if (
            distance > 0 &&
            distance < collisionDistance
        ) {

            // Direction from AI toward player
            const pushX =
                dx / distance;

            const pushZ =
                dz / distance;

            const overlap =
                collisionDistance - distance;

            // ------------------------------------------------
            // CALCULATE PLAYER PUSH
            // ------------------------------------------------

            const newPlayerX =
                player.x -
                pushX * overlap * 0.6;

            const newPlayerZ =
                player.z -
                pushZ * overlap * 0.6;

            // Only push the player if the new position
            // is still on the track.
            if (
                isOnTrack(
                    newPlayerX,
                    newPlayerZ
                )
            ) {

                player.x =
                    newPlayerX;

                player.z =
                    newPlayerZ;
            }

            // ------------------------------------------------
            // PUSH AI
            // ------------------------------------------------

            const newAIX =
                ai.kart.position.x +
                pushX * overlap * 0.4;

            const newAIZ =
                ai.kart.position.z +
                pushZ * overlap * 0.4;

            if (
                isOnTrack(
                    newAIX,
                    newAIZ
                )
            ) {

                ai.kart.position.x =
                    newAIX;

                ai.kart.position.z =
                    newAIZ;
            }

            // ------------------------------------------------
            // SLOW BOTH KARTS
            // ------------------------------------------------

            player.speed *= 0.55;
            ai.speed *= 0.75;
        }
    }

    // Keep visual player kart synced
    kart.position.x =
        player.x;

    kart.position.z =
        player.z;
}

// ============================================================
// RACE POSITION
// ============================================================

function getRaceProgress(racer) {

    return racer.raceProgress;
}

function getPlayerProgress() {

    const nearest =
        closestTrackPoint(
            player.x,
            player.z
        );

    return (
        (player.lap - 1) *
        trackPoints.length +
        nearest.index
    );
}

function getPlayerPosition() {

    const playerProgress =
        getPlayerProgress();

    let position = 1;

    for (const ai of aiKarts) {

        const aiProgress =
            getRaceProgress(ai);

        if (
            aiProgress >
            playerProgress
        ) {

            position++;
        }
    }

    return position;
}

// ============================================================
// RACE SYSTEM
// ============================================================

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

    if (player.boostTimer > 0) {

        // Accelerate during boost until the boost's cap
        if (player.speed < player.currentBoostCap) {

            player.speed +=
                player.acceleration *
                deltaTime;

            player.speed =
                Math.min(
                    player.speed,
                    player.currentBoostCap
                );
        }

    } else {

        // Normal driving
        if (player.speed < player.maxSpeed) {

            player.speed +=
                player.acceleration *
                deltaTime;

            player.speed =
                Math.min(
                    player.speed,
                    player.maxSpeed
                );
        }

        // If we are above normal speed after a boost,
        // smoothly return toward 36.
        if (player.speed > player.maxSpeed) {

            player.speed =
                moveToward(
                    player.speed,
                    player.maxSpeed,
                    3 * deltaTime
                );
        }
    }
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

            // ------------------------------------------------
            // RELEASE DRIFT BOOST
            // ------------------------------------------------

            if (player.driftCharge < 0.8) {

                // MINI BOOST
                player.boostTimer = 0.35;
                player.currentBoostCap = 47;

                player.speed =
                    Math.min(
                        player.speed + 4,
                        player.currentBoostCap
                    );

            }
            else if (player.driftCharge < 1.5) {

                // MEDIUM BOOST
                player.boostTimer = 0.65;
                player.currentBoostCap = 53;

                player.speed =
                    Math.min(
                        player.speed + 10,
                        player.currentBoostCap
                    );

            }
            else {

                // MAX BOOST
                player.boostTimer = 1.0;
                player.currentBoostCap = 59;

                player.speed =
                    Math.min(
                        player.speed + 18,
                        player.currentBoostCap
                    );
            }
        }

        player.driftCharge = 0;
    }

    // --------------------------------------------------------
    // BOOST
    // --------------------------------------------------------

    if (player.boostTimer > 0) {

        player.boostTimer -=
            deltaTime;

        // Never allow the current boost
        // to exceed its individual cap.
        player.speed =
            Math.min(
                player.speed,
                player.currentBoostCap
            );

        boostFlame.visible = true;

    } else {

        boostFlame.visible = false;

        // After the boost ends, gradually
        // return toward normal speed.
        if (player.speed > player.maxSpeed) {

            player.speed =
                moveToward(
                    player.speed,
                    player.maxSpeed,
                    3 * deltaTime
                );
        }
    }

    // --------------------------------------------------------
    // DRIFT MOVEMENT
    // --------------------------------------------------------

    let moveAngle =
        player.angle;

    if (player.drifting) {

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

// Follow the height of the Oasis ramp
const playerTrackPoint =
    closestTrackPoint(
        player.x,
        player.z
    );

kart.position.y =
    getTrackHeight(
        playerTrackPoint.index
    );

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

    // Remember whether we were drifting
    // for the next frame.
    player.lastDrifting =
        player.drifting;
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

let trackSelected =
    new URLSearchParams(window.location.search).has("track");

if (trackSelected) {
    const trackSelect = document.getElementById("trackSelect");

    if (trackSelect) {
        trackSelect.style.display = "none";
    }
}

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

        if (!trackSelected) {
        return;
    }

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

Position:
${getPlayerPosition()} /
${AI_COUNT + 1}

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

        <br>

<button
    id="trackSelectButton"
    style="
        padding: 12px 24px;
        font-size: 16px;
        cursor: pointer;
        border-radius: 8px;
        border: none;
    "
>
    TRACK SELECT
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

    document
    .getElementById(
        "trackSelectButton"
    )
    .addEventListener(
        "click",
        () => {
            window.location.href = "index.html";
        }
    );
}

// ============================================================
// CAMERA
// ============================================================

const cameraTarget =
    new THREE.Vector3();

function updateCamera(deltaTime) {

    // --------------------------------------------------------
    // CAMERA SETTINGS
    // --------------------------------------------------------

    const normalDistance = 12;
    const boostDistance = 15;

    const normalHeight = 7;
    const boostHeight = 8;

    const boostAmount =
        player.boostTimer > 0
            ? 1
            : 0;

    const cameraDistance =
        THREE.MathUtils.lerp(
            normalDistance,
            boostDistance,
            boostAmount
        );

    const cameraHeight =
        THREE.MathUtils.lerp(
            normalHeight,
            boostHeight,
            boostAmount
        );

    // --------------------------------------------------------
    // CAMERA POSITION
    // --------------------------------------------------------

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
    cameraHeight + getTrackHeight(closestTrackPoint(player.x, player.z).index),
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

    // --------------------------------------------------------
    // LOOK AHEAD
    // --------------------------------------------------------

    const lookAhead =
        player.boostTimer > 0
            ? 8
            : 6;

    const lookX =
        player.x +
        Math.cos(player.angle) *
        lookAhead;

    const lookZ =
        player.z -
        Math.sin(player.angle) *
        lookAhead;

    const cameraTrackPoint =
    closestTrackPoint(
        player.x,
        player.z
    );

const cameraTrackHeight =
    getTrackHeight(
        cameraTrackPoint.index
    );

camera.lookAt(
    lookX,
    1.2 + cameraTrackHeight,
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

    updateAI(
        deltaTime
    );

    updateKartCollisions();

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
}

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

document.getElementById("track1Button").onclick = () => {
    window.location.href = "?track=1";
};

document.getElementById("track2Button").onclick = () => {
    trackSelected = true;
    document.getElementById("trackSelect").style.display = "none";
};

document.getElementById("track3Button").onclick = () => {
    window.location.href = "?track=3";
};
