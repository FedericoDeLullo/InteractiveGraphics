import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';
import { EnemyDeathManager } from './EnemyDeathManager.js';

export class Enemy {
    /**
     * @param {THREE.Scene} scene - La scena Three.js in cui aggiungere il nemico.
     * @param {HTMLElement} healthBarContainer - L'elemento DOM in cui aggiungere la barra della salute.
     * @param {THREE.Vector3} position - La posizione iniziale del nemico.
     * @param {number} health - La salute massima del nemico.
     * @param {THREE.Camera} playerCamera - La telecamera del giocatore per calcolare la traiettoria.
     * @param {Array} playerObjects - L'array di oggetti del giocatore da colpire.
     * @param {Function} playerDamageCallback - Funzione per infliggere danno al giocatore.
     * @param {Array} collidableObjects - L'array di oggetti con cui il nemico può entrare in collisione.
     * @param {EnemyDeathManager} enemyDeathManager - L'istanza del gestore della morte dei nemici.
     */
    constructor(scene, healthBarContainer, position = new THREE.Vector3(0, 0, 0), health = 100, playerCamera, playerObjects, playerDamageCallback, collidableObjects, enemyDeathManager) {
        this.scene = scene;
        this.maxHealth = health;
        this.health = health;
        this.isAlive = true;
        this.model = null;

        this.playerCamera = playerCamera;
        this.playerObjects = playerObjects;
        this.collidableObjects = collidableObjects;
        this.playerDamageCallback = playerDamageCallback;
        this.enemyDeathManager = enemyDeathManager;

        this.projectiles = [];
        this.raycaster = new THREE.Raycaster();

        this.group = new THREE.Group();
        this.group.position.copy(position);

        this.speed = 2.0;
        this.pursueSpeed = 4.0;
        this.rotationSpeed = 1;

        this.attackCooldown = 1.5;
        this.lastAttackTime = 0;
        this.damage = 10;
        this.fireSound = new Audio('sounds/pistol.mp3');

        this.state = 'Idle';
        this.roamingTimer = 0;
        this.roamingDuration = 5;

        const randomAngle = Math.random() * Math.PI * 2;
        this.roamingDirection = new THREE.Vector3(Math.sin(randomAngle), 0, Math.cos(randomAngle));

        this.pursueRange = 20;
        this.attackRange = 10;
        this.minAttackDistance = 2;

        this.down = new THREE.Vector3(0, -1, 0);
        this.movementRaycaster = new THREE.Raycaster();
        this.collisionCheckDistance = 1.0;

        this.walkCycle = 0;
        this.walkSpeed = 5;

        this.head = null;
        this.leftArm = null;
        this.rightArm = null;
        this.leftLeg = null;
        this.rightLeg = null;
        this.gun = null;
        this.gunLeft = null;

        this.gunIdlePosition = new THREE.Vector3(0.5, -3, 0.5);
        this.gunIdleRotation = new THREE.Euler(Math.PI / 2, 0, 0);

        this.gunPursuePosition = new THREE.Vector3(0.1, -2.5, 0.8);
        this.gunPursueRotation = new THREE.Euler(Math.PI / 2, 0, 0);
        this.createEnemyModel();

        // Ho ripristinato la dimensione del personaggio alla tua impostazione iniziale.
        this.group.scale.set(0.6, 0.6, 0.6);

        const enemyGeometry = new THREE.BoxGeometry(2, 10, 2);
        const enemyMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0,
            visible: false
        });
        this.mesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
        this.mesh.name = 'enemyHitbox';
        this.group.add(this.mesh);

        this.scene.add(this.group);
        this.createHealthBar(healthBarContainer);
    }

    createEnemyModel() {
        const bodyGeometry = new THREE.BoxGeometry(3, 5, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000, flatShading: true });
        this.model = new THREE.Mesh(bodyGeometry, bodyMaterial);

        const headGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 3.5;
        this.model.add(this.head);

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

        const armGeometry = new THREE.BoxGeometry(1, 4, 1);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });

        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-2, 0, 0);
        this.model.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(2, 0, 0);
        this.model.add(this.rightArm);

        const legGeometry = new THREE.BoxGeometry(1, 4, 1);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.7, -4.5, 0);
        this.model.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.7, -4.5, 0);
        this.model.add(this.rightLeg);

        const handGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const handMaterial = new THREE.MeshStandardMaterial({ color: 0x4B4B4B });

        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.y = -2;
        this.leftArm.add(leftHand);

        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.y = -2;
        this.rightArm.add(rightHand);

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

        const footGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const footMaterial = new THREE.MeshStandardMaterial({ color: 0x4B4B4B });

        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.y = -2;
        this.leftLeg.add(leftFoot);

        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.y = -2;
        this.rightLeg.add(rightFoot);

        const vertices = this.model.geometry.attributes.position.array;
        vertices[1] += 0.5;
        vertices[4] += 0.5;
        vertices[7] += 0.5;

        vertices[10] -= 0.5;
        vertices[13] -= 0.5;
        vertices[16] -= 0.5;

        this.model.geometry.attributes.position.needsUpdate = true;

        this.group.add(this.model);
    }

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

    shoot(playerPosition) {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown * 1000) {
            return;
        }
        this.lastAttackTime = now;

        this.fireSound.currentTime = 0;
        this.fireSound.play();

        const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000
        });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

        const enemyGroupPosition = new THREE.Vector3();
        this.group.getWorldPosition(enemyGroupPosition);
        const direction = playerPosition.clone().sub(enemyGroupPosition).normalize();

        projectile.position.copy(enemyGroupPosition);
        projectile.velocity = direction.multiplyScalar(30);
        projectile.damage = this.damage;
        projectile.previousPosition = projectile.position.clone();
        this.scene.add(projectile);
        this.projectiles.push(projectile);
    }

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

    animateLegs(delta) {
        this.walkCycle += this.walkSpeed * delta;
        const legSwing = Math.sin(this.walkCycle) * 0.5;

        this.leftLeg.rotation.x = -legSwing;
        this.rightLeg.rotation.x = legSwing;
    }

    animateArms(delta) {
        this.walkCycle += this.walkSpeed * delta;
        const armSwing = Math.sin(this.walkCycle) * 0.5;

        this.leftArm.rotation.x = armSwing;
        this.rightArm.rotation.x = -armSwing;
    }

    update(delta, playerPosition) {
        if (!this.isAlive) {
            return;
        }

        const projectilesToRemove = [];
        this.projectiles.forEach(p => {
            p.previousPosition.copy(p.position);
            p.position.addScaledVector(p.velocity, delta);

            const distanceTraveled = p.position.distanceTo(this.group.position);
            if (distanceTraveled > 50) {
                projectilesToRemove.push(p);
            } else {
                const directionVector = p.position.clone().sub(p.previousPosition).normalize();
                const distanceToCheck = p.position.distanceTo(p.previousPosition);
                this.raycaster.set(p.previousPosition, directionVector);
                this.raycaster.far = distanceToCheck;

                const intersects = this.raycaster.intersectObjects(this.playerObjects, true);

                if (intersects.length > 0) {
                    this.playerDamageCallback(p.damage);
                    projectilesToRemove.push(p);
                }
            }
        });

        projectilesToRemove.forEach(p => {
            this.scene.remove(p);
            const index = this.projectiles.indexOf(p);
            if (index > -1) {
                this.projectiles.splice(index, 1);
            }
        });

        this.raycaster.set(this.group.position, this.down);
        const intersects = this.raycaster.intersectObjects(this.collidableObjects, true);

        if (intersects.length > 0) {
            const distanceToGround = intersects[0].distance;
            const targetY = this.group.position.y - distanceToGround + 3.5;
            this.group.position.y = targetY;
        }

        const distanceToPlayer = this.group.position.distanceTo(playerPosition);
        let direction = new THREE.Vector3();

        if (distanceToPlayer <= this.minAttackDistance) {
            this.state = 'Evade';
        } else if (distanceToPlayer <= this.attackRange) {
            this.state = 'Attack';
        } else if (distanceToPlayer <= this.pursueRange) {
            this.state = 'Pursue';
        } else {
            this.state = 'Idle';
        }

        switch (this.state) {
            case 'Idle':
                if (this.gun && this.gunLeft) {
                    this.gun.position.copy(this.gunIdlePosition);
                    this.gun.rotation.copy(this.gunIdleRotation);
                    this.gunLeft.position.set(-this.gunIdlePosition.x, this.gunIdlePosition.y, this.gunIdlePosition.z);
                    this.gunLeft.rotation.copy(this.gunIdleRotation);
                }

                this.roamingTimer += delta;
                if (this.roamingTimer >= this.roamingDuration) {
                    this.roamingTimer = 0;
                    const newRandomAngle = Math.random() * Math.PI * 2;
                    this.roamingDirection.set(Math.sin(newRandomAngle), 0, Math.cos(newRandomAngle));
                }

                this.movementRaycaster.set(this.group.position, this.roamingDirection);
                const idleIntersects = this.movementRaycaster.intersectObjects(this.collidableObjects, true);
                if (idleIntersects.length > 0 && idleIntersects[0].distance < this.collisionCheckDistance) {
                    const newRandomAngle = Math.random() * Math.PI * 2;
                    this.roamingDirection.set(Math.sin(newRandomAngle), 0, Math.cos(newRandomAngle));
                } else {
                    this.group.position.addScaledVector(this.roamingDirection, this.speed * delta);
                }

                this.group.lookAt(this.group.position.clone().add(this.roamingDirection));

                this.animateLegs(delta);
                this.animateArms(delta);
                break;

            case 'Pursue':
                if (this.gun && this.gunLeft) {
                    this.gun.position.copy(this.gunPursuePosition);
                    this.gun.rotation.copy(this.gunPursueRotation);
                    this.gunLeft.position.set(-this.gunPursuePosition.x, this.gunPursuePosition.y, this.gunPursuePosition.z);
                    this.gunLeft.rotation.copy(this.gunPursueRotation);
                }

                const speed = this.pursueSpeed;
                direction.subVectors(playerPosition, this.group.position).normalize();

                this.movementRaycaster.set(this.group.position, direction);
                const pursueIntersects = this.movementRaycaster.intersectObjects(this.collidableObjects, true);
                if (pursueIntersects.length > 0 && pursueIntersects[0].distance < this.collisionCheckDistance) {
                    // Si ferma se c'è un ostacolo
                } else {
                    this.group.position.addScaledVector(direction, speed * delta);
                }

                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);

                this.animateLegs(delta);

                const rightArmWorldPosition = new THREE.Vector3();
                this.rightArm.getWorldPosition(rightArmWorldPosition);

                const aimingVector = new THREE.Vector3().subVectors(playerPosition, rightArmWorldPosition).normalize();
                const aimingAngleX = Math.atan2(aimingVector.y, Math.sqrt(aimingVector.x * aimingVector.x + aimingVector.z * aimingVector.z));

                this.rightArm.rotation.x = aimingAngleX - Math.PI / 2;
                this.rightArm.rotation.z = 0;

                this.leftArm.rotation.x = aimingAngleX - Math.PI / 2;
                this.leftArm.rotation.z = 0;
                break;

            case 'Attack':
                if (this.gun && this.gunLeft) {
                    this.gun.position.copy(this.gunPursuePosition);
                    this.gun.rotation.copy(this.gunPursueRotation);
                    this.gunLeft.position.set(-this.gunPursuePosition.x, this.gunPursuePosition.y, this.gunPursuePosition.z);
                    this.gunLeft.rotation.copy(this.gunPursueRotation);
                }

                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);

                this.leftLeg.rotation.x = 0;
                this.rightLeg.rotation.x = 0;
                this.leftArm.rotation.x = 0;
                this.rightArm.rotation.x = 0;

                const rightArmWorldPositionAttack = new THREE.Vector3();
                this.rightArm.getWorldPosition(rightArmWorldPositionAttack);

                const aimingVectorAttack = new THREE.Vector3().subVectors(playerPosition, rightArmWorldPositionAttack).normalize();
                const aimingAngleXAttack = Math.atan2(aimingVectorAttack.y, Math.sqrt(aimingVectorAttack.x * aimingVectorAttack.x + aimingVectorAttack.z * aimingVectorAttack.z));

                this.rightArm.rotation.x = aimingAngleXAttack - Math.PI / 2;
                this.rightArm.rotation.z = 0;

                this.leftArm.rotation.x = aimingAngleXAttack - Math.PI / 2;
                this.leftArm.rotation.z = 0;

                this.shoot(playerPosition);
                break;

            case 'Evade':
                direction.subVectors(this.group.position, playerPosition).normalize();

                this.movementRaycaster.set(this.group.position, direction);
                const evadeIntersects = this.movementRaycaster.intersectObjects(this.collidableObjects, true);
                if (evadeIntersects.length > 0 && evadeIntersects[0].distance < this.collisionCheckDistance) {
                    // Si ferma se c'è un ostacolo
                } else {
                    this.group.position.addScaledVector(direction, this.pursueSpeed * delta);
                }

                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);

                this.animateLegs(delta);
                this.animateArms(delta);
                break;
        }
    }
}