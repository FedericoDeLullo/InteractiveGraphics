import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/GLTFLoader.js';

export class Enemy {
    constructor(scene, healthBarContainer, position = new THREE.Vector3(0, 0, 0), health = 100) {
        this.scene = scene;
        this.maxHealth = health;
        this.health = health;
        this.isAlive = true;
        this.model = null;

        this.group = new THREE.Group();
        this.group.position.copy(position);

        // Crea il cubo invisibile per il rilevamento delle collisioni
        const enemyGeometry = new THREE.BoxGeometry(2, 10, 2);
        const enemyMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0,
            visible: false
        });
        this.mesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
        this.mesh.name = 'enemyHitbox';
        this.group.add(this.mesh);

        // Carica il modello GLB e lo aggiunge al gruppo
        const loader = new GLTFLoader();
        loader.load('./models/enemy.glb', (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(2, 2, 2);

            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Posiziona il modello in base alla dimensione della hitbox
            // Questo assicura che il modello sia centrato sulla hitbox
            const box = new THREE.Box3().setFromObject(this.model);
            const modelHeight = box.max.y - box.min.y;
            this.model.position.y -= modelHeight + 1.01;

            this.group.add(this.model);
            this.scene.add(this.group);

        }, undefined, (error) => {
            console.error('Errore nel caricamento del modello del nemico:', error);
        });

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
            this.healthBar.remove();
            this.scene.remove(this.group);
        }
    }

    updateHealthBar(camera, renderer) {
        if (!this.isAlive) return;

        const enemyPosition = new THREE.Vector3();
        this.group.getWorldPosition(enemyPosition);

        // Aggiungi un offset verticale per alzare la barra della vita
        const offset = new THREE.Vector3(0, 4, 0);
        enemyPosition.add(offset);

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