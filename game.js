import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ============================================================
// KART RACER 3D - FPS INDEPENDENT PHYSICS
// ============================================================

const canvas = document.getElementById("gameCanvas");
const container = document.getElementById("gameCanvasContainer");

// ------------------------------------------------------------
// SCENE
// ------------------------------------------------------------

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    90,
    220
);

// ------------------------------------------------------------
// CAMERA
// ------------------------------------------------------------

const camera = new THREE.PerspectiveCamera(
    65,
    container.clientWidth / container.clientHeight,
    0.1,
    500
);

camera.position.set(0, 7, 12);

// ------------------------------------------------------------
// RENDERER
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// LIGHTING
// ------------------------------------------------------------

const ambientLight =
    new THREE.HemisphereLight(
        0xffffff,
        0x557755,
        2
    );

scene.add(ambientLight);

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

const grassGeometry =
    new THREE.PlaneGeometry(
        220,
        180
    );

const grassMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x3f8f3f,
        roughness: 1
    });

const grass =
    new THREE.Mesh(
        grassGeometry,
        grassMaterial
    );

grass.rotation.x =
    -Math.PI / 2;

grass.receiveShadow = true;

scene.add(grass);

// ============================================================
// TRACK
// ============================================================

const TRACK_WIDTH = 12;

const TRACK_HALF_X = 42;
const TRACK_HALF_Z = 27;
const CORNER_RADIUS = 11;

const trackPoints = [];

function roundedRectanglePoints() {

    const points = [];

    const sections = [

        {
            cx:
                TRACK_HALF_X -
                CORNER_RADIUS,

            cz:
                -TRACK_HALF_Z +
                CORNER_RADIUS,

            start:
                -Math.PI / 2,

            end:
                0
        },

        {
            cx:
                TRACK_HALF_X -
                CORNER_RADIUS,

            cz:
                TRACK_HALF_Z -
                CORNER_RADIUS,

            start:
                0,

            end:
                Math.PI / 2
        },

        {
            cx:
                -TRACK_HALF_X +
                CORNER_RADIUS,

            cz:
                TRACK_HALF_Z -
                CORNER_RADIUS,

            start:
                Math.PI / 2,

            end:
                Math.PI
        },

        {
            cx:
                -TRACK_HALF_X +
                CORNER_RADIUS,

            cz:
                -TRACK_HALF_Z +
                CORNER_RADIUS,

            start:
                Math.PI,

            end:
                Math.PI * 1.5
        }
    ];

    for (
        const section of sections
    ) {

        const steps = 30;

        for (
            let i = 0;
            i < steps;
            i++
        ) {

            const t =
                i / steps;

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

trackPoints.push(
    ...roundedRectanglePoints()
);

// ------------------------------------------------------------
// ROAD
// ------------------------------------------------------------

function createTrack() {

    const positions = [];
    const indices = [];

    const outer = [];
    const inner = [];

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

        outer.push({

            x:
                current.x +
                nx * TRACK_WIDTH / 2,

            z:
                current.z +
                nz * TRACK_WIDTH / 2
        });

        inner.push({

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

    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x3b3b3b,
            roughness: 0.9
        });

    const road =
        new THREE.Mesh(
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

    const curbMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xd92727,
            roughness: 0.8
        });

    for (
        let i = 0;
        i < trackPoints.length;
        i += 2
    ) {

        const p =
            trackPoints[i];

        const next =
            trackPoints[
                (i + 1) %
                trackPoints.length
            ];

        const dx =
            next.x - p.x;

        const dz =
            next.z - p.z;

        const length =
            Math.sqrt(
                dx * dx +
                dz * dz
            );

        const curb =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    Math.max(length, 1),
                    0.25,
                    0.7
                ),
                curbMaterial
            );

        curb.position.set(
            p.x,
            0.2,
            p.z
        );

        curb.rotation.y =
            -Math.atan2(
                dz,
                dx
            );

        curb.castShadow = true;

        scene.add(curb);
    }
}

createCurbs();

// ============================================================
// TRACK BORDERS
// ============================================================

function createTrackBorder() {

    const borderMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8
        });

    for (
        let i = 0;
        i < trackPoints.length;
        i += 3
    ) {

        const p =
            trackPoints[i];

        const next =
            trackPoints[
                (i + 1) %
                trackPoints.length
            ];

        const dx =
            next.x - p.x;

        const dz =
            next.z - p.z;

        const length =
            Math.sqrt(
                dx * dx +
                dz * dz
            );

        const nx =
            -dz / length;

        const nz =
            dx / length;

        for (
            const side of [-1, 1]
        ) {

            const border =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        Math.max(length, 1),
                        0.35,
                        0.35
                    ),
                    borderMaterial
                );

            border.position.set(
                p.x +
                    nx *
                    side *
                    TRACK_WIDTH /
                    2,

                0.25,

                p.z +
                    nz *
                    side *
                    TRACK_WIDTH /
                    2
            );

            border.rotation.y =
                -Math.atan2(
                    dz,
                    dx
                );

            border.castShadow = true;

            scene.add(border);
        }
    }
}

