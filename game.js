import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ============================================================
// KART RACER 3D
// ============================================================

const canvas = document.getElementById("gameCanvas");
const container = document.getElementById("gameCanvasContainer");

// ============================================================
// THREE.JS SETUP
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    100,
    240
);

const camera = new THREE.PerspectiveCamera(
    65,
    container.clientWidth / container.clientHeight,
    0.1,
    500
);

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
renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

// ============================================================
// LIGHTING
// ============================================================

const skyLight = new THREE.HemisphereLight(
    0xffffff,
    0x426b42,
    2.2
);

scene.add(skyLight);

const sun = new THREE.DirectionalLight(
    0xffffff,
    2.5
);

sun.position.set(
    40,
    80,
    30
);

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

const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(
        220,
        180
    ),
    new THREE.MeshStandardMaterial({
        color: 0x4c9f45,
        roughness: 1
    })
);

grass.rotation.x = -Math.PI / 2;

grass.receiveShadow = true;

scene.add(grass);

// ============================================================
// TRACK SETTINGS
// ============================================================

const TRACK_WIDTH = 18;

const TRACK_HALF_X = 45;
const TRACK_HALF_Z = 30;

const CORNER_RADIUS = 13;

// ============================================================
// TRACK CENTERLINE
// ============================================================

function createTrackPoints() {

    const points = [];

    const cornerSteps = 35;

    const sections = [

        // Top-right corner
        {
            cx: TRACK_HALF_X - CORNER_RADIUS,
            cz: -TRACK_HALF_Z + CORNER_RADIUS,
            start: -Math.PI / 2,
            end: 0
        },

        // Bottom-right corner
        {
            cx: TRACK_HALF_X - CORNER_RADIUS,
            cz: TRACK_HALF_Z - CORNER_RADIUS,
            start: 0,
            end: Math.PI / 2
        },

        // Bottom-left corner
        {
            cx: -TRACK_HALF_X + CORNER_RADIUS,
            cz: TRACK_HALF_Z - CORNER_RADIUS,
            start: Math.PI / 2,
            end: Math.PI
        },

        // Top-left corner
        {
            cx: -TRACK_HALF_X + CORNER_RADIUS,
            cz: -TRACK_HALF_Z + CORNER_RADIUS,
            start: Math.PI,
            end: Math.PI * 1.5
        }
    ];

    for (const section of sections) {

        for (
            let i = 0;
            i < cornerSteps;
            i++
        ) {

            const t =
                i / cornerSteps;

            const angle =
                section.start +
                (
                    section.end -
                    section.start
                ) * t;

            points.push({
                x:
                    section.cx +
                    Math.cos(angle) *
                    CORNER_RADIUS,

                z:
                    section.cz +
                    Math.sin(angle) *
                    CORNER_RADIUS
            });
        }
    }

    return points;
}

const trackPoints =
    createTrackPoints();

// ============================================================
// TRACK ROAD
// ============================================================

function createRoad() {

    const positions = [];
    const indices = [];

    const leftSide = [];
    const rightSide = [];

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
            next.x - current.x;

        const dz =
            next.z - current.z;

        const length =
            Math.sqrt(
                dx * dx +
                dz * dz
            );

        const nx =
            -dz / length;

        const nz =
            dx / length;

        leftSide.push({
            x:
                current.x +
                nx * TRACK_WIDTH / 2,

            z:
                current.z +
                nz * TRACK_WIDTH / 2
        });

        rightSide.push({
            x:
                current.x -
                nx * TRACK_WIDTH / 2,

            z:
                current.z -
                nz * TRACK_WIDTH / 2
        });
    }

    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        positions.push(
            leftSide[i].x,
            0.05,
            leftSide[i].z,

            rightSide[i].x,
            0.05,
            rightSide[i].z
        );
    }

    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const next =
            (i + 1) %
            trackPoints.length;

        const a = i * 2;
        const b = i * 2 + 1;

        const c = next * 2;
        const d = next * 2 + 1;

        indices.push(
            a, b, c,
            b, d, c
        );
    }

    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    const road =
        new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: 0x3d3d3d,
                roughness: 0.95,
                side: THREE.DoubleSide
            })
        );

    road.receiveShadow = true;

    scene.add(road);
}

