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

        // coperchio
        const lidGeom = new THREE.BoxGeometry(width, thickness, depth);
        this.lid = new THREE.Mesh(lidGeom, darkBrownMaterial);
        // La posizione iniziale del coperchio è la stessa.
        this.lid.position.set(0, height + thickness / 2, 0);
        this.group.add(this.lid);

        scene.add(this.group);

        const cubeGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
        const cubeMat = new THREE.MeshStandardMaterial({ color: randomColor });
        this.insideCube = new THREE.Mesh(cubeGeom, cubeMat);
        this.insideCube.position.set(0, height + thickness + 0.5, 0);
        this.insideCube.visible = false;
        this.group.add(this.insideCube);

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

        const targetY = this.lid.position.y + 5; // Nuova posizione finale del coperchio (5 unità più in alto)
        const duration = 0.5;
        const startY = this.lid.position.y;
        const startTime = performance.now();

        const animateOpen = (time) => {
            const elapsed = (time - startTime) / 1000;
            if (elapsed < duration) {
                // Interpola la posizione Y per un movimento verticale
                this.lid.position.y = THREE.MathUtils.lerp(startY, targetY, elapsed / duration);
                requestAnimationFrame(animateOpen);
            } else {
                this.lid.position.y = targetY; // Assicurati che arrivi alla posizione finale
                this.lid.visible = false; // Rendi il coperchio invisibile
                this.insideCube.visible = true;
            }
        };

        requestAnimationFrame(animateOpen);
    }
}