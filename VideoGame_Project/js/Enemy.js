import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';
import { EnemyDeathManager } from './EnemyDeathManager.js';

/**
 * Rappresenta un nemico nel mondo di gioco, gestendo il suo comportamento, il modello 3D,
 * la salute e l'interazione con il giocatore e l'ambiente.
 */
export class Enemy {
    /**
     * @param {THREE.Scene} scene - La scena Three.js in cui aggiungere il nemico.
     * @param {HTMLElement} healthBarContainer - L'elemento DOM per la barra della salute.
     * @param {THREE.Vector3} position - La posizione iniziale del nemico.
     * @param {number} health - La salute massima del nemico.
     * @param {THREE.Camera} playerCamera - La telecamera del giocatore per calcolare la traiettoria di sparo.
     * @param {Array} playerObjects - L'array di oggetti del giocatore da colpire.
     * @param {Function} playerDamageCallback - Funzione per infliggere danno al giocatore.
     * @param {Array} collidableObjects - L'array di oggetti con cui il nemico può entrare in collisione.
     * @param {EnemyDeathManager} enemyDeathManager - L'istanza del gestore della morte dei nemici.
     * @param {Array} enemyProjectiles - L'array globale dei proiettili dei nemici.
     */
    constructor(scene, healthBarContainer, position = new THREE.Vector3(0, 0, 0), health = 100, playerCamera, playerObjects, playerDamageCallback, collidableObjects, enemyDeathManager, enemyProjectiles) {
        this.scene = scene;
        this.maxHealth = health;
        this.health = health;
        this.isAlive = true;

        // Riferimenti esterni per l'interazione con il mondo di gioco
        this.playerCamera = playerCamera;
        this.playerObjects = playerObjects;
        this.collidableObjects = collidableObjects;
        this.playerDamageCallback = playerDamageCallback;
        this.enemyDeathManager = enemyDeathManager;
        this.enemyProjectiles = enemyProjectiles;

        // Raycaster per la rilevazione di collisioni e la posizione sul terreno
        this.raycaster = new THREE.Raycaster();
        this.down = new THREE.Vector3(0, -1, 0);
        this.movementRaycaster = new THREE.Raycaster();
        this.collisionCheckDistance = 1.0;

        // Gruppo principale per il nemico, che contiene il modello e l'hitbox
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.group.scale.set(0.6, 0.6, 0.6); // Utilizza l'impostazione fornita in precedenza
        this.scene.add(this.group);

        // Parametri di movimento e attacco
        this.speed = 2.0;
        this.pursueSpeed = 4.0;
        this.attackCooldown = 1.5;
        this.lastAttackTime = 0;
        this.damage = 10;
        this.fireSound = new Audio('sounds/pistol.mp3');

        // Stati del nemico e variabili per il roaming
        this.state = 'Idle';
        this.roamingTimer = 0;
        this.roamingDuration = 5;
        this.roamingDirection = this.getRandomDirection();

        // Raggi di rilevamento e attacco
        this.pursueRange = 20;
        this.attackRange = 10;
        this.minAttackDistance = 2;

        // Variabili per l'animazione degli arti
        this.walkCycle = 0;
        this.walkSpeed = 5;

        // Parti del modello 3D
        this.model = null;
        this.head = null;
        this.leftArm = null;
        this.rightArm = null;
        this.leftLeg = null;
        this.rightLeg = null;
        this.gun = null;
        this.gunLeft = null;

        // Punti di riferimento per la pistola
        this.gunIdlePosition = new THREE.Vector3(0.5, -3, 0.5);
        this.gunIdleRotation = new THREE.Euler(Math.PI / 2, 0, 0);
        this.gunPursuePosition = new THREE.Vector3(0.1, -2.5, 0.8);
        this.gunPursueRotation = new THREE.Euler(Math.PI / 2, 0, 0);

        // Inizializzazione del nemico
        this.createEnemyModel();
        this.createEnemyHitbox();
        this.createHealthBar(healthBarContainer);
    }

    /**
     * Genera una direzione casuale per il roaming.
     * @returns {THREE.Vector3} Una direzione casuale normalizzata.
     */
    getRandomDirection() {
        const randomAngle = Math.random() * Math.PI * 2;
        return new THREE.Vector3(Math.sin(randomAngle), 0, Math.cos(randomAngle)).normalize();
    }