createRoad();

// ============================================================
// TRACK EDGE CURBS
// ============================================================

function createCurbs() {

    const redMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xe53935
        });

    const whiteMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });

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
            next.x - current.x;

        const dz =
            next.z - current.z;

        const length =
            Math.sqrt(
                dx * dx +
                dz * dz
            );

        const nx =
            -dz / length;

        const nz =
            dx / length;

        const angle =
            -Math.atan2(
                dz,
                dx
            );

        for (
            const side of [-1, 1]
        ) {

            const material =
                i % 4 === 0
                    ? whiteMaterial
                    : redMaterial;

            const curb =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        length + 0.2,
                        0.18,
                        0.8
                    ),
                    material
                );

            curb.position.set(
                current.x +
                    nx *
                    side *
                    (TRACK_WIDTH / 2),

                0.18,

                current.z +
                    nz *
                    side *
                    (TRACK_WIDTH / 2)
            );

            curb.rotation.y =
                angle;

            curb.castShadow = true;

            scene.add(curb);
        }
    }
}

createCurbs();

// ============================================================
// FINISH LINE
// ============================================================

function createFinishLine() {

    const start =
        trackPoints[0];

    const next =
        trackPoints[1];

    const finish =
        new THREE.Group();

    const squareSize = 1.5;

    const rows = 2;
    const columns = 6;

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let column = 0;
            column < columns;
            column++
        ) {

            const black =
                (
                    row +
                    column
                ) % 2 === 0;

            const square =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        squareSize,
                        0.12,
                        squareSize
                    ),
                    new THREE.MeshStandardMaterial({
                        color:
                            black
                                ? 0x111111
                                : 0xffffff
                    })
                );

            square.position.set(
                0,
                0.16,
                (
                    column -
                    (columns - 1) / 2
                ) *
                squareSize
            );

            finish.add(square);
        }
    }

    finish.position.set(
        start.x,
        0,
        start.z
    );

    finish.rotation.y =
        -Math.atan2(
            next.z - start.z,
            next.x - start.x
        );

    scene.add(finish);
}

createFinishLine();

// ============================================================
// CHECKPOINT GATES
// ============================================================

const checkpointIndices = [
    35,
    70,
    105
];

function createCheckpoint(
    index,
    number
) {

    const point =
        trackPoints[index];

    const next =
        trackPoints[
            (index + 1) %
            trackPoints.length
        ];

    const gate =
        new THREE.Group();

    const gateMaterial =
        new THREE.MeshStandardMaterial({
            color:
                number === 1
                    ? 0x00ff55
                    : 0x00aaff,

            transparent: true,
            opacity: 0.5
        });

    const bar =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.35,
                5,
                TRACK_WIDTH
            ),
            gateMaterial
        );

    bar.position.y = 2.5;

    gate.add(bar);

    gate.position.set(
        point.x,
        0,
        point.z
    );

    gate.rotation.y =
        -Math.atan2(
            next.z - point.z,
            next.x - point.x
        );

    scene.add(gate);
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
// TREES
// ============================================================

function createTree(
    x,
    z,
    scale = 1
) {

    const tree =
        new THREE.Group();

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.65,
                0.85,
                3,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x704321
            })
        );

    trunk.position.y = 1.5;

    trunk.castShadow = true;

    tree.add(trunk);

    const leaves =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                2.7,
                12,
                12
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

    tree.scale.setScalar(scale);

    scene.add(tree);
}

const treeLocations = [

    [-72, -45],
    [-55, -48],
    [-20, -48],
    [20, -48],
    [55, -48],
    [72, -40],

    [72, 40],
    [50, 48],
    [20, 48],
    [-20, 48],
    [-55, 48],
    [-72, 40]
];

