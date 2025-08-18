import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { HouseA } from '../houses/HouseA.js';
import { HouseB } from '../houses/HouseB.js';
import { HouseC } from '../houses/HouseC.js';
import { HouseD } from '../houses/HouseD.js';
import { Chest } from './Chest.js';
import { Enemy } from './Enemy.js';
import { EnemyDeathManager } from './EnemyDeathManager.js';
import { Fountain } from '../houses/Fountain.js';

export class GameWorld {
    /**
     * @param {THREE.Scene} scene - The Three.js scene to build the world in.
     * @param {HTMLElement} healthBarContainer - The HTML container for enemy health bars.
     * @param {object} weaponModels - An object containing weapon models.
     * @param {THREE.Camera} playerCamera - The player's camera.
     * @param {Array} playerObjects - The player's collidable objects.
     * @param {Function} playerDamageCallback - The function to inflict damage on the player.
     */
    constructor(scene, healthBarContainer, weaponModels, playerCamera, playerObjects, playerDamageCallback) {
        this.scene = scene;
        this.houses = [];
        this.trees = [];
        this.collidableObjects = []; // Contains all solid objects in the world
        this.chests = [];
        this.collectibleItems = [];
        this.enemies = [];
        this.healthBarContainer = healthBarContainer;
        this.weaponModels = weaponModels;
        this.playerCamera = playerCamera;
        this.playerObjects = playerObjects;
        this.playerDamageCallback = playerDamageCallback;
        this.enemyProjectiles = []; // Array for enemy projectiles
        this.fountain = null; // Property for the fountain

        // Centralize enemy removal logic
        this.enemyDeathManager = new EnemyDeathManager(this.scene, this.collidableObjects, (enemyMesh) => {
            const collidableIndex = this.collidableObjects.indexOf(enemyMesh);
            if (collidableIndex > -1) {
                this.collidableObjects.splice(collidableIndex, 1);
            }
        });

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

        this.createGround();
        this.createRoads();
        this.createTrees();
        this.createHouses();
        this.spawnEnemies();
        this.createFountain();
    }

    /**
     * Creates a specified number of chests in random positions within a house.
     * @param {THREE.Vector3[]} positionArray - The array of available positions for the chests.
     * @param {number} numChests - The number of chests to create.
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
     * Creates a tree and adds it to the scene.
     * @param {THREE.Vector3} position - The position of the tree.
     * @param {number} trunkHeight - The height of the trunk.
     * @param {number} trunkRadius - The radius of the trunk.
     * @param {number} foliageHeight - The height of the foliage.
     * @param {number} foliageRadius - The radius of the foliage.
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
     * Creates the ground and adds it to the scene.
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
     * Creates the roads and adds them to the scene.
     */
    createRoads() {
        this.createRoad(20, 100, 0, 0);
        this.createRoad(100, 20, 0, -40);
        this.createRoad(100, 20, 0, 40);
        this.createRoad(100, 20, -40, 0);
        this.createRoad(100, 20, 40, 0);
        this.createRoad(20, 100, -50, 0);
        this.createRoad(20, 100, 50, 0);
    }

    /**
     * Creates a road and adds it to the scene.
     * @param {number} width - The width of the road.
     * @param {number} depth - The depth of the road.
     * @param {number} positionX - The X position of the road.
     * @param {number} positionZ - The Z position of the road.
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
     * Creates the trees and adds them to the scene.
     */
    createTrees() {
        this.createTree(new THREE.Vector3(-25, 0, -20), 10, 1, 10, 5);
        this.createTree(new THREE.Vector3(25, 0, -20), 10, 1, 10, 5);
        this.createTree(new THREE.Vector3(-25, 0, 20), 10, 1, 10, 5);
        this.createTree(new THREE.Vector3(25, 0, 20), 10, 1, 10, 5);
    }

    /**
     * Creates the houses and adds them to the scene.
     */
    createHouses() {
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
     * Spawns and adds enemies to the game world.
     */
    spawnEnemies() {
        const enemy1 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(-20, 1, -20), 100, this.playerCamera, this.playerObjects, this.playerDamageCallback, this.collidableObjects, this.enemyDeathManager, this.enemyProjectiles);
        const enemy2 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(30, 1, 10), 100, this.playerCamera, this.playerObjects, this.playerDamageCallback, this.collidableObjects, this.enemyDeathManager, this.enemyProjectiles);
        const enemy3 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(-5, 1, -40), 100, this.playerCamera, this.playerObjects, this.playerDamageCallback, this.collidableObjects, this.enemyDeathManager, this.enemyProjectiles);

        this.enemies.push(enemy1, enemy2, enemy3);
        this.collidableObjects.push(enemy1.mesh, enemy2.mesh, enemy3.mesh);
    }

    /**
     * Creates the fountain at the center of the game world.
     */
    createFountain() {
        this.fountain = new Fountain(this.scene);
        this.collidableObjects.push(this.fountain.fountainGroup);
    }

    /**
     * Updates the state of enemies and health bars.
     * @param {number} delta - The time elapsed since the last frame.
     * @param {THREE.Vector3} playerPosition - The player's position.
     * @param {THREE.Camera} camera - The scene's camera.
     * @param {THREE.WebGLRenderer} renderer - The Three.js renderer.
     */
    update(delta, playerPosition, camera, renderer) {
        this.enemyDeathManager.update(delta);
        this.fountain.update();

        // Update enemies and their health bars, removing those that are dead
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta, playerPosition);
            enemy.updateHealthBar(camera, renderer);
            if (!enemy.isAlive) {
                this.enemies.splice(i, 1);
            }
        }

        const projectilesToRemove = [];
        // Combines player and world objects for a single raycast
        const allCollidableObjects = [...this.playerObjects, ...this.collidableObjects];

        // Updates and manages enemy projectiles
        this.enemyProjectiles.forEach((projectile) => {
            const previousPosition = projectile.position.clone();
            projectile.position.addScaledVector(projectile.velocity, delta);

            const raycaster = new THREE.Raycaster(previousPosition, projectile.velocity.clone().normalize(), 0, previousPosition.distanceTo(projectile.position));
            const intersects = raycaster.intersectObjects(allCollidableObjects, true);

            if (intersects.length > 0) {
                const hitObject = intersects[0].object;
                if (hitObject.name === 'playerHitbox') {
                    this.playerDamageCallback(10);
                }
                projectilesToRemove.push(projectile);
            }
        });

        // Removes projectiles that have hit something or have exceeded their range
        projectilesToRemove.forEach(projectile => {
            this.scene.remove(projectile);
            const index = this.enemyProjectiles.indexOf(projectile);
            if (index > -1) {
                this.enemyProjectiles.splice(index, 1);
            }
            projectile.geometry.dispose();
            projectile.material.dispose();
        });
    }
}
