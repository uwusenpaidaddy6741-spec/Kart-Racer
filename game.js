import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

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
    1000,
    1000
);

const grassMaterial = new THREE.MeshStandardMaterial({
    color:
    new URLSearchParams(window.location.search).get("track") === "4"
        ? 0xf5f5f5
        : new URLSearchParams(window.location.search).get("track") === "3"
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
// TRACK SETTINGS
// ============================================================

const TRACK_WIDTH = 20;

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

function oasisPoints() {

    const points = [];

    // Track dimensions
    const leftX = -60;
    const rightX = 45;

    const topZ = -35;
    const middleZ = -5;
    const bottomZ = 35;

    // Inner section
    const innerX = 5;

    // --------------------------------------------------
    // TOP STRAIGHT
    // --------------------------------------------------

    for (let i = 0; i <= 35; i++) {

        const t = i / 35;

        points.push({
            x: THREE.MathUtils.lerp(
                leftX,
                innerX,
                t
            ),
            z: topZ
        });
    }

    // --------------------------------------------------
    // TOP RIGHT ROUNDED CORNER
    // --------------------------------------------------

    const radius1 = 10;

    for (let i = 1; i <= 15; i++) {

        const t = i / 15;

        const angle =
            -Math.PI / 2 +
            t * (Math.PI / 2);

        points.push({
            x:
                innerX +
                Math.cos(angle) * radius1,

            z:
                topZ +
                radius1 +
                Math.sin(angle) * radius1
        });
    }

    // --------------------------------------------------
    // INNER VERTICAL
    // --------------------------------------------------

    for (let i = 1; i <= 20; i++) {

        const t = i / 20;

        points.push({
            x: innerX + radius1,
            z: THREE.MathUtils.lerp(
                topZ + radius1,
                middleZ,
                t
            )
        });
    }

    // --------------------------------------------------
    // MIDDLE STRAIGHT TO THE RIGHT
    // --------------------------------------------------

    for (let i = 1; i <= 25; i++) {

        const t = i / 25;

        points.push({
            x: THREE.MathUtils.lerp(
                innerX + radius1,
                rightX - 10,
                t
            ),
            z: middleZ
        });
    }

    // --------------------------------------------------
    // RIGHT TOP CORNER
    // --------------------------------------------------

    const radius2 = 10;

    for (let i = 1; i <= 15; i++) {

        const t = i / 15;

        const angle =
            -Math.PI / 2 +
            t * (Math.PI / 2);

        points.push({
            x:
                rightX -
                radius2 +
                Math.cos(angle) * radius2,

            z:
                middleZ +
                radius2 +
                Math.sin(angle) * radius2
        });
    }

    // --------------------------------------------------
    // RIGHT VERTICAL
    // --------------------------------------------------

    for (let i = 1; i <= 25; i++) {

        const t = i / 25;

        points.push({
            x: rightX,
            z: THREE.MathUtils.lerp(
                middleZ + radius2,
                bottomZ - 10,
                t
            )
        });
    }

    // --------------------------------------------------
    // BOTTOM RIGHT CORNER
    // --------------------------------------------------

    for (let i = 1; i <= 15; i++) {

        const t = i / 15;

        const angle =
            t * (Math.PI / 2);

        points.push({
            x:
                rightX -
                10 +
                Math.cos(angle) * 10,

            z:
                bottomZ -
                10 +
                Math.sin(angle) * 10
        });
    }

    // --------------------------------------------------
    // BOTTOM STRAIGHT
    // --------------------------------------------------

    for (let i = 1; i <= 40; i++) {

        const t = i / 40;

        points.push({
            x: THREE.MathUtils.lerp(
                rightX - 10,
                leftX,
                t
            ),
            z: bottomZ
        });
    }

    // --------------------------------------------------
    // LEFT SIDE
    // --------------------------------------------------

    for (let i = 1; i <= 30; i++) {

        const t = i / 30;

        points.push({
            x: leftX,
            z: THREE.MathUtils.lerp(
                bottomZ,
                topZ,
                t
            )
        });
    }

    return points;
}

// ============================================================
// TRACK 4 - SNOW TRACK
// WIDE RECTANGULAR / S-CURVE LAYOUT
// ============================================================

function snowTrackPoints() {

    const controlPoints = [

        // ----------------------------------------------------
        // START / FINISH - LONG TOP STRAIGHT
        // ----------------------------------------------------

        { x: -70, z: -50 },
        { x: -45, z: -50 },
        { x: -20, z: -50 },
        { x:   5, z: -50 },
        { x:  30, z: -50 },
        { x:  50, z: -50 },

        // ----------------------------------------------------
        // LARGE RIGHT U-TURN
        // ----------------------------------------------------

        { x:  62, z: -45 },
        { x:  68, z: -35 },
        { x:  68, z: -23 },
        { x:  62, z: -12 },
        { x:  52, z:  -5 },

        // ----------------------------------------------------
        // FIRST PART OF S-CURVE
        // ----------------------------------------------------

        { x:  42, z:   0 },
        { x:  35, z:   8 },
        { x:  36, z:  18 },
        { x:  43, z:  25 },

        // ----------------------------------------------------
        // SECOND PART OF S-CURVE
        // ----------------------------------------------------

        { x:  48, z:  32 },
        { x:  45, z:  40 },
        { x:  37, z:  46 },
        { x:  27, z:  48 },

        // ----------------------------------------------------
        // DROP TOWARD BOTTOM SECTION
        // ----------------------------------------------------

        { x:  17, z:  48 },
        { x:  10, z:  52 },
        { x:  10, z:  62 },

        // ----------------------------------------------------
        // BOTTOM-RIGHT CORNER
        // ----------------------------------------------------

        { x:  10, z:  70 },
        { x:   5, z:  75 },
        { x:  -5, z:  78 },

        // ----------------------------------------------------
        // LONG BOTTOM STRAIGHT
        // ----------------------------------------------------

        { x: -25, z:  78 },
        { x: -50, z:  78 },
        { x: -70, z:  78 },

        // ----------------------------------------------------
        // BOTTOM-LEFT CORNER
        // ----------------------------------------------------

        { x: -82, z:  72 },
        { x: -86, z:  62 },

        // ----------------------------------------------------
        // LONG LEFT STRAIGHT
        // ----------------------------------------------------

        { x: -86, z:  42 },
        { x: -86, z:  20 },
        { x: -86, z:  -5 },
        { x: -86, z: -30 },
        { x: -82, z: -42 },

        // ----------------------------------------------------
        // RETURN TO START
        // ----------------------------------------------------

        { x: -76, z: -48 },
        { x: -70, z: -50 }
    ];

    const points = [];

    // --------------------------------------------------------
    // CATMULL-ROM INTERPOLATION
    // --------------------------------------------------------

    for (
        let i = 0;
        i < controlPoints.length;
        i++
    ) {

        const previous =
            controlPoints[
                (i - 1 + controlPoints.length) %
                controlPoints.length
            ];

        const current =
            controlPoints[i];

        const next =
            controlPoints[
                (i + 1) %
                controlPoints.length
            ];

        const nextNext =
            controlPoints[
                (i + 2) %
                controlPoints.length
            ];

        const steps = 12;

        for (
            let j = 0;
            j < steps;
            j++
        ) {

            const t = j / steps;
            const t2 = t * t;
            const t3 = t2 * t;

            const x =
                0.5 * (
                    (2 * current.x) +

                    (-previous.x + next.x) * t +

                    (
                        2 * previous.x -
                        5 * current.x +
                        4 * next.x -
                        nextNext.x
                    ) * t2 +

                    (
                        -previous.x +
                        3 * current.x -
                        3 * next.x +
                        nextNext.x
                    ) * t3
                );

            const z =
                0.5 * (
                    (2 * current.z) +

                    (-previous.z + next.z) * t +

                    (
                        2 * previous.z -
                        5 * current.z +
                        4 * next.z -
                        nextNext.z
                    ) * t2 +

                    (
                        -previous.z +
                        3 * current.z -
                        3 * next.z +
                        nextNext.z
                    ) * t3
                );

            points.push({
                x: x,
                z: z
            });
        }
    }

    return points;
}

// ============================================================
// TRACK 5 - GRAND CIRCUIT
// CLEAN CLOSED CIRCUIT
// ============================================================

function grandCircuitPoints() {

    const points = [];

    // --------------------------------------------------------
    // STRAIGHT
    // --------------------------------------------------------

    const addLine = (
        x1,
        z1,
        x2,
        z2,
        steps
    ) => {

        for (let i = 0; i <= steps; i++) {

            const t = i / steps;

            points.push({

                x:
                    THREE.MathUtils.lerp(
                        x1,
                        x2,
                        t
                    ),

                z:
                    THREE.MathUtils.lerp(
                        z1,
                        z2,
                        t
                    )
            });
        }
    };


    // --------------------------------------------------------
    // CURVE
    // --------------------------------------------------------

    const addArc = (
        centerX,
        centerZ,
        radius,
        startAngle,
        endAngle,
        steps
    ) => {

        for (let i = 1; i <= steps; i++) {

            const t =
                i / steps;

            const angle =
                startAngle +
                (endAngle - startAngle) * t;

            points.push({

                x:
                    centerX +
                    Math.cos(angle) *
                    radius,

                z:
                    centerZ +
                    Math.sin(angle) *
                    radius
            });
        }
    };


    // ========================================================
    // START / FINISH STRAIGHT
    // ========================================================

    addLine(
        -300,
        -180,

        40,
        -180,

        42
    );


    // ========================================================
    // TOP RIGHT U-TURN
    // ========================================================

    addArc(
        40,
        -130,

        50,

        -Math.PI / 2,
        Math.PI / 2,

        24
    );


    // ========================================================
    // UPPER INNER STRAIGHT
    // ========================================================

    addLine(
        40,
        -80,

        -40,
        -80,

        16
    );


    // ========================================================
    // LEFT INNER DESCENT
    // ========================================================

    addLine(
        -40,
        -80,

        -40,
        20,

        20
    );


    // ========================================================
    // LONG MIDDLE STRAIGHT
    // ========================================================

    addLine(
        -40,
        20,

        220,
        20,

        40
    );


    // ========================================================
    // RIGHT SIDE
    // ========================================================

    addLine(
        220,
        20,

        220,
        130,

        22
    );


    // ========================================================
    // LOWER RIGHT HAIRPIN
    // ========================================================

    addArc(
        160,
        130,

        60,

        0,
        Math.PI,

        30
    );


    // ========================================================
    // LOWER INNER STRAIGHT
    // ========================================================

    addLine(
        100,
        130,

        100,
        230,

        20
    );


    // ========================================================
    // LOWER MIDDLE STRAIGHT
    // ========================================================

    addLine(
        100,
        230,

        -80,
        230,

        30
    );


    // ========================================================
    // LOWER DROP
    // ========================================================

    addLine(
        -80,
        230,

        -80,
        290,

        12
    );


    // ========================================================
    // BOTTOM STRAIGHT
    // ========================================================

    addLine(
        -80,
        290,

        -300,
        290,

        34
    );


    // ========================================================
    // BOTTOM LEFT CORNER
    // ========================================================

    addArc(
        -300,
        230,

        60,

        Math.PI / 2,
        Math.PI,

        24
    );


    // ========================================================
    // LEFT SIDE
    // ========================================================

    addLine(
        -360,
        230,

        -360,
        -120,

        50
    );


    // ========================================================
    // TOP LEFT CORNER
    // ========================================================

    addArc(
        -300,
        -120,

        60,

        Math.PI,
        Math.PI * 1.5,

        24
    );


    // ========================================================
    // CLEAN LOOP CLOSURE
    // ========================================================

    const firstPoint = points[0];

    const lastPoint =
        points[points.length - 1];

    const distanceToStart =
        Math.hypot(
            lastPoint.x - firstPoint.x,
            lastPoint.z - firstPoint.z
        );

    // Only add the starting point if the
    // curve did not already end there.

    if (distanceToStart > 0.01) {

        points.push({

            x: firstPoint.x,

            z: firstPoint.z

        });
    }


    return points;
}

// ============================================================
// TRACK 6 - SUNSET SPEEDWAY
// DESERT CANYON HIGH-SPEED CIRCUIT
// ============================================================

function sunsetSpeedwayPoints() {

    const controlPoints = [

        // ----------------------------------------------------
        // START / FINISH STRAIGHT
        // ----------------------------------------------------

        { x: -300, z: -180 },
        { x: -220, z: -180 },
        { x: -120, z: -180 },
        { x: -20, z: -180 },
        { x: 80, z: -180 },


        // ----------------------------------------------------
        // EAST CANYON
        // ----------------------------------------------------

        { x: 170, z: -150 },
        { x: 220, z: -80 },
        { x: 220, z: 10 },


        // ----------------------------------------------------
        // CANYON HAIRPIN
        // ----------------------------------------------------

        { x: 190, z: 70 },
        { x: 120, z: 90 },
        { x: 40, z: 70 },


        // ----------------------------------------------------
        // CENTRAL CANYON SECTION
        // ----------------------------------------------------

        { x: 90, z: 130 },
        { x: 150, z: 180 },
        { x: 130, z: 240 },


        // ----------------------------------------------------
        // LOWER DESERT STRAIGHT
        // ----------------------------------------------------

        { x: 40, z: 260 },
        { x: -60, z: 260 },
        { x: -160, z: 250 },


        // ----------------------------------------------------
        // WESTERN CANYON
        // ----------------------------------------------------

        { x: -240, z: 210 },
        { x: -290, z: 140 },
        { x: -290, z: 60 },


        // ----------------------------------------------------
        // WESTERN HAIRPIN
        // ----------------------------------------------------

        { x: -250, z: 10 },
        { x: -190, z: 20 },
        { x: -150, z: -30 },


        // ----------------------------------------------------
        // FINAL RUN BACK TO START
        // ----------------------------------------------------

        { x: -180, z: -100 },
        { x: -240, z: -150 }

    ];

    const points = [];


    // --------------------------------------------------------
    // SMOOTH THE TRACK
    // --------------------------------------------------------

    for (
        let i = 0;
        i < controlPoints.length;
        i++
    ) {

        const previous =
            controlPoints[
                (i - 1 + controlPoints.length) %
                controlPoints.length
            ];

        const current =
            controlPoints[i];

        const next =
            controlPoints[
                (i + 1) %
                controlPoints.length
            ];

        const nextNext =
            controlPoints[
                (i + 2) %
                controlPoints.length
            ];

        const steps = 14;


        for (
            let j = 0;
            j < steps;
            j++
        ) {

            const t =
                j / steps;

            const t2 =
                t * t;

            const t3 =
                t2 * t;


            // Catmull-Rom interpolation

            const x =
                0.5 * (
                    (2 * current.x) +

                    (-previous.x + next.x) * t +

                    (
                        2 * previous.x -
                        5 * current.x +
                        4 * next.x -
                        nextNext.x
                    ) * t2 +

                    (
                        -previous.x +
                        3 * current.x -
                        3 * next.x +
                        nextNext.x
                    ) * t3
                );


            const z =
                0.5 * (
                    (2 * current.z) +

                    (-previous.z + next.z) * t +

                    (
                        2 * previous.z -
                        5 * current.z +
                        4 * next.z -
                        nextNext.z
                    ) * t2 +

                    (
                        -previous.z +
                        3 * current.z -
                        3 * next.z +
                        nextNext.z
                    ) * t3
                );


            points.push({
                x: x,
                z: z
            });
        }
    }


    return points;
}

// ============================================================
// TRACK 7 - MOUNTAIN PASS
// NON-CROSSING MOUNTAIN LOOP
// ============================================================

function mountainPassPoints() {

    const controlPoints = [

        // ====================================================
        // START / FINISH
        // ====================================================

        { x: 0,   z: -120 },

        // ====================================================
        // LOWER STRAIGHT
        // ====================================================

        { x: 45,  z: -115 },
        { x: 80,  z: -90 },

        // ====================================================
        // FIRST CLIMB
        // ====================================================

        { x: 105, z: -50 },
        { x: 115, z: 0 },
        { x: 105, z: 45 },

        // ====================================================
        // HIGH MOUNTAIN SECTION
        // ====================================================

        { x: 80,  z: 80 },
        { x: 40,  z: 105 },
        { x: -10, z: 112 },
        { x: -60, z: 100 },

        // ====================================================
        // MOUNTAIN HAIRPIN
        // ====================================================

        { x: -95, z: 75 },
        { x: -112, z: 35 },

        // ====================================================
        // DESCENT
        // ====================================================

        { x: -115, z: -10 },
        { x: -105, z: -50 },
        { x: -80,  z: -80 },

        // ====================================================
        // FINAL RUN TO FINISH
        // ====================================================

        { x: -45, z: -100 },
        { x: -15, z: -112 },

        // Back to start
        { x: 0, z: -120 }
    ];

    const points = [];

    for (
        let i = 0;
        i < controlPoints.length - 1;
        i++
    ) {

        const previous =
            controlPoints[
                Math.max(0, i - 1)
            ];

        const current =
            controlPoints[i];

        const next =
            controlPoints[i + 1];

        const nextNext =
            controlPoints[
                Math.min(
                    controlPoints.length - 1,
                    i + 2
                )
            ];

        const samples = 12;

        for (
            let j = 0;
            j < samples;
            j++
        ) {

            const t = j / samples;

            const t2 = t * t;
            const t3 = t2 * t;

            const x =
                0.5 * (
                    (2 * current.x) +

                    (-previous.x + next.x) * t +

                    (
                        2 * previous.x -
                        5 * current.x +
                        4 * next.x -
                        nextNext.x
                    ) * t2 +

                    (
                        -previous.x +
                        3 * current.x -
                        3 * next.x +
                        nextNext.x
                    ) * t3
                );

            const z =
                0.5 * (
                    (2 * current.z) +

                    (-previous.z + next.z) * t +

                    (
                        2 * previous.z -
                        5 * current.z +
                        4 * next.z -
                        nextNext.z
                    ) * t2 +

                    (
                        -previous.z +
                        3 * current.z -
                        3 * next.z +
                        nextNext.z
                    ) * t3
                );

            points.push({
                x: x,
                z: z
            });
        }
    }

    return points;
}

// ============================================================
// TRACK 8 - CASTLE RUN
// ============================================================

function castleRunPoints() {

    const controlPoints = [

        // Outdoor approach to castle
        { x: -100, z: -90 },
        { x: -55,  z: -105 },
        { x: -10,  z: -105 },

        // Castle entrance
        { x: 35,   z: -105 },
        { x: 65,   z: -90 },
        { x: 75,   z: -55 },

        // Drive INTO the castle
        { x: 75,   z: -20 },
        { x: 75,   z: 20 },

        // Castle interior
        { x: 55,   z: 45 },
        { x: 15,   z: 55 },
        { x: -25,  z: 45 },

        // Castle courtyard
        { x: -55,  z: 20 },
        { x: -60,  z: -20 },

        // Turn toward castle exit
        { x: -35,  z: -50 },
        { x: 5,    z: -55 },

        // Drive OUT of the castle
        { x: 40,   z: -45 },
        { x: 65,   z: -20 },

        // Outdoor section
        { x: 90,   z: 15 },
        { x: 105,  z: 55 },
        { x: 90,   z: 95 },
        { x: 50,   z: 115 },
        { x: 0,    z: 120 },
        { x: -50,  z: 110 },
        { x: -90,  z: 80 },
        { x: -110, z: 35 },
        { x: -115, z: -15 },
        { x: -105, z: -55 },
        { x: -100, z: -90 }
    ];

    const points = [];

    for (
        let i = 0;
        i < controlPoints.length - 1;
        i++
    ) {

        const previous =
            controlPoints[Math.max(0, i - 1)];

        const current =
            controlPoints[i];

        const next =
            controlPoints[i + 1];

        const nextNext =
            controlPoints[
                Math.min(
                    controlPoints.length - 1,
                    i + 2
                )
            ];

        const samples = 12;

        for (let j = 0; j < samples; j++) {

            const t = j / samples;

            const t2 = t * t;
            const t3 = t2 * t;

            const x =
                0.5 * (
                    (2 * current.x) +
                    (-previous.x + next.x) * t +
                    (2 * previous.x -
                        5 * current.x +
                        4 * next.x -
                        nextNext.x) * t2 +
                    (-previous.x +
                        3 * current.x -
                        3 * next.x +
                        nextNext.x) * t3
                );

            const z =
                0.5 * (
                    (2 * current.z) +
                    (-previous.z + next.z) * t +
                    (2 * previous.z -
                        5 * current.z +
                        4 * next.z -
                        nextNext.z) * t2 +
                    (-previous.z +
                        3 * current.z -
                        3 * next.z +
                        nextNext.z) * t3
                );

            points.push({
                x,
                z
            });
        }
    }

    return points;
}

// ============================================================
// TRACK 9 — JUNGLE RUN
// ============================================================

function jungleRunPoints() {

    const points = [];

    const controlPoints = [

        // Start / finish straight
        { x: 0,   z: 55 },
        { x: 18,  z: 55 },
        { x: 38,  z: 48 },

        // First jungle bend
        { x: 55,  z: 32 },
        { x: 58,  z: 10 },
        { x: 48,  z: -8 },

        // Waterfall section
        { x: 30,  z: -22 },
        { x: 8,   z: -28 },

        // Cave entrance
        { x: -18, z: -25 },
        { x: -38, z: -12 },

        // Cave exit / sharp turn
        { x: -52, z: 5 },
        { x: -48, z: 25 },

        // Long jungle straight
        { x: -32, z: 40 },
        { x: -12, z: 50 },

        // Back toward start
        { x: 0,   z: 55 }

    ];

    // Smooth the control points
    for (
        let i = 0;
        i < controlPoints.length - 1;
        i++
    ) {

        const previous =
            controlPoints[
                (i - 1 + controlPoints.length) %
                controlPoints.length
            ];

        const current =
            controlPoints[i];

        const next =
            controlPoints[
                (i + 1) %
                controlPoints.length
            ];

        const nextNext =
            controlPoints[
                (i + 2) %
                controlPoints.length
            ];

        const steps = 12;

        for (
            let j = 0;
            j < steps;
            j++
        ) {

            const t =
                j / steps;

            const t2 =
                t * t;

            const t3 =
                t2 * t;

            const x =
                0.5 * (
                    (2 * current.x) +

                    (-previous.x + next.x) * t +

                    (
                        2 * previous.x -
                        5 * current.x +
                        4 * next.x -
                        nextNext.x
                    ) * t2 +

                    (
                        -previous.x +
                        3 * current.x -
                        3 * next.x +
                        nextNext.x
                    ) * t3
                );

            const z =
                0.5 * (
                    (2 * current.z) +

                    (-previous.z + next.z) * t +

                    (
                        2 * previous.z -
                        5 * current.z +
                        4 * next.z -
                        nextNext.z
                    ) * t2 +

                    (
                        -previous.z +
                        3 * current.z -
                        3 * next.z +
                        nextNext.z
                    ) * t3
                );

            points.push({
                x: x,
                z: z
            });
        }
    }

    return points;
}

// ============================================================
// TRACK 10 - RACERS CIRCUIT
// Large, fast circuit
// Designed for the increased game speed and wider track
// ============================================================

function racersCircuitPoints() {

    const controlPoints = [

        // ====================================================
        // START / FINISH - VERY LONG MAIN STRAIGHT
        // ====================================================
        { x: -190, z: -110 },
        { x: -145, z: -110 },
        { x: -100, z: -110 },
        { x: -55,  z: -110 },
        { x: -10,  z: -110 },
        { x: 35,   z: -110 },
        { x: 80,   z: -110 },
        { x: 125,  z: -110 },
        { x: 165,  z: -105 },

        // ====================================================
        // LARGE RIGHT HAIRPIN
        // ====================================================
        { x: 190, z: -90 },
        { x: 200, z: -65 },
        { x: 200, z: -35 },
        { x: 192, z: -10 },
        { x: 175, z: 8 },
        { x: 150, z: 18 },

        // ====================================================
        // LONG STRAIGHT
        // ====================================================
        { x: 125, z: 18 },
        { x: 125, z: 45 },
        { x: 125, z: 72 },

        // ====================================================
        // LARGE SWEEPING CORNER
        // ====================================================
        { x: 130, z: 92 },
        { x: 142, z: 108 },
        { x: 160, z: 118 },
        { x: 182, z: 120 },

        // ====================================================
        // VERY LONG RIGHT SIDE STRAIGHT
        // ====================================================
        { x: 205, z: 120 },
        { x: 205, z: 165 },
        { x: 205, z: 210 },
        { x: 205, z: 250 },

        // ====================================================
        // LONG BOTTOM STRAIGHT
        // ====================================================
        { x: 165, z: 260 },
        { x: 120, z: 260 },
        { x: 75,  z: 260 },
        { x: 30,  z: 260 },
        { x: -15, z: 260 },
        { x: -60, z: 260 },
        { x: -105, z: 260 },
        { x: -150, z: 260 },

        // ====================================================
        // LEFT SIDE - LONG STRAIGHT
        // ====================================================
        { x: -175, z: 250 },
        { x: -175, z: 210 },
        { x: -175, z: 170 },
        { x: -175, z: 130 },

        // ====================================================
        // LEFT SWEEP
        // ====================================================
        { x: -170, z: 110 },
        { x: -160, z: 95 },
        { x: -145, z: 85 },

        // ====================================================
        // LONG DIAGONAL
        // ====================================================
        { x: -125, z: 65 },
        { x: -105, z: 45 },
        { x: -85,  z: 25 },
        { x: -65,  z: 5 },

        // ====================================================
        // S-TURN
        // ====================================================
        { x: -50, z: -15 },
        { x: -55, z: -35 },
        { x: -70, z: -50 },
        { x: -90, z: -55 },

        // ====================================================
        // VERY LONG FINAL DIAGONAL
        // ====================================================
        { x: -115, z: -70 },
        { x: -140, z: -85 },
        { x: -165, z: -98 },

        // Return toward start
        { x: -185, z: -105 }

    ];

    const points = [];

    const curve =
        new THREE.CatmullRomCurve3(
            controlPoints.map(
                p =>
                    new THREE.Vector3(
                        p.x,
                        0,
                        p.z
                    )
            ),
            true,
            "catmullrom",
            0.5
        );

    // More points for smooth high-speed driving
    const steps = 20;

    const totalPoints =
        controlPoints.length * steps;

    for (
        let i = 0;
        i < totalPoints;
        i++
    ) {

        const t =
            i / totalPoints;

        const point =
            curve.getPointAt(t);

        points.push({
            x: point.x,
            z: point.z
        });
    }

    return points;
}

// ============================================================
// TRACK 11 - GRAND PRIX CIRCUIT
// Long, fast circuit with a clean final straight
// ============================================================

function grandPrixCircuitPoints() {

    const controlPoints = [

        // ====================================================
        // START / FINISH - LONG STRAIGHT
        // ====================================================
        { x: -220, z: -180 },
        { x: -215, z: -180 },
        { x: -170, z: -180 },
        { x: -125, z: -180 },
        { x: -80,  z: -180 },
        { x: -35,  z: -180 },
        { x: 10,   z: -180 },
        { x: 55,   z: -180 },
        { x: 100,  z: -180 },
        { x: 145,  z: -180 },
        { x: 185,  z: -180 },

        // ====================================================
        // LARGE FAST RIGHT CORNER
        // ====================================================
        { x: 210, z: -170 },
        { x: 225, z: -150 },
        { x: 230, z: -125 },
        { x: 230, z: -100 },

        // ====================================================
        // LONG RIGHT STRAIGHT
        // ====================================================
        { x: 230, z: -60 },
        { x: 230, z: -20 },
        { x: 230, z: 20 },
        { x: 230, z: 60 },
        { x: 230, z: 100 },

        // ====================================================
        // LARGE BOTTOM-RIGHT CORNER
        // ====================================================
        { x: 225, z: 125 },
        { x: 210, z: 145 },
        { x: 185, z: 155 },

        // ====================================================
        // LONG BOTTOM STRAIGHT
        // ====================================================
        { x: 140, z: 155 },
        { x: 95,  z: 155 },
        { x: 50,  z: 155 },
        { x: 5,   z: 155 },
        { x: -40, z: 155 },
        { x: -85, z: 155 },
        { x: -130, z: 155 },
        { x: -175, z: 155 },

        // ====================================================
        // LARGE LEFT CORNER
        // ====================================================
        { x: -200, z: 145 },
        { x: -215, z: 125 },
        { x: -220, z: 100 },

        // ====================================================
        // LEFT SECTION
        // ====================================================
        { x: -220, z: 70 },
        { x: -220, z: 40 },
        { x: -220, z: 20 },

        // ====================================================
        // BROAD TURN INTO INNER SECTION
        // ====================================================
        { x: -215, z: 5 },
        { x: -205, z: -5 },
        { x: -190, z: -10 },
        { x: -170, z: -10 },

        // ====================================================
        // LONG INNER STRAIGHT
        // ====================================================
        { x: -135, z: -10 },
        { x: -100, z: -10 },
        { x: -65,  z: -10 },

        // ====================================================
        // WIDE RIGHT-HAND SWEEP
        // ====================================================
        { x: -40, z: -5 },
        { x: -25, z: 5 },
        { x: -15, z: 20 },
        { x: -10, z: 40 },

        // ====================================================
        // LONG INNER STRAIGHT
        // ====================================================
        { x: 20, z: 40 },
        { x: 55, z: 40 },
        { x: 90, z: 40 },
        { x: 125, z: 40 },

        // ====================================================
        // WIDE LEFT TURN
        // ====================================================
        { x: 145, z: 35 },
        { x: 158, z: 25 },
        { x: 162, z: 10 },
        { x: 158, z: -5 },

        // ====================================================
        // LONG RETURN SECTION
        // ====================================================
        { x: 145, z: -20 },
        { x: 120, z: -30 },
        { x: 90,  z: -30 },
        { x: 60,  z: -30 },

        // ====================================================
        // BROAD LEFT TURN
        // ====================================================
        { x: 35,  z: -30 },
        { x: 15,  z: -35 },
        { x: 0,   z: -45 },
        { x: -10, z: -60 },

        // ====================================================
        // LONG LEFTWARD SECTION
        // ====================================================
        { x: -40,  z: -60 },
        { x: -75,  z: -60 },
        { x: -110, z: -60 },
        { x: -145, z: -60 },
        { x: -175, z: -60 },

        // ====================================================
// FINAL TURN
// ====================================================
{ x: -195, z: -65 },
{ x: -210, z: -75 },
{ x: -220, z: -90 },

// ====================================================
// LINE UP WITH FINISH STRAIGHT
// ====================================================
{ x: -220, z: -115 },
{ x: -220, z: -140 },

// ====================================================
// LONG FINAL STRAIGHT
// COMES INTO THE FINISH FROM THE LEFT
// ====================================================
{ x: -260, z: -180 },
{ x: -240, z: -180 },
{ x: -220, z: -180 }

    ];

    const points = [];

    const curve =
        new THREE.CatmullRomCurve3(
            controlPoints.map(
                p =>
                    new THREE.Vector3(
                        p.x,
                        0,
                        p.z
                    )
            ),
            true,
            "catmullrom",
            0.5
        );

    const steps = 20;

    const totalPoints =
        controlPoints.length * steps;

    for (
        let i = 0;
        i < totalPoints;
        i++
    ) {

        const t =
            i / totalPoints;

        const point =
            curve.getPointAt(t);

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

const urlParams =
    new URLSearchParams(window.location.search);

const selectedTrack =
    urlParams.get("track");

const timeTrial =
    urlParams.get("mode") === "timeTrial";

let timeTrialStartTime = null;
let timeTrialElapsedTime = 0;
let timeTrialFinished = false;

const trackPoints =
    selectedTrack === "1"
        ? roundedRectanglePoints()
        : selectedTrack === "2"
            ? forestRunPoints()
            : selectedTrack === "3"
                ? oasisPoints()
                : selectedTrack === "4"
                    ? snowTrackPoints()
                    : selectedTrack === "5"
                        ? grandCircuitPoints()
                        : selectedTrack === "6"
                            ? sunsetSpeedwayPoints()
                            : selectedTrack === "7"
                                ? mountainPassPoints()
                                : selectedTrack === "8"
 ? castleRunPoints()
    : selectedTrack === "9"
        ? jungleRunPoints()
        : selectedTrack === "10"
            ? racersCircuitPoints()
    : selectedTrack === "11"
            ? grandPrixCircuitPoints()
            : roundedRectanglePoints();
// ============================================================
// PLAYER / CONTROL HELPERS
// ============================================================

// PLAYER / CONTROL HELPERS
const keys = {};

// ============================================================
// CONTROLLER DETECTION
// ============================================================

let connectedGamepad = null;

window.addEventListener("gamepadconnected", (event) => {

    connectedGamepad = event.gamepad;

    console.log(
        "🎮 Controller connected:",
        connectedGamepad.id
    );
});

window.addEventListener("gamepaddisconnected", (event) => {

    if (
        connectedGamepad &&
        connectedGamepad.index === event.gamepad.index
    ) {
        connectedGamepad = null;
    }

    console.log(
        "🎮 Controller disconnected"
    );
});

// ============================================================
// CONTROLLER STEERING
// ============================================================

const GAMEPAD_DEADZONE = 0.15;

function getGamepadSteering() {

    if (!connectedGamepad) {
        return 0;
    }

    const gamepad = navigator.getGamepads()[connectedGamepad.index];

    if (!gamepad) {
        return 0;
    }

    let stickX = gamepad.axes[0] || 0;

    // Ignore tiny accidental stick movement
    if (Math.abs(stickX) < GAMEPAD_DEADZONE) {
        return 0;
    }

    return stickX;
}

let mobileDriftToggle = false;

const mobileDriftButton =
    document.getElementById("driftButton");

if (mobileDriftButton) {

    mobileDriftButton.addEventListener(
        "click",
        () => {

            mobileDriftToggle =
                !mobileDriftToggle;

            mobileDriftButton.textContent =
                mobileDriftToggle
                    ? "DRIFT ON"
                    : "DRIFT";

            mobileDriftButton.style.background =
                mobileDriftToggle
                    ? "rgba(255, 255, 255, 0.35)"
                    : "rgba(0, 0, 0, 0.55)";
        }
    );
}

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

let mobileForward = false;
let mobileBackward = false;
let mobileLeft = false;
let mobileRight = false;

function forward() {

    const gamepad =
        connectedGamepad
            ? navigator.getGamepads()[connectedGamepad.index]
            : null;

    const rtPressed =
        gamepad &&
        gamepad.buttons[7] &&
        gamepad.buttons[7].value > 0.15;

    return keys["KeyW"] ||
           keys["ArrowUp"] ||
           mobileForward ||
           rtPressed;
}

function backward() {

    const gamepad =
        connectedGamepad
            ? navigator.getGamepads()[connectedGamepad.index]
            : null;

    const ltPressed =
        gamepad &&
        gamepad.buttons[6] &&
        gamepad.buttons[6].value > 0.15;

    return keys["KeyS"] ||
           keys["ArrowDown"] ||
           mobileBackward ||
           ltPressed;
}

function left() {
    return keys["KeyA"] ||
           keys["ArrowLeft"] ||
           mobileLeft;
}

function right() {
    return keys["KeyD"] ||
           keys["ArrowRight"] ||
           mobileRight;
}

function space() {
    // Get the currently connected controller
    const gamepad =
        connectedGamepad
            ? navigator.getGamepads()[connectedGamepad.index]
            : null;

    // A button / Cross button
    const aPressed =
        gamepad &&
        gamepad.buttons[0] &&
        gamepad.buttons[0].pressed === true;

    // Keyboard Space or controller A/Cross
    return (
        keys["Space"] === true ||
        aPressed === true
    );
}

function wheelie() {
    return keys["KeyF"];
}

const mobileControls = {
    accelerate:
        document.getElementById("accelerateButton"),

    brake:
        document.getElementById("brakeButton"),

    left:
        document.getElementById("leftButton"),

    right:
        document.getElementById("rightButton")
};

function setupTouchButton(button, onStart, onEnd) {

    if (!button) {
        return;
    }

    button.addEventListener(
        "touchstart",
        (event) => {
            event.preventDefault();
            onStart();
        },
        { passive: false }
    );

    button.addEventListener(
        "touchend",
        (event) => {
            event.preventDefault();
            onEnd();
        },
        { passive: false }
    );

    button.addEventListener(
        "touchcancel",
        (event) => {
            event.preventDefault();
            onEnd();
        },
        { passive: false }
    );
}

setupTouchButton(
    mobileControls.accelerate,
    () => {
        mobileForward = true;
    },
    () => {
        mobileForward = false;
    }
);

setupTouchButton(
    mobileControls.brake,
    () => {
        mobileBackward = true;
    },
    () => {
        mobileBackward = false;
    }
);

setupTouchButton(
    mobileControls.left,
    () => {
        mobileLeft = true;
    },
    () => {
        mobileLeft = false;
    }
);

setupTouchButton(
    mobileControls.right,
    () => {
        mobileRight = true;
    },
    () => {
        mobileRight = false;
    }
);

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

const customizationToggle =
    document.getElementById("customizationToggle");

let selectedKart =
    localStorage.getItem("selectedKart") ||
    "speedster";

// ============================================================
// CHARACTER SELECTION / STATS
// ============================================================

let selectedCharacter =
    localStorage.getItem("selectedCharacter") ||
    "blaze";

const characterStats = {

    blaze: {
        name: "Blaze",
        speed: 3,
        acceleration: 0,
        handling: -0.1,
        miniTurbo: 8
    },

    bolt: {
        name: "Bolt",
        speed: 0,
        acceleration: 4,
        handling: +0.1,
        miniTurbo: 15
    },

    rex: {
        name: "Rex",
        speed: 5,
        acceleration: -2,
        handling: -0.2,
        miniTurbo: 5
    },

    nova: {
        name: "Nova",
        speed: +2,
        acceleration: +2,
        handling: +0.1,
        miniTurbo: 11
    },

    misty: {
        name: "Misty",
        speed: -1,
        acceleration: 2,
        handling: +0.6,
        miniTurbo: 14
    },

    axel: {
        name: "Axel",
        speed: 3,
        acceleration: 2,
        handling: +0.3,
        miniTurbo: 12
    },

    vex: {
        name: "Vex",
        speed: 1,
        acceleration: 3,
        handling: +0.3,
        miniTurbo: 15
    },

    titan: {
        name: "Titan",
        speed: 6,
        acceleration: -4,
        handling: -0.4,
        miniTurbo: 2
    }
};

const characterButtons =
    document.querySelectorAll("#characterOptions button");

characterButtons.forEach((button) => {

    button.addEventListener("click", () => {

        selectedCharacter =
            button.dataset.character;

        localStorage.setItem(
            "selectedCharacter",
            selectedCharacter
        );

        characterButtons.forEach(
            (characterButton) => {

                characterButton.classList.remove(
                    "selected"
                );

            }
        );

        button.classList.add("selected");

        // Update vehicle stats
        if (typeof player !== "undefined") {
            applyKartStats();
        }

        // Change the 3D character
        if (
            typeof kart !== "undefined" &&
            typeof loadCharacterModel === "function"
        ) {

            loadCharacterModel(
                selectedCharacter
            );

        }

    });

});
        console.log(
            "Selected character:",
            selectedCharacter
        );

const savedCharacterButton =
    document.querySelector(
        `#characterOptions button[data-character="${selectedCharacter}"]`
    );

if (savedCharacterButton) {
    savedCharacterButton.classList.add("selected");
}

const kartStats = {

    speedster: {
        maxSpeed: 56,
        acceleration: 23,
        braking: 31,
        turnSpeed: 3.2,
        driftChargeRate: 1.15,
        miniTurbo: 7
    },

    balanced: {
        maxSpeed: 53,
        acceleration: 25,
        braking: 32,
        turnSpeed: 3.5,
        driftChargeRate: 1.45,
        miniTurbo: 10
    },

    rocket: {
        maxSpeed: 55,
        acceleration: 36,
        braking: 27,
        turnSpeed: 2.7,
        driftChargeRate: 1.45,
        miniTurbo: 12
    },

    heavy: {
        maxSpeed: 63,
        acceleration: 21,
        braking: 39,
        turnSpeed: 2.6,
        driftChargeRate: 1.10,
        miniTurbo: 4
    },

    drifter: {
        maxSpeed: 52,
        acceleration: 27,
        braking: 31,
        turnSpeed: 3.6,
        driftChargeRate: 1.75,
        miniTurbo: 18
    },
        
    blaze: {
        maxSpeed: 59,
        acceleration: 29,
        braking: 22,
        turnSpeed: 3.0,
        driftChargeRate: 1.25,
        miniTurbo: 8
    },

    accelerator: {
        maxSpeed: 54,
        acceleration: 39,
        braking: 25,
        turnSpeed: 3.2,
        driftChargeRate: 1.3,
        miniTurbo: 13
    },

    comet: {
        maxSpeed: 62,
        acceleration: 20,
        braking: 22,
        turnSpeed: 2.8,
        driftChargeRate: 1.0,
        miniTurbo: 6
    },

    turbo: {
        maxSpeed: 54,
        acceleration: 34,
        braking: 27,
        turnSpeed: 3.1,
        driftChargeRate: 1.55,
        miniTurbo: 13
    },

    overdrive: {
        maxSpeed: 57,
        acceleration: 36,
        braking: 20,
        turnSpeed: 2.9,
        driftChargeRate: 1.45,
        miniTurbo: 10
    }

};

// ============================================================
// BIKES
// ============================================================

let selectedBike =
    localStorage.getItem("selectedBike") || "none";

const bikeStats = {

    apexRider: {
        name: "Apex Rider",

        maxSpeed: 58,
        acceleration: 29,
        braking: 27,
        turnSpeed: 3.0,
        driftChargeRate: 1.3,
        miniTurbo: 9
    },

    bobsBike: {
        name: "Bob's Bike",

        maxSpeed: 55,
        acceleration: 32,
        braking: 29,
        turnSpeed: 2.8,
        driftChargeRate: 1.5,
        miniTurbo: 11
    },

    rocket: {
    name: "Rocket Bike",
    maxSpeed: 68,
    acceleration: 18,
    braking: 19,
    turnSpeed: 2.0,
    driftChargeRate: 0.95,
    miniTurbo: 5
},

    champion: {
    name: "Champion Bike",
    maxSpeed: 65,
    acceleration: 25,
    braking: 24,
    turnSpeed: 2.5,
    driftChargeRate: 1.35,
    miniTurbo: 8
},

    flash: {
    name: "Flash Bike",
    maxSpeed: 54,
    acceleration: 40,
    braking: 25,
    turnSpeed: 3.2,
    driftChargeRate: 1.65,
        miniTurbo: 15
},

    specter: {
    name: "Specter Bike",
    maxSpeed: 53,
    acceleration: 31,
    braking: 23,
    turnSpeed: 3.8,
    driftChargeRate: 2.15,
        miniTurbo: 17
},

    juggernaut: {
    name: "Juggernaut Bike",
    maxSpeed: 62,
    acceleration: 28,
    braking: 43,
    turnSpeed: 2.1,
    driftChargeRate: 1.4,
        miniTurbo: 7
},
    streak: {
    name: "Streak Bike",
    maxSpeed: 58,
    acceleration: 36,
    braking: 28,
    turnSpeed: 3.6,
    driftChargeRate: 1.55,
        miniTurbo: 11
},

    vortex: {
    name: "Vortex",
    maxSpeed: 56,
    acceleration: 38,
    braking: 26,
    turnSpeed: 2.5,
    driftChargeRate: 1.65,
        miniTurbo: 15
}

};

const kartButtons =
    document.querySelectorAll(
        "#kartOptions button"
    );

kartButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            // Select the kart
            selectedKart =
                button.dataset.kart;

            localStorage.setItem(
                "selectedKart",
                selectedKart
            );

            // IMPORTANT:
            // Selecting a kart disables the bike.
            selectedBike = "none";

            localStorage.setItem(
                "selectedBike",
                "none"
            );

            // Remove selected state from all karts
            kartButtons.forEach(
                (kartButton) => {

                    kartButton.classList.remove(
                        "selected"
                    );

                }
            );

            // Remove selected state from all bikes
            bikeButtons.forEach(
                (bikeButton) => {

                    bikeButton.classList.remove(
                        "selected"
                    );

                }
            );

            // Highlight the selected kart
            button.classList.add(
                "selected"
            );

            // Update stats
            applyKartStats();
        }
    );
});

