// GameWorld.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

import { HouseA } from '../houses/HouseA.js';
import { HouseB } from '../houses/HouseB.js';
import { HouseC } from '../houses/HouseC.js';
import { HouseD } from '../houses/HouseD.js';
import { Chest } from './Chest.js';
import { Enemy } from './Enemy.js';

export class GameWorld {
    constructor(scene, healthBarContainer, weaponModels) {
        this.scene = scene;
        this.houses = [];
        this.trees = [];
        this.collidableObjects = [];
        this.chests = [];
        this.collectibleItems = [];
        this.enemies = [];
        this.healthBarContainer = healthBarContainer;
        this.weaponModels = weaponModels;
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
        this.createEnemies();
    }

    createHouses() {
        this.createRoad(20, 100, 0, 0);
        this.createRoad(100, 20, 0, -40);
        this.createRoad(100, 20, 0, 40);
        this.createRoad(100, 20, -40, 0);
        this.createRoad(100, 20, 40, 0);
        this.createRoad(100, 20, -40, 0);
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

    createGround() {
        const groundGeometry = new THREE.BoxGeometry(200, 0.1, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = 0;
        this.scene.add(ground);
        this.collidableObjects.push(ground);
    }

    createRoad(width, depth, positionX, positionZ) {
        const roadGeometry = new THREE.BoxGeometry(width, 0.2, depth);
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.position.set(positionX, 0.05, positionZ);
        this.scene.add(road);
        this.collidableObjects.push(road);
    }

    createEnemies() {
        const enemy1 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(-20, 1, -20));
        const enemy2 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(30, 1, 10));
        const enemy3 = new Enemy(this.scene, this.healthBarContainer, new THREE.Vector3(-5, 1, -40));

        this.enemies.push(enemy1, enemy2, enemy3);

        this.collidableObjects.push(enemy1.mesh, enemy2.mesh, enemy3.mesh);
    }
}