import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ============================================================
// KART RACER 3D
// ============================================================

const canvas = document.getElementById("gameCanvas");
const container = document.getElementById("gameCanvasContainer");

// ============================================================
// SCENE
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    110,
    250
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
// LIGHTS
// ============================================================

const hemisphereLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x4a704a,
        2.2
    );

scene.add(hemisphereLight);

const sun =
    new THREE.DirectionalLight(
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

const grass =
    new THREE.Mesh(
        new THREE.PlaneGeometry(
            220,
            180
        ),
        new THREE.MeshStandardMaterial({
            color: 0x4c9f45,
            roughness: 1
        })
    );

grass.rotation.x =
    -Math.PI / 2;

grass.receiveShadow = true;

scene.add(grass);

// ============================================================
// TRACK
// ============================================================

const TRACK_WIDTH = 20;

const TRACK_HALF_X = 45;
const TRACK_HALF_Z = 30;

const CORNER_RADIUS = 14;

function makeTrackPoints() {

    const points = [];

    const sections = [
        {
            cx: TRACK_HALF_X - CORNER_RADIUS,
            cz: -TRACK_HALF_Z + CORNER_RADIUS,
            start: -Math.PI / 2,
            end: 0
        },
        {
            cx: TRACK_HALF_X - CORNER_RADIUS,
            cz: TRACK_HALF_Z - CORNER_RADIUS,
            start: 0,
            end: Math.PI / 2
        },
        {
            cx: -TRACK_HALF_X + CORNER_RADIUS,
            cz: TRACK_HALF_Z - CORNER_RADIUS,
            start: Math.PI / 2,
            end: Math.PI
        },
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
            i < 40;
            i++
        ) {

            const t = i / 40;

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
    makeTrackPoints();

// ============================================================
// ROAD
// ============================================================

function createRoad() {

    const positions = [];
    const indices = [];

    const left = [];
    const right = [];

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

        left.push({
            x:
                current.x +
                nx *
                TRACK_WIDTH / 2,

            z:
                current.z +
                nz *
                TRACK_WIDTH / 2
        });

        right.push({
            x:
                current.x -
                nx *
                TRACK_WIDTH / 2,

            z:
                current.z -
                nz *
                TRACK_WIDTH / 2
        });
    }

    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        positions.push(
            left[i].x,
            0.05,
            left[i].z,

            right[i].x,
            0.05,
            right[i].z
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
// CURBS
// ============================================================

function createCurbs() {

    const red =
        new THREE.MeshStandardMaterial({
            color: 0xe53935
        });

    const white =
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

            const curb =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        length + 0.15,
                        0.2,
                        0.8
                    ),
                    i % 4 === 0
                        ? white
                        : red
                );

            curb.position.set(
                current.x +
                    nx *
                    side *
                    TRACK_WIDTH / 2,

                0.18,

                current.z +
                    nz *
                    side *
                    TRACK_WIDTH / 2
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

    const line =
        new THREE.Group();

    const size = 1.6;

    for (
        let row = 0;
        row < 2;
        row++
    ) {

        for (
            let col = 0;
            col < 10;
            col++
        ) {

            const isBlack =
                (row + col) % 2 === 0;

            const square =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        size,
                        0.1,
                        size
                    ),
                    new THREE.MeshStandardMaterial({
                        color:
                            isBlack
                                ? 0x111111
                                : 0xffffff
                    })
                );

            square.position.set(
                row === 0
                    ? -0.8
                    : 0.8,

                0.15,

                (
                    col - 4.5
                ) * size
            );

            line.add(square);
        }
    }

    line.position.set(
        start.x,
        0,
        start.z
    );

    line.rotation.y =
        Math.atan2(
            next.x - start.x,
            next.z - start.z
        );

    scene.add(line);
}

createFinishLine();

// ============================================================
// CHECKPOINTS
// ============================================================

const checkpointIndices = [
    40,
    80,
    120
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

    const material =
        new THREE.MeshStandardMaterial({
            color:
                number === 1
                    ? 0x00ff55
                    : 0x00aaff,

            transparent: true,
            opacity: 0.45
        });

    const bar =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.35,
                5,
                TRACK_WIDTH
            ),
            material
        );

    bar.position.y = 2.5;

    gate.add(bar);

    gate.position.set(
        point.x,
        0,
        point.z
    );

    gate.rotation.y =
        Math.atan2(
            next.x - point.x,
            next.z - point.z
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
                0.7,
                0.9,
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
                2.8,
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

    tree.scale.setScalar(
        scale
    );

    scene.add(tree);
}

