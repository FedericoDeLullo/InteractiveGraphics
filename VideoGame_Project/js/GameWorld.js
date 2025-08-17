import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { HouseA } from '../houses/HouseA.js';
import { HouseB } from '../houses/HouseB.js';
import { HouseC } from '../houses/HouseC.js';
import { HouseD } from '../houses/HouseD.js';
import { Chest } from './Chest.js';
import { Enemy } from './Enemy.js';
import { EnemyDeathManager } from './EnemyDeathManager.js'; // Aggiungi il nuovo import

export class GameWorld {
    /**
     * @param {THREE.Scene} scene - La scena Three.js in cui costruire il mondo.
     * @param {HTMLElement} healthBarContainer - Il container HTML per le barre della vita dei nemici.
     * @param {object} weaponModels - L'oggetto contenente i modelli delle armi.
     * @param {THREE.Camera} playerCamera - La telecamera del giocatore.
     * @param {Array} playerObjects - Gli oggetti collidibili del giocatore.
     * @param {Function} playerDamageCallback - Funzione per infliggere danno al giocatore.
     */
    constructor(scene, healthBarContainer, weaponModels, playerCamera, playerObjects, playerDamageCallback) {
        this.scene = scene;
        this.houses = [];
        this.trees = [];
        this.collidableObjects = [];
        this.chests = [];
        this.collectibleItems = [];
        this.enemies = [];
        this.healthBarContainer = healthBarContainer;
        this.weaponModels = weaponModels;
        this.playerCamera = playerCamera;
        this.playerObjects = playerObjects;
        this.playerDamageCallback = playerDamageCallback;
        this.enemyProjectiles = [];
        // Crea l'istanza del gestore della morte dei nemici
        this.enemyDeathManager = new EnemyDeathManager(this.scene, this.collidableObjects);

        this.housePositions = {
            houseA: [
                new THREE.Vector3(-50.5, 10.2, -58),
                new THREE.Vector3(-56.5, 0.2, -58),
                new THREE.Vector3(-63.5, 0.2, -58),
                new THREE.Vector3(-63.5, 10.2, -58),
                new THREE.Vector3(-63.5, 0.2, -38),
            ],
            houseB: [
                new THREE.Vector3(50.5, 10.2, -58),
                new THREE.Vector3(56.5, 0.2, -58),
                new THREE.Vector3(63.5, 0.2, -58),
                new THREE.Vector3(63.5, 10.2, -58),
                new THREE.Vector3(63.5, 0.2, -38),
            ],
            houseC: [
                new THREE.Vector3(-50.5, 10.2, 58),
                new THREE.Vector3(-56.5, 0.2, 58),
                new THREE.Vector3(-63.5, 0.2, 58),
                new THREE.Vector3(-63.5, 10.2, 58),
                new THREE.Vector3(-63.5, 0.2, 38),
            ],
            houseD: [
                new THREE.Vector3(50.5, 10.2, 58),
                new THREE.Vector3(56.5, 0.2, 58),
                new THREE.Vector3(63.5, 0.2, 58),
                new THREE.Vector3(63.5, 10.2, 58),
                new THREE.Vector3(63.5, 0.2, 38),
            ]
        };

        this.createHouses();
        this.spawnEnemies();
    }

    /**
     * Crea le case, le strade, il terreno e gli alberi nel mondo di gioco.
     */
    createHouses() {
        this.createRoad(20, 100, 0, 0);
        this.createRoad(100, 20, 0, -40);
        this.createRoad(100, 20, 0, 40);
        this.createRoad(100, 20, -40, 0);
        this.createRoad(100, 20, 40, 0);
        this.createRoad(20, 100, -50, 0);
        this.createRoad(20, 100, 50, 0);

        this.createTree(new THREE.Vector3(-25, 0, -20), 5, 1, 10, 5);
        this.createTree(new THREE.Vector3(25, 0, -20), 5, 1, 10, 5);
        this.createTree(new THREE.Vector3(-25, 0, 20), 5, 1, 10, 5);
        this.createTree(new THREE.Vector3(25, 0, 20), 5, 1, 10, 5);

        this.createGround();

        const houseA = new HouseA(this.scene, this.collidableObjects);
        this.houses.push(houseA.create());

        const houseB = new HouseB(this.scene, this.collidableObjects);
        this.houses.push(houseB.create());

        const houseC = new HouseC(this.scene, this.collidableObjects);
        this.houses.push(houseC.create());

        const houseD = new HouseD(this.scene, this.collidableObjects);
        this.houses.push(houseD.create());

        this.createChestsInHouse(this.housePositions.houseA, 2);
        this.createChestsInHouse(this.housePositions.houseB, 2);
        this.createChestsInHouse(this.housePositions.houseC, 2);
        this.createChestsInHouse(this.housePositions.houseD, 2);
    }