const defaultKartButton =
    document.querySelector(
        '#kartOptions button[data-kart="speedster"]'
    );

if (defaultKartButton) {
    defaultKartButton.classList.add("selected");
}

// ============================================================
// BIKE SELECTION
// ============================================================

const bikeButtons =
    document.querySelectorAll(
        "#bikeOptions button"
    );

bikeButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            // ====================================================
            // CHAMPION BIKE LOCK
            // ====================================================

            if (
                button.dataset.bike === "champion" &&
                !isChampionBikeUnlocked()
            ) {

                alert(
                    "🏆 Champion Bike is LOCKED!\n\n" +
                    "Finish in the Top 5 on a Time Trial leaderboard to unlock it."
                );

                return;
            }

            selectedBike =
                button.dataset.bike;

            localStorage.setItem(
                "selectedBike",
                selectedBike
            );

            // Selecting a bike disables the kart choice
            kartButtons.forEach(
                (kartButton) => {

                    kartButton.classList.remove(
                        "selected"
                    );

                }
            );

            bikeButtons.forEach(
                (bikeButton) => {

                    bikeButton.classList.remove(
                        "selected"
                    );

                }
            );

            button.classList.add(
                "selected"
            );

            applyKartStats();
        }

    );
});


let selectedWheels =
    localStorage.getItem("selectedWheels") ||
    "street";