[
    [-75, -45],
    [-55, -48],
    [-25, -48],
    [10, -48],
    [45, -48],
    [70, -42],

    [70, 42],
    [45, 48],
    [10, 48],
    [-25, 48],
    [-55, 48],
    [-75, 42]
].forEach(
    ([x, z], i) => {

        createTree(
            x,
            z,
            0.9 +
            (i % 3) * 0.12
        );
    }
);

// ============================================================
// KART
// ============================================================

const kart =
    new THREE.Group();

// Body

const body =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            2.8,
            0.7,
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

// Front

const front =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            2.5,
            0.45,
            1.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0x42a5f5
        })
    );

front.position.set(
    0,
    1.15,
    -1.05
);

front.castShadow = true;

kart.add(front);

// Seat

const seat =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            1.1,
            1.3
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

// Driver

const driver =
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

driver.position.set(
    0,
    2.25,
    0.35
);

driver.castShadow = true;

kart.add(driver);

// ============================================================
// WHEELS
// ============================================================

const wheels = [];

function makeWheel(
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

makeWheel(-1.5, -1.25);
makeWheel(1.5, -1.25);
makeWheel(-1.5, 1.25);
makeWheel(1.5, 1.25);

// ============================================================
// BOOST FLAME
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

    // IMPORTANT:
    // 0 means the kart faces toward -Z.
    angle: 0,

    speed: 0,

    maxSpeed: 0.55,

    acceleration: 0.010,

    braking: 0.022,

    reverseSpeed: 0.25,

    turnSpeed: 0.035,

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
// STARTING DIRECTION
// ============================================================

// Work out the direction of the first
// section of track.

const start =
    trackPoints[0];

const startNext =
    trackPoints[1];

// Our kart faces -Z.
// Calculate the rotation needed so
// -Z points along the track.

player.angle =
    Math.atan2(
        startNext.x - start.x,
        -(startNext.z - start.z)
    );

kart.position.set(
    player.x,
    0,
    player.z
);

kart.rotation.y =
    player.angle;

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

    let bestIndex = 0;

    let bestDistance =
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
            bestDistance
        ) {

            bestDistance =
                distance;

            bestIndex =
                i;
        }
    }

    return {
        index: bestIndex,

        distance:
            Math.sqrt(
                bestDistance
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

    return (
        nearest.distance <=
        TRACK_WIDTH / 2 + 4
    );
}

// ============================================================
// MOVEMENT
// ============================================================

function updatePlayer() {

    if (
        player.finished
    ) {
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
    // FRICTION
    // --------------------------------------------------------

    if (
        !forward() &&
        !backward()
    ) {

        player.speed *=
            0.97;

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
        Math.abs(
            player.speed
        ) > 0.10 &&
        (left() || right());

    // --------------------------------------------------------
    // TURNING
    // --------------------------------------------------------

    if (
        left() ||
        right()
    ) {

        const direction =
            left()
                ? 1
                : -1;

        let turnAmount =
            player.turnSpeed;

        // Turning becomes slightly stronger
        // as the kart gains speed.

        turnAmount *=
            Math.min(
                Math.abs(
                    player.speed
                ) / 0.30,
                1
            );

        if (
            player.drifting
        ) {

            turnAmount *=
                1.65;
        }

        // Reverse steering

        if (
            player.speed < 0
        ) {

            turnAmount *=
                -1;
        }

        player.angle +=
            direction *
            turnAmount;
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

                player.boostTimer =
                    22;

            } else if (
                player.driftCharge < 90
            ) {

                player.boostTimer =
                    38;

            } else {

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
            player.maxSpeed +
            0.25
        ) {

            player.speed =
                player.maxSpeed +
                0.25;
        }

        boostFlame.visible =
            true;

    } else {

        boostFlame.visible =
            false;
    }

    // --------------------------------------------------------
    // FORWARD VECTOR
    // --------------------------------------------------------

    // The kart's front is -Z.
    //
    // Therefore:
    //
    // X = sin(angle)
    // Z = -cos(angle)

    let forwardX =
        Math.sin(
            player.angle
        );

    let forwardZ =
        -Math.cos(
            player.angle
        );

    // --------------------------------------------------------
    // DRIFT MOVEMENT
    // --------------------------------------------------------

    let movementX =
        forwardX;

    let movementZ =
        forwardZ;

    if (
        player.drifting
    ) {

        const driftDirection =
            left()
                ? -1
                : 1;

        const sidewaysX =
            Math.cos(
                player.angle
            ) *
            driftDirection;

        const sidewaysZ =
            Math.sin(
                player.angle
            ) *
            driftDirection;

        movementX =
            forwardX * 0.88 +
            sidewaysX * 0.20;

        movementZ =
            forwardZ * 0.88 +
            sidewaysZ * 0.20;
    }

    // --------------------------------------------------------
    // MOVE
    // --------------------------------------------------------

    const moveX =
        movementX *
        player.speed;

    const moveZ =
        movementZ *
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
            0.25;
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
            0.25;
    }

    // --------------------------------------------------------
    // KART POSITION
    // --------------------------------------------------------

    kart.position.x =
        player.x;

    kart.position.z =
        player.z;

    // IMPORTANT:
    // Same angle used by movement.

    kart.rotation.y =
        player.angle;

    // --------------------------------------------------------
    // BODY LEAN
    // --------------------------------------------------------

    if (
        player.drifting
    ) {

        const lean =
            left()
                ? 0.10
                : -0.10;

        kart.rotation.z =
            THREE.MathUtils.lerp(
                kart.rotation.z,
                lean,
                0.15
            );

    } else {

        kart.rotation.z =
            THREE.MathUtils.lerp(
                kart.rotation.z,
                0,
                0.12
            );
    }

    // --------------------------------------------------------
    // WHEEL ROTATION
    // --------------------------------------------------------

    for (
        const wheel of wheels
    ) {

        wheel.rotation.x +=
            player.speed *
            0.8;
    }

    updateRace();
}

// ============================================================
// RACE
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

    // Checkpoint 1

    if (
        player.nextCheckpoint === 0 &&
        Math.abs(
            index -
            checkpointIndices[0]
        ) < 7
    ) {

        player.nextCheckpoint = 1;
    }

    // Checkpoint 2

    if (
        player.nextCheckpoint === 1 &&
        Math.abs(
            index -
            checkpointIndices[1]
        ) < 7
    ) {

        player.nextCheckpoint = 2;
    }

    // Checkpoint 3

    if (
        player.nextCheckpoint === 2 &&
        Math.abs(
            index -
            checkpointIndices[2]
        ) < 7
    ) {

        player.nextCheckpoint = 3;
    }

    // Finish

    if (
        player.nextCheckpoint === 3 &&
        index < 7
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

    let boost =
        "";

    if (
        player.boostTimer > 0
    ) {

        boost =
            "<br>🔥 BOOST!";
    }

    let drift =
        "";

    if (
        player.drifting
    ) {

        drift =
            `<br>Drift: ${Math.floor(
                player.driftCharge
            )}`;
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
        ${boost}
        ${drift}
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
            () => location.reload()
        );
}

// ============================================================
// CAMERA
// ============================================================

function updateCamera() {

    // ========================================================
    // THIS IS THE IMPORTANT PART
    //
    // The camera is positioned BEHIND the kart using the
    // EXACT SAME angle that controls the kart.
    // ========================================================

    const distance = 12;
    const height = 7;

    const cameraX =
        player.x -
        Math.sin(
            player.angle
        ) *
        distance;

    const cameraZ =
        player.z +
        Math.cos(
            player.angle
        ) *
        distance;

    // Smoothly follow the kart.

    camera.position.x =
        THREE.MathUtils.lerp(
            camera.position.x,
            cameraX,
            0.15
        );

    camera.position.y =
        THREE.MathUtils.lerp(
            camera.position.y,
            height,
            0.15
        );

    camera.position.z =
        THREE.MathUtils.lerp(
            camera.position.z,
            cameraZ,
            0.15
        );

    // Look slightly ahead of the kart.

    const lookX =
        player.x +
        Math.sin(
            player.angle
        ) *
        7;

    const lookZ =
        player.z -
        Math.cos(
            player.angle
        ) *
        7;

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
// RACE TIMER
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
