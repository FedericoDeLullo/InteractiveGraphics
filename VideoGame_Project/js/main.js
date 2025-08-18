import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/PointerLockControls.js';
import { GameWorld } from './GameWorld.js';
import { Inventory } from './Inventory.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';
import { WeaponHandler } from './WeaponHandler.js';

// --- Configurazione del Gioco (Centralizzata) ---
const config = {
    player: {
        health: 100,
        size: 2,
        jumpVelocity: 30,
        acceleration: 500.0,
        drag: 20.0,
        gravity: 9.8 * 10.0
    },
    weapons: {
        fist: {
            damage: 5,
            range: 15,
            name: 'Pugno',
            imagePath: null,
            fireMode: 'single'
        },
        models: [
            { path: 'models/pistol.glb', imagePath: 'img/pistol.png', stats: { damage: 10, range: 20, name: 'Pistola', scale: 0.3, fireMode: 'single' } },
            { path: 'models/rifle.glb', imagePath: 'img/rifle.png', stats: { damage: 20, range: 40, name: 'Fucile', scale: 2.2, fireMode: 'auto' } },
            { path: 'models/rocketLauncher.glb', imagePath: 'img/rocketLauncher.png', stats: { damage: 50, range: 60, name: 'Lanciarazzi', scale: 0.2, fireMode: 'single' } }
        ]
    },
    gameplay: {
        attackCooldown: 0.1,
        collectibleRange: 6,
        chestRange: 6
    }
};

// --- Variabili di Gioco ---
let scene, camera, renderer;
let controls;
let gameWorld;
let inventory;
let enemyHealthBarContainer;
let weaponModels = [];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isShooting = false;
let isInventoryOpen = false;
let isOpeningChest = false;
let isGameOver = false;
let isGameWon = false;

let lastAttackTime = 0;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();

let playerHealth = config.player.health;
const playerSize = config.player.size;
let crosshair = null;

let currentWeapon = { ...config.weapons.fist };
let equippedWeaponMesh = null;
let weaponHandler;

// --- Riferimenti al DOM ---
const victoryScreen = document.getElementById('victory-screen');
const victoryRestartButton = document.getElementById('victory-restart-button');
const victoryExitButton = document.getElementById('victory-exit-button');
const gameOverScreen = document.getElementById('game-over-screen');
const restartButton = document.getElementById('restart-button');
const exitButton = document.getElementById('exit-button');
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');
const interactMessage = document.getElementById('interactive-message');
const collectMessage = document.getElementById('collect-message');
const notification = document.getElementById('notification-message');

// --- Funzioni di Utilità ---
function showNotification(message) {
    if (notification) {
        notification.innerHTML = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }
}

function updatePlayerHealth(damage) {
    playerHealth = Math.max(0, playerHealth - damage);
    const healthBar = document.getElementById('player-health-bar-inner');
    if (healthBar) {
        healthBar.style.width = `${playerHealth}%`;
        if (playerHealth <= 0) {
            showGameOverScreen();
        }
    }
}

function updateEquippedWeaponHUD() {
    const nameSpan = document.getElementById('equipped-weapon-name');
    const damageSpan = document.getElementById('equipped-weapon-damage');
    const rangeSpan = document.getElementById('equipped-weapon-range');
    const imageDiv = document.getElementById('equipped-weapon-image');

    if (nameSpan) nameSpan.textContent = currentWeapon.name;
    if (damageSpan) damageSpan.textContent = currentWeapon.damage;
    if (rangeSpan) rangeSpan.textContent = currentWeapon.range;

    if (imageDiv) {
        imageDiv.innerHTML = currentWeapon.imagePath ? `<img src="${currentWeapon.imagePath}" alt="${currentWeapon.name}">` : '';
    }
    if (crosshair) {
        crosshair.classList.toggle('hidden', currentWeapon.name === config.weapons.fist.name);
    }
}

function showGameOverScreen() {
    isGameOver = true;
    gameOverScreen.style.display = 'flex';
    blocker.style.display = 'flex';
    if (controls.isLocked) {
        controls.unlock();
    }
    if (crosshair) {
        crosshair.classList.add('hidden');
    }
}

