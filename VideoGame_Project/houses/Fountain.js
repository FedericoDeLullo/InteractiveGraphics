import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Fountain {
    constructor(scene) {
        this.scene = scene;
        this.fountainGroup = new THREE.Group();
        this.waterParticles = [];
        this.particlePool = [];
        this.bowlRadius = 5;
        this.init();
    }

    init() {
        // --- Materiali
        const darkGrayMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.2 });
        const lightGrayMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.2 });
        const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x00bfff, transparent: true, opacity: 0.8, metalness: 0.8, roughness: 0.1 });

        // --- Base della fontana (cilindro stretto e alto, grigio scuro)
        const baseGeometry = new THREE.CylinderGeometry(1, 1.5, 4, 32);
        const base = new THREE.Mesh(baseGeometry, darkGrayMaterial);
        base.position.y = 2;
        this.fountainGroup.add(base);

        // --- Vasca (semisfera concava più grande, grigio chiaro)
        const semiSphereGeometry = new THREE.SphereGeometry(this.bowlRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const semiSphere = new THREE.Mesh(semiSphereGeometry, lightGrayMaterial);
        semiSphere.scale.y = 0.5;
        semiSphere.rotation.x = Math.PI;
        semiSphere.position.y = 4;
        this.fountainGroup.add(semiSphere);

        // --- Superficie dell'acqua
        const waterSurfaceGeometry = new THREE.CylinderGeometry(this.bowlRadius - 0.1, this.bowlRadius - 0.1, 0.1, 32);
        const waterSurface = new THREE.Mesh(waterSurfaceGeometry, waterMaterial);
        waterSurface.position.y = 4;
        this.fountainGroup.add(waterSurface);

        // --- Asta centrale (più dettagliata, grigio chiaro)
        const columnGroup = new THREE.Group();

        // Asta principale
        const columnGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 16);
        const column = new THREE.Mesh(columnGeometry, lightGrayMaterial);
        column.position.y = 5.5;
        columnGroup.add(column);

        // Dettaglio alla base dell'asta
        const columnBaseGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.5, 16);
        const columnBase = new THREE.Mesh(columnBaseGeometry, lightGrayMaterial);
        columnBase.position.y = 4.1;
        columnGroup.add(columnBase);

        this.fountainGroup.add(columnGroup);

        // Aggiunge la fontana alla scena
        this.fountainGroup.position.set(0, 0, 0);
        this.scene.add(this.fountainGroup);

        // Pool di particelle
        const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        for (let i = 0; i < 2000; i++) { // Aumentato il numero a 2000
            const particle = new THREE.Mesh(particleGeometry, waterMaterial);
            particle.visible = false;
            this.fountainGroup.add(particle);
            this.particlePool.push(particle);
        }
    }

    getParticleFromPool() {
        for (let i = 0; i < this.particlePool.length; i++) {
            if (!this.particlePool[i].visible) {
                return this.particlePool[i];
            }
        }
        return null;
    }

    update() {
        // Parametri per il getto d'acqua a spirale
        const streamStart = new THREE.Vector3(0, 7.1, 0);
        const gravity = -0.05;
        const emissionRate = 0.1; // Ridotto il valore per aumentare l'emissione
        const rotationSpeed = 0.05;
        const spiralRadius = 1.5;

        // Emette una nuova particella
        if (Math.random() > emissionRate) {
            const newParticle = this.getParticleFromPool();
            if (newParticle) {
                // Calcola la posizione sulla spirale
                const angle = Date.now() * rotationSpeed;
                const targetX = Math.cos(angle) * spiralRadius;
                const targetZ = Math.sin(angle) * spiralRadius;

                newParticle.position.copy(streamStart);
                newParticle.userData.velocity = new THREE.Vector3(
                    targetX * 0.1,
                    Math.random() * 0.1 + 0.3,
                    targetZ * 0.1
                );
                newParticle.visible = true;
                this.waterParticles.push(newParticle);
            }
        }

        // Aggiorna le posizioni delle particelle esistenti
        for (let i = this.waterParticles.length - 1; i >= 0; i--) {
            const particle = this.waterParticles[i];
            particle.userData.velocity.y += gravity;
            particle.position.add(particle.userData.velocity);

            // Controlla se la particella è caduta nella vasca
            if (particle.position.y < 4 || Math.sqrt(particle.position.x * particle.position.x + particle.position.z * particle.position.z) > this.bowlRadius) {
                particle.visible = false;
                this.waterParticles.splice(i, 1);
            }
        }
    }
}