const wheelStats = {

    street: {
        maxSpeed: +1,
        acceleration: +1,
        turnSpeed: +0.1,
        driftChargeRate: 1.40,
    miniTurbo: 10
    },

    grip: {
        maxSpeed: -2,
        acceleration: +1,
        turnSpeed: 0.7,
        driftChargeRate: 1.3,
        miniTurbo: 8
    },

    speed: {
        maxSpeed: 7,
        acceleration: -1,
        turnSpeed: -0.3,
        driftChargeRate: 0.95,
        miniTurbo: 4
    },

    offroad: {
        maxSpeed: -1,
        acceleration: 3,
        turnSpeed: 0.3,
        driftChargeRate: 1.45,
        miniTurbo: 12
    },

    drift: {
        maxSpeed: -1,
        acceleration: +1,
        turnSpeed: 0.3,
        driftChargeRate: 1.75,
        miniTurbo: 18
    },

    shadow: {
        maxSpeed: +3,
        acceleration: +2,
        turnSpeed: 0.8,
        driftChargeRate: 1.4,
        miniTurbo: 11
    },

    cyclone: {
        maxSpeed: 1,
        acceleration: 3,
        turnSpeed: 1.0,
        driftChargeRate: 1.55,
        miniTurbo: 15
    }
};

const wheelButtons =
    document.querySelectorAll(
        "#wheelOptions button"
    );

wheelButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            selectedWheels =
                button.dataset.wheels;

            localStorage.setItem(
    "selectedWheels",
    selectedWheels
);
            
            applyKartStats();

            wheelButtons.forEach(
                (wheelButton) => {
                    wheelButton.classList.remove(
                        "selected"
                    );
                }
            );

            button.classList.add("selected");
        }
    );
});

const defaultWheelButton =
    document.querySelector(
        '#wheelOptions button[data-wheels="street"]'
    );

if (defaultWheelButton) {
    defaultWheelButton.classList.add("selected");
}

const customizationOptions =
    document.getElementById("customizationOptions");

if (
    customizationToggle &&
    customizationOptions
) {

    customizationToggle.addEventListener(
        "click",
        () => {

            const isOpen =
                customizationOptions.style.display ===
"grid";

            customizationOptions.style.display =
    isOpen
        ? "none"
        : "grid";

            customizationToggle.textContent =
                isOpen
                    ? "🏎️ KART & WHEELS ▼"
                    : "🏎️ KART & WHEELS ▲";
        }
    );
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
// STABLE PLAYER TRACK POINT
// Prevents the player from jumping between nearby
// sections of the Oasis spiral.
// ============================================================

function stablePlayerTrackPoint(x, z) {

    const searchRange = 8;

    let bestIndex =
        player.trackIndex;

    let bestDistance =
        Infinity;

    for (
        let offset = -searchRange;
        offset <= searchRange;
        offset++
    ) {

        const index =
            (
                player.trackIndex +
                offset +
                trackPoints.length
            ) %
            trackPoints.length;

        const point =
            trackPoints[index];

        const distance =
            Math.hypot(
                x - point.x,
                z - point.z
            );

        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;

            bestIndex =
                index;
        }
    }

    player.trackIndex =
        bestIndex;

    return {
        index: bestIndex,
        distance: bestDistance
    };
}

// ============================================================
// TRACK COLLISION
// ============================================================

function isOnTrack(x, z) {

    let closestDistance = Infinity;
    let closestIndex = 0;

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

    // Normal horizontal track check
    if (
        closestDistance >
        TRACK_WIDTH / 2
    ) {

        return false;
    }

    // --------------------------------------------------------
    // OASIS HEIGHT CHECK
    // Prevents lower track from counting as drivable
    // when the kart is on the elevated section.
    // --------------------------------------------------------

    if (
        selectedTrack === "3"
    ) {

        const kartHeight =
            getTrackHeight(
                player.trackIndex
            );

        const nearbyTrackHeight =
            getTrackHeight(
                closestIndex
            );

        const heightDifference =
            Math.abs(
                kartHeight -
                nearbyTrackHeight
            );

        if (
            heightDifference >
            2.5
        ) {

            return false;
        }
    }

    return true;
}

function getTrackHeight(index) {

    // ========================================================
    // MOUNTAIN PASS ELEVATION
    // ========================================================

    if (selectedTrack === "7") {

        const total = trackPoints.length;

        // ----------------------------------------
        // START — FLAT
        // ----------------------------------------

        if (index < total * 0.12) {
            return 0;
        }

        // ----------------------------------------
        // FIRST CLIMB
        // ----------------------------------------

        if (
            index >= total * 0.12 &&
            index < total * 0.30
        ) {

            const t =
                (index - total * 0.12) /
                (total * 0.18);

            return t * 12;
        }

        // ----------------------------------------
        // HIGH MOUNTAIN SECTION
        // ----------------------------------------

        if (
            index >= total * 0.30 &&
            index < total * 0.55
        ) {

            return 12;
        }

        // ----------------------------------------
        // DESCENDING HAIRPIN
        // ----------------------------------------

        if (
            index >= total * 0.55 &&
            index < total * 0.72
        ) {

            const t =
                (index - total * 0.55) /
                (total * 0.17);

            return 12 - (t * 8);
        }

        // ----------------------------------------
        // FINAL DESCENT
        // ----------------------------------------

        if (
            index >= total * 0.72 &&
            index < total * 0.90
        ) {

            const t =
                (index - total * 0.72) /
                (total * 0.18);

            return 4 - (t * 4);
        }

        // ----------------------------------------
        // RETURN TO START
        // ----------------------------------------

        return 0;
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

    // --------------------------------------------------------
    // BUILD ROAD EDGES
    // --------------------------------------------------------

    for (let i = 0; i < trackPoints.length; i++) {

        const current =
            trackPoints[i];

        const next =
            trackPoints[
                (i + 1) % trackPoints.length
            ];

        const dx =
            next.x - current.x;

        const dz =
            next.z - current.z;

        const length =
            Math.hypot(
                dx,
                dz
            );

        // Skip zero-length segments
        if (length < 0.0001) {
            continue;
        }

        // Perpendicular direction
        const nx =
            -dz / length;

        const nz =
            dx / length;

        // Outer edge
        outer.push({
            x:
                current.x +
                nx *
                TRACK_WIDTH / 2,

            z:
                current.z +
                nz *
                TRACK_WIDTH / 2
        });

        // Inner edge
        inner.push({
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


    // --------------------------------------------------------
    // CREATE ROAD VERTICES
    // --------------------------------------------------------

    for (
        let i = 0;
        i < outer.length;
        i++
    ) {

        const outerPoint =
            outer[i];

        const innerPoint =
            inner[i];

        const height =
            getTrackHeight(i);

        positions.push(

            // Outer vertex
            outerPoint.x,
            height + 0.05,
            outerPoint.z,

            // Inner vertex
            innerPoint.x,
            height + 0.05,
            innerPoint.z

        );
    }


    // --------------------------------------------------------
    // CREATE ROAD TRIANGLES
    // --------------------------------------------------------

    for (
        let i = 0;
        i < outer.length;
        i++
    ) {

        const next =
            (i + 1) %
            outer.length;

        const outerCurrent =
            i * 2;

        const innerCurrent =
            i * 2 + 1;

        const outerNext =
            next * 2;

        const innerNext =
            next * 2 + 1;

        // First triangle
        indices.push(
            outerCurrent,
            outerNext,
            innerCurrent
        );

        // Second triangle
        indices.push(
            innerCurrent,
            outerNext,
            innerNext
        );
    }


    // --------------------------------------------------------
    // CREATE GEOMETRY
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // ROAD MATERIAL
    // --------------------------------------------------------

    const material =
        new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.85,
            metalness: 0.0
        });


    // --------------------------------------------------------
    // CREATE ROAD MESH
    // --------------------------------------------------------

    const road =
        new THREE.Mesh(
            geometry,
            material
        );

    road.receiveShadow = true;

    road.castShadow = false;

    scene.add(road);


    // --------------------------------------------------------
    // ROAD BORDERS
    // --------------------------------------------------------

    const borderHeight = 0.12;

    const borderWidth = 0.35;


    // --------------------------------------------------------
    // CREATE CURBS
    // --------------------------------------------------------

    for (
        let i = 0;
        i < outer.length;
        i++
    ) {

        const next =
            (i + 1) %
            outer.length;

        const p1 =
            outer[i];

        const p2 =
            outer[next];

        const dx =
            p2.x - p1.x;

        const dz =
            p2.z - p1.z;

        const length =
            Math.hypot(
                dx,
                dz
            );

        if (
            length <
            0.0001
        ) {
            continue;
        }

        const angle =
            Math.atan2(
                dz,
                dx
            );

        // Only place curbs every few segments
        if (i % 2 !== 0) {
            continue;
        }

        // ----------------------------------------------------
        // OUTER CURB
        // ----------------------------------------------------

        const outerX =
            (p1.x + p2.x) / 2;

        const outerZ =
            (p1.z + p2.z) / 2;

        const outerCurb =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    length,
                    borderHeight,
                    borderWidth
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xff2222
                })
            );

        outerCurb.position.set(
            outerX,
            0.16,
            outerZ
        );

        outerCurb.rotation.y =
            -angle;

        outerCurb.castShadow = true;

        outerCurb.receiveShadow = true;

        scene.add(
            outerCurb
        );
    }


    // --------------------------------------------------------
    // INNER WHITE BORDER
    // --------------------------------------------------------

    for (
        let i = 0;
        i < inner.length;
        i++
    ) {

        const next =
            (i + 1) %
            inner.length;

        const p1 =
            inner[i];

        const p2 =
            inner[next];

        const dx =
            p2.x - p1.x;

        const dz =
            p2.z - p1.z;

        const length =
            Math.hypot(
                dx,
                dz
            );

        if (
            length <
            0.0001
        ) {
            continue;
        }

        const angle =
            Math.atan2(
                dz,
                dx
            );

        // White border every third segment
        if (i % 3 !== 0) {
            continue;
        }

        const innerX =
            (p1.x + p2.x) / 2;

        const innerZ =
            (p1.z + p2.z) / 2;

        const innerBorder =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    length,
                    borderHeight,
                    borderWidth
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff
                })
            );

        innerBorder.position.set(
            innerX,
            0.16,
            innerZ
        );

        innerBorder.rotation.y =
            -angle;

        innerBorder.castShadow = true;

        innerBorder.receiveShadow = true;

        scene.add(
            innerBorder
        );
    }


    // --------------------------------------------------------
    // FINISH LINE
    // --------------------------------------------------------

    const start =
        trackPoints[0];

    const next =
        trackPoints[1];

    const dx =
        next.x - start.x;

    const dz =
        next.z - start.z;

    const startAngle =
        Math.atan2(
            dz,
            dx
        );


    const finishGroup =
        new THREE.Group();


    const finishWidth =
        TRACK_WIDTH;

    const finishLength =
        3;


    // --------------------------------------------------------
    // CHECKERED FINISH LINE
    // --------------------------------------------------------

    const checkerCount =
        8;

    const checkerWidth =
        finishWidth /
        checkerCount;


    for (
        let i = 0;
        i < checkerCount;
        i++
    ) {

        const tile =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    finishLength,
                    0.04,
                    checkerWidth
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        i % 2 === 0
                            ? 0xffffff
                            : 0x111111
                })
            );

        tile.position.set(
            (i - checkerCount / 2 + 0.5) *
                checkerWidth,

            0.09,

            0
        );

        finishGroup.add(
            tile
        );
    }


    // Finish line orientation
    finishGroup.rotation.y =
        -startAngle;


    finishGroup.position.set(
        start.x,
        0.10,
        start.z
    );


    scene.add(
        finishGroup
    );

// ============================================================
// TRACK 8 - CASTLE ENTRANCE
// ============================================================

if (selectedTrack === "8") {

    const castleWallMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x6b6b6b,
            roughness: 0.9
        });


    // ========================================================
    // LEFT CASTLE TOWER
    // ========================================================

    const towerGeometry =
        new THREE.BoxGeometry(
            8,
            14,
            6
        );

    const leftTower =
        new THREE.Mesh(
            towerGeometry,
            castleWallMaterial
        );

    leftTower.position.set(
        10,
        7,
        -116
    );

    leftTower.castShadow = true;
    leftTower.receiveShadow = true;

    scene.add(leftTower);


    // ========================================================
    // RIGHT CASTLE TOWER
    // ========================================================

    const rightTower =
        new THREE.Mesh(
            towerGeometry,
            castleWallMaterial
        );

    rightTower.position.set(
        10,
        7,
        -94
    );

    rightTower.castShadow = true;
    rightTower.receiveShadow = true;

    scene.add(rightTower);


    // ========================================================
    // WALL ABOVE THE ROAD
    // ========================================================

    const entranceTopGeometry =
        new THREE.BoxGeometry(
            8,
            8,
            34
        );

    const entranceTop =
        new THREE.Mesh(
            entranceTopGeometry,
            castleWallMaterial
        );

    entranceTop.position.set(
        10,
        10,
        -105
    );

    entranceTop.castShadow = true;
    entranceTop.receiveShadow = true;

    scene.add(entranceTop);


    // ========================================================
    // DARK CASTLE OPENING
    // ========================================================

    const doorwayGeometry =
        new THREE.BoxGeometry(
            0.5,
            10,
            14
        );

    const doorwayMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x151515,
            roughness: 1
        });

    const doorway =
        new THREE.Mesh(
            doorwayGeometry,
            doorwayMaterial
        );

    doorway.position.set(
        5.8,
        5,
        -105
    );

    scene.add(doorway);


    // ========================================================
    // WOODEN DOORS
    // ========================================================

    const doorMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x4a2b18,
            roughness: 0.8
        });

    const doorGeometry =
        new THREE.BoxGeometry(
            0.8,
            9,
            7
        );


    // Left door
    const leftDoor =
        new THREE.Mesh(
            doorGeometry,
            doorMaterial
        );

    leftDoor.position.set(
        5,
        4.5,
        -109
    );

    leftDoor.rotation.y =
        THREE.MathUtils.degToRad(-35);

    leftDoor.castShadow = true;

    scene.add(leftDoor);


    // Right door
    const rightDoor =
        new THREE.Mesh(
            doorGeometry,
            doorMaterial
        );

    rightDoor.position.set(
        5,
        4.5,
        -101
    );

    rightDoor.rotation.y =
        THREE.MathUtils.degToRad(35);

    rightDoor.castShadow = true;

    scene.add(rightDoor);


    // ========================================================
    // CASTLE FLAGS
    // ========================================================

    const flagMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xb00000,
            side: THREE.DoubleSide
        });

    const flagGeometry =
        new THREE.PlaneGeometry(
            4,
            3
        );


    const leftFlag =
        new THREE.Mesh(
            flagGeometry,
            flagMaterial
        );

    leftFlag.position.set(
        10,
        14,
        -116
    );

    leftFlag.rotation.y =
        Math.PI / 2;

    scene.add(leftFlag);


    const rightFlag =
        new THREE.Mesh(
            flagGeometry,
            flagMaterial
        );

    rightFlag.position.set(
        10,
        14,
        -94
    );

    rightFlag.rotation.y =
        Math.PI / 2;

    scene.add(rightFlag);

}
    
}

// ============================================================
// TRACK 8 - CASTLE INTERIOR WALLS
// ============================================================

function createCastleInteriorWalls() {

    if (selectedTrack !== "8") {
        return;
    }

    const stoneMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.95
        });

    // ========================================================
    // LEFT SIDE WALL
    // ========================================================

    const leftWall =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5,
                12,
                48
            ),
            stoneMaterial
        );

    leftWall.position.set(
        55,
        6,
        4
    );

    leftWall.castShadow = true;
    leftWall.receiveShadow = true;

    scene.add(leftWall);


    // ========================================================
    // RIGHT SIDE WALL
    // ========================================================

    const rightWall =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5,
                12,
                48
            ),
            stoneMaterial
        );

    rightWall.position.set(
        95,
        6,
        4
    );

    rightWall.castShadow = true;
    rightWall.receiveShadow = true;

    scene.add(rightWall);


    // ========================================================
    // EXIT WALL
    //
    // Instead of one huge wall across the road,
    // create two smaller sections with a wide opening.
    // ========================================================

    const exitWallLeft =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                18,
                12,
                5
            ),
            stoneMaterial
        );

    exitWallLeft.position.set(
        18,
        6,
        48
    );

    exitWallLeft.rotation.y =
        -Math.PI / 6;

    exitWallLeft.castShadow = true;
    exitWallLeft.receiveShadow = true;

    scene.add(exitWallLeft);


    // ========================================================
    // EXIT WALL RIGHT
    // ========================================================

    const exitWallRight =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                18,
                12,
                5
            ),
            stoneMaterial
        );

    exitWallRight.position.set(
        70,
        6,
        25
    );

    exitWallRight.rotation.y =
        -Math.PI / 6;

    exitWallRight.castShadow = true;
    exitWallRight.receiveShadow = true;

    scene.add(exitWallRight);


    // ========================================================
    // OPENING ARCH
    //
    // No solid object underneath this.
    // The kart can drive straight through.
    // ========================================================

    const exitArch =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                30,
                4,
                5
            ),
            stoneMaterial
        );

    exitArch.position.set(
        44,
        10,
        37
    );

    exitArch.rotation.y =
        -Math.PI / 6;

    exitArch.castShadow = true;
    exitArch.receiveShadow = true;

    scene.add(exitArch);
}

// Create Track 8 castle interior
createCastleInteriorWalls();

// ============================================================
// TRACK 8 - CASTLE INTERIOR PILLARS
// ============================================================