    /**
     * Crea l'hitbox invisibile del nemico per la rilevazione delle collisioni.
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
     * Crea il modello 3D del nemico, includendo corpo, testa, arti e pistola.
     */
    createEnemyModel() {
        // Corpo principale
        const bodyGeometry = new THREE.BoxGeometry(3, 5, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000, flatShading: true });
        this.model = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Testa
        const headGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 3.5;
        this.model.add(this.head);

        // Occhi, naso e capelli
        this.createFaceParts();
        this.createHair();

        // Braccia e gambe
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

        // Carica e aggiunge la pistola
        this.loadGunModel();

        this.group.add(this.model);
    }

    /**
     * Crea e aggiunge gli elementi del viso (occhi, naso) alla testa del nemico.
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
     * Crea e aggiunge gli elementi dei capelli alla testa del nemico.
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
     * Crea un arto (braccio o gamba) con una mano/piede.
     * @param {THREE.BufferGeometry} limbGeometry - Geometria dell'arto.
     * @param {THREE.Material} limbMaterial - Materiale dell'arto.
     * @param {THREE.Vector3} position - Posizione dell'arto rispetto al corpo.
     * @param {THREE.Material} handFootMaterial - Materiale per la mano/piede.
     * @param {string} type - Tipo di arto ('hand' o 'foot').
     * @returns {THREE.Mesh} Il mesh dell'arto completo.
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
     * Carica il modello GLTF della pistola e lo aggiunge alle braccia.
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
     * Crea la barra della salute del nemico nel DOM.
     * @param {HTMLElement} container - L'elemento DOM padre per la barra della salute.
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
     * Infligge danno al nemico.
     * @param {number} damage - Il danno da infliggere.
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
     * Crea e spara un proiettile verso il giocatore.
     * @param {THREE.Vector3} playerPosition - La posizione attuale del giocatore.
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
     * Aggiorna la posizione della barra della salute in base alla posizione del nemico.
     * @param {THREE.Camera} camera - La telecamera della scena.
     * @param {THREE.WebGLRenderer} renderer - Il renderer Three.js.
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
     * Anima il movimento delle gambe del nemico.
     * @param {number} delta - Il tempo trascorso dall'ultimo frame.
     * @param {number} direction - 1 per avanti, -1 per indietro.
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
     * Aggiorna la posizione e la rotazione delle pistole in base allo stato del nemico.
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
     * Aggiorna lo stato, il movimento e le animazioni del nemico.
     * @param {number} delta - Il tempo trascorso dall'ultimo frame.
     * @param {THREE.Vector3} playerPosition - La posizione del giocatore.
     */
    update(delta, playerPosition) {
        if (!this.isAlive) {
            return;
        }

        // Posiziona il nemico a terra
        this.raycaster.set(this.group.position, this.down);
        const intersects = this.raycaster.intersectObjects(this.collidableObjects, true);
        if (intersects.length > 0) {
            const distanceToGround = intersects[0].distance;
            const targetY = this.group.position.y - distanceToGround + 3.5;
            this.group.position.y = targetY;
        }

        // Determina lo stato del nemico in base alla distanza dal giocatore
        const distanceToPlayer = this.group.position.distanceTo(playerPosition);
        if (distanceToPlayer <= this.minAttackDistance) {
            this.state = 'Evade';
        } else if (distanceToPlayer <= this.attackRange) {
            this.state = 'Attack';
        } else if (distanceToPlayer <= this.pursueRange) {
            this.state = 'Pursue';
        } else {
            this.state = 'Idle';
        }

        let direction = new THREE.Vector3();

        // Esegue le azioni appropriate per ogni stato
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
                // Ferma il movimento, ma continua a guardare il giocatore e spara
                this.leftLeg.rotation.x = 0;
                this.rightLeg.rotation.x = 0;
                this.leftArm.rotation.x = 0;
                this.rightArm.rotation.x = 0;
                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);
                this.shoot(playerPosition);
                break;

            case 'Evade':
                this.animateLimbs(delta, -1); // Anima camminata all'indietro
                direction.subVectors(this.group.position, playerPosition).normalize();
                this.movementRaycaster.set(this.group.position, direction);
                const evadeIntersects = this.movementRaycaster.intersectObjects(this.collidableObjects, true);
                if (!(evadeIntersects.length > 0 && evadeIntersects[0].distance < this.collisionCheckDistance)) {
                    this.group.position.addScaledVector(direction, this.pursueSpeed * delta);
                }
                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);
                break;
        }

        // Aggiorna sempre la posizione della pistola in base allo stato
        this.updateGunPosition();

        // Ruota gli arti per mirare solo quando necessario
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
