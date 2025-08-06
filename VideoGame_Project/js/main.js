// main.js
import * as THREE from 'https://unpkg.com/three@0.126.0/build/three.module.js';
import { GameWorld } from './GameWorld.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, player;
let isFirstPerson = false;
let gameWorld;
let score = 0;
let scoreElement;

let mixer;
let actions = {};
let activeAction;
let previousAction;

const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

const clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();

    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const cubeTexture = cubeTextureLoader.load([
        './skybox/right.jpg',
        './skybox/left.jpg',
        './skybox/top.jpg',
        './skybox/bottom.jpg',
        './skybox/front.jpg',
        './skybox/back.jpg'
    ]);
    scene.background = cubeTexture;
    scene.environment = cubeTexture;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.outputEncoding = THREE.sRGBEncoding;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-3, 10, -10);
    scene.add(dirLight);

    gameWorld = new GameWorld(scene);

    scoreElement = document.getElementById('score');

    const manager = new THREE.LoadingManager();
    const loader = new GLTFLoader(manager);

    loader.load('./models/house.glb', (gltf) => {
        const house = gltf.scene;
        scene.add(house);
        gameWorld.walls.push(house);
    }, undefined, (error) => {
        console.error(error);
    });

    loader.load('./models/character.glb', (gltf) => {
        player = gltf.scene;
        player.scale.set(2, 2, 2);
        player.position.set(0, 0.5, -15);
        player.rotation.y = Math.PI;

        mixer = new THREE.AnimationMixer(player);
        scene.add(player);

        if (gltf.animations.length > 0) {
            // Usiamo il nome esatto 'Animation' per l'azione statica
            actions['Animation'] = mixer.clipAction(gltf.animations[0]);
        }

        loader.load('./models/walk.glb', (gltfAnim) => {
            const clip = gltfAnim.animations[0];
            if (clip) {
                // Usiamo il nome esatto 'Armature|CINEMA_4D_Main|Layer0' per la camminata
                actions['Armature|CINEMA_4D_Main|Layer0'] = mixer.clipAction(clip);
            }
        });

    }, undefined, (error) => {
        console.error('An error happened while loading the character model.', error);
    });

    manager.onLoad = () => {
        console.log('Tutti gli asset sono stati caricati.');
        // Impostiamo l'animazione di default (statica)
        setAction('Animation');
        animate();
    };

    manager.onError = (url) => {
        console.error('Si è verificato un errore durante il caricamento di: ' + url);
    };
}

function setAction(name) {
    if (activeAction && activeAction === actions[name]) return;

    previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction) {
        previousAction.fadeOut(0.2);
    }

    if (activeAction) {
        activeAction.reset().fadeIn(0.2).play();
    }
}

function animate() {
    requestAnimationFrame(animate);

    const moveSpeed = 0.1;
    const rotateSpeed = 0.05;

    const delta = clock.getDelta();

    const direction = new THREE.Vector3();
    if (player) {
        player.getWorldDirection(direction);
    } else {
        return;
    }

    const prevPosition = player.position.clone();

    const isMovingForward = keys['KeyW'] || keys['ArrowUp'];
    const isMovingBackward = keys['KeyS'] || keys['ArrowDown'];

    if (isMovingForward || isMovingBackward) {
        setAction('Armature|CINEMA_4D_Main|Layer0');
    } else {
        setAction('Animation');
    }

    if (isMovingForward) {
        player.position.add(direction.multiplyScalar(moveSpeed));
    }
    if (isMovingBackward) {
        player.position.add(direction.multiplyScalar(-moveSpeed));
    }

    if (keys['KeyA'] || keys['ArrowLeft']) {
        player.rotation.y += rotateSpeed;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        player.rotation.y -= rotateSpeed;
    }

    if (gameWorld.checkCollision(player)) {
        player.position.copy(prevPosition);
    }

    const collidedCoin = gameWorld.checkCoinCollision(player);
    if (collidedCoin) {
        score += 1;
        scoreElement.textContent = `Score: ${score}`;
        scene.remove(collidedCoin);
        const coinIndex = gameWorld.coins.indexOf(collidedCoin);
        if (coinIndex > -1) {
            gameWorld.coins.splice(coinIndex, 1);
        }
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
        camera.position.y = player.position.y + 5;
        camera.position.z = player.position.z - 10;
        camera.lookAt(player.position);
    }

    if (mixer) {
        mixer.update(delta);
    }

    renderer.render(scene, camera);
}

init();