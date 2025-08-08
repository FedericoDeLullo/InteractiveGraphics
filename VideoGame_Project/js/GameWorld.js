import * as THREE from 'https://unpkg.com/three@0.126.0/build/three.module.js';

export class GameWorld {
    constructor(scene) {
        this.scene = scene;
        this.houses = [];
        this.collidableObjects = [];
    }

    createHouses() {
        this.createGround();
        // Assegna un nome unico a ogni casa
        this.createDetailedHouse(new THREE.Vector3(-60, 0, -60), 'houseA');
        this.createDetailedHouse(new THREE.Vector3(60, 0, -60), 'houseB');
        this.createDetailedHouse(new THREE.Vector3(-60, 0, 60), 'houseC');
        this.createDetailedHouse(new THREE.Vector3(60, 0, 60), 'houseD');
    }

    createGround() {
        const groundGeometry = new THREE.BoxGeometry(200, 0.1, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.position.y = 0;
        this.scene.add(ground);
        this.collidableObjects.push(ground);
    }

    createDetailedHouse(position, houseId) { // Accetta il parametro 'houseId'
        const houseGroup = new THREE.Group();
        houseGroup.position.copy(position);
        houseGroup.houseId = houseId; // Assegna il nome al gruppo

        const houseWidth = 50;
        const houseDepth = 40;
        const floorHeight = 20;
        const wallThickness = 0.5;
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

        // Questo è il nuovo materiale per l'ultimo muro
        const specialWallMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
        const specialWallMateriall = new THREE.MeshStandardMaterial({ color: 0x696969 });

        // Piano terra
        const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        groundFloor.position.y = 0;
        houseGroup.add(groundFloor);
        this.collidableObjects.push(groundFloor);

        const createWall = (width, height, depth, x, y, z, material = wallMaterial) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
            wall.position.set(x, y, z);
            houseGroup.add(wall);
            this.collidableObjects.push(wall);
            return wall; // Restituisce l'oggetto del muro creato
        };

        if (houseId === 'houseA') {
            // Muro frontale alto (con finestra):
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight + 1, houseDepth / 2);

        // Muro frontale basso (con finestra):
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight - 21, houseDepth / 2);

