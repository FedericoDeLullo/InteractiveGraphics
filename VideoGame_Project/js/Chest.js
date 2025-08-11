// Chest.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Chest {
    constructor(scene, position = new THREE.Vector3(0, 0, 0), collidableObjects = null) {
        this.scene = scene;
        this.isOpen = false;
        this.group = new THREE.Group();
        this.group.position.copy(position);

        const width = 6;
        const height = 1.5;
        const depth = 3;
        const thickness = 0.1;

        const brownMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const darkBrownMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

        const frontGeom = new THREE.BoxGeometry(width, height, thickness);
        this.front = new THREE.Mesh(frontGeom, brownMaterial);
        this.front.position.set(0, height / 2, depth / 2 - thickness / 2);
        this.group.add(this.front);

        const backGeom = new THREE.BoxGeometry(width, height, thickness);
        this.back = new THREE.Mesh(backGeom, brownMaterial);
        this.back.position.set(0, height / 2, -depth / 2 + thickness / 2);
        this.group.add(this.back);

        const leftGeom = new THREE.BoxGeometry(thickness, height, depth);
        this.left = new THREE.Mesh(leftGeom, brownMaterial);
        this.left.position.set(-width / 2 + thickness / 2, height / 2, 0);
        this.group.add(this.left);

        const rightGeom = new THREE.BoxGeometry(thickness, height, depth);
        this.right = new THREE.Mesh(rightGeom, brownMaterial);
        this.right.position.set(width / 2 - thickness / 2, height / 2, 0);
        this.group.add(this.right);

        const bottomGeom = new THREE.BoxGeometry(width, thickness, depth);
        this.bottom = new THREE.Mesh(bottomGeom, brownMaterial);
        this.bottom.position.set(0, thickness / 2, 0);
        this.group.add(this.bottom);

        const lidGeom = new THREE.BoxGeometry(width, thickness, depth);
        this.lid = new THREE.Mesh(lidGeom, darkBrownMaterial);
        this.lid.position.set(0, height + thickness / 2, 0);
        this.group.add(this.lid);

        scene.add(this.group);

        // --- INIZIO NUOVO CODICE ---
        // Definisci i possibili colori per le armi
        this.weaponColors = [
            new THREE.Color(0xff0000), // Rosso
            new THREE.Color(0x00ff00), // Verde
            new THREE.Color(0x0000ff)  // Blu
        ];

        // Crea i 3 cubi per l'animazione, inizialmente invisibili
        this.spinCubes = [];
        for (let i = 0; i < 3; i++) {
            const cubeGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            const cubeMat = new THREE.MeshStandardMaterial({ color: this.weaponColors[i] });
            const cube = new THREE.Mesh(cubeGeom, cubeMat);
            cube.position.set(-1.5 + i * 1.5, height + thickness + 0.5, 0); // Posizionali uno accanto all'altro
            cube.visible = false;
            this.group.add(cube);
            this.spinCubes.push(cube);
        }

        // Il cubo finale, inizialmente invisibile
        const finalCubeGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        this.finalCube = new THREE.Mesh(finalCubeGeom, new THREE.MeshStandardMaterial());
        this.finalCube.position.set(0, height + thickness + 0.5, 0);
        this.finalCube.visible = false;
        this.group.add(this.finalCube);
        // --- FINE NUOVO CODICE ---

        this.collisionMeshes = [this.front, this.back, this.left, this.right, this.bottom];

        if (collidableObjects) {
            collidableObjects.push(...this.collisionMeshes);
        }

        this.audio = new Audio('sounds/chest-open.mp3');
    }

    open() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.audio.play();

        const targetY = this.lid.position.y + 5;
        const duration = 0.5;
        const startY = this.lid.position.y;
        const startTime = performance.now();

        const animateOpen = (time) => {
            const elapsed = (time - startTime) / 1000;
            if (elapsed < duration) {
                this.lid.position.y = THREE.MathUtils.lerp(startY, targetY, elapsed / duration);
                requestAnimationFrame(animateOpen);
            } else {
                this.lid.position.y = targetY;
                this.lid.visible = false;
                // Inizia l'animazione dei cubi dopo che il coperchio è scomparso
                this.startSpinAnimation();
            }
        };

        requestAnimationFrame(animateOpen);
    }

    // --- INIZIO NUOVA FUNZIONE ---
    startSpinAnimation() {
        const spinDuration = 3; // 5 secondi
        const spinStartTime = performance.now();
        const spinSpeed = 0.1; // Velocità di rotazione

        // Scegli un colore finale a caso
        const finalColor = this.weaponColors[Math.floor(Math.random() * this.weaponColors.length)];

        // Rendi visibili i cubi rotanti
        this.spinCubes.forEach(cube => cube.visible = true);

        const animateSpin = (time) => {
            const elapsed = (time - spinStartTime) / 1000;

            if (elapsed < spinDuration) {
                // Fai ruotare i cubi e cambiane il colore in modo casuale
                this.spinCubes.forEach(cube => {
                    cube.rotation.y += spinSpeed;
                    cube.material.color.set(this.weaponColors[Math.floor(Math.random() * this.weaponColors.length)]);
                });
                requestAnimationFrame(animateSpin);
            } else {
                // Al termine dell'animazione, rendi invisibili i cubi rotanti
                this.spinCubes.forEach(cube => cube.visible = false);

                // Rendi visibile il cubo finale e assegnagli il colore scelto
                this.finalCube.material.color.set(finalColor);
                this.finalCube.visible = true;
            }
        };

        requestAnimationFrame(animateSpin);
    }
    // --- FINE NUOVA FUNZIONE ---
}