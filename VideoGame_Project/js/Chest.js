import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Chest {
    constructor(scene, position = new THREE.Vector3(0, 0, 0), collidableObjects = null) {
        this.scene = scene;
        this.isOpen = false;
        this.group = new THREE.Group();
        this.group.position.copy(position);

        // Dimensioni cassa
        const width = 3;
        const height = 2;
        const depth = 2;
        const thickness = 0.1; // spessore pareti

        const brownMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const darkBrownMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

        // 4 lati (pareti)
        // lato anteriore
        const frontGeom = new THREE.BoxGeometry(width, height, thickness);
        this.front = new THREE.Mesh(frontGeom, brownMaterial);
        this.front.position.set(0, height / 2, depth / 2 - thickness / 2);
        this.group.add(this.front);

        // lato posteriore
        const backGeom = new THREE.BoxGeometry(width, height, thickness);
        this.back = new THREE.Mesh(backGeom, brownMaterial);
        this.back.position.set(0, height / 2, -depth / 2 + thickness / 2);
        this.group.add(this.back);

        // lato sinistro
        const leftGeom = new THREE.BoxGeometry(thickness, height, depth);
        this.left = new THREE.Mesh(leftGeom, brownMaterial);
        this.left.position.set(-width / 2 + thickness / 2, height / 2, 0);
        this.group.add(this.left);

        // lato destro
        const rightGeom = new THREE.BoxGeometry(thickness, height, depth);
        this.right = new THREE.Mesh(rightGeom, brownMaterial);
        this.right.position.set(width / 2 - thickness / 2, height / 2, 0);
        this.group.add(this.right);

        // fondo
        const bottomGeom = new THREE.BoxGeometry(width, thickness, depth);
        this.bottom = new THREE.Mesh(bottomGeom, brownMaterial);
        this.bottom.position.set(0, thickness / 2, 0);
        this.group.add(this.bottom);

        // coperchio (pivot sull'asse posteriore, rotazione su X)
        const lidGeom = new THREE.BoxGeometry(width, thickness, depth);
        this.lid = new THREE.Mesh(lidGeom, darkBrownMaterial);
        this.lid.position.set(0, height + thickness / 2, -depth / 2 + thickness / 2);
        this.lid.geometry.translate(0, 0, depth / 2); // sposta pivot sul bordo posteriore
        this.group.add(this.lid);

        scene.add(this.group);

        // cubo interno (inizialmente invisibile)
        const cubeGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
        const cubeMat = new THREE.MeshStandardMaterial({ color: randomColor });
        this.insideCube = new THREE.Mesh(cubeGeom, cubeMat);
        this.insideCube.position.set(0, height + thickness + 0.5, 0);
        this.insideCube.visible = false;
        this.group.add(this.insideCube);

        // Mesh da usare per collisioni (4 lati + fondo)
        this.collisionMeshes = [this.front, this.back, this.left, this.right, this.bottom];

        if (collidableObjects) {
            collidableObjects.push(...this.collisionMeshes);
        }
    }

    open() {
        if (this.isOpen) return;

        this.isOpen = true;

        const targetRotation = -Math.PI / 2; // apertura a 90°
        const duration = 0.5;
        const startRotation = this.lid.rotation.x;
        const startTime = performance.now();

        const animateOpen = (time) => {
            let elapsed = (time - startTime) / 1000;
            if (elapsed < duration) {
                this.lid.rotation.x = THREE.MathUtils.lerp(startRotation, targetRotation, elapsed / duration);
                requestAnimationFrame(animateOpen);
            } else {
                this.lid.rotation.x = targetRotation;
                // Dopo apertura, sparisci coperchio e mostra cubo dentro
                this.lid.visible = false;
                this.insideCube.visible = true;
            }
        };

        requestAnimationFrame(animateOpen);
    }
}
