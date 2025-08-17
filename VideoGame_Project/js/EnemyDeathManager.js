import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

/**
 * Gestisce la logica di esplosione e animazione della morte per i nemici.
 */
export class EnemyDeathManager {
    constructor(scene, collidableObjects) {
        this.scene = scene;
        this.collidableObjects = collidableObjects;
        this.bodyParts = []; // Array per le parti del corpo da animare
        this.raycaster = new THREE.Raycaster();
        this.down = new THREE.Vector3(0, -1, 0);
        this.deathSound = new Audio('sounds/body-smash.mp3');
    }

    /**
     * Attiva l'animazione di esplosione per un nemico.
     * @param {THREE.Group} enemyGroup - Il gruppo del nemico da smembrare.
     * @param {THREE.Mesh} enemyModel - Il modello del nemico.
     * @param {THREE.Mesh} head - La testa.
     * @param {THREE.Mesh} leftArm - Il braccio sinistro.
     * @param {THREE.Mesh} rightArm - Il braccio destro.
     * @param {THREE.Mesh} leftLeg - La gamba sinistra.
     * @param {THREE.Mesh} rightLeg - La gamba destra.
     * @param {HTMLElement} healthBar - La barra della vita del nemico.
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

        this.scene.remove(enemyGroup);
        if (healthBar) {
            healthBar.style.display = 'none';
        }
    }

    /**
     * Aggiorna lo stato delle parti del corpo in animazione.
     * @param {number} delta - Il tempo trascorso dall'ultimo frame.
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

    /**
     * Restituisce il numero di parti del corpo attualmente in animazione.
     */
    get activePartsCount() {
        return this.bodyParts.length;
    }
}