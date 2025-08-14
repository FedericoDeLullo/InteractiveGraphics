// Enemy.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Enemy {
    // Ho impostato il valore predefinito della salute a 100 per i tuoi test
    constructor(scene, healthBarContainer, position = new THREE.Vector3(0, 0, 0), health = 100) {
        this.scene = scene;
        this.maxHealth = health;
        this.health = health;
        this.isAlive = true;

        this.group = new THREE.Group();
        this.group.position.copy(position);

        const enemyGeometry = new THREE.BoxGeometry(2, 2, 2);
        const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Cubo rosso
        this.mesh = new THREE.Mesh(enemyGeometry, enemyMaterial);

        this.group.add(this.mesh);
        this.scene.add(this.group);

        this.createHealthBar(healthBarContainer);
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
        this.health -= damage;
        this.healthBar.style.display = 'block';
        console.log(`Il nemico ha subito ${damage} danni. Salute rimanente: ${this.health}`);

        const healthPercentage = (this.health / this.maxHealth) * 100;
        this.healthBarInner.style.width = `${Math.max(0, healthPercentage)}%`;

        if (this.health <= 0) {
            this.isAlive = false;
            console.log("Il nemico è stato sconfitto!");
            this.healthBar.remove(); // Rimuove la barra della vita HTML
            this.scene.remove(this.group); // Rimuove il nemico dalla scena 3D
        }
    }

    updateHealthBar(camera, renderer) {
        if (!this.isAlive) return;

        const enemyPosition = new THREE.Vector3();
        this.group.getWorldPosition(enemyPosition);

        const screenPosition = enemyPosition.clone().project(camera);

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

    update() {
        // Qui andrà la logica del movimento del nemico
    }
}