treeLocations.forEach(
    ([x, z], i) => {

        createTree(
            x,
            z,
            0.9 + (i % 3) * 0.15
        );
    }
);

// ============================================================
// KART
// ============================================================

const kart =
    new THREE.Group();

// Main body

const body =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            2.8,
            0.65,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0x2196f3,
            roughness: 0.7
        })
    );

body.position.y = 0.85;

body.castShadow = true;

kart.add(body);

// Front hood

const hood =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            2.5,
            0.4,
            1.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0x42a5f5
        })
    );

hood.position.set(
    0,
    1.15,
    -1.05
);

hood.castShadow = true;

kart.add(hood);

// Seat

const seat =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            1.1,
            1.25
        ),
        new THREE.MeshStandardMaterial({
            color: 0x202020
        })
    );

seat.position.set(
    0,
    1.35,
    0.55
);

seat.castShadow = true;

kart.add(seat);

// Driver head

const head =
    new THREE.Mesh(
        new THREE.SphereGeometry(
            0.55,
            16,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffc79c
        })
    );

head.position.set(
    0,
    2.25,
    0.35
);

head.castShadow = true;

kart.add(head);

// Wheels

const wheels = [];

function createWheel(
    x,
    z
) {

    const wheel =
        new THREE.Mesh(
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
        0.58,
        z
    );

    wheel.castShadow = true;

    kart.add(wheel);

    wheels.push(wheel);
}

createWheel(-1.5, -1.25);
createWheel(1.5, -1.25);
createWheel(-1.5, 1.25);
createWheel(1.5, 1.25);

// ============================================================
// BOOST FLAMES
// ============================================================

const boostFlame =
    new THREE.Mesh(
        new THREE.ConeGeometry(
            0.35,
            1.4,
            10
        ),
        new THREE.MeshBasicMaterial({
            color: 0xff8c00
        })
    );

boostFlame.rotation.x =
    -Math.PI / 2;

boostFlame.position.set(
    0,
    0.75,
    2.35
);

boostFlame.visible = false;

kart.add(boostFlame);

scene.add(kart);

// ============================================================
// PLAYER
// ============================================================

const player = {

    x: trackPoints[0].x,

    z: trackPoints[0].z,

    angle: 0,

    speed: 0,

    maxSpeed: 0.62,

    acceleration: 0.012,

    braking: 0.025,

    reverseSpeed: 0.28,

    turnSpeed: 0.025,

    drifting: false,

    driftCharge: 0,

    boostTimer: 0,

    lap: 1,

    nextCheckpoint: 0,

    finished: false,

    finishTime: 0,

    lastTrackIndex: 0
};

// ============================================================
// CORRECT KART START DIRECTION
// ============================================================

const startPoint =
    trackPoints[0];

const secondPoint =
    trackPoints[1];

player.angle =
    Math.atan2(
        secondPoint.z - startPoint.z,
        secondPoint.x - startPoint.x
    );

// The kart model points toward -Z,
// so rotate the model 90 degrees
// relative to its movement direction.

kart.rotation.y =
    player.angle + Math.PI / 2;

kart.position.set(
    player.x,
    0,
    player.z
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
// TRACK COLLISION
// ============================================================

function closestTrackPoint(
    x,
    z
) {

    let closestIndex = 0;

    let closestDistance =
        Infinity;

    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const point =
            trackPoints[i];

        const dx =
            x - point.x;

        const dz =
            z - point.z;

        const distance =
            dx * dx +
            dz * dz;

        if (
            distance <
            closestDistance
        ) {

            closestDistance =
                distance;

            closestIndex = i;
        }
    }

    return {
        index: closestIndex,

        distance:
            Math.sqrt(
                closestDistance
            )
    };
}

function isOnTrack(
    x,
    z
) {

    const nearest =
        closestTrackPoint(
            x,
            z
        );

    // Extra forgiveness around
    // the edges of the road.

    return (
        nearest.distance <=
        TRACK_WIDTH / 2 + 3
    );
}

// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer() {

    if (player.finished) {
        return;
    }

    // --------------------------------------------------------
    // ACCELERATION
    // --------------------------------------------------------

    if (forward()) {

        player.speed +=
            player.acceleration;

        if (
            player.speed >
            player.maxSpeed
        ) {

            player.speed =
                player.maxSpeed;
        }
    }

    // --------------------------------------------------------
    // BRAKING / REVERSE
    // --------------------------------------------------------

    if (backward()) {

        if (
            player.speed > 0
        ) {

            player.speed -=
                player.braking;

        } else {

            player.speed -=
                player.acceleration;
        }

        if (
            player.speed <
            -player.reverseSpeed
        ) {

            player.speed =
                -player.reverseSpeed;
        }
    }

    // --------------------------------------------------------
    // NATURAL SLOWDOWN
    // --------------------------------------------------------

    if (
        !forward() &&
        !backward()
    ) {

        player.speed *= 0.975;

        if (
            Math.abs(
                player.speed
            ) < 0.005
        ) {

            player.speed = 0;
        }
    }

    // --------------------------------------------------------
    // DRIFT
    // --------------------------------------------------------

    player.drifting =
        space() &&
        Math.abs(player.speed) > 0.12 &&
        (left() || right());

    // --------------------------------------------------------
    // STEERING
    // --------------------------------------------------------

    if (
        left() ||
        right()
    ) {

        let direction =
            right()
                ? -1
                : 1;

        let steeringPower =
            Math.min(
                Math.abs(
                    player.speed
                ) / 0.45,
                1
            );

        if (
            player.drifting
        ) {

            steeringPower *= 1.7;
        }

        player.angle +=
            direction *
            player.turnSpeed *
            steeringPower;
    }

    // --------------------------------------------------------
    // DRIFT CHARGE
    // --------------------------------------------------------

    if (
        player.drifting
    ) {

        player.driftCharge += 1;

        if (
            player.driftCharge >
            120
        ) {

            player.driftCharge =
                120;
        }

    } else {

        if (
            player.driftCharge >= 20
        ) {

            if (
                player.driftCharge < 50
            ) {

                // Small boost

                player.boostTimer =
                    22;

            } else if (
                player.driftCharge < 90
            ) {

                // Medium boost

                player.boostTimer =
                    38;

            } else {

                // Large boost

                player.boostTimer =
                    60;
            }
        }

        player.driftCharge = 0;
    }

    // --------------------------------------------------------
    // BOOST
    // --------------------------------------------------------

    if (
        player.boostTimer > 0
    ) {

        player.boostTimer--;

        player.speed +=
            0.018;

        if (
            player.speed >
            player.maxSpeed + 0.25
        ) {

            player.speed =
                player.maxSpeed + 0.25;
        }

        boostFlame.visible = true;

    } else {

        boostFlame.visible = false;
    }

    // --------------------------------------------------------
    // MOVEMENT
    // --------------------------------------------------------

    let movementAngle =
        player.angle;

    if (
        player.drifting
    ) {

        const driftDirection =
            right()
                ? -1
                : 1;

        movementAngle +=
            driftDirection *
            0.20;
    }

    const moveX =
        Math.cos(
            movementAngle
        ) *
        player.speed;

    const moveZ =
        Math.sin(
            movementAngle
        ) *
        player.speed;

    const newX =
        player.x + moveX;

    const newZ =
        player.z + moveZ;

    // --------------------------------------------------------
    // COLLISION
    // --------------------------------------------------------

    if (
        isOnTrack(
            newX,
            player.z
        )
    ) {

        player.x =
            newX;

    } else {

        player.speed *=
            0.30;
    }

    if (
        isOnTrack(
            player.x,
            newZ
        )
    ) {

        player.z =
            newZ;

    } else {

        player.speed *=
            0.30;
    }

    // --------------------------------------------------------
    // UPDATE KART
    // --------------------------------------------------------

    kart.position.x =
        player.x;

    kart.position.z =
        player.z;

    kart.rotation.y =
        player.angle +
        Math.PI / 2;

    // --------------------------------------------------------
    // WHEEL ROTATION
    // --------------------------------------------------------

    for (
        const wheel of wheels
    ) {

        wheel.rotation.x +=
            player.speed *
            0.7;
    }

    // Small body movement

    if (
        player.drifting
    ) {

        kart.rotation.z =
            THREE.MathUtils.lerp(
                kart.rotation.z,
                right()
                    ? -0.08
                    : 0.08,
                0.12
            );

    } else {

        kart.rotation.z =
            THREE.MathUtils.lerp(
                kart.rotation.z,
                0,
                0.12
            );
    }

    updateRace();
}

