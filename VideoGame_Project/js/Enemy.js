import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';
import { EnemyDeathManager } from './EnemyDeathManager.js';

/**
 * Represents an enemy in the game world, managing its behavior, 3D model,
 * health, and interaction with the player and environment.
 */
export class Enemy {
    /**
     * @param {THREE.Scene} scene - The Three.js scene to which the enemy will be added.
     * @param {HTMLElement} healthBarContainer - The DOM element for the health bar.
     * @param {THREE.Vector3} position - The initial position of the enemy.
     * @param {number} health - The maximum health of the enemy.
     * @param {THREE.Camera} playerCamera - The player's camera to calculate the shooting trajectory.
     * @param {Array} playerObjects - The array of player objects to hit.
     * @param {Function} playerDamageCallback - Function to inflict damage on the player.
     * @param {Array} collidableObjects - The array of objects the enemy can collide with.
     * @param {EnemyDeathManager} enemyDeathManager - The instance of the enemy death manager.
     * @param {Array} enemyProjectiles - The global array of enemy projectiles.
     */
    constructor(scene, healthBarContainer, position = new THREE.Vector3(0, 0, 0), health = 100, playerCamera, playerObjects, playerDamageCallback, collidableObjects, enemyDeathManager, enemyProjectiles) {
        this.scene = scene;
        this.maxHealth = health;
        this.health = health;
        this.isAlive = true;

        // External references for interacting with the game world
        this.playerCamera = playerCamera;
        this.playerObjects = playerObjects;
        this.collidableObjects = collidableObjects;
        this.playerDamageCallback = playerDamageCallback;
        this.enemyDeathManager = enemyDeathManager;
        this.enemyProjectiles = enemyProjectiles;

        // Raycasters for collision detection and ground positioning
        this.raycaster = new THREE.Raycaster();
        this.down = new THREE.Vector3(0, -1, 0);
        this.movementRaycaster = new THREE.Raycaster();
        this.collisionCheckDistance = 1.0;

        // Main group for the enemy, containing the model and the hitbox
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.group.scale.set(0.6, 0.6, 0.6); // Using the previously provided setting
        this.scene.add(this.group);

        // Movement and attack parameters
        this.speed = 2.0;
        this.pursueSpeed = 4.0;
        this.attackCooldown = 1.5;
        this.lastAttackTime = 0;
        this.damage = 10;
        this.fireSound = new Audio('sounds/pistol.mp3');

        // Enemy states and variables for roaming
        this.state = 'Idle';
        this.roamingTimer = 0;
        this.roamingDuration = 5;
        this.roamingDirection = this.getRandomDirection();

        // Detection and attack ranges
        this.pursueRange = 20;
        this.attackRange = 10;
        this.minAttackDistance = 2;

        // Variables for limb animation
        this.walkCycle = 0;
        this.walkSpeed = 5;

        // 3D model parts
        this.model = null;
        this.head = null;
        this.leftArm = null;
        this.rightArm = null;
        this.leftLeg = null;
        this.rightLeg = null;
        this.gun = null;
        this.gunLeft = null;

        // Reference points for the gun
        this.gunIdlePosition = new THREE.Vector3(0.5, -3, 0.5);
        this.gunIdleRotation = new THREE.Euler(Math.PI / 2, 0, 0);
        this.gunPursuePosition = new THREE.Vector3(0.1, -2.5, 0.8);
        this.gunPursueRotation = new THREE.Euler(Math.PI / 2, 0, 0);

        // Initialize the enemy
        this.createEnemyModel();
        this.createEnemyHitbox();
        this.createHealthBar(healthBarContainer);
    }

