import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

// Funzione ausiliaria per creare le scale
const createStairs = (parent, collidableObjects, floorHeight, houseDepth, startPosition, orientation) => {
    const stairWidth = 6;
    const stairHeight = 1.2;
    const numSteps = floorHeight / stairHeight - 9;
    const stairMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

    for (let i = 0; i < numSteps; i++) {
        const stairGeometry = new THREE.BoxGeometry(stairWidth, stairHeight, 2);
        const stair = new THREE.Mesh(stairGeometry, stairMaterial);

        let x = startPosition.x;
        const y = (i * stairHeight) + stairHeight / 2;
        let z = startPosition.z;

        if (orientation === 'x') {
            x = startPosition.x + (i * 2);
            stair.rotation.y = Math.PI / 2;
        } else if (orientation === 'z') {
            z = startPosition.z + (i * 2);
        } else if (orientation === 'z-reversed') {
            z = startPosition.z - (i * 2);
        }

        stair.position.set(x, y, z);
        parent.add(stair);
        collidableObjects.push(stair);
    }
};

export class HouseC {
    constructor(scene, collidableObjects) {
        this.scene = scene;
        this.collidableObjects = collidableObjects;
    }

    create() {
        const houseGroup = new THREE.Group();
        houseGroup.position.copy(new THREE.Vector3(-60, 0, 60));
        houseGroup.houseId = 'houseC';

        const houseWidth = 50;
        const houseDepth = 40;
        const floorHeight = 20;
        const wallThickness = 0.5;
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const specialWallMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
        const specialWallMateriall = new THREE.MeshStandardMaterial({ color: 0x228B22 });

        const createWall = (width, height, depth, x, y, z, material = wallMaterial) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
            wall.position.set(x, y, z);
            houseGroup.add(wall);
            this.collidableObjects.push(wall);
            return wall;
        };

        const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        groundFloor.position.y = 0;
        houseGroup.add(groundFloor);
        this.collidableObjects.push(groundFloor);

        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight + 1, -(houseDepth / 2));
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight - 21, -(houseDepth / 2));
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, houseWidth - 31 , floorHeight - 10 , -(houseDepth / 2));
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, -(houseWidth - 31), floorHeight - 10, -(houseDepth / 2));
        createWall(houseWidth / 3 - 2, floorHeight, wallThickness, -(houseWidth / 4 - 12.5), floorHeight / 2, -(houseDepth / 2));
        createWall(houseWidth, floorHeight / 4, wallThickness, houseWidth - 50, floorHeight - 10, -(houseDepth / 2));
        createWall(houseWidth, floorHeight, wallThickness, 0, floorHeight / 2, houseDepth / 2);
        createWall(wallThickness, floorHeight / 2 + 2, houseDepth , houseWidth - 25, floorHeight / 2 + 5, -(houseDepth - 40));
        createWall(wallThickness, floorHeight / 4 + 38, houseDepth / 2 + 16, houseWidth - 25, floorHeight - 20,  houseDepth - 37);
        createWall(wallThickness, floorHeight, houseDepth, -(houseWidth / 2), floorHeight / 2, 0);

        createStairs(houseGroup, this.collidableObjects, floorHeight, houseDepth, new THREE.Vector3(3, 0, houseDepth / 2 - 35), 'z');

        const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        secondFloor.position.y = floorHeight;
        houseGroup.add(secondFloor);
        this.collidableObjects.push(secondFloor);

        const thirdFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth /2), floorMaterial);
        thirdFloor.position.y = floorHeight / 2;
        thirdFloor.position.z = -(houseDepth / 2 - 30);
        houseGroup.add(thirdFloor);
        this.collidableObjects.push(thirdFloor);

        const lateralWall = new THREE.Mesh(new THREE.BoxGeometry(houseWidth / 3 + 3, wallThickness, houseDepth ), floorMaterial);
        lateralWall.position.x = houseWidth / 2 - 10;
        lateralWall.position.y = floorHeight / 2;
        lateralWall.position.z = -(houseDepth / 2 - 20);
        houseGroup.add(lateralWall);
        this.collidableObjects.push(lateralWall);

        const upperWall = new THREE.Mesh(new THREE.BoxGeometry(houseWidth / 2 + 1 , wallThickness, houseDepth ), floorMaterial);
        upperWall.position.x = houseWidth / 2 - 37;
        upperWall.position.y = floorHeight / 2;
        upperWall.position.z = -(houseDepth / 2 - 20);
        houseGroup.add(upperWall);
        this.collidableObjects.push(upperWall);

        const smallWall = new THREE.Mesh(new THREE.BoxGeometry(houseWidth / 2 - 1 , wallThickness, houseDepth / 4), floorMaterial);
        smallWall.position.x = houseWidth / 2 - 20;
        smallWall.position.y = floorHeight / 2;
        smallWall.position.z = -(houseDepth / 2 - 5);
        houseGroup.add(smallWall);
        this.collidableObjects.push(smallWall);

        const stairWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, floorHeight / 2, houseDepth / 2), floorMaterial);
        stairWall.position.y = floorHeight / 2 + 5;
        stairWall.position.x = houseWidth / 2 - 19;
        stairWall.position.z = -(houseDepth / 2 - 10);
        houseGroup.add(stairWall);
        this.collidableObjects.push(stairWall);

        const backWall = new THREE.Mesh(new THREE.BoxGeometry(houseWidth / 2 - 19, floorHeight / 2, wallThickness), floorMaterial);
        backWall.position.y = floorHeight / 2 + 5;
        backWall.position.x = houseWidth / 2 - 22;
        backWall.position.z = -(houseDepth / 2 - 10);
        houseGroup.add(backWall);
        this.collidableObjects.push(backWall);

        const GroundWallHeight = floorHeight;
        const GroundWallYPosition = floorHeight;
        createWall(houseWidth / 2 + 17, GroundWallHeight, wallThickness, 0, -GroundWallYPosition + 20, 0, specialWallMaterial);
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, 5, -GroundWallYPosition + 28, 0, specialWallMaterial);
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, -5, -GroundWallYPosition + 28, 0, specialWallMaterial);
        createWall(wallThickness, GroundWallHeight, houseDepth / 2 + 12, 0, GroundWallYPosition - 20, 0, specialWallMaterial);
        createWall(wallThickness, GroundWallHeight / 4 - 1, houseDepth / 2 - 5, 0, GroundWallYPosition - 12, -12.5, specialWallMaterial);

        const wallHeight = floorHeight / 2;
        const wallYPosition = floorHeight / 2 + 5;
        createWall(houseWidth / 3 - 0.5 , wallHeight, wallThickness, 13.5, wallYPosition, 0, specialWallMaterial);
        createWall(houseWidth / 2 - 5 , wallHeight, wallThickness, -10, wallYPosition, 0, specialWallMaterial);
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, -5, wallYPosition + 3, 0, specialWallMaterial);
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, 5, wallYPosition + 3, 0, specialWallMaterial);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, -5, specialWallMaterial);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, 5, specialWallMaterial);
        createWall(wallThickness, wallHeight / 2 - 1, houseDepth / 2 + 10, 0, wallYPosition - 7, 5, specialWallMaterial);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 15, 0, GroundWallYPosition - 9, -2.5, specialWallMaterial);

        this.scene.add(houseGroup);
        return houseGroup;
    }
}