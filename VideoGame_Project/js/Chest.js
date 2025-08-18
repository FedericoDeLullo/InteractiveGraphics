import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

/**
 * Represents a chest in the game world, which can be opened to reveal a collectible weapon.
 */
export class Chest {
    /**
     * @param {THREE.Scene} scene - The Three.js scene to which the chest will be added.
     * @param {THREE.Vector3} position - The initial position of the chest.
     * @param {Array<THREE.Object3D>} collidableObjects - An array to add the chest's base for collision detection.
     * @param {Array<THREE.Object3D>} collectibleItems - Not currently used in this version.
     * @param {Array<THREE.Object3D>} weaponModels - An array of weapon models to be placed inside the chest.
     */
    constructor(scene, position = new THREE.Vector3(0, 0, 0), collidableObjects = null, collectibleItems = null, weaponModels = []) {
        this.scene = scene;
        this.isOpen = false;
        this.weaponModels = weaponModels;

        // Dimensions of the chest components
        const width = 6;
        const height = 1.5;
        const depth = 3;
        const thickness = 0.1;

        // Materials for the chest parts
        const brownMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const darkBrownMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

        // Creation of the chest's bottom, which acts as a floor and a collidable object
        const bottomGeom = new THREE.BoxGeometry(width, thickness, depth);
        this.bottom = new THREE.Mesh(bottomGeom, brownMaterial);
        this.bottom.position.set(position.x, position.y + thickness / 2, position.z);
        this.scene.add(this.bottom);

        // Add the chest's bottom to the collidable objects array for collision detection
        if (collidableObjects) {
            collidableObjects.push(this.bottom);
        }

        // Create a group to contain the movable parts of the chest (walls and lid)
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.scene.add(this.group);

        // Create the front, back, left, and right walls of the chest
        const frontGeom = new THREE.BoxGeometry(width, height, thickness);
        this.front = new THREE.Mesh(frontGeom, brownMaterial);
        this.front.position.set(0, height / 2 + thickness, depth / 2 - thickness / 2);
        this.group.add(this.front);

        const backGeom = new THREE.BoxGeometry(width, height, thickness);
        this.back = new THREE.Mesh(backGeom, brownMaterial);
        this.back.position.set(0, height / 2 + thickness, -depth / 2 + thickness / 2);
        this.group.add(this.back);

        const leftGeom = new THREE.BoxGeometry(thickness, height, depth);
        this.left = new THREE.Mesh(leftGeom, brownMaterial);
        this.left.position.set(-width / 2 + thickness / 2, height / 2 + thickness, 0);
        this.group.add(this.left);

        const rightGeom = new THREE.BoxGeometry(thickness, height, depth);
        this.right = new THREE.Mesh(rightGeom, brownMaterial);
        this.right.position.set(width / 2 - thickness / 2, height / 2 + thickness, 0);
        this.group.add(this.right);

        // Create the lid of the chest
        const lidGeom = new THREE.BoxGeometry(width, thickness, depth);
        this.lid = new THREE.Mesh(lidGeom, darkBrownMaterial);
        this.lid.position.set(0, height + thickness + thickness / 2, 0);
        this.group.add(this.lid);

        // Prepare the weapon models for the spinning animation
        this.spinWeapons = [];
        this.weaponModels.forEach((model, i) => {
            const weaponContainer = new THREE.Group();
            const spinWeapon = model.clone();

            // Store weapon properties on the cloned mesh
            spinWeapon.damage = model.damage;
            spinWeapon.range = model.range;
            spinWeapon.name = model.name;

            weaponContainer.add(spinWeapon);

            const spacing = 2;
            weaponContainer.position.set(0 + (i - 1) * spacing, height + thickness * 2 + 0.5, 0);

            // Hide the weapons initially
            weaponContainer.visible = false;
            this.group.add(weaponContainer);
            this.spinWeapons.push(weaponContainer);
        });

        // Placeholder for the final collectible item
        this.collectibleItem = null;

        // Sound for opening the chest
        this.audio = new Audio('sounds/chest-open.mp3');
    }

    /**
     * Opens the chest with an animation.
     * @param {Function} onAnimationComplete - A callback function to be executed after the animation finishes.
     */
    open(onAnimationComplete) {
        if (this.isOpen) return; // Prevent opening an already open chest
        this.isOpen = true;
        this.audio.play();

        // Animation parameters
        const targetY = this.lid.position.y + 5;
        const duration = 0.5;
        const startY = this.lid.position.y;
        const startTime = performance.now();

        // The animation loop for the lid movement
        const animateOpen = (time) => {
            const elapsed = (time - startTime) / 1000;
            if (elapsed < duration) {
                // Use linear interpolation to smoothly move the lid
                this.lid.position.y = THREE.MathUtils.lerp(startY, targetY, elapsed / duration);
                requestAnimationFrame(animateOpen);
            } else {
                // Set the final position and hide the lid
                this.lid.position.y = targetY;
                this.lid.visible = false;
                // Start the spinning animation of the weapons
                this.startSpinAnimation(onAnimationComplete);
            }
        };
        requestAnimationFrame(animateOpen);
    }

    /**
     * Starts the spinning animation for the weapons inside the chest.
     * @param {Function} onAnimationComplete - A callback function to be executed after the spin animation finishes.
     */
    startSpinAnimation(onAnimationComplete) {
        const spinDuration = 3;
        const spinStartTime = performance.now();
        const spinSpeed = 0.1;

        // Make the weapon containers visible
        this.spinWeapons.forEach(weaponContainer => weaponContainer.visible = true);

        // The animation loop for the spinning weapons
        const animateSpin = (time) => {
            const elapsed = (time - spinStartTime) / 1000;
            if (elapsed < spinDuration) {
                // Rotate each weapon container
                this.spinWeapons.forEach(weaponContainer => {
                    weaponContainer.rotation.y += spinSpeed;
                });
                requestAnimationFrame(animateSpin);
            } else {
                // Select a winning weapon at random
                const winningIndex = Math.floor(Math.random() * this.spinWeapons.length);
                const winningWeaponContainer = this.spinWeapons[winningIndex];
                const winningWeapon = winningWeaponContainer.children[0];

                // Remove the losing weapons from the scene
                this.spinWeapons.forEach((weaponContainer, index) => {
                    if (index !== winningIndex) {
                        this.group.remove(weaponContainer);
                    }
                });

                // Move the winning weapon from the group to the main scene
                const worldPosition = new THREE.Vector3();
                winningWeaponContainer.getWorldPosition(worldPosition);
                this.group.remove(winningWeaponContainer);
                this.scene.add(winningWeapon);
                winningWeapon.position.copy(worldPosition);

                // Store the final collectible item
                this.collectibleItem = winningWeapon;

                console.log(`The created weapon has a damage of: ${this.collectibleItem.damage} and a range of: ${this.collectibleItem.range}`);

                // Call the animation complete callback with the winning item
                if (onAnimationComplete) {
                    onAnimationComplete(this.collectibleItem);
                }
            }
        };
        requestAnimationFrame(animateSpin);
    }
}
