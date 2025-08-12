import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Chest {
    constructor(scene, position = new THREE.Vector3(0, 0, 0), collidableObjects = null, collectibleItems = null, weaponModels = []) {
        this.scene = scene;
        this.isOpen = false;
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.weaponModels = weaponModels;

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

        this.spinWeapons = [];
        this.weaponModels.forEach((model, i) => {
            const weaponContainer = new THREE.Group();
            const spinWeapon = model.clone();

            spinWeapon.damage = model.damage;
            spinWeapon.range = model.range;
            spinWeapon.name = model.name;

            weaponContainer.add(spinWeapon);

            const spacing = 2;
            weaponContainer.position.set(0 + (i - 1) * spacing, height + thickness + 0.5, 0);

            weaponContainer.visible = false;
            this.group.add(weaponContainer);
            this.spinWeapons.push(weaponContainer);
        });

        this.collectibleItem = null;

        this.collisionMeshes = [this.front, this.back, this.left, this.right, this.bottom];

        if (collidableObjects) {
            collidableObjects.push(...this.collisionMeshes);
        }

        this.audio = new Audio('sounds/chest-open.mp3');
    }

    open(onAnimationComplete) {
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
                this.startSpinAnimation(onAnimationComplete);
            }
        };
        requestAnimationFrame(animateOpen);
    }

    startSpinAnimation(onAnimationComplete) {
        const spinDuration = 3;
        const spinStartTime = performance.now();
        const spinSpeed = 0.1;

        this.spinWeapons.forEach(weaponContainer => weaponContainer.visible = true);

        const animateSpin = (time) => {
            const elapsed = (time - spinStartTime) / 1000;
            if (elapsed < spinDuration) {
                this.spinWeapons.forEach(weaponContainer => {
                    weaponContainer.rotation.y += spinSpeed;
                });
                requestAnimationFrame(animateSpin);
            } else {
                const winningIndex = Math.floor(Math.random() * this.spinWeapons.length);
                const winningWeaponContainer = this.spinWeapons[winningIndex];
                const winningWeapon = winningWeaponContainer.children[0];

                this.spinWeapons.forEach((weaponContainer, index) => {
                    if (index !== winningIndex) {
                        this.group.remove(weaponContainer);
                    }
                });

                const worldPosition = new THREE.Vector3();
                winningWeaponContainer.getWorldPosition(worldPosition);
                this.group.remove(winningWeaponContainer);

                this.scene.add(winningWeapon);
                winningWeapon.position.copy(worldPosition);

                this.collectibleItem = winningWeapon;

                console.log(`L'arma creata ha un danno di: ${this.collectibleItem.damage} e una portata di: ${this.collectibleItem.range}`);

                if (onAnimationComplete) {
                    onAnimationComplete(this.collectibleItem);
                }
            }
        };
        requestAnimationFrame(animateSpin);
    }
}