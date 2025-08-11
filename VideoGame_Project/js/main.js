// main.js
import * as THREE from 'https://unpkg.com/three@0.126.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.126.0/examples/jsm/controls/PointerLockControls.js';
import { GameWorld } from './GameWorld.js';

let scene, camera, renderer;
let controls;
let gameWorld;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isFlying = false;
let canJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.7;
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-3, 10, -10);
    scene.add(dirLight);

    gameWorld = new GameWorld(scene);
    gameWorld.createHouses();

    controls = new PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    if (instructions && blocker) {
        instructions.addEventListener('click', () => {
            controls.lock();
        });

        controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        });

        controls.addEventListener('unlock', () => {
            blocker.style.display = 'block';
            instructions.style.display = '';
        });
    }

    scene.add(controls.getObject());

    const onKeyDown = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (canJump && !isFlying) {
                    velocity.y += 30;
                    canJump = false;
                }
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                isFlying = true;
                break;
        }
    };

    const onKeyUp = (event) => {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                isFlying = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('keydown', (event) => {
        if (event.code === 'KeyX' && controls.isLocked) {
            const playerPos = controls.getObject().position;
            for (const chest of gameWorld.chests) {
                const dist = chest.group.position.distanceTo(playerPos);
                if (dist < 5 && !chest.isOpen) {
                    chest.open();
                    break;
                }
            }
        }
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (controls.isLocked) {
        const acceleration = 500.0;
        const drag = 20.0;
        const flySpeed = 25.0;
        const playerHeight = 1.7;

        velocity.x -= velocity.x * drag * delta;
        velocity.z -= velocity.z * drag * delta;

        if (isFlying) {
            velocity.y = 0;
            if (moveForward || moveBackward) {
                const directionY = Number(moveForward) - Number(moveBackward);
                velocity.y = directionY * flySpeed;
            } else {
                velocity.y = 0;
            }
        } else {
            velocity.y -= 9.8 * 10.0 * delta;
        }

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (!isFlying) {
            if (moveForward || moveBackward) {
                const movementVector = new THREE.Vector3();
                camera.getWorldDirection(movementVector);
                movementVector.y = 0;
                movementVector.normalize();
                movementVector.multiplyScalar(direction.z * 0.1);

                raycaster.set(controls.getObject().position, movementVector);
                const intersections = raycaster.intersectObjects(gameWorld.collidableObjects, true);

                if (intersections.length === 0 || intersections[0].distance > 1.0) {
                    velocity.z -= direction.z * acceleration * delta;
                } else {
                    velocity.z = 0;
                }
            }

            if (moveLeft || moveRight) {
                const movementVector = new THREE.Vector3();
                camera.getWorldDirection(movementVector);
                const crossVector = new THREE.Vector3(0, 1, 0);
                movementVector.cross(crossVector);
                movementVector.multiplyScalar(-direction.x * 0.1);

                raycaster.set(controls.getObject().position, movementVector);
                const intersections = raycaster.intersectObjects(gameWorld.collidableObjects, true);

                if (intersections.length === 0 || intersections[0].distance > 1.0) {
                    velocity.x -= direction.x * acceleration * delta;
                } else {
                    velocity.x = 0;
                }
            }
        } else {
            if (direction.x !== 0) velocity.x = -direction.x * flySpeed;
            if (direction.z !== 0) velocity.z = -direction.z * flySpeed;
        }

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        controls.getObject().position.y += velocity.y * delta;

        if (!isFlying) {
            const downwardRaycaster = new THREE.Raycaster(controls.getObject().position, new THREE.Vector3(0, -1, 0), 0, playerHeight);
            const groundIntersects = downwardRaycaster.intersectObjects(gameWorld.collidableObjects, true);

            if (groundIntersects.length > 0) {
                const distanceToGround = groundIntersects[0].distance;
                if (distanceToGround <= playerHeight) {
                    velocity.y = Math.max(0, velocity.y);
                    controls.getObject().position.y = controls.getObject().position.y - distanceToGround + playerHeight;
                    canJump = true;
                } else {
                    canJump = false;
                }
            } else {
                canJump = false;
            }
        }
    }

    const playerPos = controls.getObject().position;
    let nearChest = false;
    const interactMessage = document.getElementById('interactive-message');

    for (const chest of gameWorld.chests) {
        const dist = chest.group.position.distanceTo(playerPos);
        if (dist < 5 && !chest.isOpen) {
            nearChest = true;
            break;
        }
    }

    if (nearChest && controls.isLocked) {
        interactMessage.style.display = 'block';
    } else {
        interactMessage.style.display = 'none';
    }

    renderer.render(scene, camera);
}

init();