function createCastleInteriorPillars() {

    if (selectedTrack !== "8") {
        return;
    }

    const pillarMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x777777,
            roughness: 0.9
        });

    const pillarGeometry =
        new THREE.BoxGeometry(
            3,
            10,
            3
        );


    // --------------------------------------------------------
    // PILLARS ALONG THE CASTLE INTERIOR
    // --------------------------------------------------------

    const pillarPositions = [

        // Left side
        { x: 65, z: -15 },
        { x: 65, z: 0 },
        { x: 65, z: 15 },

        // Right side
        { x: 85, z: -15 },
        { x: 85, z: 0 },
        { x: 85, z: 15 }

    ];


    for (const position of pillarPositions) {

        const pillar =
            new THREE.Mesh(
                pillarGeometry,
                pillarMaterial
            );

        pillar.position.set(
            position.x,
            5,
            position.z
        );

        pillar.castShadow = true;
        pillar.receiveShadow = true;

        scene.add(pillar);
    }
}


// Create Track 8 castle pillars
createCastleInteriorPillars();

// ============================================================
// TRACK 8 - CASTLE TORCHES
// ============================================================

function createCastleTorches() {

    if (selectedTrack !== "8") {
        return;
    }

    // --------------------------------------------------------
    // TORCH MATERIALS
    // --------------------------------------------------------

    const woodMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x4a2b18,
            roughness: 0.9
        });

    const flameMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xff7a00,
            emissive: 0xff3300,
            emissiveIntensity: 2
        });


    // --------------------------------------------------------
    // TORCH GEOMETRY
    // --------------------------------------------------------

    const torchHandleGeometry =
        new THREE.CylinderGeometry(
            0.35,
            0.45,
            2.5,
            8
        );

    const flameGeometry =
        new THREE.SphereGeometry(
            0.8,
            12,
            12
        );


    // --------------------------------------------------------
    // TORCH POSITIONS
    // --------------------------------------------------------

    const torchPositions = [

        // Left wall
        { x: 63, z: -10 },
        { x: 63, z: 5 },
        { x: 63, z: 20 },

        // Right wall
        { x: 87, z: -10 },
        { x: 87, z: 5 },
        { x: 87, z: 20 }

    ];


    // --------------------------------------------------------
    // CREATE TORCHES
    // --------------------------------------------------------

    for (const position of torchPositions) {

        // Wooden handle
        const handle =
            new THREE.Mesh(
                torchHandleGeometry,
                woodMaterial
            );

        handle.position.set(
            position.x,
            5,
            position.z
        );

        handle.rotation.z =
            Math.PI / 2;

        handle.castShadow = true;

        scene.add(handle);


        // Flame
        const flame =
            new THREE.Mesh(
                flameGeometry,
                flameMaterial
            );

        flame.position.set(
            position.x,
            6.4,
            position.z
        );

        flame.scale.set(
            0.7,
            1.2,
            0.7
        );

        scene.add(flame);


        // Warm light
        const torchLight =
            new THREE.PointLight(
                0xff6600,
                2.5,
                18
            );

        torchLight.position.set(
            position.x,
            6.5,
            position.z
        );

        scene.add(torchLight);
    }
}


// Create Track 8 castle torches
createCastleTorches();

// ============================================================
// TRACK 8 - CASTLE EXIT GATE
// ============================================================

function createCastleExitGate() {

    if (selectedTrack !== "8") {
        return;
    }

    const stoneMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.95
        });

    // --------------------------------------------------------
    // GATE GROUP
    // --------------------------------------------------------

    const gateGroup =
        new THREE.Group();

    // Match the diagonal direction of the road
    gateGroup.rotation.y =
        Math.PI / 4;

    gateGroup.position.set(
        43,
        0,
        -38
    );

    // --------------------------------------------------------
    // LEFT GATE TOWER
    // --------------------------------------------------------

    const leftTower =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                8,
                14,
                10
            ),
            stoneMaterial
        );

    leftTower.position.set(
        -13,
        7,
        0
    );

    leftTower.castShadow = true;
    leftTower.receiveShadow = true;

    gateGroup.add(leftTower);

    // --------------------------------------------------------
    // RIGHT GATE TOWER
    // --------------------------------------------------------

    const rightTower =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                8,
                14,
                10
            ),
            stoneMaterial
        );

    rightTower.position.set(
        13,
        7,
        0
    );

    rightTower.castShadow = true;
    rightTower.receiveShadow = true;

    gateGroup.add(rightTower);

    // --------------------------------------------------------
    // TOP ARCH
    // --------------------------------------------------------

    const gateTop =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                34,
                5,
                10
            ),
            stoneMaterial
        );

    gateTop.position.set(
        0,
        14.5,
        0
    );

    gateTop.castShadow = true;
    gateTop.receiveShadow = true;

    gateGroup.add(gateTop);

    // --------------------------------------------------------
    // TORCH MATERIAL
    // --------------------------------------------------------

    const flameMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xff7a00,
            emissive: 0xff3300,
            emissiveIntensity: 2
        });

    const flameGeometry =
        new THREE.SphereGeometry(
            0.8,
            12,
            12
        );

    // --------------------------------------------------------
    // LEFT TORCH
    // --------------------------------------------------------

    const flame1 =
        new THREE.Mesh(
            flameGeometry,
            flameMaterial
        );

    flame1.position.set(
        -10,
        9,
        -5.5
    );

    flame1.scale.set(
        0.7,
        1.2,
        0.7
    );

    gateGroup.add(flame1);

    const light1 =
        new THREE.PointLight(
            0xff6600,
            2.5,
            18
        );

    light1.position.set(
        -10,
        9,
        -5.5
    );

    gateGroup.add(light1);

    // --------------------------------------------------------
    // RIGHT TORCH
    // --------------------------------------------------------

    const flame2 =
        new THREE.Mesh(
            flameGeometry,
            flameMaterial
        );

    flame2.position.set(
        10,
        9,
        -5.5
    );

    flame2.scale.set(
        0.7,
        1.2,
        0.7
    );

    gateGroup.add(flame2);

    const light2 =
        new THREE.PointLight(
            0xff6600,
            2.5,
            18
        );

    light2.position.set(
        10,
        9,
        -5.5
    );

    gateGroup.add(light2);

    // --------------------------------------------------------
    // ADD GATE
    // --------------------------------------------------------

    scene.add(
        gateGroup
    );
}

// Create Track 8 castle exit gate
createCastleExitGate();

createTrack();

// ============================================================
// TRACK 9 — JUNGLE TREES
// ============================================================

function createJungleTree(x, z, scale = 1) {

    const tree = new THREE.Group();

    // --------------------------------------------------------
    // TRUNK
    // --------------------------------------------------------

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.45,
            0.7,
            5,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x5b351c,
            roughness: 1
        })
    );

    trunk.position.y = 2.5;

    trunk.castShadow = true;
    trunk.receiveShadow = true;

    tree.add(trunk);

    // --------------------------------------------------------
    // MAIN LEAVES
    // --------------------------------------------------------

    const leafMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x176b2c,
            roughness: 0.9
        });

    const leafPositions = [
        [0, 5.0, 0],
        [-1.2, 4.6, 0.2],
        [1.2, 4.7, -0.2],
        [0, 5.7, 0.4]
    ];

    for (
        const position of leafPositions
    ) {

        const leaves =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    1.6,
                    8,
                    6
                ),
                leafMaterial
            );

        leaves.position.set(
            position[0],
            position[1],
            position[2]
        );

        leaves.scale.set(
            1.3,
            0.8,
            1.2
        );

        leaves.castShadow = true;

        tree.add(leaves);
    }

    // --------------------------------------------------------
    // VINES
    // --------------------------------------------------------

    const vineMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x2f8f3b,
            roughness: 0.9
        });

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const vine =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.06,
                    0.06,
                    2.5,
                    6
                ),
                vineMaterial
            );

        vine.position.set(
            (i - 1) * 0.5,
            4.2,
            0.6
        );

        vine.rotation.z =
            (i - 1) * 0.18;

        tree.add(vine);
    }

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


// ============================================================
// PLACE JUNGLE TREES
// ============================================================

function createJungleTrees() {

    if (
        selectedTrack !== "9"
    ) {
        return;
    }

    const trees = [

        // Left side
        [-72, 45, 1.3],
        [-68, 25, 1.0],
        [-70, 0, 1.5],
        [-68, -28, 1.1],
        [-55, -45, 1.4],
        [-30, -48, 1.0],

        // Right side
        [72, 45, 1.2],
        [70, 25, 1.4],
        [72, 0, 1.0],
        [68, -28, 1.5],
        [52, -45, 1.2],
        [28, -50, 1.4],

        // Back jungle
        [-45, 65, 1.2],
        [-20, 70, 1.4],
        [5, 70, 1.1],
        [30, 68, 1.5],
        [55, 60, 1.2]

    ];

    for (
        const tree of trees
    ) {

        createJungleTree(
            tree[0],
            tree[1],
            tree[2]
        );
    }
}

createJungleTrees();

// ============================================================
// TRACK 9 — CENTER JUNGLE WATERFALL + POND
// ============================================================

function createJungleWaterfall() {

    if (selectedTrack !== "9") {
        return;
    }

    const waterfall = new THREE.Group();

    // ========================================================
    // MATERIALS
    // ========================================================

    const rockMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x4a4a42,
            roughness: 1
        });

    const waterMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x42b9e8,
            transparent: true,
            opacity: 0.78,
            roughness: 0.15,
            metalness: 0.05
        });

    // ========================================================
    // WATERFALL ROCK WALL
    // ========================================================

    const rockWall = new THREE.Mesh(
        new THREE.BoxGeometry(
            12,
            11,
            4
        ),
        rockMaterial
    );

    rockWall.position.set(
    0,
    5.5,
    0
);

    rockWall.castShadow = true;
    rockWall.receiveShadow = true;

    waterfall.add(rockWall);

    // ========================================================
    // WATERFALL
    // ========================================================

    const waterfallWater = new THREE.Mesh(
        new THREE.PlaneGeometry(
            6,
            10
        ),
        waterMaterial
    );

    waterfallWater.position.set(
    0,
    5,
    2.1
);

    waterfall.add(waterfallWater);

    // ========================================================
    // CENTER POND
    // ========================================================

    const pond = new THREE.Mesh(
        new THREE.CylinderGeometry(
            8,
            8,
            0.3,
            40
        ),
        waterMaterial
    );

    pond.position.set(
    0,
    0.15,
    8
);

    pond.receiveShadow = true;

    waterfall.add(pond);

    // ========================================================
    // POND INNER WATER
    // ========================================================

    const pondInner = new THREE.Mesh(
        new THREE.CircleGeometry(
            6.5,
            40
        ),
        new THREE.MeshStandardMaterial({
            color: 0x238fc0,
            transparent: true,
            opacity: 0.65,
            roughness: 0.1
        })
    );

    pondInner.rotation.x = -Math.PI / 2;

    pondInner.position.set(
        0,
        0.32,
        -4
    );

    waterfall.add(pondInner);

    // ========================================================
    // ROCKS AROUND POND
    // ========================================================

    const pondRocks = [
        [-8, -4, 1.4],
        [8, -4, 1.3],
        [-6, 3, 1.0],
        [6, 3, 1.2],
        [-4, -11, 1.1],
        [4, -11, 1.0],
        [-9, -9, 0.9],
        [9, -9, 1.0]
    ];

    for (const rockData of pondRocks) {

        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(
                rockData[2]
            ),
            rockMaterial
        );

        rock.position.set(
            rockData[0],
            0.7,
            rockData[1]
        );

        rock.rotation.set(
            Math.random(),
            Math.random(),
            Math.random()
        );

        rock.castShadow = true;

        waterfall.add(rock);
    }

    // ========================================================
    // SMALL ROCKS AT WATERFALL BASE
    // ========================================================

    for (let i = 0; i < 7; i++) {

        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(
                0.5 + Math.random() * 0.6
            ),
            rockMaterial
        );

        rock.position.set(
            -4 + Math.random() * 8,
            0.5,
            -11 + Math.random() * 3
        );

        rock.rotation.set(
            Math.random(),
            Math.random(),
            Math.random()
        );

        rock.castShadow = true;

        waterfall.add(rock);
    }

    // ========================================================
    // CENTER JUNGLE ROCKS
    // ========================================================

    const largeRocks = [
        [-11, -1, 2.0],
        [11, -1, 1.8],
        [-10, 8, 1.5],
        [10, 8, 1.6]
    ];

    for (const rockData of largeRocks) {

        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(
                rockData[2]
            ),
            rockMaterial
        );

        rock.position.set(
            rockData[0],
            1,
            rockData[1]
        );

        rock.rotation.set(
            Math.random(),
            Math.random(),
            Math.random()
        );

        rock.castShadow = true;

        waterfall.add(rock);
    }

    scene.add(waterfall);
}

createJungleWaterfall();
// ============================================================
// COIN SYSTEM
// ============================================================

const TOTAL_COINS = 10;

const coins = [];

const coinGeometry =
    new THREE.TorusGeometry(
        0.55,
        0.16,
        12,
        24
    );

const coinMaterial =
    new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.25,
        emissive: 0x5a4500
    });

// ------------------------------------------------------------
// CREATE ONE COIN
// ------------------------------------------------------------

function createCoin(index) {

    const coin =
        new THREE.Mesh(
            coinGeometry,
            coinMaterial
        );

    coin.rotation.x =
        Math.PI / 2;

    coin.castShadow = true;

    coin.receiveShadow = true;

    coin.userData.collected = false;

    coin.userData.index = index;

    // --------------------------------------------------------
    // PLACE COINS AROUND THE TRACK
    // --------------------------------------------------------

    const trackPosition =
        Math.floor(
            (
                trackPoints.length /
                TOTAL_COINS
            ) * index
        );

    const point =
        trackPoints[
            trackPosition %
            trackPoints.length
        ];

    // Get the mountain elevation
    const trackHeight =
        getTrackHeight(trackPosition);

    // Save the base height so the floating
    // animation stays attached to the mountain.
    coin.userData.baseHeight =
        trackHeight + 1.0;

    coin.position.set(
        point.x,
        coin.userData.baseHeight,
        point.z
    );

    scene.add(coin);

    coins.push(coin);
}

// ------------------------------------------------------------
// CREATE ALL COINS
// ------------------------------------------------------------

for (
    let i = 0;
    i < TOTAL_COINS;
    i++
) {

    createCoin(i);
}

// ============================================================
// COLLECT COINS
// ============================================================

function updateCoins(deltaTime) {

    for (
        const coin of coins
    ) {

        // ----------------------------------------------------
        // SPIN
        // ----------------------------------------------------

        if (
            !coin.userData.collected
        ) {

            coin.rotation.y +=
                4 *
                deltaTime;

            // Small floating animation
            coin.position.y =
    coin.userData.baseHeight +
    Math.sin(
        performance.now() * 0.004 +
        coin.userData.index
    ) *
    0.12;
        }

        // ----------------------------------------------------
        // COLLECTION
        // ----------------------------------------------------

        if (
            coin.userData.collected
        ) {

            continue;
        }

        const distance =
            Math.hypot(
                player.x -
                    coin.position.x,

                player.z -
                    coin.position.z
            );

        if (
            distance < 2.0 &&
            player.coins <
                player.maxCoins
        ) {

            player.coins++;

            coin.userData.collected =
                true;

            coin.visible =
                false;

            console.log(
                `Coin collected! ${player.coins}/${player.maxCoins}`
            );

            // ------------------------------------------------
            // COIN SPEED BONUS
            // ------------------------------------------------

            applyCoinSpeedBonus();
        }
    }
}

// ============================================================
// COIN SPEED BONUS
// ============================================================

function applyCoinSpeedBonus() {

    // Every coin gives +0.5 maximum speed.
    // 10 coins = +5 maximum speed.

    const baseSpeed =
        player.baseMaxSpeed;

    if (
        typeof baseSpeed !==
        "number"
    ) {

        return;
    }

    player.maxSpeed =
        baseSpeed +
        player.coins * 0.5;
}

// ============================================================
// RESET COINS
// ============================================================

function resetCoins() {

    player.coins = 0;

    for (
        const coin of coins
    ) {

        coin.userData.collected =
            false;

        coin.visible =
            true;
    }

    applyCoinSpeedBonus();
}

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

        // Get the elevation of both ends of this curb
const height1 = getTrackHeight(i);
const height2 = getTrackHeight(
    (i + 1) % trackPoints.length
);

// Put the curb halfway between those elevations
const curbHeight =
    (height1 + height2) / 2;

curb.position.set(
    (p.x + next.x) / 2,
    curbHeight + 0.2,
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

        const length =
            Math.hypot(dx, dz);

        if (length === 0) {
            continue;
        }

        const nx = -dz / length;
        const nz = dx / length;

        for (const side of [-1, 1]) {

            const border =
                new THREE.Mesh(
                    new THREE.BoxGeometry(
                        Math.max(length + 0.25, 1),
                        0.5,
                        0.55
                    ),
                    borderMaterial
                );

            border.position.set(

                (p.x + next.x) / 2 +
                    nx * side *
                    TRACK_WIDTH / 2,

                0.32,

                (p.z + next.z) / 2 +
                    nz * side *
                    TRACK_WIDTH / 2
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

    // Make the finish line fill the entire square corner
    const size = TRACK_WIDTH;
    const squares = 8;
    const squareSize = size / squares;

    const whiteMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });

    const blackMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });

    // Create a full 8x8 checkerboard square
    for (let x = 0; x < squares; x++) {

        for (let z = 0; z < squares; z++) {

            const square = new THREE.Mesh(
                new THREE.BoxGeometry(
                    squareSize,
                    0.08,
                    squareSize
                ),
                (x + z) % 2 === 0
                    ? whiteMaterial
                    : blackMaterial
            );

            square.position.x =
                -size / 2 +
                (x + 0.5) *
                squareSize;

            square.position.z =
                -size / 2 +
                (z + 0.5) *
                squareSize;

            group.add(square);
        }
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
    [-45,55]

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
    [-70, -10],
    [-68, 25],
    [-5, -58],
    [30, -55],
    [72, -15],
    [70, 30],
    [-5, 58],
    [45, 52]
];

    for (const [x, z] of palmTreeLocations) {
        createPalmTree(x, z);
    }
}

// ============================================================
// CHARACTER 3D MODEL SYSTEM
// PROCEDURAL CHARACTERS
// ============================================================

let currentCharacterModel = null;

let characterMixer = null;
let characterAnimations = [];

// ------------------------------------------------------------
// CHARACTER MATERIAL
// ------------------------------------------------------------

function characterMaterial(color, roughness = 0.65, metalness = 0) {

    return new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness,
        metalness: metalness
    });

}

// ------------------------------------------------------------
// ADD MESH HELPER
// ------------------------------------------------------------

function addCharacterPart(
    group,
    geometry,
    material,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0
) {

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.rotation.set(
        rx,
        ry,
        rz
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group.add(mesh);

    return mesh;
}

// ============================================================
// BASIC HUMANOID PARTS
// ============================================================

function addHumanoidParts(
    group,
    bodyMaterial,
    skinMaterial,
    shoeMaterial,
    options = {}
) {

    const bodyScale =
        options.bodyScale || 1;

    const headScale =
        options.headScale || 1;

    const legLength =
        options.legLength || 0.8;

    const armLength =
        options.armLength || 0.9;

    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    addCharacterPart(
        group,
        new THREE.CapsuleGeometry(
            0.38 * bodyScale,
            0.75 * bodyScale,
            6,
            10
        ),
        bodyMaterial,
        0,
        1.15 * bodyScale,
        0
    );

    // --------------------------------------------------------
    // HEAD
    // --------------------------------------------------------

    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.42 * headScale,
            16,
            12
        ),
        skinMaterial,
        0,
        1.95 * bodyScale,
        0
    );

    // --------------------------------------------------------
    // LEFT ARM
    // --------------------------------------------------------

    addCharacterPart(
        group,
        new THREE.CapsuleGeometry(
            0.13 * bodyScale,
            armLength * bodyScale,
            5,
            8
        ),
        bodyMaterial,
        -0.48 * bodyScale,
        1.15 * bodyScale,
        0,
        0,
        0,
        -0.12
    );

    // --------------------------------------------------------
    // RIGHT ARM
    // --------------------------------------------------------

    addCharacterPart(
        group,
        new THREE.CapsuleGeometry(
            0.13 * bodyScale,
            armLength * bodyScale,
            5,
            8
        ),
        bodyMaterial,
        0.48 * bodyScale,
        1.15 * bodyScale,
        0,
        0,
        0,
        0.12
    );

    // --------------------------------------------------------
    // LEFT LEG
    // --------------------------------------------------------

    addCharacterPart(
        group,
        new THREE.CapsuleGeometry(
            0.15 * bodyScale,
            legLength * bodyScale,
            5,
            8
        ),
        bodyMaterial,
        -0.22 * bodyScale,
        0.48 * bodyScale,
        0
    );

    // --------------------------------------------------------
    // RIGHT LEG
    // --------------------------------------------------------

    addCharacterPart(
        group,
        new THREE.CapsuleGeometry(
            0.15 * bodyScale,
            legLength * bodyScale,
            5,
            8
        ),
        bodyMaterial,
        0.22 * bodyScale,
        0.48 * bodyScale,
        0
    );

    // --------------------------------------------------------
    // LEFT SHOE
    // --------------------------------------------------------

    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.34 * bodyScale,
            0.18 * bodyScale,
            0.55 * bodyScale
        ),
        shoeMaterial,
        -0.22 * bodyScale,
        0.05,
        -0.08
    );

    // --------------------------------------------------------
    // RIGHT SHOE
    // --------------------------------------------------------

    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.34 * bodyScale,
            0.18 * bodyScale,
            0.55 * bodyScale
        ),
        shoeMaterial,
        0.22 * bodyScale,
        0.05,
        -0.08
    );

}