// ============================================================
// RACE SYSTEM
// ============================================================

const TOTAL_LAPS = 3;

function updateRace() {

    const nearest =
        closestTrackPoint(
            player.x,
            player.z
        );

    const index =
        nearest.index;

    player.lastTrackIndex =
        index;

    // --------------------------------------------------------
    // CHECKPOINT 1
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 0 &&
        Math.abs(
            index -
            checkpointIndices[0]
        ) < 6
    ) {

        player.nextCheckpoint = 1;
    }

    // --------------------------------------------------------
    // CHECKPOINT 2
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 1 &&
        Math.abs(
            index -
            checkpointIndices[1]
        ) < 6
    ) {

        player.nextCheckpoint = 2;
    }

    // --------------------------------------------------------
    // CHECKPOINT 3
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 2 &&
        Math.abs(
            index -
            checkpointIndices[2]
        ) < 6
    ) {

        player.nextCheckpoint = 3;
    }

    // --------------------------------------------------------
    // FINISH LINE
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 3 &&
        index < 6
    ) {

        if (
            player.lap <
            TOTAL_LAPS
        ) {

            player.lap++;

            player.nextCheckpoint =
                0;

        } else {

            player.finished =
                true;

            player.finishTime =
                (
                    performance.now() -
                    raceStartTime
                ) / 1000;

            showFinish();
        }
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
    "rgba(0,0,0,0.7)";

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

container.style.position =
    "relative";

container.appendChild(
    hud
);

function updateHUD() {

    let boostText = "";

    if (
        player.boostTimer > 0
    ) {

        boostText =
            "<br>🔥 BOOST!";
    }

    let driftText = "";

    if (
        player.drifting
    ) {

        let charge =
            Math.floor(
                player.driftCharge
            );

        driftText =
            `<br>Drift: ${charge}`;
    }

    hud.innerHTML = `
        <strong>🏎️ KART RACER</strong>
        <br>
        Lap: ${player.lap} / ${TOTAL_LAPS}
        <br>
        Speed: ${Math.floor(
            Math.abs(
                player.speed
            ) * 100
        )}
        ${boostText}
        ${driftText}
    `;
}

// ============================================================
// FINISH SCREEN
// ============================================================

function showFinish() {

    const finish =
        document.createElement("div");

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
        "rgba(0,0,0,0.92)";

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
        <h1>🏆 FINISH!</h1>

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

function updateCamera() {

    // Camera stays behind the kart.

    const cameraDistance = 13;
    const cameraHeight = 7.5;

    const behindX =
        player.x -
        Math.cos(
            player.angle
        ) *
        cameraDistance;

    const behindZ =
        player.z -
        Math.sin(
            player.angle
        ) *
        cameraDistance;

    const target =
        new THREE.Vector3(
            behindX,
            cameraHeight,
            behindZ
        );

    camera.position.lerp(
        target,
        0.08
    );

    const lookX =
        player.x +
        Math.cos(
            player.angle
        ) *
        6;

    const lookZ =
        player.z +
        Math.sin(
            player.angle
        ) *
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

    camera.aspect =
        width / height;

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
// START TIMER
// ============================================================

const raceStartTime =
    performance.now();

// ============================================================
// GAME LOOP
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );

    updatePlayer();

    updateCamera();

    updateHUD();

    renderer.render(
        scene,
        camera
    );
}

animate();
