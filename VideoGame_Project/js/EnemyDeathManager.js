import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

/**
 * Manages the explosion and death animation logic for enemies.
 */
export class EnemyDeathManager {
    /**
     * @param {THREE.Scene} scene - The Three.js scene.
     * @param {Array<THREE.Object3D>} collidableObjects - The array of collidable objects to check for ground.
     */
    constructor(scene, collidableObjects) {
        this.scene = scene;
        this.collidableObjects = collidableObjects;
        this.bodyParts = []; // Array for the body parts to animate
        this.raycaster = new THREE.Raycaster();
        this.down = new THREE.Vector3(0, -1, 0);
        this.deathSound = new Audio('sounds/body-smash.mp3');
    }

    /**
     * Triggers the explosion animation for an enemy and removes it from the scene and collidable objects list.
     * @param {THREE.Group} enemyGroup - The enemy group to be dismembered.
     * @param {THREE.Mesh} enemyModel - The enemy's model mesh.
     * @param {THREE.Mesh} head - The head.
     * @param {THREE.Mesh} leftArm - The left arm.
     * @param {THREE.Mesh} rightArm - The right arm.
     * @param {THREE.Mesh} leftLeg - The left leg.
     * @param {THREE.Mesh} rightLeg - The right leg.
     * @param {HTMLElement} healthBar - The enemy's health bar.
     */
    explode(enemyGroup, enemyModel, head, leftArm, rightArm, leftLeg, rightLeg, healthBar) {
        this.deathSound.currentTime = 0;
        this.deathSound.play();

        const partsToDetach = [
            enemyModel,
            head,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg
        ];

        partsToDetach.forEach(part => {
            if (part && part.parent) {
                const worldPosition = new THREE.Vector3();
                part.getWorldPosition(worldPosition);

                const worldRotation = new THREE.Quaternion();
                part.getWorldQuaternion(worldRotation);

                this.scene.attach(part);
                part.position.copy(worldPosition);
                part.rotation.setFromQuaternion(worldRotation);

                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    Math.random() * 5 + 5,
                    (Math.random() - 0.5) * 10
                );
                part.userData.velocity = velocity;

                const rotationSpeed = new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5
                );
                part.userData.rotationSpeed = rotationSpeed;
                part.userData.lifeTimer = 0;
                this.bodyParts.push(part);
            }
        });

        // Remove the enemy from the scene
        this.scene.remove(enemyGroup);

        // Remove the enemy mesh from the collidable objects list directly
        const collidableIndex = this.collidableObjects.indexOf(enemyModel);
        if (collidableIndex > -1) {
            this.collidableObjects.splice(collidableIndex, 1);
        }

        if (healthBar) {
            healthBar.style.display = 'none';
        }
    }

    /**
     * Updates the state of the animating body parts.
     * @param {number} delta - The time elapsed since the last frame.
     */
    update(delta) {
        for (let i = this.bodyParts.length - 1; i >= 0; i--) {
            const part = this.bodyParts[i];

            if (part.userData.lifeTimer >= 5) {
                this.scene.remove(part);
                this.bodyParts.splice(i, 1);
                continue;
            }

            part.userData.lifeTimer += delta;

            if (part.userData.velocity) {
                part.position.addScaledVector(part.userData.velocity, delta);
                part.userData.velocity.y -= 9.8 * delta;
            }

            if (part.userData.rotationSpeed) {
                part.rotation.x += part.userData.rotationSpeed.x * delta;
                part.rotation.y += part.userData.rotationSpeed.y * delta;
                part.rotation.z += part.userData.rotationSpeed.z * delta;
            }

            this.raycaster.set(part.position, this.down);
            const groundIntersects = this.raycaster.intersectObjects(this.collidableObjects, true);

            if (groundIntersects.length > 0) {
                const distanceToGround = groundIntersects[0].distance;
                if (distanceToGround < 1.5) {
                    part.position.y += (1.5 - distanceToGround);
                    part.userData.velocity.y = -part.userData.velocity.y * 0.5;
                    part.userData.rotationSpeed.multiplyScalar(0.5);
                }
            }
        }
    }
}