function showVictoryScreen() {
    isGameWon = true;
    victoryScreen.style.display = 'flex';
    blocker.style.display = 'flex';
    if (controls.isLocked) {
        controls.unlock();
    }
    if (crosshair) {
        crosshair.classList.add('hidden');
    }
}

// --- Funzioni di Caricamento e Inizializzazione ---
function loadModels() {
    const loader = new GLTFLoader();
    let loadedCount = 0;
    const modelsToLoad = config.weapons.models;

    modelsToLoad.forEach(weapon => {
        loader.load(weapon.path, (gltf) => {
            const model = gltf.scene;
            model.damage = weapon.stats.damage;
            model.range = weapon.stats.range;
            model.name = weapon.stats.name;
            model.imagePath = weapon.imagePath;
            model.fireMode = weapon.stats.fireMode;

            model.scale.set(weapon.stats.scale, weapon.stats.scale, weapon.stats.scale);

            weaponModels.push(model);
            loadedCount++;

            if (loadedCount === modelsToLoad.length) {
                console.log("Tutti i modelli delle armi sono stati caricati.");
                init();
            }
        }, undefined, (error) => {
            console.error(`Errore nel caricamento del modello ${weapon.path}:`, error);
        });
    });
}

function init() {
    setupSceneAndCamera();
    setupGameObjects();
    setupEventListeners();
    updateEquippedWeaponHUD();
    animate();
}

function setupSceneAndCamera() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = playerSize / 2;
    camera.position.z = 20;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-3, 10, -10);
    scene.add(dirLight);

    const playerHitbox = new THREE.Mesh(new THREE.BoxGeometry(playerSize, playerSize, playerSize), new THREE.MeshBasicMaterial({ visible: false }));
    playerHitbox.name = 'playerHitbox';
    camera.add(playerHitbox);
}

