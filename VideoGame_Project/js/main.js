// main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/PointerLockControls.js';
import { GameWorld } from './GameWorld.js';
import { Inventory } from './Inventory.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let controls;
let gameWorld;
let inventory;
let healthBarContainer;
let weaponModels = [];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isFlying = false;
let canJump = false;
let isCollecting = false;
let isInventoryOpen = false;
let isOpeningChest = false;

let isAttacking = false;
const attackCooldown = 0.5;
let lastAttackTime = 0;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

const playerSize = 2;

let currentWeapon = {
    damage: 5,
    range: 15,
    name: 'Pugno'
};

function loadModels() {
    const loader = new GLTFLoader();
    const weaponPaths = [
        // Aggiunto il fattore di scala per ogni modello
        { path: 'models/pistol.glb', stats: { damage: 10, range: 20, name: 'Pistola', scale: 0.5 } },
        { path: 'models/rifle.glb', stats: { damage: 20, range: 40, name: 'Fucile', scale: 1.5} },
        { path: 'models/rocketLauncher.glb', stats: { damage: 50, range: 60, name: 'Lanciarazzi', scale: 0.2 } }
    ];

    let loadedCount = 0;
    weaponPaths.forEach(weapon => {
        loader.load(weapon.path, (gltf) => {
            const model = gltf.scene;
            model.damage = weapon.stats.damage;
            model.range = weapon.stats.range;
            model.name = weapon.stats.name;
            model.scale.set(weapon.stats.scale, weapon.stats.scale, weapon.stats.scale); // Applica la scala
            weaponModels.push(model);
            loadedCount++;

            if (loadedCount === weaponPaths.length) {
                console.log("Tutti i modelli delle armi sono stati caricati.");
                init();
            }
        }, undefined, (error) => {
            console.error(`Errore nel caricamento del modello ${weapon.path}:`, error);
        });
    });
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = playerSize / 2;
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

    healthBarContainer = document.getElementById('health-bar-container');
    gameWorld = new GameWorld(scene, healthBarContainer, weaponModels);

    // Nota: l'inventario viene inizializzato senza una callback per l'equipaggiamento manuale,
    // in linea con la logica di equipaggiamento automatico attuale.
    inventory = new Inventory('inventory-items');

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
            if (!isInventoryOpen) {
                blocker.style.display = 'flex';
                instructions.style.display = '';
            }
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
            case 'KeyE':
                isCollecting = true;
                break;
            case 'KeyI':
                if (controls.isLocked) {
                    controls.unlock();
                    isInventoryOpen = true;
                    document.getElementById('inventory-container').style.display = 'block';
                    inventory.render();
                } else if (isInventoryOpen) {
                    controls.lock();
                    isInventoryOpen = false;
                    document.getElementById('inventory-container').style.display = 'none';
                }
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
            case 'KeyE':
                isCollecting = false;
                break;
        }
    };

    const onMouseDown = (event) => {
        if (event.button === 0 && controls.isLocked && !isInventoryOpen) {
            isAttacking = true;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);

    document.addEventListener('keydown', (event) => {
        if (event.code === 'KeyX' && controls.isLocked) {
            const playerPos = controls.getObject().position;
            for (const chest of gameWorld.chests) {
                const dist = chest.group.position.distanceTo(playerPos);
                if (dist < 6 && !chest.isOpen) {
                    isOpeningChest = true;
                    chest.open((item) => {
                        if (item) {
                            gameWorld.collectibleItems.push(item);
                        }
                        isOpeningChest = false;
                    });
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
    const elapsedTime = clock.getElapsedTime();

    if (controls.isLocked && !isInventoryOpen) {
        const acceleration = 500.0;
        const drag = 20.0;
        const flySpeed = 25.0;
        const playerHeight = playerSize;

        velocity.x -= velocity.x * drag * delta;
        velocity.z -= velocity.z * drag * delta;

        if (isOpeningChest) {
            velocity.y = 0;
        } else if (isFlying) {
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

        if (!isFlying && !isOpeningChest) {
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

        if (isAttacking && elapsedTime - lastAttackTime > attackCooldown) {
            const raycaster = new THREE.Raycaster();
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            raycaster.set(camera.position, cameraDirection);

            const aliveEnemies = gameWorld.enemies.filter(e => e.isAlive);
            const enemyMeshes = aliveEnemies.map(e => e.mesh);

            const intersects = raycaster.intersectObjects(enemyMeshes, true);

            if (intersects.length > 0) {
                const firstIntersection = intersects[0];
                if (firstIntersection.distance <= currentWeapon.range) {
                    const hitEnemy = aliveEnemies.find(e => e.mesh === firstIntersection.object);
                    if (hitEnemy) {
                        hitEnemy.takeDamage(currentWeapon.damage);

                        if (!hitEnemy.isAlive) {
                            gameWorld.scene.remove(hitEnemy.group);
                            gameWorld.enemies = gameWorld.enemies.filter(e => e !== hitEnemy);
                        }
                    }
                }
            }
            lastAttackTime = elapsedTime;
            isAttacking = false;
        }

        gameWorld.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.updateHealthBar(camera, renderer);
            }
        });
    }

    const playerPos = controls.getObject().position;
    const interactMessage = document.getElementById('interactive-message');
    const collectMessage = document.getElementById('collect-message');
    const notification = document.getElementById('notification-message');

    let nearChest = false;
    let nearCollectible = false;
    let collectibleToCollect = null;

    for (const chest of gameWorld.chests) {
        const dist = chest.group.position.distanceTo(playerPos);
        if (dist < 6 && !chest.isOpen) {
            nearChest = true;
            break;
        }
    }

    for (const item of gameWorld.collectibleItems) {
        const dist = item.position.distanceTo(playerPos);
        if (dist < 6) {
            nearCollectible = true;
            collectibleToCollect = item;
            break;
        }
    }

    if (interactMessage) {
        if (nearChest && controls.isLocked) {
            interactMessage.style.display = 'block';
        } else {
            interactMessage.style.display = 'none';
        }
    }

    if (collectMessage) {
        if (nearCollectible && controls.isLocked) {
            collectMessage.style.display = 'block';
            if (isCollecting) {
                // TROVA IL MODELLO ORIGINALE PRE-CARICATO
                const originalModel = weaponModels.find(m => m.name === collectibleToCollect.name);

                // Crea l'oggetto dati per l'inventario usando il modello originale
                const itemData = {
                    name: originalModel.name,
                    damage: originalModel.damage,
                    range: originalModel.range,
                    model: originalModel
                };
                inventory.addItem(itemData);

                // Aggiorna l'arma equipaggiata automaticamente
                if (itemData.damage !== undefined && itemData.range !== undefined) {
                    currentWeapon.damage = itemData.damage;
                    currentWeapon.range = itemData.range;
                    currentWeapon.name = itemData.name;
                    console.log(`Hai equipaggiato una nuova arma! Danno: ${currentWeapon.damage}, Portata: ${currentWeapon.range}`);

                    if (notification) {
                        notification.innerHTML = `Hai equipaggiato una nuova arma!<br>Danno: ${currentWeapon.damage}, Portata: ${currentWeapon.range}`;
                        notification.style.display = 'block';
                        setTimeout(() => {
                            notification.style.display = 'none';
                        }, 4000);
                    }
                }

                // Rimuovi l'oggetto originale dal mondo di gioco
                gameWorld.scene.remove(collectibleToCollect);
                gameWorld.collectibleItems = gameWorld.collectibleItems.filter(item => item !== collectibleToCollect);

                isCollecting = false;
                collectMessage.style.display = 'none';
            }
        } else {
            collectMessage.style.display = 'none';
        }
    }

    if (isInventoryOpen) {
        inventory.animate();
    }

    renderer.render(scene, camera);
}

loadModels();