import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

// Importa le classi di ogni casa, usando il percorso 'risali di una cartella'
import { HouseA } from '../houses/HouseA.js';
import { HouseB } from '../houses/HouseB.js';
import { HouseC } from '../houses/HouseC.js';
import { HouseD } from '../houses/HouseD.js';

export class GameWorld {
    constructor(scene) {
        this.scene = scene;
        this.houses = [];
        this.trees = [];
        this.collidableObjects = [];
    }

    createHouses() {
        // Creazione delle strade
        this.createRoad(20, 100, 0, 0);  // Segmento verticale principale
        this.createRoad(100, 20, 0, -40); // Segmento orizzontale in basso
        this.createRoad(100, 20, 0, 40); // Segmento orizzontale in alto
        this.createRoad(100, 20, -40, 0);
        this.createRoad(100, 20, 40, 0);
        this.createRoad(100, 20, -40, 0);
        this.createRoad(20, 100, -50, 0);
        this.createRoad(20, 100, 50, 0);

        // Creazione degli alberi
        this.createTree(new THREE.Vector3(-25, 0, -20), 5, 1, 10, 5);
        this.createTree(new THREE.Vector3(25, 0, -20), 5, 1, 10, 5);
        this.createTree(new THREE.Vector3(-25, 0, 20), 5, 1, 10, 5);
        this.createTree(new THREE.Vector3(25, 0, 20), 5, 1, 10, 5);

        this.createGround();

        // Istanziazione e creazione delle case
        const houseA = new HouseA(this.scene, this.collidableObjects);
        this.houses.push(houseA.create());

        const houseB = new HouseB(this.scene, this.collidableObjects);
        this.houses.push(houseB.create());

        const houseC = new HouseC(this.scene, this.collidableObjects);
        this.houses.push(houseC.create());

        const houseD = new HouseD(this.scene, this.collidableObjects);
        this.houses.push(houseD.create());
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
}