        // Muro frontale destro (con finestra)
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, houseWidth - 31 , floorHeight - 10 , houseDepth / 2);

        // Muro frontale sinistro (con finestra)
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, -(houseWidth - 31), floorHeight - 10, houseDepth / 2);

        // Muro frontale centrale (con finestra)
        createWall(houseWidth / 3 - 2, floorHeight, wallThickness, -(houseWidth / 4 - 12.5), floorHeight / 2, houseDepth / 2);

        // Muro striscia centrale (con finestra)
        createWall(houseWidth, floorHeight / 4, wallThickness, houseWidth - 50, floorHeight - 10, houseDepth / 2);


        // Muro posteriore
        createWall(houseWidth, floorHeight, wallThickness, 0, floorHeight / 2, -houseDepth / 2);

        // Muri laterale alto(con porta)
        createWall(wallThickness, floorHeight / 2 + 2, houseDepth , houseWidth - 25, floorHeight / 2 + 5, houseDepth - 40);

        // Muri laterale (con porta)

        createWall(wallThickness, floorHeight / 4 + 38, houseDepth / 2 + 16, houseWidth - 25, floorHeight - 20,  -(houseDepth - 37));


        createWall(wallThickness, floorHeight, houseDepth, -houseWidth / 2, floorHeight / 2, 0);

        // Scale per il secondo piano
        this.createStairs(houseGroup, floorHeight, houseDepth);

        // tetto
        const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        secondFloor.position.y = floorHeight;
        houseGroup.add(secondFloor);
        this.collidableObjects.push(secondFloor);

        //pavimento del secondo piano
        const thirdFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        thirdFloor.position.y = floorHeight / 2;
        houseGroup.add(thirdFloor);
        this.collidableObjects.push(thirdFloor);

        // --- I due muri per creare le 4 stanze al secondo piano ---
        const GroundWallHeight = floorHeight;
        const GroundWallYPosition = floorHeight;

        // Muro orizzontale (allineato all'asse X)
        createWall(houseWidth / 2 + 17, GroundWallHeight, wallThickness, 0, -GroundWallYPosition + 20, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, -5, -GroundWallYPosition + 28, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, 5, -GroundWallYPosition + 28, 0, specialWallMaterial);

        // Muro verticale (allineato all'asse Z)
        createWall(wallThickness, GroundWallHeight, houseDepth / 2 + 12, 0, GroundWallYPosition - 20, 0, specialWallMateriall);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 10, 0, GroundWallYPosition - 9, -5, specialWallMateriall);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 10, 0, GroundWallYPosition - 9, 5, specialWallMateriall);



        // --- I due muri per creare le 4 stanze al secondo piano ---
        const wallHeight = floorHeight / 2;
        const wallYPosition = floorHeight / 2 + 5;

        // Muro orizzontale (allineato all'asse X)
        createWall(houseWidth / 2 + 17, wallHeight, wallThickness, 0, wallYPosition, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, -5, wallYPosition + 3, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, 5, wallYPosition + 3, 0, specialWallMaterial);

        // Muro verticale (allineato all'asse Z)
        createWall(wallThickness, wallHeight, houseDepth / 2 + 12, 0, wallYPosition, 0, specialWallMateriall);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, -5, specialWallMateriall);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, 5, specialWallMateriall);

        this.scene.add(houseGroup);
        this.houses.push(houseGroup);
        }

        if (houseId === 'houseB') {
           // Muro frontale alto (con finestra):
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight + 1, houseDepth / 2);

        // Muro frontale basso (con finestra):
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight - 21, houseDepth / 2);

        // Muro frontale destro (con finestra)
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, houseWidth - 31 , floorHeight - 10 , houseDepth / 2);

        // Muro frontale sinistro (con finestra)
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, -(houseWidth - 31), floorHeight - 10, houseDepth / 2);

        // Muro frontale centrale (con finestra)
        createWall(houseWidth / 3 - 2, floorHeight, wallThickness, -(houseWidth / 4 - 12.5), floorHeight / 2, houseDepth / 2);

        // Muro striscia centrale (con finestra)
        createWall(houseWidth, floorHeight / 4, wallThickness, houseWidth - 50, floorHeight - 10, houseDepth / 2);


        // Muro posteriore
        createWall(houseWidth, floorHeight, wallThickness, 0, floorHeight / 2, -houseDepth / 2);

        // Muri laterale alto(con porta)
        createWall(wallThickness, floorHeight / 2 + 2, houseDepth , -(houseWidth - 25), floorHeight / 2 + 5, houseDepth - 40);

        // Muri laterale (con porta)

        createWall(wallThickness, floorHeight / 4 + 38, houseDepth / 2 + 16, -(houseWidth - 25), floorHeight - 20,  -(houseDepth - 37));


        createWall(wallThickness, floorHeight, houseDepth, houseWidth / 2, floorHeight / 2, 0);

        // Scale per il secondo piano
        this.createStairs(houseGroup, floorHeight, houseDepth);

        // tetto
        const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        secondFloor.position.y = floorHeight;
        houseGroup.add(secondFloor);
        this.collidableObjects.push(secondFloor);

        //pavimento del secondo piano
        const thirdFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        thirdFloor.position.y = floorHeight / 2;
        houseGroup.add(thirdFloor);
        this.collidableObjects.push(thirdFloor);

        // --- I due muri per creare le 4 stanze al secondo piano ---
        const GroundWallHeight = floorHeight;
        const GroundWallYPosition = floorHeight;

        // Muro orizzontale (allineato all'asse X)
        createWall(houseWidth / 2 + 17, GroundWallHeight, wallThickness, 0, -GroundWallYPosition + 20, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, -5, -GroundWallYPosition + 28, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, 5, -GroundWallYPosition + 28, 0, specialWallMaterial);

        // Muro verticale (allineato all'asse Z)
        createWall(wallThickness, GroundWallHeight, houseDepth / 2 + 12, 0, GroundWallYPosition - 20, 0, specialWallMateriall);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 10, 0, GroundWallYPosition - 9, -5, specialWallMateriall);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 10, 0, GroundWallYPosition - 9, 5, specialWallMateriall);



        // --- I due muri per creare le 4 stanze al secondo piano ---
        const wallHeight = floorHeight / 2;
        const wallYPosition = floorHeight / 2 + 5;

        // Muro orizzontale (allineato all'asse X)
        createWall(houseWidth / 2 + 17, wallHeight, wallThickness, 0, wallYPosition, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, -5, wallYPosition + 3, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, 5, wallYPosition + 3, 0, specialWallMaterial);

        // Muro verticale (allineato all'asse Z)
        createWall(wallThickness, wallHeight, houseDepth / 2 + 12, 0, wallYPosition, 0, specialWallMateriall);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, -5, specialWallMateriall);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, 5, specialWallMateriall);

        this.scene.add(houseGroup);
        this.houses.push(houseGroup);
        }

        if (houseId === 'houseC') {
        // Muro frontale alto (con finestra):
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight + 1, -(houseDepth / 2));

        // Muro frontale basso (con finestra):
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight - 21, -(houseDepth / 2));

        // Muro frontale destro (con finestra)
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, houseWidth - 31 , floorHeight - 10 , -(houseDepth / 2));

        // Muro frontale sinistro (con finestra)
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, -(houseWidth - 31), floorHeight - 10, -(houseDepth / 2));

        // Muro frontale centrale (con finestra)
        createWall(houseWidth / 3 - 2, floorHeight, wallThickness, -(houseWidth / 4 - 12.5), floorHeight / 2, -(houseDepth / 2));

        // Muro striscia centrale (con finestra)
        createWall(houseWidth, floorHeight / 4, wallThickness, houseWidth - 50, floorHeight - 10, -(houseDepth / 2));


        // Muro posteriore
        createWall(houseWidth, floorHeight, wallThickness, 0, floorHeight / 2, houseDepth / 2);

        // Muri laterale alto(con porta)
        createWall(wallThickness, floorHeight / 2 + 2, houseDepth , houseWidth - 25, floorHeight / 2 + 5, -(houseDepth - 40));

        // Muri laterale (con porta)

        createWall(wallThickness, floorHeight / 4 + 38, houseDepth / 2 + 16, houseWidth - 25, floorHeight - 20,  houseDepth - 37);


        createWall(wallThickness, floorHeight, houseDepth, -(houseWidth / 2), floorHeight / 2, 0);

        // Scale per il secondo piano
        this.createStairs(houseGroup, floorHeight, houseDepth);

        // tetto
        const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        secondFloor.position.y = floorHeight;
        houseGroup.add(secondFloor);
        this.collidableObjects.push(secondFloor);

        //pavimento del secondo piano
        const thirdFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        thirdFloor.position.y = floorHeight / 2;
        houseGroup.add(thirdFloor);
        this.collidableObjects.push(thirdFloor);

        // --- I due muri per creare le 4 stanze al secondo piano ---
        const GroundWallHeight = floorHeight;
        const GroundWallYPosition = floorHeight;

        // Muro orizzontale (allineato all'asse X)
        createWall(houseWidth / 2 + 17, GroundWallHeight, wallThickness, 0, -GroundWallYPosition + 20, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, -5, -GroundWallYPosition + 28, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, 5, -GroundWallYPosition + 28, 0, specialWallMaterial);

        // Muro verticale (allineato all'asse Z)
        createWall(wallThickness, GroundWallHeight, houseDepth / 2 + 12, 0, GroundWallYPosition - 20, 0, specialWallMateriall);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 10, 0, GroundWallYPosition - 9, -5, specialWallMateriall);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 10, 0, GroundWallYPosition - 9, 5, specialWallMateriall);



        // --- I due muri per creare le 4 stanze al secondo piano ---
        const wallHeight = floorHeight / 2;
        const wallYPosition = floorHeight / 2 + 5;

        // Muro orizzontale (allineato all'asse X)
        createWall(houseWidth / 2 + 17, wallHeight, wallThickness, 0, wallYPosition, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, -5, wallYPosition + 3, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, 5, wallYPosition + 3, 0, specialWallMaterial);

        // Muro verticale (allineato all'asse Z)
        createWall(wallThickness, wallHeight, houseDepth / 2 + 12, 0, wallYPosition, 0, specialWallMateriall);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, -5, specialWallMateriall);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, 5, specialWallMateriall);

        this.scene.add(houseGroup);
        this.houses.push(houseGroup);
        }

        if (houseId === 'houseD') {
        // Muro frontale alto (con finestra):
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight + 1, -(houseDepth / 2));

        // Muro frontale basso (con finestra):
        createWall(houseWidth, floorHeight / 3, wallThickness, houseWidth / 10 - 5, floorHeight - 21, -(houseDepth / 2));

        // Muro frontale destro (con finestra)
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, houseWidth - 31 , floorHeight - 10 , -(houseDepth / 2));

        // Muro frontale sinistro (con finestra)
        createWall(houseWidth / 4 - 1, floorHeight, wallThickness, -(houseWidth - 31), floorHeight - 10, -(houseDepth / 2));

        // Muro frontale centrale (con finestra)
        createWall(houseWidth / 3 - 2, floorHeight, wallThickness, -(houseWidth / 4 - 12.5), floorHeight / 2, -(houseDepth / 2));

        // Muro striscia centrale (con finestra)
        createWall(houseWidth, floorHeight / 4, wallThickness, houseWidth - 50, floorHeight - 10, -(houseDepth / 2));


        // Muro posteriore
        createWall(houseWidth, floorHeight, wallThickness, 0, floorHeight / 2, houseDepth / 2);

        // Muri laterale alto(con porta)
        createWall(wallThickness, floorHeight / 2 + 2, houseDepth , -(houseWidth - 25), floorHeight / 2 + 5, -(houseDepth - 40));

        // Muri laterale (con porta)

        createWall(wallThickness, floorHeight / 4 + 38, houseDepth / 2 + 16, -(houseWidth - 25), floorHeight - 20,  houseDepth - 37);


        createWall(wallThickness, floorHeight, houseDepth, houseWidth / 2, floorHeight / 2, 0);

        // Scale per il secondo piano
        this.createStairs(houseGroup, floorHeight, houseDepth);

        // tetto
        const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        secondFloor.position.y = floorHeight;
        houseGroup.add(secondFloor);
        this.collidableObjects.push(secondFloor);

        //pavimento del secondo piano
        const thirdFloor = new THREE.Mesh(new THREE.BoxGeometry(houseWidth, wallThickness, houseDepth), floorMaterial);
        thirdFloor.position.y = floorHeight / 2;
        houseGroup.add(thirdFloor);
        this.collidableObjects.push(thirdFloor);

        // --- I due muri per creare le 4 stanze al secondo piano ---
        const GroundWallHeight = floorHeight;
        const GroundWallYPosition = floorHeight;

        // Muro orizzontale (allineato all'asse X)
        createWall(houseWidth / 2 + 17, GroundWallHeight, wallThickness, 0, -GroundWallYPosition + 20, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, -5, -GroundWallYPosition + 28, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, GroundWallHeight / 2 - 6, wallThickness, 5, -GroundWallYPosition + 28, 0, specialWallMaterial);

        // Muro verticale (allineato all'asse Z)
        createWall(wallThickness, GroundWallHeight, houseDepth / 2 + 12, 0, GroundWallYPosition - 20, 0, specialWallMateriall);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 10, 0, GroundWallYPosition - 9, -5, specialWallMateriall);
        createWall(wallThickness, GroundWallHeight / 2, houseDepth / 2 + 10, 0, GroundWallYPosition - 9, 5, specialWallMateriall);



        // --- I due muri per creare le 4 stanze al secondo piano ---
        const wallHeight = floorHeight / 2;
        const wallYPosition = floorHeight / 2 + 5;

        // Muro orizzontale (allineato all'asse X)
        createWall(houseWidth / 2 + 17, wallHeight, wallThickness, 0, wallYPosition, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, -5, wallYPosition + 3, 0, specialWallMaterial);

        // Muro orizzontale sopra porta
        createWall(houseWidth / 2 + 15, wallHeight / 2, wallThickness, 5, wallYPosition + 3, 0, specialWallMaterial);

        // Muro verticale (allineato all'asse Z)
        createWall(wallThickness, wallHeight, houseDepth / 2 + 12, 0, wallYPosition, 0, specialWallMateriall);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, -5, specialWallMateriall);
        createWall(wallThickness, wallHeight / 2, houseDepth / 2 + 10, 0, wallYPosition + 3, 5, specialWallMateriall);

        this.scene.add(houseGroup);
        this.houses.push(houseGroup);
        }
    }

    createStairs(parent, floorHeight, houseDepth) {
        const stairWidth = 4;
        const stairHeight = 0.7;
        const numSteps = floorHeight / stairHeight;
        const stairMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

        for (let i = 0; i < numSteps; i++) {
            const stairGeometry = new THREE.BoxGeometry(stairWidth, stairHeight, 2);
            const stair = new THREE.Mesh(stairGeometry, stairMaterial);

            const x = 10;
            const y = (i * stairHeight) + stairHeight / 2; // Correzione della posizione Y
            const z = -houseDepth / 2 + 1 + (i * 2); // Posizione Z rivista

            stair.position.set(x, y, z);
            parent.add(stair);
            this.collidableObjects.push(stair);
        }
    }
}