// ============================================================
// BLAZE
// ============================================================

function createBlaze() {

    const group = new THREE.Group();

    const red = characterMaterial(0xd92828);
    const darkRed = characterMaterial(0x8e1111);
    const orange = characterMaterial(0xff7a00);
    const skin = characterMaterial(0xffc08a);
    const black = characterMaterial(0x151515);

    addHumanoidParts(
        group,
        red,
        skin,
        black
    );

    // Fire-colored hair
    addCharacterPart(
        group,
        new THREE.ConeGeometry(
            0.42,
            0.75,
            8
        ),
        orange,
        0,
        2.48,
        0
    );

    // Dark red chest armor
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.55,
            0.35,
            0.18
        ),
        darkRed,
        0,
        1.3,
        -0.34
    );

    // Flame shoulder pads
    for (const x of [-0.52, 0.52]) {

        addCharacterPart(
            group,
            new THREE.ConeGeometry(
                0.18,
                0.4,
                6
            ),
            orange,
            x,
            1.55,
            0,
            0,
            0,
            x < 0 ? -0.4 : 0.4
        );

    }

    return group;
}

// ============================================================
// BOLT
// ============================================================

function createBolt() {

    const group = new THREE.Group();

    const yellow = characterMaterial(0xffd21f);
    const darkYellow = characterMaterial(0xb88900);
    const blue = characterMaterial(0x2166ff);
    const skin = characterMaterial(0xffc08a);
    const black = characterMaterial(0x151515);

    addHumanoidParts(
        group,
        blue,
        skin,
        black
    );

    // Yellow helmet
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.48,
            16,
            10
        ),
        yellow,
        0,
        2.08,
        0
    );

    // Lightning bolt antenna
    addCharacterPart(
        group,
        new THREE.ConeGeometry(
            0.12,
            0.7,
            5
        ),
        yellow,
        0,
        2.62,
        0
    );

    // Yellow chest
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.62,
            0.35,
            0.18
        ),
        yellow,
        0,
        1.3,
        -0.34
    );

    // Shoulder electricity
    for (const x of [-0.58, 0.58]) {

        addCharacterPart(
            group,
            new THREE.ConeGeometry(
                0.12,
                0.45,
                5
            ),
            darkYellow,
            x,
            1.5,
            0,
            0,
            0,
            x < 0 ? -0.5 : 0.5
        );

    }

    return group;
}

// ============================================================
// REX
// ============================================================

function createRex() {

    const group = new THREE.Group();

    const green = characterMaterial(0x319447);
    const darkGreen = characterMaterial(0x17602a);
    const belly = characterMaterial(0x9acb59);
    const skin = characterMaterial(0x6dbb55);
    const claws = characterMaterial(0xe8e0b0);

    addHumanoidParts(
        group,
        green,
        skin,
        darkGreen,
        {
            bodyScale: 1.3,
            headScale: 1.2,
            legLength: 1.0,
            armLength: 1.0
        }
    );

    // Dinosaur snout
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.58,
            0.32,
            0.65
        ),
        green,
        0,
        1.95,
        -0.35
    );

    // Belly
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.32,
            12,
            8
        ),
        belly,
        0,
        1.2,
        -0.38
    );

    // Dinosaur spikes
    for (let i = 0; i < 5; i++) {

        addCharacterPart(
            group,
            new THREE.ConeGeometry(
                0.13,
                0.4,
                5
            ),
            darkGreen,
            0,
            1.55 + i * 0.2,
            0.25,
            Math.PI,
            0,
            0
        );

    }

    // Tail
    const tail = addCharacterPart(
        group,
        new THREE.ConeGeometry(
            0.25,
            1.4,
            8
        ),
        green,
        0,
        1.0,
        0.8,
        Math.PI / 2,
        0,
        0
    );

    // Claws
    for (const x of [-0.22, 0.22]) {

        addCharacterPart(
            group,
            new THREE.ConeGeometry(
                0.08,
                0.3,
                5
            ),
            claws,
            x,
            0.05,
            -0.35,
            Math.PI / 2,
            0,
            0
        );

    }

    return group;
}

// ============================================================
// NOVA
// ============================================================

function createNova() {

    const group = new THREE.Group();

    const purple = characterMaterial(
        0x7138d4,
        0.45,
        0.2
    );

    const darkPurple = characterMaterial(
        0x28104f,
        0.4,
        0.25
    );

    const cyan = characterMaterial(
        0x55e6ff,
        0.3,
        0.35
    );

    const skin = characterMaterial(0xe8b6ff);
    const black = characterMaterial(0x111111);

    addHumanoidParts(
        group,
        purple,
        skin,
        black
    );

    // Space helmet
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.5,
            20,
            14
        ),
        darkPurple,
        0,
        2.05,
        0
    );

    // Glowing visor
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.27,
            16,
            10
        ),
        cyan,
        0,
        2.05,
        -0.4
    );

    // Cosmic chest core
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.15,
            12,
            8
        ),
        cyan,
        0,
        1.3,
        -0.4
    );

    // Shoulder rings
    for (const x of [-0.52, 0.52]) {

        addCharacterPart(
            group,
            new THREE.TorusGeometry(
                0.16,
                0.06,
                8,
                16
            ),
            cyan,
            x,
            1.5,
            0,
            Math.PI / 2,
            0,
            0
        );

    }

    return group;
}

// ============================================================
// MISTY
// ============================================================

function createMisty() {

    const group = new THREE.Group();

    const blue = characterMaterial(0x279fe8);
    const lightBlue = characterMaterial(0x79dcff);
    const darkBlue = characterMaterial(0x14538a);
    const skin = characterMaterial(0xffd1ba);
    const white = characterMaterial(0xf2f7ff);

    addHumanoidParts(
        group,
        blue,
        skin,
        white
    );

    // Water hair
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.5,
            16,
            10
        ),
        lightBlue,
        0,
        2.15,
        0
    );

    // Hair spikes
    for (let i = 0; i < 5; i++) {

        const angle =
            (i / 4 - 0.5) * Math.PI;

        addCharacterPart(
            group,
            new THREE.ConeGeometry(
                0.12,
                0.5,
                6
            ),
            lightBlue,
            Math.sin(angle) * 0.4,
            2.05,
            -Math.abs(Math.cos(angle)) * 0.15,
            angle,
            0,
            0
        );

    }

    // Water chest plate
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.62,
            0.35,
            0.18
        ),
        darkBlue,
        0,
        1.3,
        -0.34
    );

    // Water orb
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.13,
            12,
            8
        ),
        lightBlue,
        0,
        1.3,
        -0.48
    );

    return group;
}

// ============================================================
// AXEL
// ============================================================

function createAxel() {

    const group = new THREE.Group();

    const racingRed = characterMaterial(0xe62b2b);
    const white = characterMaterial(0xf4f4f4);
    const black = characterMaterial(0x181818);
    const visor = characterMaterial(
        0x36c9ff,
        0.25,
        0.4
    );
    const skin = characterMaterial(0xffc08a);

    addHumanoidParts(
        group,
        racingRed,
        skin,
        black
    );

    // Racing helmet
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.5,
            20,
            12
        ),
        white,
        0,
        2.08,
        0
    );

    // Blue visor
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.62,
            0.2,
            0.16
        ),
        visor,
        0,
        2.1,
        -0.43
    );

    // Racing stripe
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.16,
            0.4,
            0.4
        ),
        racingRed,
        0,
        2.35,
        -0.05
    );

    // Racing chest stripe
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.18,
            0.65,
            0.2
        ),
        white,
        0,
        1.2,
        -0.4
    );

    // Shoulder guards
    for (const x of [-0.53, 0.53]) {

        addCharacterPart(
            group,
            new THREE.SphereGeometry(
                0.2,
                12,
                8
            ),
            white,
            x,
            1.55,
            0
        );

    }

    return group;
}

// ============================================================
// VEX
// ============================================================

function createVex() {

    const group = new THREE.Group();

    const purple = characterMaterial(0x7d32d6);
    const dark = characterMaterial(0x21102f);
    const magenta = characterMaterial(0xe638ff);
    const skin = characterMaterial(0xcfa1ff);
    const black = characterMaterial(0x080808);

    addHumanoidParts(
        group,
        dark,
        skin,
        black
    );

    // Purple head
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.45,
            16,
            12
        ),
        purple,
        0,
        2.0,
        0
    );

    // V-shaped horns
    for (const x of [-0.25, 0.25]) {

        addCharacterPart(
            group,
            new THREE.ConeGeometry(
                0.13,
                0.55,
                6
            ),
            magenta,
            x,
            2.5,
            0,
            0,
            0,
            x < 0 ? -0.3 : 0.3
        );

    }

    // Dark armor
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.68,
            0.4,
            0.2
        ),
        purple,
        0,
        1.3,
        -0.35
    );

    // Energy core
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.13,
            12,
            8
        ),
        magenta,
        0,
        1.3,
        -0.48
    );

    return group;
}

// ============================================================
// TITAN
// ============================================================

function createTitan() {

    const group = new THREE.Group();

    const armor = characterMaterial(
        0x5c6673,
        0.7,
        0.2
    );

    const darkArmor = characterMaterial(
        0x252b33,
        0.75,
        0.25
    );

    const gold = characterMaterial(
        0xd6a62c,
        0.45,
        0.35
    );

    const skin = characterMaterial(0xb78c6b);

    addHumanoidParts(
        group,
        armor,
        skin,
        darkArmor,
        {
            bodyScale: 1.5,
            headScale: 1.3,
            legLength: 1.05,
            armLength: 1.15
        }
    );

    // Huge helmet
    addCharacterPart(
        group,
        new THREE.SphereGeometry(
            0.55,
            16,
            12
        ),
        darkArmor,
        0,
        2.15,
        0
    );

    // Gold helmet crest
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.16,
            0.5,
            0.45
        ),
        gold,
        0,
        2.65,
        0
    );

    // Giant chest armor
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.9,
            0.5,
            0.3
        ),
        armor,
        0,
        1.3,
        -0.35
    );

    // Gold center plate
    addCharacterPart(
        group,
        new THREE.BoxGeometry(
            0.25,
            0.4,
            0.12
        ),
        gold,
        0,
        1.3,
        -0.52
    );

    // Massive shoulder armor
    for (const x of [-0.7, 0.7]) {

        addCharacterPart(
            group,
            new THREE.SphereGeometry(
                0.28,
                12,
                8
            ),
            armor,
            x,
            1.58,
            0
        );

    }

    return group;
}

// ============================================================
// CREATE CHARACTER
// ============================================================

function createProceduralCharacter(characterName) {

    switch (characterName) {

        case "blaze":
            return createBlaze();

        case "bolt":
            return createBolt();

        case "rex":
            return createRex();

        case "nova":
            return createNova();

        case "misty":
            return createMisty();

        case "axel":
            return createAxel();

        case "vex":
            return createVex();

        case "titan":
            return createTitan();

        default:
            return createBlaze();

    }

}

// ============================================================
// LOAD CHARACTER MODEL
// ============================================================

function loadCharacterModel(characterName) {

    // Remove previous character
    if (currentCharacterModel) {

        if (currentCharacterModel.parent) {

            currentCharacterModel.parent.remove(
                currentCharacterModel
            );

        }

        currentCharacterModel = null;

    }

    // Reset animation variables
    characterMixer = null;
    characterAnimations = [];

    // Create procedural character
    const model =
        createProceduralCharacter(
            characterName
        );

    currentCharacterModel = model;

    // Put character inside the kart
    kart.add(model);

    console.log(
        "Created procedural character:",
        characterName
    );

}

// ============================================================
// GLB VEHICLE MODELS
// ============================================================

const vehicleLoader = new GLTFLoader();

let vehicleGLBModel = null;

// ------------------------------------------------------------
// SELECT GLB MODEL PATH
// ------------------------------------------------------------

function getSelectedVehicleGLBPath() {

    // -------------------------
    // BIKES
    // -------------------------

    if (selectedBike === "apexRider") {
        return "models/bikes/apex_rider.glb";
    }

    if (selectedBike === "bobsBike") {
        return "models/bikes/bobs_bike.glb";
    }

    if (selectedBike === "rocket") {
        return "models/bikes/rocket_bike.glb";
    }

    if (selectedBike === "champion") {
    return "models/bikes/champion_bike.glb";
}

if (selectedBike === "flash") {
    return "models/bikes/flash_bike.glb";
}

    if (selectedBike === "specter") {
    return "models/bikes/specter_bike.glb";
}
    
    if (selectedBike === "juggernaut") {
    return "models/bikes/juggernaut_bike.glb";
}

    if (selectedBike === "streak") {
    return "models/bikes/streak_bike.glb";
}

    if (selectedBike === "vortex") {
    return "models/bikes/black_scooter.glb";
}

    // -------------------------
    // KARTS
    // -------------------------

    if (selectedKart === "rocket") {
        return "models/karts/rocket.glb";
    }

    if (selectedKart === "speedster") {
        return "models/karts/speedster.glb";
    }

    if (selectedKart === "balanced") {
        return "models/karts/balanced.glb";
    }

    if (selectedKart === "drifter") {
        return "models/karts/drifter.glb";
    }

    if (selectedKart === "heavy") {
        return "models/karts/heavy.glb";
    }

    if (selectedKart === "blaze") {
        return "models/karts/blaze.glb";
    }

    if (selectedKart === "accelerator") {
        return "models/karts/accelerator.glb";
    }

    if (selectedKart === "comet") {
        return "models/karts/comet.glb";
    }

    if (selectedKart === "turbo") {
        return "models/karts/turbo.glb";
    }

    if (selectedKart === "overdrive") {
        return "models/karts/overdrive.glb";
    }

    return null;
}


// ============================================================
// LOAD SELECTED GLB VEHICLE
// ============================================================

const selectedVehicleGLBPath =
    getSelectedVehicleGLBPath();

const useGLBVehicle =
    selectedVehicleGLBPath !== null;

if (useGLBVehicle) {

    vehicleLoader.load(

        selectedVehicleGLBPath,

        (gltf) => {

            vehicleGLBModel =
                gltf.scene;

            console.log("🏎️ KART/BIKE GLB LOADED:", selectedVehicleGLBPath);

            vehicleGLBModel.scale.set(
                1,
                1,
                1
            );

            vehicleGLBModel.position.set(
                0,
                0,
                0
            );

            vehicleGLBModel.rotation.set(
    0,
    0,
    0
);

            vehicleGLBModel.traverse(
                (object) => {

                    if (object.isMesh) {

                        object.castShadow = true;
                        object.receiveShadow = true;

                    }

                }
            );

            kart.add(
                vehicleGLBModel
            );

            console.log(
                "🏁 GLB vehicle loaded:",
                selectedVehicleGLBPath
            );

        },

        undefined,

        (error) => {

            console.error(
                "❌ Failed to load GLB vehicle:",
                selectedVehicleGLBPath,
                error
            );

        }

    );

}

// ============================================================
// KART
// ============================================================

const kart = new THREE.Group();

kart.rotation.order = "YXZ";

scene.add(kart);

loadCharacterModel(selectedCharacter);

// ------------------------------------------------------------
// KART BODY
// ------------------------------------------------------------

let kartBody;
let hood;
let seat;

