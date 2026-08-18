import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";


// ============================================================
// CANVAS
// ============================================================

const canvas = document.getElementById("viewer");


// ============================================================
// RENDERER
// ============================================================

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


// Iluminación y color más cinematográficos
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;


// ============================================================
// SCENE
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x111118);


// ============================================================
// CAMERA
// ============================================================

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
);

camera.position.set(
    3,
    2.5,
    5
);


// ============================================================
// CONTROLS
// ============================================================

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.enablePan = false;

controls.minDistance = 1;
controls.maxDistance = 15;

controls.target.set(
    0,
    1,
    0
);


// ============================================================
// LIGHTING
// ============================================================


// Luz principal
//
// Esta es la que crea la iluminación direccional
// parecida a la imagen que mostraste.

const keyLight = new THREE.DirectionalLight(
    0xffffff,
    3.0
);

keyLight.position.set(
    4,
    7,
    5
);

keyLight.castShadow = true;


// Configuración de sombras

keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;

keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 30;

keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -5;

keyLight.shadow.bias = -0.0005;

scene.add(keyLight);


// ============================================================
// FILL LIGHT
// ============================================================

// Una luz ambiental muy suave.
// Evita que las zonas oscuras sean completamente negras.

const fillLight = new THREE.HemisphereLight(
    0xb8b8d8,
    0x202025,
    1.2
);

scene.add(fillLight);


// ============================================================
// RIM LIGHT
// ============================================================

// Una pequeña luz trasera para separar el modelo
// del fondo.

const rimLight = new THREE.DirectionalLight(
    0xaaaadd,
    0.7
);

rimLight.position.set(
    -4,
    4,
    -5
);

scene.add(rimLight);


// ============================================================
// FLOOR
// ============================================================

// Por ahora tenemos un suelo invisible visualmente,
// pero que puede recibir sombras.

const floorGeometry = new THREE.PlaneGeometry(
    30,
    30
);

const floorMaterial = new THREE.ShadowMaterial({
    opacity: 0.18
});

const floor = new THREE.Mesh(
    floorGeometry,
    floorMaterial
);

floor.rotation.x = -Math.PI / 2;

floor.position.y = 0;

floor.receiveShadow = true;

scene.add(floor);


// ============================================================
// MODEL
// ============================================================

let model = null;


// ============================================================
// ANIMATION
// ============================================================

let mixer = null;

const clock = new THREE.Clock();


// ============================================================
// GLTF LOADER
// ============================================================

const loader = new GLTFLoader();

loader.load(
    "./models/player.glb",

    (gltf) => {

        model = gltf.scene;

        scene.add(model);


        // ----------------------------------------------------
        // Preparar sombras
        // ----------------------------------------------------

        model.traverse((object) => {

            if (object.isMesh) {

                object.castShadow = true;
                object.receiveShadow = true;

            }

        });


        // ----------------------------------------------------
        // Animaciones
        // ----------------------------------------------------

        if (gltf.animations && gltf.animations.length > 0) {

            mixer = new THREE.AnimationMixer(model);


            // Reproducimos la primera animación
            // encontrada automáticamente.

            const animation = gltf.animations[0];

            const action = mixer.clipAction(animation);

            action.play();


            console.log(
                "Animación reproducida:",
                animation.name
            );


            console.log(
                "Animaciones disponibles:",
                gltf.animations.map(
                    animation => animation.name
                )
            );

        } else {

            console.log(
                "El modelo no contiene animaciones."
            );

        }


        // ----------------------------------------------------
        // Centrar modelo
        // ----------------------------------------------------

        centerModel(model);

    },

    (progress) => {

        if (progress.total > 0) {

            const percentage =
                (progress.loaded / progress.total) * 100;

            console.log(
                `Cargando player: ${percentage.toFixed(0)}%`
            );

        }

    },

    (error) => {

        console.error(
            "No se pudo cargar player.glb:",
            error
        );

    }
);


// ============================================================
// CENTER MODEL
// ============================================================

function centerModel(object) {

    const box = new THREE.Box3().setFromObject(object);

    const center = new THREE.Vector3();

    box.getCenter(center);

    object.position.x -= center.x;
    object.position.z -= center.z;


    // --------------------------------------------------------
    // Colocar los pies sobre el suelo
    // --------------------------------------------------------

    const newBox = new THREE.Box3().setFromObject(object);

    object.position.y -= newBox.min.y;


    // --------------------------------------------------------
    // Calcular tamaño
    // --------------------------------------------------------

    const size = new THREE.Vector3();

    newBox.getSize(size);

    const maxDimension =
        Math.max(
            size.x,
            size.y,
            size.z
        );


    // --------------------------------------------------------
    // Ajustar cámara
    // --------------------------------------------------------

    const distance =
        maxDimension * 2.8;

    camera.position.set(
        distance * 0.9,
        maxDimension * 0.7,
        distance
    );

    controls.target.set(
        0,
        maxDimension * 0.5,
        0
    );

    controls.update();

}


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

    }
);


// ============================================================
// ANIMATION LOOP
// ============================================================

function animate() {

    requestAnimationFrame(animate);


    const delta =
        clock.getDelta();


    // Actualizar animaciones

    if (mixer) {

        mixer.update(delta);

    }


    // Actualizar cámara

    controls.update();


    // Render

    renderer.render(
        scene,
        camera
    );

}

animate();
