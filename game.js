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
    100,
    220
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
// LIGHTING
// ============================================================

const skyLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x4d704d,
        2.2
    );

scene.add(skyLight);

const sun =
    new THREE.DirectionalLight(
        0xffffff,
        2.5
    );

sun.position.set(
    30,
    80,
    30
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;

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
            color: 0x4d9f48,
            roughness: 1
        })
    );

grass.rotation.x =
    -Math.PI / 2;

grass.receiveShadow = true;

scene.add(grass);

// ============================================================
// TRACK SETTINGS
// ============================================================

const TRACK_WIDTH = 22;

// Center-line dimensions
const TRACK_HALF_X = 48;
const TRACK_HALF_Z = 32;

// Rounded corners
const CORNER_RADIUS = 15;

// How much extra room the kart gets
// before being considered off-road.
const ROAD_MARGIN = 2.8;

// ============================================================
// CREATE ROUNDED RECTANGLE CENTER LINE
// ============================================================

function createTrackPoints() {

    const points = [];

    const corners = [

        // Top-right
        {
            x:
                TRACK_HALF_X -
                CORNER_RADIUS,

            z:
                -TRACK_HALF_Z +
                CORNER_RADIUS,

            start:
                -Math.PI / 2,

            end:
                0
        },

        // Bottom-right
        {
            x:
                TRACK_HALF_X -
                CORNER_RADIUS,

            z:
                TRACK_HALF_Z -
                CORNER_RADIUS,

            start:
                0,

            end:
                Math.PI / 2
        },

        // Bottom-left
        {
            x:
                -TRACK_HALF_X +
                CORNER_RADIUS,

            z:
                TRACK_HALF_Z -
                CORNER_RADIUS,

            start:
                Math.PI / 2,

            end:
                Math.PI
        },

        // Top-left
        {
            x:
                -TRACK_HALF_X +
                CORNER_RADIUS,

            z:
                -TRACK_HALF_Z +
                CORNER_RADIUS,

            start:
                Math.PI,

            end:
                Math.PI * 1.5
        }
    ];

    // Each corner
    for (const corner of corners) {

        for (
            let i = 0;
            i < 20;
            i++
        ) {

            const t =
                i / 20;

            const angle =
                corner.start +
                (
                    corner.end -
                    corner.start
                ) * t;

            points.push({
                x:
                    corner.x +
                    Math.cos(angle) *
                    CORNER_RADIUS,

                z:
                    corner.z +
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
// TRACK GEOMETRY
// ============================================================

function createRoad() {

    const positions = [];
    const indices = [];

    const leftPoints = [];
    const rightPoints = [];

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

        const length =
            Math.sqrt(
                dx * dx +
                dz * dz
            );

        // Normal pointing sideways
        const nx =
            -dz / length;

        const nz =
            dx / length;

        leftPoints.push({
            x:
                current.x +
                nx *
                TRACK_WIDTH / 2,

            z:
                current.z +
                nz *
                TRACK_WIDTH / 2
        });

        rightPoints.push({
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

    // Build vertices
    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        positions.push(
            leftPoints[i].x,
            0.06,
            leftPoints[i].z,

            rightPoints[i].x,
            0.06,
            rightPoints[i].z
        );
    }

    // Build triangles
    for (
        let i = 0;
        i < trackPoints.length;
        i++
    ) {

        const next =
            (i + 1) %
            trackPoints.length;

        const a =
            i * 2;

        const b =
            i * 2 + 1;

        const c =
            next * 2;

        const d =
            next * 2 + 1;

        indices.push(
            a,
            b,
            c,

            b,
            d,
            c
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

    geometry.setIndex(
        indices
    );

    geometry.computeVertexNormals();

    const road =
        new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: 0x404040,
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
            next.x -
            current.x;

        const dz =
            next.z -
            current.z;

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
            Math.atan2(
                dz,
                dx
            );

        for (
            const side of [-1, 1]
        ) {

            const curb =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        length + 0.2,
                        0.22,
                        0.9
                    ),
                    (
                        i % 2 === 0
                            ? redMaterial
                            : whiteMaterial
                    )
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

    // Start line is between point 0 and point 1

    const p1 =
        trackPoints[0];

    const p2 =
        trackPoints[1];

    const dx =
        p2.x - p1.x;

    const dz =
        p2.z - p1.z;

    const length =
        Math.sqrt(
            dx * dx +
            dz * dz
        );

    const angle =
        Math.atan2(
            dz,
            dx
        );

    const group =
        new THREE.Group();

    const squareSize = 1.5;

    for (
        let row = 0;
        row < 2;
        row++
    ) {

        for (
            let col = 0;
            col < 12;
            col++
        ) {

            const black =
                (
                    row + col
                ) % 2 === 0;

            const square =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        squareSize,
                        0.08,
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
                (
                    row - 0.5
                ) * squareSize,

                0.12,

                (
                    col - 5.5
                ) * squareSize
            );

            group.add(
                square
            );
        }
    }

    group.position.set(
        p1.x,
        0,
        p1.z
    );

    group.rotation.y =
        angle;

    scene.add(group);
}

createFinishLine();

// ============================================================
// CHECKPOINT GATES
// ============================================================

const checkpointIndices = [
    20,
    40,
    60
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

    const group =
        new THREE.Group();

    const material =
        new THREE.MeshStandardMaterial({
            color:
                number === 1
                    ? 0x00ff55
                    : 0x00aaff,

            transparent: true,
            opacity: 0.35
        });

    const gate =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.25,
                5,
                TRACK_WIDTH
            ),
            material
        );

    gate.position.y =
        2.5;

    group.add(
        gate
    );

    group.position.set(
        point.x,
        0,
        point.z
    );

    group.rotation.y =
        Math.atan2(
            next.x - point.x,
            next.z - point.z
        );

    scene.add(
        group
    );
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

    trunk.position.y =
        1.5;

    trunk.castShadow = true;

    tree.add(
        trunk
    );

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

    leaves.position.y =
        4;

    leaves.castShadow = true;

    tree.add(
        leaves
    );

    tree.position.set(
        x,
        0,
        z
    );

    tree.scale.setScalar(
        scale
    );

    scene.add(
        tree
    );
}

// Outside the track
const treeLocations = [

    [-72, -50],
    [-52, -52],
    [-25, -52],
    [5, -52],
    [35, -52],
    [68, -48],

    [70, 48],
    [45, 52],
    [15, 52],
    [-15, 52],
    [-45, 52],
    [-72, 48]
];

treeLocations.forEach(
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

// ------------------------------------------------------------
// BODY
// ------------------------------------------------------------

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

body.position.y =
    0.85;

body.castShadow = true;

kart.add(
    body
);

// ------------------------------------------------------------
// FRONT NOSE
// ------------------------------------------------------------

const nose =
    new THREE.Mesh(
        new THREE.BoxGeometry(
            2.5,
            0.45,
            1.4
        ),
        new THREE.MeshStandardMaterial({
            color: 0x42a5f5
        })
    );

nose.position.set(
    0,
    1.12,
    -1.15
);

nose.castShadow = true;

kart.add(
    nose
);

// ------------------------------------------------------------
// SEAT
// ------------------------------------------------------------

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

kart.add(
    seat
);

// ------------------------------------------------------------
// DRIVER
// ------------------------------------------------------------

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
    0.25
);

driver.castShadow = true;

kart.add(
    driver
);

// ============================================================
// WHEELS
// ============================================================

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
                0.48,
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

    kart.add(
        wheel
    );

    wheels.push(
        wheel
    );
}

createWheel(-1.5, -1.25);
createWheel(1.5, -1.25);
createWheel(-1.5, 1.25);
createWheel(1.5, 1.25);

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
    2.4
);

boostFlame.visible =
    false;

kart.add(
    boostFlame
);

scene.add(
    kart
);

// ============================================================
// PLAYER
// ============================================================

const player = {

    x:
        trackPoints[0].x,

    z:
        trackPoints[0].z,

    // Kart faces -Z.
    angle: 0,

    speed: 0,

    // Deliberately slower than before.
    maxSpeed: 0.48,

    acceleration: 0.008,

    braking: 0.018,

    reverseSpeed: 0.20,

    turnSpeed: 0.035,

    drifting: false,

    driftCharge: 0,

    boostTimer: 0,

    lap: 1,

    nextCheckpoint: 0,

    finished: false,

    finishTime: 0
};

// ============================================================
// CORRECT STARTING DIRECTION
// ============================================================

const startPoint =
    trackPoints[0];

const startNext =
    trackPoints[1];

const startDX =
    startNext.x -
    startPoint.x;

const startDZ =
    startNext.z -
    startPoint.z;

// Because the front of the kart is -Z:
player.angle =
    Math.atan2(
        startDX,
        -startDZ
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

        keys[event.code] =
            true;

        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "Space"
            ].includes(
                event.code
            )
        ) {

            event.preventDefault();
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.code] =
            false;
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
// POINT-TO-SEGMENT DISTANCE
//
// THIS IS THE IMPORTANT ROAD COLLISION FIX.
//
// Instead of asking:
// "Am I close to a track point?"
//
// we ask:
// "Am I close to the actual road segment?"
//
// This prevents invisible gaps between points.
// ============================================================

function distanceToSegment(
    px,
    pz,
    ax,
    az,
    bx,
    bz
) {

    const abX =
        bx - ax;

    const abZ =
        bz - az;

    const apX =
        px - ax;

    const apZ =
        pz - az;

    const abLengthSquared =
        abX * abX +
        abZ * abZ;

    let t = 0;

    if (
        abLengthSquared > 0
    ) {

        t =
            (
                apX * abX +
                apZ * abZ
            ) /
            abLengthSquared;
    }

    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );

    const closestX =
        ax +
        abX * t;

    const closestZ =
        az +
        abZ * t;

    const dx =
        px -
        closestX;

    const dz =
        pz -
        closestZ;

    return Math.sqrt(
        dx * dx +
        dz * dz
    );
}

// ============================================================
// FIND CLOSEST TRACK SEGMENT
// ============================================================

function getClosestTrackSegment(
    x,
    z
) {

    let closestDistance =
        Infinity;

    let closestIndex =
        0;

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
        distance:
            closestDistance,

        index:
            closestIndex
    };
}