if (!useGLBVehicle) {

    if (!useGLBVehicle && selectedBike === "apexRider") {
        
    // ========================================================
    // APEX RIDER
    // ========================================================

    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x1976d2,
        roughness: 0.5,
        metalness: 0.35
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x151515,
        roughness: 0.7
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
        color: 0x00c8ff,
        roughness: 0.35,
        metalness: 0.4
    });


    // Main frame
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.38,
            0.38,
            2.5
        ),
        frameMaterial
    );

    frame.position.set(
        0,
        0.95,
        0
    );

    frame.rotation.x = -0.08;

    frame.castShadow = true;

    kart.add(frame);


    // Fuel tank
    const tank = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.72,
            16,
            10
        ),
        frameMaterial
    );

    tank.scale.set(
        0.85,
        0.55,
        1.0
    );

    tank.position.set(
        0,
        1.25,
        -0.15
    );

    tank.castShadow = true;

    kart.add(tank);


    // Seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.9,
            0.22,
            0.9
        ),
        darkMaterial
    );

    seat.position.set(
        0,
        1.45,
        0.75
    );

    seat.castShadow = true;

    kart.add(seat);


    // Rear body
    const rearBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.75,
            0.35,
            1.0
        ),
        frameMaterial
    );

    rearBody.position.set(
        0,
        1.2,
        0.85
    );

    rearBody.castShadow = true;

    kart.add(rearBody);


    // Front fork
    const frontFork = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.16,
            1.55,
            0.18
        ),
        accentMaterial
    );

    frontFork.position.set(
        0,
        1.05,
        -1.15
    );

    frontFork.rotation.x = -0.18;

    frontFork.castShadow = true;

    kart.add(frontFork);


    // Handlebars
    const handlebars = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.0,
            0.14,
            0.14
        ),
        darkMaterial
    );

    handlebars.position.set(
        0,
        1.72,
        -1.55
    );

    handlebars.castShadow = true;

    kart.add(handlebars);


    // Handlebar center
    const handlebarCenter = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.18,
            0.3,
            0.18
        ),
        accentMaterial
    );

    handlebarCenter.position.set(
        0,
        1.55,
        -1.5
    );

    kart.add(handlebarCenter);


    // Headlight
    const headlight = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.25,
            12,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0x666600,
            roughness: 0.2
        })
    );

    headlight.position.set(
        0,
        1.55,
        -1.7
    );

    kart.add(headlight);


    // Exhaust
    const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.12,
            0.16,
            1.5,
            10
        ),
        new THREE.MeshStandardMaterial({
            color: 0x777777,
            metalness: 0.8,
            roughness: 0.25
        })
    );

    exhaust.rotation.x = Math.PI / 2;

    exhaust.position.set(
        0.48,
        0.85,
        0.85
    );

    kart.add(exhaust);


    // Blue side accent
    const sideAccent = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.9,
            0.18,
            1.2
        ),
        accentMaterial
    );

    sideAccent.position.set(
        0,
        1.05,
        -0.35
    );

    kart.add(sideAccent);


} else if (!useGLBVehicle && selectedBike === "bobsBike") {

    // ========================================================
    // BOB'S BIKE
    // ========================================================

    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0xd84315,
        roughness: 0.55,
        metalness: 0.25
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x202020,
        roughness: 0.75
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
        color: 0xffc107,
        roughness: 0.4,
        metalness: 0.3
    });


    // Main frame
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.42,
            0.42,
            2.6
        ),
        frameMaterial
    );

    frame.position.set(
        0,
        0.95,
        0
    );

    frame.rotation.x = 0.05;

    frame.castShadow = true;

    kart.add(frame);


    // Large fuel tank
    const tank = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.78,
            16,
            10
        ),
        frameMaterial
    );

    tank.scale.set(
        0.95,
        0.58,
        1.0
    );

    tank.position.set(
        0,
        1.3,
        -0.15
    );

    tank.castShadow = true;

    kart.add(tank);


    // Seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.0,
            0.25,
            1.0
        ),
        darkMaterial
    );

    seat.position.set(
        0,
        1.43,
        0.72
    );

    seat.castShadow = true;

    kart.add(seat);


    // Rear mudguard
    const rearGuard = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.95,
            0.18,
            1.2
        ),
        accentMaterial
    );

    rearGuard.position.set(
        0,
        1.15,
        1.05
    );

    rearGuard.castShadow = true;

    kart.add(rearGuard);


    // Front fork
    const frontFork = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.18,
            1.7,
            0.2
        ),
        darkMaterial
    );

    frontFork.position.set(
        0,
        1.05,
        -1.2
    );

    frontFork.rotation.x = -0.15;

    frontFork.castShadow = true;

    kart.add(frontFork);


    // Handlebars
    const handlebars = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.15,
            0.16,
            0.16
        ),
        darkMaterial
    );

    handlebars.position.set(
        0,
        1.75,
        -1.55
    );

    kart.add(handlebars);


    // Headlight
    const headlight = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.28,
            12,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0xfff4c2,
            emissive: 0x665500,
            roughness: 0.2
        })
    );

    headlight.position.set(
        0,
        1.55,
        -1.72
    );

    kart.add(headlight);


    // Exhaust
    const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.13,
            0.18,
            1.6,
            10
        ),
        new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.85,
            roughness: 0.25
        })
    );

    exhaust.rotation.x = Math.PI / 2;

    exhaust.position.set(
        -0.5,
        0.85,
        0.85
    );

    kart.add(exhaust);


    // Yellow side accent
    const sideAccent = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.95,
            0.2,
            1.25
        ),
        accentMaterial
    );

    sideAccent.position.set(
        0,
        1.05,
        -0.35
    );

    kart.add(sideAccent);

   } else if (!useGLBVehicle && selectedBike === "rocket") {

    // ========================================================
    // ROCKET BIKE
    // ========================================================

    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x263238,
        roughness: 0.35,
        metalness: 0.75
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3d00,
        roughness: 0.3,
        metalness: 0.55,
        emissive: 0x330800
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.7,
        metalness: 0.25
    });

    const engineMaterial = new THREE.MeshStandardMaterial({
        color: 0x607d8b,
        roughness: 0.25,
        metalness: 0.9
    });

    // Main aerodynamic frame
    const rocketFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.42, 3.1),
        frameMaterial
    );
    rocketFrame.position.set(0, 1.0, 0);
    rocketFrame.rotation.x = -0.04;
    rocketFrame.castShadow = true;
    kart.add(rocketFrame);

    // Front nose
    const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.42, 1.25, 16),
        frameMaterial
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 1.0, -2.0);
    nose.castShadow = true;
    kart.add(nose);

    // Upper body
    const upperBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 16, 10),
        frameMaterial
    );
    upperBody.scale.set(0.72, 0.48, 1.05);
    upperBody.position.set(0, 1.25, -0.35);
    upperBody.castShadow = true;
    kart.add(upperBody);

    // Low seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.22, 0.95),
        darkMaterial
    );
    seat.position.set(0, 1.34, 0.72);
    seat.castShadow = true;
    kart.add(seat);

    // Rear engine housing
    const engineHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.65, 0.9, 16),
        engineMaterial
    );
    engineHousing.rotation.x = Math.PI / 2;
    engineHousing.position.set(0, 1.0, 1.45);
    engineHousing.castShadow = true;
    kart.add(engineHousing);

    // Rocket exhaust
    const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.48, 0.85, 16),
        engineMaterial
    );
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0, 1.0, 2.15);
    exhaust.castShadow = true;
    kart.add(exhaust);

    // Exhaust flame
    const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 0.85, 12),
        new THREE.MeshStandardMaterial({
            color: 0xff9800,
            emissive: 0xff3d00,
            emissiveIntensity: 2.0,
            roughness: 0.3
        })
    );
    flame.rotation.x = Math.PI / 2;
    flame.position.set(0, 1.0, 2.75);
    kart.add(flame);

    // Left side fin
    const leftFin = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.8, 1.25),
        accentMaterial
    );
    leftFin.position.set(-0.58, 1.0, 0.75);
    leftFin.rotation.z = -0.18;
    leftFin.castShadow = true;
    kart.add(leftFin);

    // Right side fin
    const rightFin = leftFin.clone();
    rightFin.position.x = 0.58;
    rightFin.rotation.z = 0.18;
    kart.add(rightFin);

    // Front fork
    const frontFork = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 1.45, 0.16),
        engineMaterial
    );
    frontFork.position.set(0, 1.02, -1.25);
    frontFork.rotation.x = -0.2;
    frontFork.castShadow = true;
    kart.add(frontFork);

    // Handlebars
    const handlebars = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.13, 0.13),
        darkMaterial
    );
    handlebars.position.set(0, 1.68, -1.48);
    handlebars.castShadow = true;
    kart.add(handlebars);

    // Headlight
    const headlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 8),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x00bfff,
            emissiveIntensity: 1.5,
            roughness: 0.15
        })
    );
    headlight.position.set(0, 1.35, -1.9);
    kart.add(headlight);

    // Left rocket stripe
    const leftStripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 1.7),
        accentMaterial
    );
    leftStripe.position.set(-0.42, 1.22, -0.25);
    leftStripe.rotation.x = -0.05;
    kart.add(leftStripe);

    // Right rocket stripe
    const rightStripe = leftStripe.clone();
    rightStripe.position.x = 0.42;
    kart.add(rightStripe);


} else if (selectedBike === "champion") {

    // Champion Bike uses its GLB model.
    // Do not create a procedural vehicle body.

} else if (!useGLBVehicle && selectedKart === "rocket") {
    
    // --------------------------------------------------------
    // ROCKET KART
    // --------------------------------------------------------

    // Main rocket body
    kartBody = new THREE.Mesh(
        new THREE.CylinderGeometry(
            1.35,
            1.7,
            3.8,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0xd32f2f,
            roughness: 0.6
        })
    );

    kartBody.rotation.x = Math.PI / 2;
    kartBody.position.y = 0.95;
    kartBody.castShadow = true;

    kart.add(kartBody);


    // Rocket nose
    const rocketNose = new THREE.Mesh(
        new THREE.ConeGeometry(
            1.35,
            2.0,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0xff5252,
            roughness: 0.5
        })
    );

    rocketNose.rotation.x = -Math.PI / 2;

    rocketNose.position.set(
        0,
        0.95,
        -2.8
    );

    rocketNose.castShadow = true;

    kart.add(rocketNose);


    // Left rocket fin
    const leftFin = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.25,
            1.0,
            1.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0xb71c1c
        })
    );

    leftFin.position.set(
        -1.35,
        0.8,
        1.0
    );

    leftFin.rotation.z = -0.25;

    leftFin.castShadow = true;

    kart.add(leftFin);


    // Right rocket fin
    const rightFin = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.25,
            1.0,
            1.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0xb71c1c
        })
    );

    rightFin.position.set(
        1.35,
        0.8,
        1.0
    );

    rightFin.rotation.z = 0.25;

    rightFin.castShadow = true;

    kart.add(rightFin);


    // Rocket engine
    const engine = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.8,
            0.8,
            0.6,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.8
        })
    );

    engine.rotation.x = Math.PI / 2;

    engine.position.set(
        0,
        0.95,
        2.1
    );

    engine.castShadow = true;

    kart.add(engine);


    // Driver seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.2,
            1.0,
            1.2
        ),
        new THREE.MeshStandardMaterial({
            color: 0x222222
        })
    );

    seat.position.set(
        0,
        1.6,
        0.3
    );

    seat.castShadow = true;

    kart.add(seat);

} else if (selectedKart === "speedster") {

    // --------------------------------------------------------
    // SPEEDSTER KART
    // --------------------------------------------------------

    // Low racing body
    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.8,
            0.55,
            4.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x2196f3,
            roughness: 0.45,
            metalness: 0.15
        })
    );

    kartBody.position.y = 0.7;
    kartBody.castShadow = true;

    kart.add(kartBody);


    // Long aerodynamic nose
    const speedsterNose = new THREE.Mesh(
        new THREE.ConeGeometry(
            1.35,
            2.4,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0x42a5f5,
            roughness: 0.4,
            metalness: 0.2
        })
    );

    speedsterNose.rotation.x = -Math.PI / 2;

    speedsterNose.position.set(
        0,
        0.72,
        -2.7
    );

    speedsterNose.scale.x = 0.9;

    speedsterNose.castShadow = true;

    kart.add(speedsterNose);


    // Rear spoiler
    const spoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.2,
            0.18,
            0.55
        ),
        new THREE.MeshStandardMaterial({
            color: 0x0d47a1,
            roughness: 0.5
        })
    );

    spoiler.position.set(
        0,
        1.35,
        1.8
    );

    spoiler.castShadow = true;

    kart.add(spoiler);


    // Spoiler supports
    const spoilerLeft = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.18,
            0.65,
            0.18
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111
        })
    );

    spoilerLeft.position.set(
        -1.15,
        1.05,
        1.8
    );

    kart.add(spoilerLeft);


    const spoilerRight = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.18,
            0.65,
            0.18
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111
        })
    );

    spoilerRight.position.set(
        1.15,
        1.05,
        1.8
    );

    kart.add(spoilerRight);


    // Racing seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.15,
            0.95,
            1.2
        ),
        new THREE.MeshStandardMaterial({
            color: 0x151515,
            roughness: 0.8
        })
    );

    seat.position.set(
        0,
        1.15,
        0.35
    );

    seat.castShadow = true;

    kart.add(seat);


} else if (selectedKart === "balanced") {

    // BALANCED KART

    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.1,
            0.85,
            4.0
        ),
        new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            roughness: 0.65,
            metalness: 0.05
        })
    );

    kartBody.position.y = 0.8;
    kartBody.castShadow = true;

    kart.add(kartBody);

    // Rounded front bumper

    const balancedFront = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.8,
            0.5,
            1.0
        ),
        new THREE.MeshStandardMaterial({
            color: 0x16a34a,
            roughness: 0.6
        })
    );

    balancedFront.position.set(
        0,
        0.95,
        -2.0
    );

    balancedFront.castShadow = true;

    kart.add(balancedFront);

    // Small rear spoiler

    const balancedSpoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.7,
            0.2,
            0.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0x166534,
            roughness: 0.55
        })
    );

    balancedSpoiler.position.set(
        0,
        1.45,
        1.65
    );

    balancedSpoiler.castShadow = true;

    kart.add(balancedSpoiler);

    // Spoiler supports

    const balancedSupportLeft = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.15,
            0.55,
            0.15
        ),
        new THREE.MeshStandardMaterial({
            color: 0x222222
        })
    );

    balancedSupportLeft.position.set(
        -0.9,
        1.2,
        1.65
    );

    kart.add(balancedSupportLeft);

    const balancedSupportRight = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.15,
            0.55,
            0.15
        ),
        new THREE.MeshStandardMaterial({
            color: 0x222222
        })
    );

    balancedSupportRight.position.set(
        0.9,
        1.2,
        1.65
    );

    kart.add(balancedSupportRight);

    // Seat

    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.35,
            1.1,
            1.25
        ),
        new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        })
    );

    seat.position.set(
        0,
        1.35,
        0.45
    );

    seat.castShadow = true;

    kart.add(seat);

} else if (selectedKart === "drifter") {

        // DRIFTER KART

    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.4,
            0.6,
            4.2
        ),
        new THREE.MeshStandardMaterial({
            color: 0x8b5cf6,
            roughness: 0.5,
            metalness: 0.1
        })
    );

    kartBody.position.y = 0.72;
    kartBody.castShadow = true;

    kart.add(kartBody);

    // Angled drift nose

    const drifterNose = new THREE.Mesh(
        new THREE.ConeGeometry(
            1.45,
            2.2,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0xa855f7,
            roughness: 0.45
        })
    );

    drifterNose.rotation.x = -Math.PI / 2;

    drifterNose.position.set(
        0,
        0.73,
        -2.7
    );

    drifterNose.scale.x = 1.05;

    drifterNose.castShadow = true;

    kart.add(drifterNose);

    // Left side drift panel

    const leftPanel = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.3,
            0.8,
            2.7
        ),
        new THREE.MeshStandardMaterial({
            color: 0x6d28d9,
            roughness: 0.5
        })
    );

    leftPanel.position.set(
        -1.7,
        0.8,
        0.2
    );

    leftPanel.rotation.z = -0.15;

    leftPanel.castShadow = true;

    kart.add(leftPanel);

    // Right side drift panel

    const rightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.3,
            0.8,
            2.7
        ),
        new THREE.MeshStandardMaterial({
            color: 0x6d28d9,
            roughness: 0.5
        })
    );

    rightPanel.position.set(
        1.7,
        0.8,
        0.2
    );

    rightPanel.rotation.z = 0.15;

    rightPanel.castShadow = true;

    kart.add(rightPanel);

    // Low rear spoiler

    const drifterSpoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.0,
            0.18,
            0.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0x4c1d95,
            roughness: 0.5
        })
    );

    drifterSpoiler.position.set(
        0,
        1.15,
        1.8
    );

    drifterSpoiler.castShadow = true;

    kart.add(drifterSpoiler);

    // Seat

    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.25,
            0.9,
            1.25
        ),
        new THREE.MeshStandardMaterial({
            color: 0x171717,
            roughness: 0.8
        })
    );

    seat.position.set(
        0,
        1.15,
        0.4
    );

    seat.castShadow = true;

    kart.add(seat);

} else if (selectedKart === "heavy") {

        // HEAVY KART

    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.6,
            1.0,
            4.4
        ),
        new THREE.MeshStandardMaterial({
            color: 0xf97316,
            roughness: 0.75,
            metalness: 0.05
        })
    );

    kartBody.position.y = 0.9;
    kartBody.castShadow = true;

    kart.add(kartBody);

    // Large front bumper

    const heavyBumper = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.5,
            0.55,
            0.7
        ),
        new THREE.MeshStandardMaterial({
            color: 0xea580c,
            roughness: 0.7
        })
    );

    heavyBumper.position.set(
        0,
        0.75,
        -2.25
    );

    heavyBumper.castShadow = true;

    kart.add(heavyBumper);

    // Heavy left side panel

    const heavyLeftPanel = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.4,
            0.9,
            3.0
        ),
        new THREE.MeshStandardMaterial({
            color: 0xc2410c,
            roughness: 0.7
        })
    );

    heavyLeftPanel.position.set(
        -1.8,
        0.85,
        0.2
    );

    heavyLeftPanel.castShadow = true;

    kart.add(heavyLeftPanel);

    // Heavy right side panel

    const heavyRightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.4,
            0.9,
            3.0
        ),
        new THREE.MeshStandardMaterial({
            color: 0xc2410c,
            roughness: 0.7
        })
    );

    heavyRightPanel.position.set(
        1.8,
        0.85,
        0.2
    );

    heavyRightPanel.castShadow = true;

    kart.add(heavyRightPanel);

    // Large rear spoiler

    const heavySpoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.5,
            0.3,
            0.65
        ),
        new THREE.MeshStandardMaterial({
            color: 0x7c2d12,
            roughness: 0.65
        })
    );

    heavySpoiler.position.set(
        0,
        1.65,
        1.8
    );

    heavySpoiler.castShadow = true;

    kart.add(heavySpoiler);

    // Spoiler supports

    const heavySupportLeft = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.22,
            0.8,
            0.22
        ),
        new THREE.MeshStandardMaterial({
            color: 0x222222
        })
    );

    heavySupportLeft.position.set(
        -1.15,
        1.35,
        1.8
    );

    kart.add(heavySupportLeft);

    const heavySupportRight = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.22,
            0.8,
            0.22
        ),
        new THREE.MeshStandardMaterial({
            color: 0x222222
        })
    );

    heavySupportRight.position.set(
        1.15,
        1.35,
        1.8
    );

    kart.add(heavySupportRight);

    // Heavy seat

    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.5,
            1.2,
            1.4
        ),
        new THREE.MeshStandardMaterial({
            color: 0x171717,
            roughness: 0.9
        })
    );

    seat.position.set(
        0,
        1.45,
        0.35
    );

    seat.castShadow = true;

    kart.add(seat);

} else if (selectedKart === "blaze") {

    // ========================================================
    // BLAZE KART
    // ========================================================

    // Main body
    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.2,
            0.75,
            4.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0xd62828,
            roughness: 0.45,
            metalness: 0.15
        })
    );

    kartBody.position.y = 0.78;
    kartBody.castShadow = true;

    kart.add(kartBody);

    // Bright orange front section
    const blazeNose = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.8,
            0.5,
            1.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0xff7a00,
            roughness: 0.4,
            metalness: 0.1
        })
    );

    blazeNose.position.set(
        0,
        0.98,
        -1.45
    );

    blazeNose.castShadow = true;

    kart.add(blazeNose);

    // Yellow fire stripe
    const blazeStripe = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.75,
            0.08,
            3.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffd000,
            roughness: 0.35,
            metalness: 0.05
        })
    );

    blazeStripe.position.set(
        0,
        1.18,
        -0.1
    );

    blazeStripe.castShadow = true;

    kart.add(blazeStripe);

    // Dark rear spoiler
    const blazeSpoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.1,
            0.25,
            0.55
        ),
        new THREE.MeshStandardMaterial({
            color: 0x171717,
            roughness: 0.6,
            metalness: 0.15
        })
    );

    blazeSpoiler.position.set(
        0,
        1.35,
        1.75
    );

    blazeSpoiler.castShadow = true;

    kart.add(blazeSpoiler);

    // Black seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            1.0,
            1.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.85
        })
    );

    seat.position.set(
        0,
        1.25,
        0.4
    );

    seat.castShadow = true;

    kart.add(seat);

} else if (selectedKart === "accelerator") {

    // ========================================================
    // ACCELERATOR KART
    // ========================================================

    // Main body — sleek electric blue
    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.1,
            0.72,
            4.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x147df5,
            roughness: 0.35,
            metalness: 0.3
        })
    );

    kartBody.position.y = 0.78;
    kartBody.castShadow = true;

    kart.add(kartBody);


    // Bright cyan front nose
    const acceleratorNose = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.75,
            0.48,
            1.45
        ),
        new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            roughness: 0.3,
            metalness: 0.25
        })
    );

    acceleratorNose.position.set(
        0,
        1.02,
        -1.45
    );

    acceleratorNose.castShadow = true;

    kart.add(acceleratorNose);


    // Yellow center acceleration stripe
    const acceleratorStripe = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.65,
            0.08,
            3.6
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffd600,
            roughness: 0.3,
            metalness: 0.1
        })
    );

    acceleratorStripe.position.set(
        0,
        1.18,
        -0.05
    );

    acceleratorStripe.castShadow = true;

    kart.add(acceleratorStripe);


    // Rear spoiler
    const acceleratorSpoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.0,
            0.22,
            0.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.5,
            metalness: 0.2
        })
    );

    acceleratorSpoiler.position.set(
        0,
        1.35,
        1.75
    );

    acceleratorSpoiler.castShadow = true;

    kart.add(acceleratorSpoiler);


    // Black racing seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            1.0,
            1.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.8
        })
    );

    seat.position.set(
        0,
        1.25,
        0.4
    );

    seat.castShadow = true;

    kart.add(seat);

} else if (selectedKart === "comet") {

    // ========================================================
    // COMET KART
    // Futuristic silver / cyan racing design
    // ========================================================

    // Main aerodynamic body
    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.0,
            0.7,
            4.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0xb8c7d9,
            roughness: 0.3,
            metalness: 0.65
        })
    );

    kartBody.position.y = 0.78;
    kartBody.castShadow = true;

    kart.add(kartBody);

    // Cyan front nose
    const cometNose = new THREE.Mesh(
        new THREE.ConeGeometry(
            1.35,
            2.2,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            roughness: 0.25,
            metalness: 0.5
        })
    );

    cometNose.rotation.x = -Math.PI / 2;

    cometNose.position.set(
        0,
        0.82,
        -2.65
    );

    cometNose.scale.x = 0.95;
    cometNose.castShadow = true;

    kart.add(cometNose);

    // Glowing cyan center stripe
    const cometStripe = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.45,
            0.08,
            3.7
        ),
        new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            roughness: 0.2,
            metalness: 0.4,
            emissive: 0x00aabb,
            emissiveIntensity: 1.5
        })
    );

    cometStripe.position.set(
        0,
        1.17,
        -0.05
    );

    kart.add(cometStripe);

    // Dark side pods
    const cometLeftPod = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.35,
            0.65,
            2.8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x263238,
            roughness: 0.4,
            metalness: 0.55
        })
    );

    cometLeftPod.position.set(
        -1.65,
        0.78,
        0.2
    );

    cometLeftPod.rotation.z = -0.08;
    cometLeftPod.castShadow = true;

    kart.add(cometLeftPod);

    const cometRightPod = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.35,
            0.65,
            2.8
        ),
        new THREE.MeshStandardMaterial({
            color: 0x263238,
            roughness: 0.4,
            metalness: 0.55
        })
    );

    cometRightPod.position.set(
        1.65,
        0.78,
        0.2
    );

    cometRightPod.rotation.z = 0.08;
    cometRightPod.castShadow = true;

    kart.add(cometRightPod);

    // Futuristic rear spoiler
    const cometSpoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.25,
            0.2,
            0.55
        ),
        new THREE.MeshStandardMaterial({
            color: 0x00bcd4,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0x004c55,
            emissiveIntensity: 0.7
        })
    );

    cometSpoiler.position.set(
        0,
        1.38,
        1.85
    );

    cometSpoiler.castShadow = true;

    kart.add(cometSpoiler);

    // Black futuristic seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.25,
            1.0,
            1.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x101820,
            roughness: 0.65,
            metalness: 0.15
        })
    );

    seat.position.set(
        0,
        1.25,
        0.4
    );

    seat.castShadow = true;

    kart.add(seat);


} else if (selectedKart === "turbo") {

    // ========================================================
    // TURBO KART
    // Red / orange aggressive racing design
    // ========================================================

    // Main red body
    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.25,
            0.8,
            4.4
        ),
        new THREE.MeshStandardMaterial({
            color: 0xd90429,
            roughness: 0.4,
            metalness: 0.25
        })
    );

    kartBody.position.y = 0.8;
    kartBody.castShadow = true;

    kart.add(kartBody);

    // Orange racing nose
    const turboNose = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.75,
            0.5,
            1.55
        ),
        new THREE.MeshStandardMaterial({
            color: 0xff6d00,
            roughness: 0.35,
            metalness: 0.15
        })
    );

    turboNose.position.set(
        0,
        1.02,
        -1.55
    );

    turboNose.castShadow = true;

    kart.add(turboNose);

    // White racing stripe
    const turboStripe = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.55,
            0.08,
            3.8
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.1
        })
    );

    turboStripe.position.set(
        0,
        1.22,
        -0.05
    );

    kart.add(turboStripe);

    // Black side panels
    const turboLeftPanel = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.4,
            0.8,
            3.0
        ),
        new THREE.MeshStandardMaterial({
            color: 0x151515,
            roughness: 0.55,
            metalness: 0.2
        })
    );

    turboLeftPanel.position.set(
        -1.72,
        0.82,
        0.2
    );

    turboLeftPanel.castShadow = true;

    kart.add(turboLeftPanel);

    const turboRightPanel = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.4,
            0.8,
            3.0
        ),
        new THREE.MeshStandardMaterial({
            color: 0x151515,
            roughness: 0.55,
            metalness: 0.2
        })
    );

    turboRightPanel.position.set(
        1.72,
        0.82,
        0.2
    );

    turboRightPanel.castShadow = true;

    kart.add(turboRightPanel);

    // Large rear spoiler
    const turboSpoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.35,
            0.28,
            0.65
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.45,
            metalness: 0.3
        })
    );

    turboSpoiler.position.set(
        0,
        1.55,
        1.85
    );

    turboSpoiler.castShadow = true;

    kart.add(turboSpoiler);

    // Spoiler supports
    const turboSupportLeft = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.2,
            0.65,
            0.2
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111
        })
    );

    turboSupportLeft.position.set(
        -1.1,
        1.25,
        1.8
    );

    kart.add(turboSupportLeft);

    const turboSupportRight = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.2,
            0.65,
            0.2
        ),
        new THREE.MeshStandardMaterial({
            color: 0x111111
        })
    );

    turboSupportRight.position.set(
        1.1,
        1.25,
        1.8
    );

    kart.add(turboSupportRight);

    // Racing seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.3,
            1.05,
            1.3
        ),
        new THREE.MeshStandardMaterial({
            color: 0x181818,
            roughness: 0.8
        })
    );

    seat.position.set(
        0,
        1.3,
        0.4
    );

    seat.castShadow = true;

    kart.add(seat);


} else if (selectedKart === "overdrive") {

    // ========================================================
    // OVERDRIVE KART
    // Black / electric purple performance design
    // ========================================================

    // Main dark metallic body
    kartBody = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.4,
            0.85,
            4.5
        ),
        new THREE.MeshStandardMaterial({
            color: 0x161616,
            roughness: 0.28,
            metalness: 0.8
        })
    );

    kartBody.position.y = 0.82;
    kartBody.castShadow = true;

    kart.add(kartBody);

    // Purple aggressive front nose
    const overdriveNose = new THREE.Mesh(
        new THREE.ConeGeometry(
            1.4,
            2.0,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0x7c3aed,
            roughness: 0.3,
            metalness: 0.5,
            emissive: 0x26005c,
            emissiveIntensity: 0.8
        })
    );

    overdriveNose.rotation.x = -Math.PI / 2;

    overdriveNose.position.set(
        0,
        0.9,
        -2.7
    );

    overdriveNose.castShadow = true;

    kart.add(overdriveNose);

    // Electric purple center stripe
    const overdriveStripe = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.5,
            0.09,
            3.9
        ),
        new THREE.MeshStandardMaterial({
            color: 0xc026ff,
            roughness: 0.2,
            metalness: 0.45,
            emissive: 0x7200aa,
            emissiveIntensity: 1.5
        })
    );

    overdriveStripe.position.set(
        0,
        1.25,
        -0.05
    );

    kart.add(overdriveStripe);

    // Purple side blades
    const overdriveLeftBlade = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.3,
            0.9,
            3.1
        ),
        new THREE.MeshStandardMaterial({
            color: 0x5b21b6,
            roughness: 0.35,
            metalness: 0.45,
            emissive: 0x180035,
            emissiveIntensity: 0.8
        })
    );

    overdriveLeftBlade.position.set(
        -1.78,
        0.85,
        0.15
    );

    overdriveLeftBlade.rotation.z = -0.12;
    overdriveLeftBlade.castShadow = true;

    kart.add(overdriveLeftBlade);

    const overdriveRightBlade = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.3,
            0.9,
            3.1
        ),
        new THREE.MeshStandardMaterial({
            color: 0x5b21b6,
            roughness: 0.35,
            metalness: 0.45,
            emissive: 0x180035,
            emissiveIntensity: 0.8
        })
    );

    overdriveRightBlade.position.set(
        1.78,
        0.85,
        0.15
    );

    overdriveRightBlade.rotation.z = 0.12;
    overdriveRightBlade.castShadow = true;

    kart.add(overdriveRightBlade);

    // Wide rear performance spoiler
    const overdriveSpoiler = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.5,
            0.3,
            0.65
        ),
        new THREE.MeshStandardMaterial({
            color: 0x6d28d9,
            roughness: 0.3,
            metalness: 0.55,
            emissive: 0x200044,
            emissiveIntensity: 0.8
        })
    );

    overdriveSpoiler.position.set(
        0,
        1.5,
        1.9
    );

    overdriveSpoiler.castShadow = true;

    kart.add(overdriveSpoiler);

    // Black performance seat
    seat = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.4,
            1.1,
            1.35
        ),
        new THREE.MeshStandardMaterial({
            color: 0x080808,
            roughness: 0.7,
            metalness: 0.25
        })
    );

    seat.position.set(
        0,
        1.32,
        0.4
    );

    seat.castShadow = true;

    kart.add(seat);


} else {

    // OTHER KARTS — TEMPORARY NORMAL LOOK

    kartBody = new THREE.Mesh(
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

    hood = new THREE.Mesh(
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

    seat = new THREE.Mesh(
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
    }

}

// ------------------------------------------------------------
// WHEELS
// ------------------------------------------------------------

const wheels = [];

function createWheel(x, z) {

    const wheelGroup = new THREE.Group();

    if (useGLBVehicle) {
        wheelGroup.visible = false;
    }

    // --------------------------------------------------------
    // TIRE
    // --------------------------------------------------------

    let tireRadius = 0.65;
    let tireWidth = 0.45;

    if (selectedWheels === "offroad") {
        tireRadius = 0.72;
        tireWidth = 0.55;
    }

    const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(
            tireRadius,
            tireRadius,
            tireWidth,
            16
        ),
        new THREE.MeshStandardMaterial({
            color:
                selectedWheels === "shadow"
                    ? 0x050505
                    : 0x111111,
            roughness: 0.9
        })
    );

    tire.rotation.z = Math.PI / 2;

    wheelGroup.add(tire);


    // --------------------------------------------------------
    // RIM
    // --------------------------------------------------------

    let rimColor = 0x777777;

    if (selectedWheels === "grip") {
        rimColor = 0x444444;
    }

    if (selectedWheels === "speed") {
        rimColor = 0xaaaaaa;
    }

    if (selectedWheels === "offroad") {
        rimColor = 0x333333;
    }

    if (selectedWheels === "drift") {
        rimColor = 0xdddddd;
    }

    if (selectedWheels === "cyclone") {
        rimColor = 0x2266ff;
    }

    if (selectedWheels === "shadow") {
        rimColor = 0x111111;
    }

    const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.39,
            0.39,
            tireWidth + 0.02,
            16
        ),
        new THREE.MeshStandardMaterial({
            color: rimColor,
            metalness: 0.7,
            roughness: 0.3
        })
    );

    rim.rotation.z = Math.PI / 2;

    wheelGroup.add(rim);


    // --------------------------------------------------------
    // SPOKES
    // --------------------------------------------------------

    let spokeCount = 6;
    let spokeColor = rimColor;

    if (selectedWheels === "street") {
        spokeCount = 6;
    }

    if (selectedWheels === "grip") {
        spokeCount = 8;
        spokeColor = 0x555555;
    }

    if (selectedWheels === "speed") {
        spokeCount = 10;
        spokeColor = 0xdddddd;
    }

    if (selectedWheels === "offroad") {
        spokeCount = 5;
        spokeColor = 0x222222;
    }

    if (selectedWheels === "drift") {
        spokeCount = 7;
        spokeColor = 0xffffff;
    }

    if (selectedWheels === "cyclone") {
        spokeCount = 9;
        spokeColor = 0x44aaff;
    }

    if (selectedWheels === "shadow") {
        spokeCount = 6;
        spokeColor = 0x333333;
    }


    for (let i = 0; i < spokeCount; i++) {

        const angle =
            (Math.PI * 2 * i) /
            spokeCount;

        const spoke = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.08,
                0.34,
                0.10
            ),
            new THREE.MeshStandardMaterial({
                color: spokeColor,
                metalness: 0.6,
                roughness: 0.35
            })
        );

        spoke.position.set(
            Math.cos(angle) * 0.19,
            0,
            Math.sin(angle) * 0.19
        );

        spoke.rotation.y =
            -angle;

        wheelGroup.add(spoke);
    }


    // --------------------------------------------------------
    // CENTER HUB
    // --------------------------------------------------------

    let hubColor = 0xcccccc;

    if (selectedWheels === "shadow") {
        hubColor = 0x111111;
    }

    if (selectedWheels === "cyclone") {
        hubColor = 0x66bbff;
    }

    if (selectedWheels === "drift") {
        hubColor = 0xffffff;
    }

    const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.13,
            0.13,
            tireWidth + 0.08,
            12
        ),
        new THREE.MeshStandardMaterial({
            color: hubColor,
            metalness: 0.8,
            roughness: 0.25
        })
    );

    hub.rotation.z = Math.PI / 2;

    wheelGroup.add(hub);


    // --------------------------------------------------------
    // SPECIAL CYCLONE RING
    // --------------------------------------------------------

    if (selectedWheels === "cyclone") {

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(
                0.31,
                0.045,
                8,
                24
            ),
            new THREE.MeshStandardMaterial({
                color: 0x3388ff,
                metalness: 0.8,
                roughness: 0.2
            })
        );

        ring.rotation.y =
            Math.PI / 2;

        wheelGroup.add(ring);
    }


    // --------------------------------------------------------
    // SPECIAL SHADOW RING
    // --------------------------------------------------------

    if (selectedWheels === "shadow") {

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(
                0.31,
                0.035,
                8,
                24
            ),
            new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.5,
                roughness: 0.4
            })
        );

        ring.rotation.y =
            Math.PI / 2;

        wheelGroup.add(ring);
    }


    // --------------------------------------------------------
    // POSITION
    // --------------------------------------------------------

    wheelGroup.position.set(
        x,
        0.55,
        z
    );

    kart.add(wheelGroup);

    wheels.push(wheelGroup);
}