    /**
     * Generates a random direction for roaming.
     * @returns {THREE.Vector3} A normalized random direction vector.
     */
    getRandomDirection() {
        const randomAngle = Math.random() * Math.PI * 2;
        return new THREE.Vector3(Math.sin(randomAngle), 0, Math.cos(randomAngle)).normalize();
    }
    /**
     * Creates the enemy's invisible hitbox for collision detection.
     */
    createEnemyHitbox() {
        const enemyGeometry = new THREE.BoxGeometry(2, 10, 2);
        const enemyMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0,
            visible: false
        });
        this.mesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
        this.mesh.name = 'enemyHitbox';
        this.group.add(this.mesh);
    }

    /**
     * Creates the enemy's 3D model, including body, head, limbs, and gun.
     */
    createEnemyModel() {
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(3, 5, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000, flatShading: true });
        this.model = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Head
        const headGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 3.5;
        this.model.add(this.head);

        // Eyes, nose, and hair
        this.createFaceParts();
        this.createHair();

        // Arms and legs
        const armGeometry = new THREE.BoxGeometry(1, 4, 1);
        const legGeometry = new THREE.BoxGeometry(1, 4, 1);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const handFootMaterial = new THREE.MeshStandardMaterial({ color: 0x4B4B4B });

        this.leftArm = this.createLimb(armGeometry, armMaterial, new THREE.Vector3(-2, 0, 0), handFootMaterial, 'hand');
        this.rightArm = this.createLimb(armGeometry, armMaterial, new THREE.Vector3(2, 0, 0), handFootMaterial, 'hand');
        this.leftLeg = this.createLimb(legGeometry, legMaterial, new THREE.Vector3(-0.7, -4.5, 0), handFootMaterial, 'foot');
        this.rightLeg = this.createLimb(legGeometry, legMaterial, new THREE.Vector3(0.7, -4.5, 0), handFootMaterial, 'foot');

        this.model.add(this.leftArm, this.rightArm, this.leftLeg, this.rightLeg);

        // Loads and adds the gun
        this.loadGunModel();

        this.group.add(this.model);
    }

    /**
     * Creates and adds face elements (eyes, nose) to the enemy's head.
     */
    createFaceParts() {
        const eyeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.6, 0.3, 1.4);
        rightEye.position.set(0.6, 0.3, 1.4);
        this.head.add(leftEye, rightEye);

        const noseGeometry = new THREE.ConeGeometry(0.3, 0.6, 16);
        const noseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 0, 1.4);
        nose.rotation.x = Math.PI / 2;
        this.head.add(nose);
    }

    /**
     * Creates and adds hair elements to the enemy's head.
     */
    createHair() {
        const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const frontHair = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), hairMaterial);
        frontHair.position.set(0, 1.5, 0.8);
        frontHair.rotation.x = -Math.PI / 8;
        this.head.add(frontHair);

        const sideHairLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 1), hairMaterial);
        sideHairLeft.position.set(-1.3, 1, -0.5);
        sideHairLeft.rotation.z = Math.PI / 4;
        this.head.add(sideHairLeft);

        const sideHairRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 1), hairMaterial);
        sideHairRight.position.set(1.3, 1, -0.5);
        sideHairRight.rotation.z = -Math.PI / 4;
        this.head.add(sideHairRight);
    }

    /**
     * Creates a limb (arm or leg) with a hand/foot.
     * @param {THREE.BufferGeometry} limbGeometry - The geometry of the limb.
     * @param {THREE.Material} limbMaterial - The material of the limb.
     * @param {THREE.Vector3} position - The position of the limb relative to the body.
     * @param {THREE.Material} handFootMaterial - The material for the hand/foot.
     * @param {string} type - The type of limb ('hand' or 'foot').
     * @returns {THREE.Mesh} The complete limb mesh.
     */
    createLimb(limbGeometry, limbMaterial, position, handFootMaterial, type) {
        const limb = new THREE.Mesh(limbGeometry, limbMaterial);
        limb.position.copy(position);

        const extremityGeometry = type === 'hand' ? new THREE.SphereGeometry(0.5, 16, 16) : new THREE.SphereGeometry(0.7, 16, 16);
        const extremity = new THREE.Mesh(extremityGeometry, handFootMaterial);
        extremity.position.y = -2;
        limb.add(extremity);

        return limb;
    }

    /**
     * Loads the GLTF gun model and adds it to the arms.
     */
    loadGunModel() {
        const loader = new GLTFLoader();
        loader.load(
            'models/pistol.glb',
            (gltf) => {
                this.gun = gltf.scene;
                this.gunLeft = this.gun.clone();
                this.gun.scale.set(1, 1, 1);
                this.gunLeft.scale.set(1, 1, 1);
                this.rightArm.add(this.gun);
                this.leftArm.add(this.gunLeft);
            },
            undefined,
            (error) => {
                console.error('An error occurred while loading the gun model:', error);
            }
        );
    }

    /**
     * Creates the enemy's health bar in the DOM.
     * @param {HTMLElement} container - The parent DOM element for the health bar.
     */
    createHealthBar(container) {
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'enemy-health-bar';
        this.healthBar.style.position = 'absolute';
        this.healthBar.style.width = '50px';
        this.healthBar.style.height = '5px';
        this.healthBar.style.background = 'red';
        this.healthBar.style.border = '1px solid black';
        this.healthBar.style.zIndex = '10';
        this.healthBar.style.display = 'none';

        this.healthBarInner = document.createElement('div');
        this.healthBarInner.style.width = '100%';
        this.healthBarInner.style.height = '100%';
        this.healthBarInner.style.background = 'green';
        this.healthBar.appendChild(this.healthBarInner);

        container.appendChild(this.healthBar);
    }

    /**
     * Inflicts damage on the enemy.
     * @param {number} damage - The amount of damage to inflict.
     */
    takeDamage(damage) {
        if (!this.isAlive) return;
        this.health -= damage;
        this.healthBar.style.display = 'block';

        const healthPercentage = (this.health / this.maxHealth) * 100;
        this.healthBarInner.style.width = `${Math.max(0, healthPercentage)}%`;

        if (this.health <= 0) {
            this.isAlive = false;
            this.enemyDeathManager.explode(
                this.group,
                this.model,
                this.head,
                this.leftArm,
                this.rightArm,
                this.leftLeg,
                this.rightLeg,
                this.healthBar
            );
        }
    }

    /**
     * Creates and shoots a projectile towards the player.
     * @param {THREE.Vector3} playerPosition - The current position of the player.
     */
    shoot(playerPosition) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown * 1000) {
            return;
        }
        this.lastAttackTime = now;

        this.fireSound.currentTime = 0;
        this.fireSound.play();

        const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

        const enemyGroupPosition = new THREE.Vector3();
        this.group.getWorldPosition(enemyGroupPosition);
        const direction = playerPosition.clone().sub(enemyGroupPosition).normalize();

        projectile.position.copy(enemyGroupPosition);
        projectile.velocity = direction.multiplyScalar(30);
        projectile.damage = this.damage;

        this.scene.add(projectile);
        this.enemyProjectiles.push(projectile);
    }

    /**
     * Updates the health bar's position based on the enemy's position.
     * @param {THREE.Camera} camera - The scene camera.
     * @param {THREE.WebGLRenderer} renderer - The Three.js renderer.
     */
    updateHealthBar(camera, renderer) {
        if (!this.isAlive) {
            this.healthBar.style.display = 'none';
            return;
        }

        const enemyPosition = new THREE.Vector3();
        const screenPosition = new THREE.Vector3();
        this.group.getWorldPosition(enemyPosition);
        const offset = new THREE.Vector3(0, 4, 0);
        enemyPosition.add(offset);
        screenPosition.copy(enemyPosition).project(camera);

        const x = (screenPosition.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
        const y = (-screenPosition.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
        const isBehind = screenPosition.z > 1;

        if (isBehind) {
            this.healthBar.style.display = 'none';
        } else {
            this.healthBar.style.left = `${x - 25}px`;
            this.healthBar.style.top = `${y - 30}px`;
            this.healthBar.style.display = 'block';
        }
    }

    /**
     * Animates the movement of the enemy's limbs.
     * @param {number} delta - The time elapsed since the last frame.
     * @param {number} direction - 1 for forward, -1 for backward.
     */
    animateLimbs(delta, direction = 1) {
        this.walkCycle += this.walkSpeed * delta;
        const swing = Math.sin(this.walkCycle) * 0.5 * direction;
        this.leftLeg.rotation.x = -swing;
        this.rightLeg.rotation.x = swing;
        this.leftArm.rotation.x = swing;
        this.rightArm.rotation.x = -swing;
    }

    /**
     * Updates the position and rotation of the guns based on the enemy's state.
     */
    updateGunPosition() {
        if (!this.gun || !this.gunLeft) return;

        const isAttacking = this.state === 'Attack' || this.state === 'Pursue';
        const position = isAttacking ? this.gunPursuePosition : this.gunIdlePosition;
        const rotation = isAttacking ? this.gunPursueRotation : this.gunIdleRotation;

        this.gun.position.copy(position);
        this.gun.rotation.copy(rotation);
        this.gunLeft.position.set(-position.x, position.y, position.z);
        this.gunLeft.rotation.copy(rotation);
    }

    /**
     * Updates the enemy's state, movement, and animations.
     * @param {number} delta - The time elapsed since the last frame.
     * @param {THREE.Vector3} playerPosition - The player's position.
     */
    update(delta, playerPosition) {
        if (!this.isAlive) {
            return;
        }

        // Positions the enemy on the ground
        this.raycaster.set(this.group.position, this.down);
        const intersects = this.raycaster.intersectObjects(this.collidableObjects, true);
        if (intersects.length > 0) {
            const distanceToGround = intersects[0].distance;
            const targetY = this.group.position.y - distanceToGround + 3.5;
            this.group.position.y = targetY;
        }

        // Determines the enemy's state based on the distance from the player
        const distanceToPlayer = this.group.position.distanceTo(playerPosition);
        if (distanceToPlayer <= this.attackRange) {
            this.state = 'Attack';
        } else if (distanceToPlayer <= this.pursueRange) {
            this.state = 'Pursue';
        } else {
            this.state = 'Idle';
        }

        let direction = new THREE.Vector3();

        // Performs the appropriate actions for each state
        switch (this.state) {
            case 'Idle':
                this.animateLimbs(delta);
                this.roamingTimer += delta;
                if (this.roamingTimer >= this.roamingDuration) {
                    this.roamingTimer = 0;
                    this.roamingDirection = this.getRandomDirection();
                }

                this.movementRaycaster.set(this.group.position, this.roamingDirection);
                const idleIntersects = this.movementRaycaster.intersectObjects(this.collidableObjects, true);
                if (idleIntersects.length > 0 && idleIntersects[0].distance < this.collisionCheckDistance) {
                    this.roamingDirection = this.getRandomDirection();
                } else {
                    this.group.position.addScaledVector(this.roamingDirection, this.speed * delta);
                }
                this.group.lookAt(this.group.position.clone().add(this.roamingDirection));
                break;

            case 'Pursue':
                this.animateLimbs(delta);
                direction.subVectors(playerPosition, this.group.position).normalize();
                this.movementRaycaster.set(this.group.position, direction);
                const pursueIntersects = this.movementRaycaster.intersectObjects(this.collidableObjects, true);
                if (!(pursueIntersects.length > 0 && pursueIntersects[0].distance < this.collisionCheckDistance)) {
                    this.group.position.addScaledVector(direction, this.pursueSpeed * delta);
                }
                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);
                break;

            case 'Attack':
                // Stops movement, but continues to look at the player and shoot
                this.leftLeg.rotation.x = 0;
                this.rightLeg.rotation.x = 0;
                this.leftArm.rotation.x = 0;
                this.rightArm.rotation.x = 0;
                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);
                this.shoot(playerPosition);
                break;

        }

        // Always update the gun's position based on the state
        this.updateGunPosition();

        // Rotates the arms for aiming only when necessary
        if (this.state === 'Pursue' || this.state === 'Attack') {
            const rightArmWorldPosition = new THREE.Vector3();
            this.rightArm.getWorldPosition(rightArmWorldPosition);
            const aimingVector = new THREE.Vector3().subVectors(playerPosition, rightArmWorldPosition).normalize();
            const aimingAngleX = Math.atan2(aimingVector.y, Math.sqrt(aimingVector.x * aimingVector.x + aimingVector.z * aimingVector.z));
            this.rightArm.rotation.x = aimingAngleX - Math.PI / 2;
            this.rightArm.rotation.z = 0;
            this.leftArm.rotation.x = aimingAngleX - Math.PI / 2;
            this.leftArm.rotation.z = 0;
        }
    }
}
