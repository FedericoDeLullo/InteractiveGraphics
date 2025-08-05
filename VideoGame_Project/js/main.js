// main.js
import { GameWorld } from './GameWorld.js';

let scene, camera, renderer, player;
let isFirstPerson = false;
let gameWorld;

const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(-10, 15, -10);
    scene.add(directionalLight2);

    gameWorld = new GameWorld(scene, THREE);

    const playerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 1;
    player.position.z = -15;
    scene.add(player);

    const noseGeometry = new THREE.BoxGeometry(0.2, 0.2, 1);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.z = -0.5;
    player.add(nose);

    camera.lookAt(player.position);

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const moveSpeed = 0.1;
    const rotateSpeed = 0.05;

    // Vettore per il movimento relativo alla direzione del giocatore
    const direction = new THREE.Vector3();
    player.getWorldDirection(direction); // Ottiene la direzione del giocatore

    const prevPosition = player.position.clone();

    if (keys['KeyW'] || keys['ArrowUp']) {
        player.position.add(direction.multiplyScalar(moveSpeed));
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        player.position.add(direction.multiplyScalar(-moveSpeed));
    }

    // Per muoversi a sinistra e destra, ruotiamo il vettore di direzione
    if (keys['KeyA'] || keys['ArrowLeft']) {
        const sideDirection = new THREE.Vector3();
        player.getWorldDirection(sideDirection);
        sideDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        player.position.add(sideDirection.multiplyScalar(-moveSpeed));
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        const sideDirection = new THREE.Vector3();
        player.getWorldDirection(sideDirection);
        sideDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        player.position.add(sideDirection.multiplyScalar(moveSpeed));
    }

    if (gameWorld.checkCollision(player)) {
        player.position.copy(prevPosition);
    }

    // Rotazione del giocatore (solo con i tasti freccia/AD)
    if (keys['ArrowLeft']) {
        player.rotation.y += rotateSpeed;
    }
    if (keys['ArrowRight']) {
        player.rotation.y -= rotateSpeed;
    }

    if (keys['KeyF']) {
        isFirstPerson = !isFirstPerson;
        keys['KeyF'] = false;
    }

    if (isFirstPerson) {
        camera.position.x = player.position.x;
        camera.position.y = player.position.y + 0.8;
        camera.position.z = player.position.z;
        camera.rotation.y = player.rotation.y;

        const cameraDirection = new THREE.Vector3();
        player.getWorldDirection(cameraDirection);
        camera.lookAt(
            player.position.x + cameraDirection.x,
            player.position.y + 0.8,
            player.position.z + cameraDirection.z
        );
    } else {
        camera.position.x = player.position.x;
        camera.position.y = player.position.y + 5; // Posizione più alta
        camera.position.z = player.position.z - 10; // Posizione davanti
        camera.lookAt(player.position);
    }

    renderer.render(scene, camera);
}

init();