// ------------------------------------------------------------
// CREATE WHEELS
// ------------------------------------------------------------

if (selectedBike !== "none") {

    // Bikes have two wheels centered on the frame

    createWheel(0, -1.45);
    createWheel(0, 1.45);

} else {

    // Karts have four wheels

    createWheel(-1.5, -1.35);
    createWheel(1.5, -1.35);
    createWheel(-1.5, 1.35);
    createWheel(1.5, 1.35);

}

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

scene.add(kart);

// ============================================================
// AI OPPONENTS
// ============================================================

const aiKarts = [];

const AI_COUNT =
    timeTrial ? 0 : 3;

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
    i === 0 ? 43.5 :
    i === 1 ? 44 :
    43,

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

    trackIndex:
        0,

    coins:
        0,

    maxCoins:
        10,
    x:
        startPoint.x,

    z:
        startPoint.z,

    speed:
        0,

    airborne:
    false,

verticalVelocity:
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
        3.0,

    angle:
        playerStartAngle,

   drifting:
    false,

driftCharge:
    0,

    miniTurbo: 0,

wheelie:
    false,

wheelieSpeedBonus:
    8,

boostTimer:
    0,

boostLevel:
    0,

boostAcceleration:
    40,

    boostMaxSpeed:
        100,

    currentBoostCap:
        73,

    lap:
        1,

    nextCheckpoint:
        1,

    finished:
        false,

    finishTime:
        0,

        previousFinishDistance:
        Infinity,

    previousFrameTime:
        null,

    lastDrifting:
        false
};

function updateTotalStats() {

    const speedElement =
        document.getElementById("totalSpeed");

    const accelerationElement =
        document.getElementById("totalAcceleration");

    const brakingElement =
        document.getElementById("totalBraking");

    const handlingElement =
        document.getElementById("totalHandling");

    const driftElement =
        document.getElementById("totalDriftCharge");

    const miniTurboElement =
        document.getElementById("totalMiniTurbo");

    if (!player) {
        return;
    }

    if (speedElement) {
        speedElement.textContent =
            player.maxSpeed.toFixed(1);
    }

    if (accelerationElement) {
        accelerationElement.textContent =
            player.acceleration.toFixed(1);
    }

    if (brakingElement) {
        brakingElement.textContent =
            player.braking.toFixed(1);
    }

    if (handlingElement) {
        handlingElement.textContent =
            player.turnSpeed.toFixed(1);
    }

    if (driftElement) {
        driftElement.textContent =
            player.driftChargeRate.toFixed(2);
    }

    if (miniTurboElement) {
        miniTurboElement.textContent =
            player.miniTurbo || 0;
    }
}

function applyKartStats() {

        player.baseMaxSpeed =
        player.maxSpeed;

    // ========================================================
    // GET SELECTED WHEELS
    // ========================================================

    const wheels =
        wheelStats[selectedWheels];

    if (!wheels) {
        return;
    }


    // ========================================================
    // GET SELECTED CHARACTER
    // ========================================================

    const character =
        characterStats[selectedCharacter];

    if (!character) {
        return;
    }


    // ========================================================
    // BIKE
    // ========================================================

    if (selectedBike !== "none") {

        const bike =
            bikeStats[selectedBike];

        if (!bike) {
            return;
        }


        // ----------------------------------------------------
        // BASE BIKE + WHEELS + CHARACTER
        // ----------------------------------------------------

        player.maxSpeed =
            bike.maxSpeed +
            wheels.maxSpeed +
            character.speed;


        player.acceleration =
            bike.acceleration +
            wheels.acceleration +
            character.acceleration;


        player.braking =
            bike.braking;


        player.turnSpeed =
            bike.turnSpeed +
            wheels.turnSpeed +
            character.handling;


        // ----------------------------------------------------
        // DRIFT
        // ----------------------------------------------------

        player.driftChargeRate =
    Math.min(
        bike.driftChargeRate *
        wheels.driftChargeRate,
        2.00
    );

        player.miniTurbo =
    Math.round(
        (
            character.miniTurbo +
            bike.miniTurbo +
            wheels.miniTurbo
        ) / 3
    );

        // ----------------------------------------------------
        // DRIFT BONUS
        // ----------------------------------------------------

                player.driftBoostBonus =
            player.driftChargeRate >= 2.00
                ? 2
                : 0;

        player.baseMaxSpeed =
            player.maxSpeed;

       applyCoinSpeedBonus();

updateTotalStats();

return;
    }


    // ========================================================
    // KART
    // ========================================================

    const kart =
        kartStats[selectedKart];

    if (!kart) {
        return;
    }


    // --------------------------------------------------------
    // BASE KART + WHEELS + CHARACTER
    // --------------------------------------------------------

    player.maxSpeed =
        kart.maxSpeed +
        wheels.maxSpeed +
        character.speed;


    player.acceleration =
        kart.acceleration +
        wheels.acceleration +
        character.acceleration;


    player.braking =
        kart.braking;


    player.turnSpeed =
        kart.turnSpeed +
        wheels.turnSpeed +
        character.handling;


    // --------------------------------------------------------
    // DRIFT
    // --------------------------------------------------------

    player.driftChargeRate =
        Math.min(
    kart.driftChargeRate *
    wheels.driftChargeRate,
    2.25
);

    player.miniTurbo =
    Math.round(
        (
            character.miniTurbo +
            kart.miniTurbo +
            wheels.miniTurbo
        ) / 3
    );


    // --------------------------------------------------------
    // DRIFT BONUS
    // --------------------------------------------------------

        player.driftBoostBonus =
        player.driftChargeRate >= 2.00
            ? 2
            : 0;

    player.baseMaxSpeed =
        player.maxSpeed;

    applyCoinSpeedBonus();

updateTotalStats();
    
}

applyKartStats();

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
// FOLLOW TRACK HEIGHT
// ----------------------------------------------------

const aiTrackHeight =
    getTrackHeight(
        ai.trackIndex
    );

ai.kart.position.y =
    THREE.MathUtils.lerp(
        ai.kart.position.y,
        aiTrackHeight,
        1 - Math.exp(-10 * deltaTime)
    );

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

    const collisionDistance = 2.5;

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

        // Prevent the same collision from triggering
        // repeatedly every frame.
        if (
            ai.bumpCooldownUntil &&
            performance.now() < ai.bumpCooldownUntil
        ) {
            continue;
        }

        if (
            distance > 0 &&
            distance < collisionDistance
        ) {

            // Direction from the player toward the AI
            const pushX =
                dx / distance;

            const pushZ =
                dz / distance;

            // ------------------------------------------------
            // MARIO-KART-STYLE PLAYER BUMP
            // ------------------------------------------------

            const playerBump =
                0.7;

            const newPlayerX =
                player.x -
                pushX * playerBump;

            const newPlayerZ =
                player.z -
                pushZ * playerBump;

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

            const aiBump =
                0.45;

            const newAIX =
                ai.kart.position.x +
                pushX * aiBump;

            const newAIZ =
                ai.kart.position.z +
                pushZ * aiBump;

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
            // SMALL SPEED HIT
            // ------------------------------------------------

            player.speed *= 0.88;
            ai.speed *= 0.90;

            // ------------------------------------------------
            // COLLISION COOLDOWN
            // ------------------------------------------------

            ai.bumpCooldownUntil =
                performance.now() + 250;
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

    if (
        !Number.isFinite(player.x) ||
        !Number.isFinite(player.z) ||
        !Number.isFinite(player.speed) ||
        !Number.isFinite(player.angle)
    ) {
        console.error("DRIFT PHYSICS ERROR:", {
            x: player.x,
            z: player.z,
            speed: player.speed,
            angle: player.angle,
            drifting: player.drifting
        });

        player.speed = 0;
        player.drifting = false;
        return;
    }

    const previousFinishPoint =
        trackPoints[0];

    player.previousFinishDistance =
        Math.hypot(
            player.x -
                previousFinishPoint.x,

            player.z -
                previousFinishPoint.z
        );

    player.previousFrameTime =
        performance.now();

    // --------------------------------------------------------
// ACCELERATION
// --------------------------------------------------------

if (forward()) {

    // ----------------------------------------------------
    // BOOST ACCELERATION
    // ----------------------------------------------------

    if (player.boostTimer > 0) {

    // Don't add any more speed while the boost is active.
    // The drift release already applied the boost amount.

    player.speed =
        Math.min(
            player.speed,
            100
        );

} else {

    player.boostTimer = 0;

    player.boostLevel = 0;

    player.currentBoostCap =
        player.maxSpeed;

    boostFlame.visible = false;

    if (
        player.speed >
        player.maxSpeed
    ) {

        player.speed =
            moveToward(
                player.speed,
                player.maxSpeed,
                1.5 * deltaTime
            );
    }
}

        // ------------------------------------------------
        // NORMAL ACCELERATION
        // ------------------------------------------------

        const wheelieCap =
            player.maxSpeed +
            (player.wheelie
                ? player.wheelieSpeedBonus
                : 0);

        if (player.speed < wheelieCap) {

            player.speed +=
                player.acceleration *
                deltaTime;

            player.speed =
                Math.min(
                    player.speed,
                    wheelieCap
                );
        }

        // If we are above normal speed after a boost,
        // smoothly return toward normal maximum speed.

        if (
    player.speed >
    player.maxSpeed
) {

    player.speed =
        moveToward(
            player.speed,
            player.maxSpeed,
            1.5 * deltaTime
        );
}
    }
}

// --------------------------------------------------------
// HARD MAX SPEED
// --------------------------------------------------------

player.speed =
    Math.min(
        player.speed,
        100
    );

    
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

const controllerSteering =
    getGamepadSteering();

const wantsDrift =
    (space() || mobileDriftToggle) &&
    Math.abs(player.speed) > 5 &&
    (
        left() ||
        right() ||
        controllerSteering !== 0
    );

player.drifting =
    wantsDrift;

    // --------------------------------------------------------
// BIKE WHEELIE
// --------------------------------------------------------

if (
    selectedBike !== "none" &&
    wheelie() &&
    player.speed > 8
) {

    player.wheelie = true;

} else {

    player.wheelie = false;
}

    // --------------------------------------------------------
    // STEERING
    // --------------------------------------------------------

    if (
    left() ||
    right() ||
    getGamepadSteering() !== 0
) {

        const controllerSteering = getGamepadSteering();

const direction =
    controllerSteering !== 0
        ? -controllerSteering
        : (
            right()
                ? -1
                : 1
        );

        const speedRatio =
            Math.min(
                Math.abs(player.speed) /
                player.maxSpeed,
                1
            );

        const steeringStrength =
            0.35 +
            speedRatio * 0.65;

        // KART PRECISION STEERING
const precisionSteering =
    selectedBike === "none" &&
    keys["KeyF"];

const turnMultiplier =
    precisionSteering
        ? 0.5
        : 1;

        const driftMultiplier =
    player.drifting
        ? (
            selectedBike !== "none"
                ? 1.20
                : 1.35
        )
        : 1;

if (!player.wheelie) {

    player.angle +=
    direction *
    player.turnSpeed *
    steeringStrength *
    driftMultiplier *
    turnMultiplier *
    deltaTime;

}
        
    }

   // ========================================================