    /**
     * Crea un numero specificato di forzieri in posizioni casuali di una casa.
     * @param {THREE.Vector3[]} positionArray - L'array di posizioni disponibili per i forzieri.
     * @param {number} numChests - Il numero di forzieri da creare.
     */
    createChestsInHouse(positionArray, numChests) {
        const availablePositions = [...positionArray];

        for (let i = 0; i < numChests; i++) {
            if (availablePositions.length === 0) break;

            const index = Math.floor(Math.random() * availablePositions.length);
            const pos = availablePositions.splice(index, 1)[0];

            const chest = new Chest(this.scene, pos, this.collidableObjects, this.collectibleItems, this.weaponModels);
            this.chests.push(chest);
        }
    }

    /**
     * Crea un albero e lo aggiunge alla scena.
     * @param {THREE.Vector3} position - La posizione dell'albero.
     * @param {number} trunkHeight - L'altezza del tronco.
     * @param {number} trunkRadius - Il raggio del tronco.
     * @param {number} foliageHeight - L'altezza del fogliame.
     * @param {number} foliageRadius - Il raggio del fogliame.
     */
    createTree(position, trunkHeight, trunkRadius, foliageHeight, foliageRadius) {
        const treeGroup = new THREE.Group();
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = trunkHeight / 2;
        treeGroup.add(trunk);

        const foliageGeometry = new THREE.ConeGeometry(foliageRadius, foliageHeight, 16);
        const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = trunkHeight + foliageHeight / 2;
        treeGroup.add(foliage);

        treeGroup.position.copy(position);
        this.scene.add(treeGroup);
        this.trees.push(treeGroup);
        this.collidableObjects.push(trunk, foliage);
    }

    /**
     * Crea il terreno e lo aggiunge alla scena.
     */
    createGround() {
        const groundGeometry = new THREE.BoxGeometry(200, 0.1, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = 0;
        this.scene.add(ground);
        this.collidableObjects.push(ground);
    }

    /**
     * Crea una strada e la aggiunge alla scena.
     * @param {number} width - La larghezza della strada.
     * @param {number} depth - La profondità della strada.
     * @param {number} positionX - La posizione X della strada.
     * @param {number} positionZ - La posizione Z della strada.
     */
    createRoad(width, depth, positionX, positionZ) {
        const roadGeometry = new THREE.BoxGeometry(width, 0.2, depth);
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.position.set(positionX, 0.05, positionZ);
        this.scene.add(road);
        this.collidableObjects.push(road);
    }

    /**
     * Genera e aggiunge nemici al mondo di gioco.
     */
    spawnEnemies() {
        // Passa l'istanza di enemyDeathManager al costruttore di Enemy
        const enemy1 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(-20, 1, -20), 100, this.playerCamera, this.playerObjects, this.playerDamageCallback, this.collidableObjects, this.enemyDeathManager);
        const enemy2 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(30, 1, 10), 100, this.playerCamera, this.playerObjects, this.playerDamageCallback, this.collidableObjects, this.enemyDeathManager);
        const enemy3 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(-5, 1, -40), 100, this.playerCamera, this.playerObjects, this.playerDamageCallback, this.collidableObjects, this.enemyDeathManager);

        this.enemies.push(enemy1, enemy2, enemy3);

        this.collidableObjects.push(enemy1.mesh, enemy2.mesh, enemy3.mesh);
    }

    /**
     * Aggiorna lo stato dei nemici e delle barre della vita.
     * @param {number} delta - Il tempo trascorso dall'ultimo frame.
     * @param {THREE.Vector3} playerPosition - La posizione del giocatore.
     * @param {THREE.Camera} camera - La telecamera della scena.
     * @param {THREE.WebGLRenderer} renderer - Il renderer Three.js.
     */
    update(delta, playerPosition, camera, renderer) {
        // Aggiorna la logica di esplosione nel manager esterno
        this.enemyDeathManager.update(delta);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            enemy.update(delta, playerPosition);
            enemy.updateHealthBar(camera, renderer);

            // Se il nemico non è vivo e il gestore della morte non ha più parti da animare, rimuovilo
            if (!enemy.isAlive && this.enemyDeathManager.activePartsCount === 0) {
                const collidableIndex = this.collidableObjects.indexOf(enemy.mesh);
                if (collidableIndex > -1) {
                    this.collidableObjects.splice(collidableIndex, 1);
                }

                this.enemies.splice(i, 1);
            }
        }
    }
}