// ============================================================
// ROAD COLLISION
// ============================================================

function isOnRoad(
    x,
    z
) {

    const closest =
        getClosestTrackSegment(
            x,
            z
        );

    return (
        closest.distance <=
        TRACK_WIDTH / 2 +
        ROAD_MARGIN
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

    if (
        forward()
    ) {

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
    // BRAKE / REVERSE
    // --------------------------------------------------------

    if (
        backward()
    ) {

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
    // NATURAL FRICTION
    // --------------------------------------------------------

    if (
        !forward() &&
        !backward()
    ) {

        player.speed *=
            0.965;

        if (
            Math.abs(
                player.speed
            ) < 0.003
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
        ) > 0.08 &&
        (
            left() ||
            right()
        );

    // --------------------------------------------------------
    // STEERING
    // --------------------------------------------------------

    if (
        left() ||
        right()
    ) {

        const direction =
    left()
        ? -1
        : 1;

        let steering =
            player.turnSpeed;

        // More steering at speed,
        // but never uncontrollable.

        const speedFactor =
            Math.min(
                Math.abs(
                    player.speed
                ) / 0.25,
                1
            );

        steering *=
            0.35 +
            speedFactor *
            0.65;

        if (
            player.drifting
        ) {

            steering *=
                1.45;
        }

        if (
            player.speed < 0
        ) {

            steering *=
                -1;
        }

        player.angle +=
            direction *
            steering;
    }

    // --------------------------------------------------------
    // DRIFT CHARGE
    // --------------------------------------------------------

    if (
        player.drifting
    ) {

        player.driftCharge +=
            1;

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
                    25;

            } else if (
                player.driftCharge < 90
            ) {

                player.boostTimer =
                    42;

            } else {

                player.boostTimer =
                    65;
            }
        }

        player.driftCharge =
            0;
    }

    // --------------------------------------------------------
    // BOOST
    // --------------------------------------------------------

    if (
        player.boostTimer > 0
    ) {

        player.boostTimer--;

        player.speed +=
            0.012;

        if (
            player.speed >
            player.maxSpeed +
            0.18
        ) {

            player.speed =
                player.maxSpeed +
                0.18;
        }

        boostFlame.visible =
            true;

    } else {

        boostFlame.visible =
            false;
    }

    // ========================================================
    // FORWARD VECTOR
    //
    // Kart front = -Z
    // ========================================================

    const forwardX =
        Math.sin(
            player.angle
        );

    const forwardZ =
        -Math.cos(
            player.angle
        );

    let movementX =
        forwardX;

    let movementZ =
        forwardZ;

    // --------------------------------------------------------
    // DRIFT SIDEWAYS MOVEMENT
    // --------------------------------------------------------

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
            forwardX *
            0.90 +
            sidewaysX *
            0.15;

        movementZ =
            forwardZ *
            0.90 +
            sidewaysZ *
            0.15;
    }

    // --------------------------------------------------------
    // MOVEMENT
    // --------------------------------------------------------

    const moveX =
        movementX *
        player.speed;

    const moveZ =
        movementZ *
        player.speed;

    const newX =
        player.x +
        moveX;

    const newZ =
        player.z +
        moveZ;

    // ========================================================
    // COLLISION
    //
    // Check the complete proposed position.
    //
    // If valid, move normally.
    //
    // If invalid, try X and Z separately.
    // This lets the kart slide along the road edge
    // instead of getting completely stuck.
    // ========================================================

    if (
        isOnRoad(
            newX,
            newZ
        )
    ) {

        player.x =
            newX;

        player.z =
            newZ;

    } else {

        // Try X movement only

        if (
            isOnRoad(
                newX,
                player.z
            )
        ) {

            player.x =
                newX;

        } else {

            player.speed *=
                0.45;
        }

        // Try Z movement only

        if (
            isOnRoad(
                player.x,
                newZ
            )
        ) {

            player.z =
                newZ;

        } else {

            player.speed *=
                0.45;
        }
    }

    // --------------------------------------------------------
    // KART POSITION
    // --------------------------------------------------------

    kart.position.x =
        player.x;

    kart.position.z =
        player.z;

    kart.rotation.y =
        player.angle;

    // --------------------------------------------------------
    // DRIFT LEAN
    // --------------------------------------------------------

    if (
        player.drifting
    ) {

        const targetLean =
            left()
                ? 0.10
                : -0.10;

        kart.rotation.z =
            THREE.MathUtils.lerp(
                kart.rotation.z,
                targetLean,
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
            0.9;
    }

    updateRace();
}

// ============================================================
// RACE SYSTEM
// ============================================================

const TOTAL_LAPS = 3;

function updateRace() {

    const closest =
        getClosestTrackSegment(
            player.x,
            player.z
        );

    const index =
        closest.index;

    // --------------------------------------------------------
    // CHECKPOINT 1
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 0 &&
        Math.abs(
            index -
            checkpointIndices[0]
        ) <= 3
    ) {

        player.nextCheckpoint =
            1;
    }

    // --------------------------------------------------------
    // CHECKPOINT 2
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 1 &&
        Math.abs(
            index -
            checkpointIndices[1]
        ) <= 3
    ) {

        player.nextCheckpoint =
            2;
    }

    // --------------------------------------------------------
    // CHECKPOINT 3
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 2 &&
        Math.abs(
            index -
            checkpointIndices[2]
        ) <= 3
    ) {

        player.nextCheckpoint =
            3;
    }

    // --------------------------------------------------------
    // FINISH LINE
    // --------------------------------------------------------

    if (
        player.nextCheckpoint === 3 &&
        index >=
        trackPoints.length - 3
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
    document.createElement(
        "div"
    );

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

    let boostText =
        "";

    if (
        player.boostTimer >
        0
    ) {

        boostText =
            "<br>🔥 BOOST!";
    }

    let driftText =
        "";

    if (
        player.drifting
    ) {

        driftText =
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
        ${boostText}
        ${driftText}
    `;
}

// ============================================================
// FINISH SCREEN
// ============================================================

function showFinish() {

    const finish =
        document.createElement(
            "div"
        );

    finish.style.position =
        "absolute";

    finish.style.left =
        "50%";

    finish.style.top =
        "50%";

    finish.style.transform =
        "translate(-50%, -50%)";

    finish.style.background =
        "rgba(0,0,0,0.92)";

    finish.style.color =
        "white";

    finish.style.padding =
        "30px 50px";

    finish.style.borderRadius =
        "15px";

    finish.style.textAlign =
        "center";

    finish.style.fontFamily =
        "Arial, sans-serif";

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
                padding:12px 24px;
                font-size:16px;
                cursor:pointer;
                border:0;
                border-radius:8px;
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
// THIRD-PERSON CAMERA
// ============================================================

function updateCamera() {

    // ========================================================
    // CAMERA IS ALWAYS BEHIND THE KART
    //
    // Kart front:
    // X = sin(angle)
    // Z = -cos(angle)
    //
    // Therefore behind:
    // X = -sin(angle)
    // Z = +cos(angle)
    // ========================================================

    const cameraDistance =
        11;

    const cameraHeight =
        6.5;

    const behindX =
        player.x -
        Math.sin(
            player.angle
        ) *
        cameraDistance;

    const behindZ =
        player.z +
        Math.cos(
            player.angle
        ) *
        cameraDistance;

    // Smooth following

    camera.position.x =
        THREE.MathUtils.lerp(
            camera.position.x,
            behindX,
            0.12
        );

    camera.position.y =
        THREE.MathUtils.lerp(
            camera.position.y,
            cameraHeight,
            0.12
        );

    camera.position.z =
        THREE.MathUtils.lerp(
            camera.position.z,
            behindZ,
            0.12
        );

    // Look toward a point in front of the kart

    const lookAhead =
        8;

    const lookX =
        player.x +
        Math.sin(
            player.angle
        ) *
        lookAhead;

    const lookZ =
        player.z -
        Math.cos(
            player.angle
        ) *
        lookAhead;

    camera.lookAt(
        lookX,
        1.1,
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