// DRIFT CHARGE
// ========================================================

if (player.drifting) {

    player.driftCharge +=
        deltaTime *
        player.driftChargeRate;

    player.driftCharge =
        Math.min(
            player.driftCharge,
            2.5
        );

}


// ========================================================
// RELEASE DRIFT
// ========================================================

if (
    !player.drifting &&
    player.lastDrifting &&
    player.driftCharge >= 0.35
) {

    const releasedCharge =
        player.driftCharge;

    // ----------------------------------------------------
    // DETERMINE NEW DRIFT LEVEL
    // ----------------------------------------------------

    let newBoostLevel = 1;

    if (releasedCharge >= 1.5) {
        newBoostLevel = 2;
    }

    if (releasedCharge >= 2.2) {
        newBoostLevel = 3;
    }


      // ----------------------------------------------------
    // BOOST VALUES
    // ----------------------------------------------------

    const boostTimers = {
        1: 0.35,  // MINI
        2: 0.65,  // MEDIUM
        3: 1.15   // MAX
    };

    const boostAmounts = {
        1: 5,     // MINI
        2: 11,    // MEDIUM
        3: 18     // MAX
    };


    // ----------------------------------------------------
    // MINI TURBO BONUS
    // ----------------------------------------------------
    // Every Mini Turbo point adds +0.9 speed.
    //
    // 0  = +0
    // 5  = +4.5
    // 10 = +9
    // 15 = +13.5
    // 20 = +18
    //
    // This is ADDITIVE to the base boost.
    // ----------------------------------------------------

    const miniTurboBonus =
        Math.min(
            player.miniTurbo,
            20
        ) * 0.9;

// ----------------------------------------------------
// MARIO KART STYLE BOOST UPGRADE
// ----------------------------------------------------

// A stronger turbo replaces a weaker turbo.
// They do NOT stack together.
//
// MINI   -> MEDIUM -> MAX
//   ↓         ↓        ↓
// weaker   stronger  strongest
//
// Example:
// Orange active -> Purple earned
// Purple replaces Orange and gets its
// own speed boost + longer timer.

if (
    newBoostLevel >
    player.boostLevel
) {

    player.boostLevel =
        newBoostLevel;

    // Stronger turbo gets its full duration.
    player.boostTimer =
        boostTimers[newBoostLevel];

    player.currentBoostCap =
        100;

    const baseBoost =
        boostAmounts[newBoostLevel];

    const finalBoost =
        baseBoost +
        miniTurboBonus;

    // Apply the stronger turbo's speed increase.
    player.speed =
        Math.min(
            player.speed +
            finalBoost,
            100
        );

} else if (
    newBoostLevel ===
    player.boostLevel
) {

    // Same turbo level:
    // refresh its duration, but don't
    // add another speed boost.

    player.boostTimer =
        Math.max(
            player.boostTimer,
            boostTimers[newBoostLevel]
        );

} else {

    // A weaker turbo cannot replace
    // a stronger turbo that is already active.

    player.boostTimer =
        Math.max(
            player.boostTimer,
            0
        );
}

   player.driftCharge = 0;

}
    
// ========================================================
// BOOST
// ========================================================

if (player.boostTimer > 0) {

    player.boostTimer -=
        deltaTime;

    // Do NOT reduce speed while the boost is active.
    // The drift-release code already applied the
    // correct Mini / Medium / MAX boost.

    player.speed =
        Math.min(
            player.speed,
            100
        );

    boostFlame.visible = true;

} else {

    player.boostTimer = 0;

    player.boostLevel = 0;

    player.currentBoostCap =
        player.maxSpeed;

    boostFlame.visible = false;

    // Gradually return boosted speed to normal max.
    if (
        player.speed >
        player.maxSpeed
    ) {

        player.speed =
            moveToward(
                player.speed,
                player.maxSpeed,
                1.5 * deltaTime
            );
    }
}

    player.boostTimer = 0;

    player.boostLevel = 0;

    player.currentBoostCap =
        player.maxSpeed;

    boostFlame.visible = false;
}


// ========================================================
// FINAL SPEED CAP
// ========================================================

player.speed =
    Math.min(
        player.speed,
        100
    );

  // --------------------------------------------------------
// DRIFT MOVEMENT
// --------------------------------------------------------

let moveAngle =
    player.angle;

if (player.drifting) {

    // Which direction are we turning?
    //
    // RIGHT = -1
    // LEFT  = +1
    //
    const controllerSteering =
    getGamepadSteering();

const turnDirection =
    controllerSteering !== 0
        ? (
            controllerSteering > 0
                ? -1
                : 1
        )
        : (
            right()
                ? -1
                : 1
        );

    // ----------------------------------------------------
    // MARIO KART STYLE DRIFTING
    // ----------------------------------------------------
    //
    // KARTS:
    // Outward drift
    //
    // BIKES:
    // Inward drift
    //
    // Our movement angle is separated from the
    // vehicle's facing angle to create the slide.
    // ----------------------------------------------------

    const isBike =
    selectedBike !== "none";

const driftAngle =
    0.34;


    if (isBike) {

    // ================================================
    // BIKE - INWARD DRIFT
    // ================================================

    moveAngle +=
        turnDirection *
        driftAngle;

    // Keep the bike visually facing into the turn.
kart.rotation.y =
    player.angle -
    Math.PI / 2;
        
} else {
        
        // ================================================
        // KART - OUTWARD DRIFT
        // ================================================

        moveAngle -=
            turnDirection *
            driftAngle;
    }
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

    // --------------------------------------------------------
// TRACK COLLISION
// --------------------------------------------------------

const leavingOasisSpiral =
    selectedTrack === "3" &&
    player.trackIndex >= 40 &&
    player.trackIndex <= 88 &&
    getTrackHeight(player.trackIndex) > 0.5;

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

} else if (
    leavingOasisSpiral
) {

    // Jump off the elevated spiral.
    player.x =
        newX;

    player.z =
        newZ;

    player.airborne =
    true;

player.verticalVelocity =
    12;

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
// while staying on the player's current section
// of the track.
if (player.airborne) {

    // Gravity
    player.verticalVelocity -=
        28 * deltaTime;

    // Move vertically
    kart.position.y +=
        player.verticalVelocity *
        deltaTime;

    // Find the track underneath the kart
    const landingPoint =
        stablePlayerTrackPoint(
            player.x,
            player.z
        );

    const landingHeight =
        getTrackHeight(
            landingPoint.index
        );

    // Land on the lower track
    if (
        kart.position.y <=
        landingHeight
    ) {

        kart.position.y =
            landingHeight;

        player.airborne =
            false;

        player.verticalVelocity =
            0;

        player.trackIndex =
            landingPoint.index;
    }

} else {

    // Normal track height following
    const playerTrackPoint =
        stablePlayerTrackPoint(
            player.x,
            player.z
        );

    const targetTrackHeight =
        getTrackHeight(
            playerTrackPoint.index
        );

    kart.position.y =
        THREE.MathUtils.lerp(
            kart.position.y,
            targetTrackHeight,
            1 -
            Math.exp(
                -10 *
                deltaTime
            )
        );
}

// --------------------------------------------------------
// VEHICLE ROTATION
// --------------------------------------------------------

let visualAngle =
    player.angle;

if (player.drifting) {

    const turnDirection =
        right()
            ? -1
            : 1;

    const isBike =
        selectedBike !== "none";

    const visualDriftAngle =
        isBike
            ? 0.20
            : -0.20;

    visualAngle +=
        turnDirection *
        visualDriftAngle;
}

kart.rotation.y =
    visualAngle -
    Math.PI / 2;

// --------------------------------------------------------
// BIKE WHEELIE VISUAL
// --------------------------------------------------------

if (selectedBike !== "none") {

    const targetWheelieAngle =
        player.wheelie
            ? 0.28
            : 0;

    kart.rotation.x =
        THREE.MathUtils.lerp(
            kart.rotation.x,
            targetWheelieAngle,
            1 - Math.exp(-12 * deltaTime)
        );

} else {

    kart.rotation.x =
        THREE.MathUtils.lerp(
            kart.rotation.x,
            0,
            1 - Math.exp(-12 * deltaTime)
        );
}

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

// ============================================================
// CHAMPION BIKE UNLOCK
// ============================================================

const CHAMPION_BIKE_UNLOCK_KEY =
    "championBikeUnlocked";

function isChampionBikeUnlocked() {

    return localStorage.getItem(
        CHAMPION_BIKE_UNLOCK_KEY
    ) === "true";
}

function unlockChampionBike() {

    localStorage.setItem(
        CHAMPION_BIKE_UNLOCK_KEY,
        "true"
    );
}

function updateChampionBikeButton() {

    const button =
        document.getElementById("championBikeButton");

    if (!button) return;

    if (isChampionBikeUnlocked()) {

        button.textContent =
            "🏆 Champion Bike — UNLOCKED";

        button.classList.add("unlocked");

    } else {

        button.textContent =
            "🏆 Champion Bike — LOCKED";

        button.classList.remove("unlocked");
    }
}

updateChampionBikeButton();

// ============================================================
// SAVE TIME TRIAL TIME
// ============================================================

async function saveTimeTrialTime(track, time) {

    try {

        const playerName =
            document
                .getElementById("playerName")
                ?.value
                .trim() || "PLAYER";


        const response =
            await fetch("/api/leaderboard", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    track: String(track),

                    name:
                        playerName,

                    time:
                        time
                })
            });


        const result =
            await response.json();


        // ----------------------------------------------------
        // SERVER ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            console.error(
                "Failed to save leaderboard time:",
                result
            );

            return false;
        }


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        console.log(
            "Global leaderboard time saved:",
            result
        );

        // ----------------------------------------------------
// CHAMPION BIKE UNLOCK
// ----------------------------------------------------

// If the player's new time is in the Top 5,
// permanently unlock the Champion Bike.

if (
    Array.isArray(result.leaderboard) &&
    result.leaderboard.some(
        entry =>
            entry.name === playerName &&
            Number(entry.time) === Number(time)
    )
) {

    if (!isChampionBikeUnlocked()) {

        unlockChampionBike();

alert(
    "🏆 CHAMPION BIKE UNLOCKED!\n\n" +
    "You finished in the Top 5!\n\n" +
    "The Champion Bike is now permanently unlocked."
);

console.log(
    "🏆 CHAMPION BIKE UNLOCKED!"
);
    }
}


        // ----------------------------------------------------
        // UPDATE THE LEADERBOARD IMMEDIATELY
        // ----------------------------------------------------

        if (
            Array.isArray(
                result.leaderboard
            )
        ) {

            const trackIds = [
    "1",
    "3",
    "2",
    "4",
    "5",
    "6"
];


            const boards =
                document.querySelectorAll(
                    ".leaderboardTrack"
                );


            const trackIndex =
                trackIds.indexOf(
                    String(track)
                );


            if (
                trackIndex !== -1 &&
                boards[trackIndex]
            ) {

                const board =
                    boards[trackIndex];


                const rows =
                    board.querySelectorAll(
                        "p"
                    );


                rows.forEach(
                    (row, i) => {

                        if (
                            result.leaderboard[i] !==
                            undefined
                        ) {

                            const entry =
                                result.leaderboard[i];


                            row.textContent =
                                `${i + 1}. ${entry.name} — ${formatLeaderboardTime(entry.time)}`;

                        } else {

                            row.textContent =
                                `${i + 1}. --:--.--`;
                        }
                    }
                );
            }


            // ------------------------------------------------
            // UPDATE LOCAL CACHE
            // ------------------------------------------------

            try {

                localStorage.setItem(

                    `leaderboard_track_${track}`,

                    JSON.stringify({

                        timestamp:
                            Date.now(),

                        times:
                            result.leaderboard
                    })
                );

            } catch (cacheError) {

                console.warn(
                    "Could not update leaderboard cache:",
                    cacheError
                );
            }
        }


        return true;


    } catch (error) {

        console.error(
            "Leaderboard connection error:",
            error
        );

        return false;
    }
}

function formatLeaderboardTime(time) {
    const minutes = Math.floor(time / 60);

    const seconds =
        (time % 60)
            .toFixed(2)
            .padStart(5, "0");

    return `${minutes}:${seconds}`;
}

const playerNameInput =
    document.getElementById("playerName");

if (playerNameInput) {

    const savedName =
        localStorage.getItem("playerName");

    if (savedName) {
        playerNameInput.value = savedName;
    }

    playerNameInput.addEventListener(
        "input",
        () => {

            localStorage.setItem(
                "playerName",
                playerNameInput.value
            );

        }
    );
}

// ============================================================
// OPTIMIZED TIME TRIAL LEADERBOARD LOADING
// ============================================================

let leaderboardLoaded = false;
let leaderboardLoading = false;

const LEADERBOARD_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

async function loadTimeTrialLeaderboard(forceRefresh = false) {

    // Prevent duplicate requests
    if (leaderboardLoading) {
        return;
    }

    // If already loaded this page session, don't request again
    if (leaderboardLoaded && !forceRefresh) {
        return;
    }

    leaderboardLoading = true;

    const trackIds = ["1", "3", "2", "4", "5", "6", "7", "8", "9"];

    const boards =
        document.querySelectorAll(
            ".leaderboardTrack"
        );

    try {

        // ----------------------------------------------------
        // LOAD EACH TRACK
        // ----------------------------------------------------

        for (
            let index = 0;
            index < boards.length && index < trackIds.length;
            index++
        ) {

            const board = boards[index];

            const track = trackIds[index];

            const rows =
                board.querySelectorAll("p");

            const cacheKey =
                `leaderboard_track_${track}`;

            let times = null;

            // ------------------------------------------------
            // CHECK BROWSER CACHE
            // ------------------------------------------------

            if (!forceRefresh) {

                try {

                    const cached =
                        localStorage.getItem(
                            cacheKey
                        );

                    if (cached) {

                        const parsed =
                            JSON.parse(cached);

                        const age =
                            Date.now() -
                            parsed.timestamp;

                        if (
                            age <
                            LEADERBOARD_CACHE_TIME
                        ) {

                            times =
                                parsed.times;

                            console.log(
                                `Using cached leaderboard for track ${track}`
                            );
                        }
                    }

                } catch (cacheError) {

                    console.warn(
                        "Leaderboard cache error:",
                        cacheError
                    );
                }
            }

            // ------------------------------------------------
            // FETCH FROM SERVER IF NOT CACHED
            // ------------------------------------------------

            if (!times) {

                try {

                    const response =
                        await fetch(
                            `/api/leaderboard?track=${track}`,
                            {
                                method: "GET",
                                cache: "no-store"
                            }
                        );

                    if (!response.ok) {

                        throw new Error(
                            `Leaderboard HTTP ${response.status}`
                        );
                    }

                    const contentType =
                        response.headers.get(
                            "content-type"
                        ) || "";

                    if (
                        !contentType.includes(
                            "application/json"
                        )
                    ) {

                        const text =
                            await response.text();

                        throw new Error(
                            `Leaderboard returned non-JSON response: ${text.slice(0, 200)}`
                        );
                    }

                    times =
                        await response.json();

                    // ----------------------------------------
                    // SAVE TO BROWSER CACHE
                    // ----------------------------------------

                    try {

                        localStorage.setItem(
                            cacheKey,
                            JSON.stringify({
                                timestamp:
                                    Date.now(),

                                times:
                                    times
                            })
                        );

                    } catch (cacheError) {

                        console.warn(
                            "Could not cache leaderboard:",
                            cacheError
                        );
                    }

                } catch (error) {

                    console.error(
                        `Failed to load leaderboard for track ${track}:`,
                        error
                    );

                    times = [];
                }
            }

            // ------------------------------------------------
            // DISPLAY LEADERBOARD
            // ------------------------------------------------

            rows.forEach(
                (row, i) => {

                    if (
                        times &&
                        times[i] !== undefined
                    ) {

                        row.textContent =
                            `${i + 1}. ${times[i].name} — ${formatLeaderboardTime(times[i].time)}`;

                    } else {

                        row.textContent =
                            `${i + 1}. --:--.--`;
                    }
                }
            );
        }

        leaderboardLoaded = true;

    } catch (error) {

        console.error(
            "Leaderboard loading error:",
            error
        );

    } finally {

        leaderboardLoading = false;
    }
}

// Load leaderboard once when the game starts
loadTimeTrialLeaderboard();

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

        // ----------------------------------------------------
        // LAP COMPLETE
        // ----------------------------------------------------

        if (
            player.lap <
            TOTAL_LAPS
        ) {

            player.lap++;

            // Start looking for checkpoint 1
            // for the next lap.
            player.nextCheckpoint = 1;

            return;
        }

        // ----------------------------------------------------
        // FINAL LAP COMPLETE
        // ----------------------------------------------------

        player.finished = true;

        const currentFinishDistance =
            finishDistance;

        const previousFinishDistance =
            player.previousFinishDistance;

        let finishFraction = 1;

        if (
            previousFinishDistance >
                finishWindow &&
            currentFinishDistance <=
                finishWindow
        ) {

            const distanceChange =
                previousFinishDistance -
                currentFinishDistance;

            if (
                distanceChange > 0
            ) {

                finishFraction =
                    (
                        previousFinishDistance -
                        finishWindow
                    ) /
                    distanceChange;

                finishFraction =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            finishFraction
                        )
                    );
            }
        }

        const finishTimeNow =
            performance.now();

        const frameTime =
            player.previousFrameTime !== null
                ? finishTimeNow -
                  player.previousFrameTime
                : 0;

        player.finishTime =
            (
                finishTimeNow -
                frameTime *
                    (1 - finishFraction) -
                raceStartTime
            ) / 1000;

        if (timeTrial) {

            const track =
                selectedTrack;

            saveTimeTrialTime(
                track,
                player.finishTime
            );
        }

        boostFlame.visible =
            false;

        showFinish();
    }
}
}

// ============================================================
// RACE TIMER
// ============================================================

let raceElapsedTime = 0;
let raceStartTime = null;

// ============================================================
// RACE COUNTDOWN
// ============================================================

let raceStarted = false;

const currentUrlParams =
    new URLSearchParams(window.location.search);

let trackSelected =
    currentUrlParams.get("start") === "1";

const kartSelectScreen =
    document.getElementById(
        "kartSelectScreen"
    );

const trackSelect =
    document.getElementById(
        "trackSelect"
    );

if (trackSelected) {

    // Race is actually starting.
    // Hide both menus.

    if (trackSelect) {
        trackSelect.style.display = "none";
    }

    if (kartSelectScreen) {
        kartSelectScreen.style.display = "none";
    }

} else if (selectedTrack) {

    if (trackSelect) {
        trackSelect.style.display = "none";
    }

    if (kartSelectScreen) {
        kartSelectScreen.style.display = "none";
    }

    trackSelected = true;

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
raceStartTime = performance.now();

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

Coins:
${player.coins}/${player.maxCoins}

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
            ${player.finishTime.toFixed(3)}
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
    !player.finished &&
    raceStartTime !== null
) {

    raceElapsedTime =
        (performance.now() -
            raceStartTime) / 1000;
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

updateCoins(
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
// CHARACTER ANIMATIONS
// --------------------------------------------------------

if (characterMixer) {
    characterMixer.update(deltaTime);
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

console.log("GAME.JS REACHED BUTTON SETUP");

document.getElementById("track1Button").onclick = () => {
    window.location.href = "?track=1";
};

document.getElementById("track2Button").onclick = () => {
    window.location.href = "?track=2";
};

document.getElementById("track3Button").onclick = () => {
    window.location.href = "?track=3";
};

document.getElementById("track4Button").onclick = () => {
    window.location.href = "?track=4";
};

document.getElementById("track5Button").onclick = () => {
    window.location.href = "?track=5";
};

document.getElementById("saveSetupButton").onclick = () => {

    const kartScreen =
        document.getElementById("kartSelectScreen");

    if (kartScreen) {
        kartScreen.style.display = "none";
    }

    const trackSelect =
        document.getElementById("trackSelect");

    if (trackSelect) {
        trackSelect.style.display = "flex";
    }
};

document.getElementById("timeTrialButton").onclick = () => {
    document.getElementById("normalTracks").style.display = "none";
    document.getElementById("timeTrialTracks").style.display = "block";
};

document.getElementById("timeTrialTrack1Button").onclick = () => {
    window.location.href = "?track=1&mode=timeTrial";
};

document.getElementById("timeTrialTrack2Button").onclick = () => {
    window.location.href = "?track=2&mode=timeTrial";
};

document.getElementById("timeTrialTrack3Button").onclick = () => {
    window.location.href = "?track=3&mode=timeTrial";
};

document.getElementById("timeTrialTrack4Button").onclick = () => {
    window.location.href = "?track=4&mode=timeTrial";
};

document.getElementById("timeTrialTrack5Button").onclick = () => {
    window.location.href = "?track=5&mode=timeTrial";
};
