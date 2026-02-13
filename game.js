let scene, camera, renderer;
let clock = new THREE.Clock();
let sun;
let blocks = [];
let blockMap = new Map();

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let keys = {};

let selectedBlock = 1;

const BLOCK = {
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4
};

const WORLD_SIZE = 40;
const BLOCK_SIZE = 1;

document.getElementById("startBtn").onclick = () => {
    document.getElementById("menu").style.display = "none";
    document.getElementById("hud").style.display = "block";
    init();
};

function init() {

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    camera.position.set(20, 20, 20);

    // Sun
    sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    scene.add(sun);

    scene.add(new THREE.AmbientLight(0x404040));

    generateWorld();
    setupControls();

    animate();
}

function generateWorld() {

    const geometry = new THREE.BoxGeometry(1,1,1);

    const materials = {
        1: new THREE.MeshLambertMaterial({ color: 0x3cb043 }),
        2: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
        3: new THREE.MeshLambertMaterial({ color: 0x777777 }),
        4: new THREE.MeshLambertMaterial({ color: 0x8B5A2B })
    };

    for (let x = 0; x < WORLD_SIZE; x++) {
        for (let z = 0; z < WORLD_SIZE; z++) {

            let height = Math.floor(
                5 + Math.sin(x * 0.2) * 2 + Math.cos(z * 0.2) * 2
            );

            for (let y = 0; y < height; y++) {

                let type = BLOCK.DIRT;

                if (y === height - 1) type = BLOCK.GRASS;
                if (y < height - 3) type = BLOCK.STONE;

                createBlock(x, y, z, type, geometry, materials[type]);
            }
        }
    }
}

function createBlock(x, y, z, type, geometry, material) {

    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.type = type;

    scene.add(mesh);
    blocks.push(mesh);

    blockMap.set(`${x},${y},${z}`, mesh);
}

function setupControls() {

    document.body.addEventListener("click", () => {
        document.body.requestPointerLock();
    });

    document.addEventListener("mousemove", (e) => {
        if (document.pointerLockElement === document.body) {
            camera.rotation.y -= e.movementX * 0.002;
            camera.rotation.x -= e.movementY * 0.002;
            camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
        }
    });

    document.addEventListener("keydown", (e) => keys[e.code] = true);
    document.addEventListener("keyup", (e) => keys[e.code] = false);

    document.addEventListener("mousedown", onMouseClick);
}

function onMouseClick(e) {

    if (document.pointerLockElement !== document.body) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0,0), camera);

    const intersects = raycaster.intersectObjects(blocks);

    if (intersects.length === 0) return;

    const hit = intersects[0];

    if (e.button === 0) {
        removeBlock(hit.object);
    }

    if (e.button === 2) {
        placeBlock(hit);
    }
}

function removeBlock(block) {

    let pos = block.position;
    blockMap.delete(`${pos.x},${pos.y},${pos.z}`);

    scene.remove(block);
    blocks = blocks.filter(b => b !== block);
}

function placeBlock(hit) {

    const normal = hit.face.normal;
    const pos = hit.object.position.clone().add(normal);

    if (blockMap.has(`${pos.x},${pos.y},${pos.z}`)) return;

    const geometry = new THREE.BoxGeometry(1,1,1);
    const material = new THREE.MeshLambertMaterial({ color: 0x3cb043 });

    createBlock(pos.x, pos.y, pos.z, selectedBlock, geometry, material);
}

function updatePlayer(delta) {

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(keys["KeyW"]) - Number(keys["KeyS"]);
    direction.x = Number(keys["KeyD"]) - Number(keys["KeyA"]);
    direction.normalize();

    if (keys["KeyW"] || keys["KeyS"])
        velocity.z -= direction.z * 20.0 * delta;

    if (keys["KeyA"] || keys["KeyD"])
        velocity.x -= direction.x * 20.0 * delta;

    camera.translateX(velocity.x * delta);
    camera.translateZ(velocity.z * delta);

    velocity.y -= 30 * delta;
    camera.position.y += velocity.y * delta;

    if (camera.position.y < 10) {
        velocity.y = 0;
        camera.position.y = 10;
    }

    if (keys["Space"] && camera.position.y <= 10.01) {
        velocity.y = 12;
    }
}

function animate() {

    requestAnimationFrame(animate);

    let delta = clock.getDelta();

    updatePlayer(delta);

    renderer.render(scene, camera);
}