createTrackBorder();

// ============================================================
// FINISH LINE
// ============================================================

function createFinishLine() {

    const group =
        new THREE.Group();

    const width = 12;
    const length = 3;

    const whiteMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });

    const blackMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });

    const squares = 8;

    for (
        let i = 0;
        i < squares;
        i++
    ) {

        const material =
            i % 2 === 0
                ? whiteMaterial
                : blackMaterial;

        const square =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    length,
                    0.08,
                    width / squares
                ),
                material
            );

        square.position.z =
            -width / 2 +
            (
                i + 0.5
            ) *
            width /
            squares;

        group.add(square);
    }

    const start =
        trackPoints[0];

    const next =
        trackPoints[1];

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
                color: 0x6b3e20
            })
        );

    trunk.position.y = 1.5;

    trunk.castShadow = true;

    tree.add(trunk);

    const leaves =
        new THREE.Mesh(
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

for (
    const [x, z]
    of treeLocations
) {

    createTree(x, z);
}

// ============================================================
// KART
// ============================================================

const kart =
    new THREE.Group();

// ------------------------------------------------------------
// BODY
// ------------------------------------------------------------

const kartBody =
    new THREE.Mesh(
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

const hood =
    new THREE.Mesh(
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

const seat =
    new THREE.Mesh(
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
// PLAYER
// ============================================================

const player = {

    speed: 0,

    // Speed is measured as world-units per 1/60th-second
    maxSpeed: 1.2,

    acceleration: 0.025,

    braking: 0.045,

    reverseSpeed: 0.5,

    turnSpeed: 0.035,

    angle: 0,

    drifting: false,

    // These timers are expressed in 60 FPS "frames"
    driftCharge: 0,

    boostTimer: 0,

    x:
        trackPoints[0].x,

    z:
        trackPoints[0].z,

    lap: 1,

    nextCheckpoint: 1,

    finished: false,

    finishTime: 0
};

kart.position.set(
    player.x,
    0,
    player.z
);

player.angle =
    -Math.atan2(
        trackPoints[1].z -
            trackPoints[0].z,

        trackPoints[1].x -
            trackPoints[0].x
    );

kart.rotation.y =
    player.angle;

// ============================================================
// CHECKPOINTS
// ============================================================

const checkpointIndices = [
    90,
    180,
    270
];

function createCheckpoint(
    index,
    number
) {

    const p =
        trackPoints[index];

    const next =
        trackPoints[
            (index + 1) %
            trackPoints.length
        ];

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

            opacity: 0.45
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

        const p =
            trackPoints[i];

        const dx =
            x - p.x;

        const dz =
            z - p.z;

        const distance =
            dx * dx +
            dz * dz;

        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;

            bestIndex = i;
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
        TRACK_WIDTH / 2 + 1.5
    );
}

// ============================================================
// FPS-INDEPENDENT PLAYER PHYSICS
// ============================================================

function updatePlayer(
    timeScale
) {

    if (player.finished) {
        return;
    }

    // --------------------------------------------------------
    // ACCELERATION
    // --------------------------------------------------------

    if (forward()) {

        player.speed +=
            player.acceleration *
            timeScale;

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

        if (player.speed > 0) {

            player.speed -=
                player.braking *
                timeScale;

        } else {

            player.speed -=
                player.acceleration *
                timeScale;
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

        // 0.985 per 60 FPS frame,
        // converted to elapsed time.

        player.speed *=
            Math.pow(
                0.985,
                timeScale
            );

        if (
            Math.abs(
                player.speed
            ) < 0.01
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
        ) > 0.25 &&
        (left() || right());

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

        const steeringMultiplier =
            player.drifting
                ? 1.8
                : 1;

        player.angle +=
            direction *
            player.turnSpeed *
            steeringMultiplier *
            Math.min(
                Math.abs(
                    player.speed
                ) + 0.2,

                1.4
            ) *
            timeScale;
    }

    // --------------------------------------------------------
    // DRIFT CHARGE
    // --------------------------------------------------------

    if (player.drifting) {

        player.driftCharge +=
            timeScale;

        if (
            player.driftCharge >
            120
        ) {

            player.driftCharge =
                120;
        }

    } else {

        // Release drift and activate boost.

        if (
            player.driftCharge >= 20
        ) {

            if (
                player.driftCharge < 50
            ) {

                // Small boost

                player.boostTimer =
                    25;

            } else if (
                player.driftCharge < 90
            ) {

                // Medium boost

                player.boostTimer =
                    40;

            } else {

                // Large boost

                player.boostTimer =
                    65;
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

        player.boostTimer -=
            timeScale;

        player.speed +=
            0.045 *
            timeScale;

        if (
            player.speed >
            player.maxSpeed +
            0.8
        ) {

            player.speed =
                player.maxSpeed +
                0.8;
        }
    }

    // --------------------------------------------------------
    // MOVEMENT
    // --------------------------------------------------------

    let moveAngle =
        player.angle;

    if (player.drifting) {

        const direction =
            right()
                ? -1
                : 1;

        moveAngle +=
            direction *
            0.18;
    }

    const moveX =
        Math.cos(
            moveAngle
        ) *
        player.speed *
        timeScale;

    const moveZ =
        -Math.sin(
            moveAngle
        ) *
        player.speed *
        timeScale;

    const newX =
        player.x +
        moveX;

    const newZ =
        player.z +
        moveZ;

    if (
        isOnTrack(
            newX,
            player.z
        )
    ) {

        player.x = newX;

    } else {

        player.speed *=
            Math.pow(
                0.45,
                timeScale
            );
    }

    if (
        isOnTrack(
            player.x,
            newZ
        )
    ) {

        player.z = newZ;

    } else {

        player.speed *=
            Math.pow(
                0.45,
                timeScale
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
        player.angle;

    // --------------------------------------------------------
    // WHEEL ANIMATION
    // --------------------------------------------------------

    for (
        const wheel of wheels
    ) {

        wheel.rotation.x +=
            player.speed *
            0.3 *
            timeScale;
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

function updateRace() {

    const nearest =
        closestTrackPoint(
            player.x,
            player.z
        );

    const index =
        nearest.index;

    // CHECKPOINT 1

    if (
        player.nextCheckpoint === 1 &&
        Math.abs(
            index -
            checkpointIndices[0]
        ) < 5
    ) {

        player.nextCheckpoint =
            2;
    }

    // CHECKPOINT 2

    if (
        player.nextCheckpoint === 2 &&
        Math.abs(
            index -
            checkpointIndices[1]
        ) < 5
    ) {

        player.nextCheckpoint =
            3;
    }

    // CHECKPOINT 3

    if (
        player.nextCheckpoint === 3 &&
        Math.abs(
            index -
            checkpointIndices[2]
        ) < 5
    ) {

        player.nextCheckpoint =
            4;
    }

    // FINISH LINE

    if (
        player.nextCheckpoint === 4 &&
        index < 5
    ) {

        if (
            player.lap <
            TOTAL_LAPS
        ) {

            player.lap++;

            player.nextCheckpoint =
                1;

        } else {

            player.finished =
                true;

            player.finishTime =
                raceElapsedTime;

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
            " 🔥 BOOST!";
    }

    let driftText = "";

    if (
        player.drifting
    ) {

        driftText =
            `<br>Drift: ${Math.floor(
                player.driftCharge
            )}`;
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
        ${Math.floor(
            Math.abs(
                player.speed
            ) * 100
        )}

        ${boostText}

        ${driftText}

        <br>

        Time:
        ${raceElapsedTime.toFixed(1)}
    `;
}

updateHUD();

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

        <button id="restartButton">
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
// FPS-INDEPENDENT CAMERA
// ============================================================

function updateCamera(
    timeScale
) {

    const cameraDistance = 11;
    const cameraHeight = 7;

    const behindX =
        player.x -
        Math.cos(
            player.angle
        ) *
        cameraDistance;

    const behindZ =
        player.z +
        Math.sin(
            player.angle
        ) *
        cameraDistance;

    const targetPosition =
        new THREE.Vector3(
            behindX,
            cameraHeight,
            behindZ
        );

    // Convert smoothing to be independent
    // of FPS.

    const cameraSmoothing =
        1 -
        Math.pow(
            0.08,
            timeScale
        );

    camera.position.lerp(
        targetPosition,
        cameraSmoothing
    );

    const lookX =
        player.x +
        Math.cos(
            player.angle
        ) *
        5;

    const lookZ =
        player.z -
        Math.sin(
            player.angle
        ) *
        5;

    camera.lookAt(
        lookX,
        1,
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
// FPS-INDEPENDENT GAME TIMER
// ============================================================

let raceElapsedTime = 0;

// ============================================================
// GAME LOOP
// ============================================================

let previousTime =
    performance.now();

function animate(
    currentTime
) {

    requestAnimationFrame(
        animate
    );

    // --------------------------------------------------------
    // DELTA TIME
    // --------------------------------------------------------

    let deltaTime =
        (
            currentTime -
            previousTime
        ) / 1000;

    previousTime =
        currentTime;

    // Prevent giant physics jumps
    // when the browser tab is paused.

    deltaTime =
        Math.min(
            deltaTime,
            0.05
        );

    // --------------------------------------------------------
    // TIME SCALE
    // --------------------------------------------------------
    //
    // At 60 FPS:
    //
    // deltaTime = 0.01667
    //
    // timeScale = 1
    //
    // At 120 FPS:
    //
    // deltaTime = 0.00833
    //
    // timeScale = 0.5
    //
    // This keeps physics consistent.
    // --------------------------------------------------------

    const timeScale =
        deltaTime * 60;

    if (!player.finished) {

        raceElapsedTime +=
            deltaTime;
    }

    updatePlayer(
        timeScale
    );

    updateCamera(
        timeScale
    );

    updateHUD();

    renderer.render(
        scene,
        camera
    );
}

requestAnimationFrame(
    animate
);
