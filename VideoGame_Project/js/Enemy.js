import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Enemy {
    /**
     * @param {THREE.Scene} scene - La scena Three.js in cui aggiungere il nemico.
     * @param {HTMLElement} healthBarContainer - L'elemento DOM in cui aggiungere la barra della salute.
     * @param {THREE.Vector3} position - La posizione iniziale del nemico.
     * @param {number} health - La salute massima del nemico.
     */
    constructor(scene, healthBarContainer, position = new THREE.Vector3(0, 0, 0), health = 100) {
        this.scene = scene;
        this.maxHealth = health;
        this.health = health;
        this.isAlive = true;
        this.model = null;

        this.group = new THREE.Group();
        this.group.position.copy(position);

        this.speed = 2.0;

        // Variabili per la logica di stato
        this.state = 'Idle';
        this.pursueRange = 20; // Raggio entro cui il nemico inizia a inseguire
        this.attackRange = 5; // Raggio entro cui il nemico inizia ad attaccare
        this.attackCooldown = 2; // Tempo tra un attacco e l'altro
        this.lastAttackTime = 0;

        // Raycaster per il posizionamento sul terreno
        this.raycaster = new THREE.Raycaster();
        this.down = new THREE.Vector3(0, -1, 0);

        // Parametri per l'animazione di camminata
        this.walkCycle = 0;
        this.walkSpeed = 5; // Velocità dell'animazione di camminata

        this.createEnemyModel();

        // Rimpicciolisce il nemico per renderlo coerente con la dimensione del giocatore
        this.group.scale.set(0.6, 0.6, 0.6);

        // Crea una hitbox invisibile.
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

        // Crea e aggiunge la barra della salute al contenitore DOM.
        this.createHealthBar(healthBarContainer);
    }

    /**
     * Crea il modello del nemico con forme geometriche di base.
     */
    createEnemyModel() {
        // Corpo (Cilindro)
        const bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.group.add(this.body);

        // Testa (Sfera)
        const headGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 3.5;
        this.group.add(this.head);

        // Gamba sinistra (Cilindro)
        const legGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 32);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.75, -4, 0);
        this.group.add(this.leftLeg);

        // Gamba destra (Cilindro)
        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.75, -4, 0);
        this.group.add(this.rightLeg);

        // Braccia
        const armGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 32);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-2.2, 0.5, 0);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(2.2, 0.5, 0);
        this.group.add(this.rightArm);

        this.model = this.group;
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

    /**
     * Infligge danni al nemico e gestisce la sua salute.
     * @param {number} damage - La quantità di danno da infliggere.
     */
    takeDamage(damage) {
        if (!this.isAlive) return;
        this.health -= damage;
        this.healthBar.style.display = 'block';

        const healthPercentage = (this.health / this.maxHealth) * 100;
        this.healthBarInner.style.width = `${Math.max(0, healthPercentage)}%`;

        if (this.health <= 0) {
            this.isAlive = false;
        }
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

    /**
     * Esegue l'animazione di camminata creata a mano.
     * @param {number} delta - Il tempo trascorso dall'ultimo frame.
     */
    animateWalk(delta) {
        // Aggiorna il ciclo di camminata in base al tempo
        this.walkCycle += this.walkSpeed * delta;

        // Movimento in sinusoide per simulare il passo
        const legSwing = Math.sin(this.walkCycle) * 0.5;
        this.leftLeg.rotation.x = -legSwing;
        this.rightLeg.rotation.x = legSwing;

        const armSwing = Math.sin(this.walkCycle + Math.PI) * 0.5;
        this.leftArm.rotation.x = armSwing;
        this.rightArm.rotation.x = -armSwing;
    }

    /**
     * Aggiorna lo stato del nemico ad ogni frame.
     * @param {number} delta - Il tempo trascorso dall'ultimo frame.
     * @param {THREE.Vector3} playerPosition - La posizione attuale del giocatore.
     * @param {Array} collidableObjects - Array di oggetti con cui il nemico può entrare in collisione.
     */
    update(delta, playerPosition, collidableObjects) {
        if (!this.isAlive) {
            return;
        }

        this.raycaster.set(this.group.position, this.down);
        const intersects = this.raycaster.intersectObjects(collidableObjects, true);

        if (intersects.length > 0) {
            const distanceToGround = intersects[0].distance;
            // Calcola il posizionamento verticale corretto in base alla scala.
            const targetY = this.group.position.y - distanceToGround + 3.5;
            this.group.position.y = targetY;
        }

        const distanceToPlayer = this.group.position.distanceTo(playerPosition);
        const direction = new THREE.Vector3();

        const previousState = this.state;

        if (distanceToPlayer <= this.attackRange) {
            this.state = 'Attack';
        } else if (distanceToPlayer <= this.pursueRange) {
            this.state = 'Pursue';
        } else {
            this.state = 'Idle';
        }

        // Esegue l'azione in base allo stato corrente
        switch (this.state) {
            case 'Idle':
                // Ferma l'animazione di camminata
                this.leftLeg.rotation.x = 0;
                this.rightLeg.rotation.x = 0;
                this.leftArm.rotation.x = 0;
                this.rightArm.rotation.x = 0;
                break;

            case 'Pursue':
                // Avvia il movimento e l'animazione di camminata
                direction.subVectors(playerPosition, this.group.position).normalize();
                this.group.position.addScaledVector(direction, this.speed * delta);
                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);
                this.animateWalk(delta);
                break;

            case 'Attack':
                // Ruota il nemico verso il giocatore e gestisce il cooldown
                this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);
                const elapsedTime = Date.now() / 1000;
                if (elapsedTime - this.lastAttackTime >= this.attackCooldown) {
                    this.lastAttackTime = elapsedTime;
                }
                break;
        }
    }
}