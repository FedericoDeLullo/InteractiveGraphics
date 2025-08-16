import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/PointerLockControls.js';
import { GameWorld } from './GameWorld.js';
import { Inventory } from './Inventory.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';
import { WeaponHandler } from './WeaponHandler.js';
import { Enemy } from './Enemy.js';

let scene, camera, renderer;
let controls;
let gameWorld;
let inventory;
let enemyHealthBarContainer;
let weaponModels = [];
let weaponPaths = [];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isCollecting = false;
let isInventoryOpen = false;
let isOpeningChest = false;

let isShooting = false;
const attackCooldown = 0.1;
let lastAttackTime = 0;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

const playerSize = 2;

let crosshair = null;

let currentWeapon = {
    damage: 5,
    range: 15,
    name: 'Pugno',
    imagePath: null,
    fireMode: 'single'
};

let equippedWeaponMesh = null;
let weaponHandler;

function updateEquippedWeaponHUD() {
    const hud = document.getElementById('equipped-weapon-hud');
    const nameSpan = document.getElementById('equipped-weapon-name');
    const damageSpan = document.getElementById('equipped-weapon-damage');
    const rangeSpan = document.getElementById('equipped-weapon-range');
    const imageDiv = document.getElementById('equipped-weapon-image');

    if (currentWeapon.name === 'Pugno') {
        nameSpan.textContent = currentWeapon.name;
        damageSpan.textContent = currentWeapon.damage;
        rangeSpan.textContent = currentWeapon.range;
        imageDiv.innerHTML = '';
        if (crosshair) {
            crosshair.classList.add('hidden');
        }
    } else {
        nameSpan.textContent = currentWeapon.name;
        damageSpan.textContent = currentWeapon.damage;
        rangeSpan.textContent = currentWeapon.range;

        if (currentWeapon.imagePath) {
            imageDiv.innerHTML = `<img src="${currentWeapon.imagePath}" alt="${currentWeapon.name}">`;
        }
        if (crosshair) {
            crosshair.classList.remove('hidden');
        }
    }
}