function setupGameObjects() {
    enemyHealthBarContainer = document.getElementById('enemy-health-bar-container');
    const playerHitbox = camera.children.find(child => child.name === 'playerHitbox');

    gameWorld = new GameWorld(scene, enemyHealthBarContainer, weaponModels, camera, [playerHitbox], updatePlayerHealth);
    const collidableObjects = [...gameWorld.collidableObjects];
    weaponHandler = new WeaponHandler(scene, camera, gameWorld, currentWeapon, collidableObjects);

    inventory = new Inventory('inventory-items');
    crosshair = document.getElementById('crosshair');

    inventory.onDiscardCallback = (discardedItem) => {
        const playerPosition = controls.getObject().position.clone();
        const originalWeaponModel = weaponModels.find(w => w.name === discardedItem.name);
        if (originalWeaponModel) {
            const newWeapon = originalWeaponModel.clone();
            newWeapon.position.copy(playerPosition);
            newWeapon.position.y -= 0.5;
            Object.assign(newWeapon, discardedItem);
            gameWorld.scene.add(newWeapon);
            gameWorld.collectibleItems.push(newWeapon);
        }

        if (equippedWeaponMesh && equippedWeaponMesh.name === discardedItem.name) {
            camera.remove(equippedWeaponMesh);
            equippedWeaponMesh = null;
            weaponHandler.equippedWeaponMesh = null;
            currentWeapon = { ...config.weapons.fist };
            updateEquippedWeaponHUD();
            showNotification(`Hai scartato ${discardedItem.name}. Ora usi il pugno.`);
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

            switch (equippedItem.name) {
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
            Object.assign(currentWeapon, equippedItem);
            weaponHandler.currentWeapon = currentWeapon;
            weaponHandler.equippedWeaponMesh = equippedWeaponMesh;
            updateEquippedWeaponHUD();
            showNotification(`Hai equipaggiato ${equippedItem.name}!<br>Danno: ${currentWeapon.damage}, Portata: ${currentWeapon.range}`);
        }

        controls.lock();
        isInventoryOpen = false;
        document.getElementById('inventory-container').style.display = 'none';
    };

    controls = new PointerLockControls(camera, document.body);
    if (instructions && blocker) {
        instructions.addEventListener('click', () => controls.lock());
        controls.addEventListener('lock', () => {
            instructions.style.display = 'none';
            blocker.style.display = 'none';
        });
        controls.addEventListener('unlock', () => {
            if (!isInventoryOpen && !isGameOver && !isGameWon) {
                blocker.style.display = 'flex';
                instructions.style.display = '';
            }
        });
    }
    scene.add(controls.getObject());
}

// --- Gestione Eventi Unificata ---
function setupEventListeners() {
    document.addEventListener('keydown', (event) => {
        if (isGameOver || isGameWon) return;
        switch (event.code) {
            case 'ArrowUp':
                moveForward = true;
                break;
            case 'ArrowLeft':
                moveLeft = true;
                break;
            case 'ArrowDown':
                moveBackward = true;
                break;
            case 'ArrowRight':
                moveRight = true;
                break;
            case 'Space':
                if (canJump && !isOpeningChest) {
                    velocity.y += config.player.jumpVelocity;
                    canJump = false;
                }
                break;
            case 'KeyI':
                toggleInventory();
                break;
            case 'KeyX':
                if (controls.isLocked) {
                    interactWithObject();
                }
                break;
        }
    });

    document.addEventListener('keyup', (event) => {
        if (isGameOver || isGameWon) return;
        switch (event.code) {
            case 'ArrowUp':
                moveForward = false;
                break;
            case 'ArrowLeft':
                moveLeft = false;
                break;
            case 'ArrowDown':
                moveBackward = false;
                break;
            case 'ArrowRight':
                moveRight = false;
                break;
        }
    });

    document.addEventListener('mousedown', (event) => {
        if (isGameOver || isGameWon) return;
        if (event.button === 0 && controls.isLocked && !isInventoryOpen) {
            isShooting = true;
        }
    });

    document.addEventListener('mouseup', (event) => {
        if (isGameOver || isGameWon) return;
        if (event.button === 0) {
            isShooting = false;
        }
    });

    if (restartButton) restartButton.addEventListener('click', () => location.reload());
    if (exitButton) exitButton.addEventListener('click', () => window.close());
    if (victoryRestartButton) victoryRestartButton.addEventListener('click', () => location.reload());
    if (victoryExitButton) victoryExitButton.addEventListener('click', () => window.close());
}

function toggleInventory() {
    isInventoryOpen = !isInventoryOpen;
    if (isInventoryOpen) {
        controls.unlock();
        document.getElementById('inventory-container').style.display = 'block';
        inventory.render();
    } else {
        controls.lock();
        document.getElementById('inventory-container').style.display = 'none';
    }
}

function interactWithObject() {
    const playerPos = controls.getObject().position;

    for (const chest of gameWorld.chests) {
        const dist = chest.group.position.distanceTo(playerPos);
        if (dist < config.gameplay.chestRange && !chest.isOpen && !isOpeningChest) {
            isOpeningChest = true;
            chest.open((item) => {
                if (item) {
                    gameWorld.collectibleItems.push(item);
                }
                isOpeningChest = false;
            });
            return;
        }
    }

    for (const item of gameWorld.collectibleItems) {
        const dist = item.position.distanceTo(playerPos);
        if (dist < config.gameplay.collectibleRange) {
            const originalModelData = config.weapons.models.find(m => m.stats.name === item.name);
            if (originalModelData) {
                const itemData = {
                    name: item.name,
                    damage: item.damage,
                    range: item.range,
                    imagePath: originalModelData.imagePath,
                    fireMode: originalModelData.stats.fireMode
                };
                inventory.addItem(itemData);
                if (!equippedWeaponMesh) {
                    inventory.onEquipCallback(itemData);
                }
                gameWorld.scene.remove(item);
                gameWorld.collectibleItems = gameWorld.collectibleItems.filter(i => i !== item);
                showNotification(`Hai raccolto ${item.name}!`);
            }
            return;
        }
    }
}

// --- Loop di Animazione ---
function animate() {
    requestAnimationFrame(animate);

    if (isGameOver || isGameWon) {
        return;
    }

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (gameWorld.enemies.length === 0) {
        showVictoryScreen();
        return;
    }

    if (controls.isLocked && !isInventoryOpen) {
        updatePlayerMovement(delta);
        updateShooting(elapsedTime);
        gameWorld.update(delta, controls.getObject().position, camera, renderer);
    }

    weaponHandler.update(delta);
    updateInteractionMessages();
    renderer.render(scene, camera);
}

// --- Logica di Movimento e Collisioni (Aggiornata) ---
function updatePlayerMovement(delta) {
    velocity.x -= velocity.x * config.player.drag * delta;
    velocity.z -= velocity.z * config.player.drag * delta;

    velocity.y -= isOpeningChest ? 0 : config.player.gravity * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    const speed = config.player.acceleration * delta;

    if (moveForward || moveBackward) {
        const forwardVector = new THREE.Vector3();
        camera.getWorldDirection(forwardVector);
        forwardVector.y = 0;
        forwardVector.normalize();

        let moveVector = forwardVector.clone();
        if (moveBackward) moveVector.negate();

        raycaster.set(controls.getObject().position, moveVector);
        const intersections = raycaster.intersectObjects(gameWorld.collidableObjects, true);

        if (intersections.length > 0 && intersections[0].distance < 1.0) {
            velocity.z = 0;
        } else {
            velocity.z -= direction.z * speed;
        }
    }

    if (moveLeft || moveRight) {
        const strafeVector = new THREE.Vector3();
        camera.getWorldDirection(strafeVector);
        strafeVector.cross(camera.up);
        strafeVector.y = 0;
        strafeVector.normalize();

        let moveVector = strafeVector.clone();
        if (moveLeft) moveVector.negate();

        raycaster.set(controls.getObject().position, moveVector);
        const intersections = raycaster.intersectObjects(gameWorld.collidableObjects, true);

        if (intersections.length > 0 && intersections[0].distance < 1.0) {
            velocity.x = 0;
        } else {
            velocity.x -= direction.x * speed;
        }
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    controls.getObject().position.y += velocity.y * delta;

    if (!isOpeningChest) {
        const downwardRaycaster = new THREE.Raycaster(controls.getObject().position, new THREE.Vector3(0, -1, 0), 0, playerSize);
        const groundIntersects = downwardRaycaster.intersectObjects(gameWorld.collidableObjects, true);

        if (groundIntersects.length > 0) {
            const distanceToGround = groundIntersects[0].distance;
            if (distanceToGround <= playerSize) {
                velocity.y = Math.max(0, velocity.y);
                controls.getObject().position.y = controls.getObject().position.y - distanceToGround + playerSize;
                canJump = true;
            } else {
                canJump = false;
            }
        } else {
            canJump = false;
        }
    }
}

function updateShooting(elapsedTime) {
    if (isShooting && elapsedTime - lastAttackTime > config.gameplay.attackCooldown) {
        weaponHandler.shoot();
        lastAttackTime = elapsedTime;
        if (currentWeapon.fireMode === 'single') {
            isShooting = false;
        }
    }
}

function updateInteractionMessages() {
    const playerPos = controls.getObject().position;
    let nearChest = false;
    let nearCollectible = false;

    for (const chest of gameWorld.chests) {
        if (chest.group.position.distanceTo(playerPos) < config.gameplay.chestRange && !chest.isOpen) {
            nearChest = true;
            break;
        }
    }

    for (const item of gameWorld.collectibleItems) {
        if (item.position.distanceTo(playerPos) < config.gameplay.collectibleRange) {
            nearCollectible = true;
            break;
        }
    }

    if (interactMessage) {
        interactMessage.style.display = nearChest && controls.isLocked ? 'block' : 'none';
    }
    if (collectMessage) {
        collectMessage.style.display = nearCollectible && controls.isLocked ? 'block' : 'none';
    }
}

loadModels();