function loadModels() {
    const loader = new GLTFLoader();
    weaponPaths = [
        { path: 'models/pistol.glb', imagePath: 'img/pistol.png', stats: { damage: 10, range: 20, name: 'Pistola', scale: 0.5, fireMode: 'single' } },
        { path: 'models/rifle.glb', imagePath: 'img/rifle.png', stats: { damage: 20, range: 40, name: 'Fucile', scale: 1.5, fireMode: 'auto' } },
        { path: 'models/rocketLauncher.glb', imagePath: 'img/rocketLauncher.png', stats: { damage: 50, range: 60, name: 'Lanciarazzi', scale: 0.2, fireMode: 'single' } }
    ];

    let loadedCount = 0;
    weaponPaths.forEach(weapon => {
        loader.load(weapon.path, (gltf) => {
            const model = gltf.scene;
            model.damage = weapon.stats.damage;
            model.range = weapon.stats.range;
            model.name = weapon.stats.name;
            model.imagePath = weapon.imagePath;
            model.scale.set(weapon.stats.scale, weapon.stats.scale, weapon.stats.scale);
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

    enemyHealthBarContainer = document.getElementById('enemy-health-bar-container');
    gameWorld = new GameWorld(scene, enemyHealthBarContainer, weaponModels);
    inventory = new Inventory('inventory-items');
    crosshair = document.getElementById('crosshair');
    weaponHandler = new WeaponHandler(scene, camera, gameWorld, currentWeapon);

    inventory.onDiscardCallback = (discardedItem) => {
        const playerPosition = controls.getObject().position.clone();
        const originalWeaponModel = weaponModels.find(w => w.name === discardedItem.name);
        if (originalWeaponModel) {
            const newWeapon = originalWeaponModel.clone();
            newWeapon.position.copy(playerPosition);
            newWeapon.position.y -= 0.5;
            newWeapon.damage = discardedItem.damage;
            newWeapon.range = discardedItem.range;
            newWeapon.name = discardedItem.name;

            gameWorld.scene.add(newWeapon);
            gameWorld.collectibleItems.push(newWeapon);
        }

        if (equippedWeaponMesh && equippedWeaponMesh.name === discardedItem.name) {
            camera.remove(equippedWeaponMesh);
            equippedWeaponMesh = null;
            weaponHandler.equippedWeaponMesh = null;
            currentWeapon = {
                damage: 5,
                range: 15,
                name: 'Pugno',
                imagePath: null,
                fireMode: 'single'
            };
            updateEquippedWeaponHUD();
            const notification = document.getElementById('notification-message');
            if (notification) {
                notification.innerHTML = `Hai scartato ${discardedItem.name}. Ora usi il pugno.`;
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 4000);
            }
        }
        controls.lock();
        isInventoryOpen = false;
        document.getElementById('inventory-container').style.display = 'none';
    };

    inventory.onEquipCallback = (equippedItem) => {
        if (equippedWeaponMesh) {
            camera.remove(equippedWeaponMesh);
        }

        const originalWeaponModel = weaponModels.find(w => w.name === equippedItem.name);
        if (originalWeaponModel) {
            equippedWeaponMesh = originalWeaponModel.clone();
            equippedWeaponMesh.name = equippedItem.name;

            switch(equippedItem.name) {
                case 'Pistola':
                    equippedWeaponMesh.position.set(0.6, -0.7, -1.2);
                    equippedWeaponMesh.rotation.set(Math.PI, 0, Math.PI);
                    break;
                case 'Fucile':
                    equippedWeaponMesh.position.set(0.5, -0.3, -0.9);
                    equippedWeaponMesh.rotation.set(0.2, Math.PI * 2, 0);
                    break;
                case 'Lanciarazzi':
                    equippedWeaponMesh.position.set(0.3, -0.8, -0.9);
                    equippedWeaponMesh.rotation.set(0, Math.PI * 2, 0);
                    break;
                default:
                    equippedWeaponMesh.position.set(0.5, -0.5, -0.8);
                    equippedWeaponMesh.rotation.set(0, 0, 0);
                    break;
            }

            camera.add(equippedWeaponMesh);
            console.log(`Hai equipaggiato l'arma: ${equippedItem.name}`);

            currentWeapon.damage = equippedItem.damage;
            currentWeapon.range = equippedItem.range;
            currentWeapon.name = equippedItem.name;
            currentWeapon.imagePath = equippedItem.imagePath;
            currentWeapon.fireMode = equippedItem.fireMode;

            weaponHandler.currentWeapon = currentWeapon;
            weaponHandler.equippedWeaponMesh = equippedWeaponMesh;
            updateEquippedWeaponHUD();

            const notification = document.getElementById('notification-message');
            if (notification) {
                notification.innerHTML = `Hai equipaggiato ${equippedItem.name}!<br>Danno: ${currentWeapon.damage}, Portata: ${currentWeapon.range}`;
                notification.style.display = 'block';
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 4000);
            }
        }

        controls.lock();
        isInventoryOpen = false;
        document.getElementById('inventory-container').style.display = 'none';
    };

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
                if (canJump && !isOpeningChest) {
                    velocity.y += 30;
                    canJump = false;
                }
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
            case 'KeyE':
                isCollecting = false;
                break;
        }
    };

    const onMouseDown = (event) => {
        if (event.button === 0 && controls.isLocked && !isInventoryOpen) {
            isShooting = true;
        }
    };

    const onMouseUp = (event) => {
        if (event.button === 0) {
            isShooting = false;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);

    document.addEventListener('keydown', (event) => {
        if (event.code === 'KeyX' && controls.isLocked) {
            const playerPos = controls.getObject().position;
            for (const chest of gameWorld.chests) {
                const dist = chest.group.position.distanceTo(playerPos);
                if (dist < 6 && !chest.isOpen && !isOpeningChest) {
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

    updateEquippedWeaponHUD();
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (controls.isLocked && !isInventoryOpen) {
        const acceleration = 500.0;
        const drag = 20.0;
        const playerHeight = playerSize;

        velocity.x -= velocity.x * drag * delta;
        velocity.z -= velocity.z * drag * delta;

        if (isOpeningChest) {
            velocity.y = 0;
        } else {
            velocity.y -= 9.8 * 10.0 * delta;
        }

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

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

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        controls.getObject().position.y += velocity.y * delta;

        if (!isOpeningChest) {
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

        if (isShooting && elapsedTime - lastAttackTime > attackCooldown) {
            if (currentWeapon.fireMode === 'auto') {
                weaponHandler.shoot();
                lastAttackTime = elapsedTime;
            } else if (currentWeapon.fireMode === 'single') {
                weaponHandler.shoot();
                lastAttackTime = elapsedTime;
                isShooting = false;
            }
        }

        gameWorld.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.updateHealthBar(camera, renderer);
            }
        });
    }

    weaponHandler.update(delta);

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
                if (collectibleToCollect) {
                    const originalModelData = weaponPaths.find(m => m.stats.name === collectibleToCollect.name);
                    const itemData = {
                        name: collectibleToCollect.name,
                        damage: collectibleToCollect.damage,
                        range: collectibleToCollect.range,
                        imagePath: originalModelData.imagePath,
                        fireMode: originalModelData.stats.fireMode
                    };
                    inventory.addItem(itemData);
                    if (!equippedWeaponMesh) {
                        inventory.onEquipCallback(itemData);
                    }
                    gameWorld.scene.remove(collectibleToCollect);
                    gameWorld.collectibleItems = gameWorld.collectibleItems.filter(item => item !== collectibleToCollect);
                }
                isCollecting = false;
                collectMessage.style.display = 'none';
            }
        } else {
            collectMessage.style.display = 'none';
        }
    }
    renderer.render(scene, camera);
}
loadModels();