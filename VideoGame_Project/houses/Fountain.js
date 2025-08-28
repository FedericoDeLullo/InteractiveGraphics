import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Fountain {
    // The constructor initializes the fountain and its related properties.
    constructor(scene) {
        this.scene = scene; // The Three.js scene to which the fountain will be added.
        this.fountainGroup = new THREE.Group(); // A group to hold all parts of the fountain for easy positioning and scaling.
        this.waterParticles = []; // An array to track active water particles.
        this.particlePool = []; // A pool of pre-created particles for performance (to avoid creating new objects during the animation loop).
        this.bowlRadius = 5; // The radius of the fountain's bowl.
        this.init(); // Calls the initialization method to build the fountain geometry.
    }

    // This method builds the 3D model of the fountain.
    init() {
        // --- Materials
        // Define materials with specific colors and properties (metalness, roughness) for a realistic look.
        const darkGrayMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.2 });
        const lightGrayMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.2 });
        const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x00bfff, transparent: true, opacity: 0.8, metalness: 0.8, roughness: 0.1 });

        // --- Fountain Base
        const baseGeometry = new THREE.CylinderGeometry(1, 1.5, 4, 32); // A cylinder for the base.
        const base = new THREE.Mesh(baseGeometry, darkGrayMaterial);
        base.position.y = 2; // Position the base on the Y-axis.
        this.fountainGroup.add(base);

        // --- Bowl
        const semiSphereGeometry = new THREE.SphereGeometry(this.bowlRadius, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2); // A half-sphere for the bowl.
        const semiSphere = new THREE.Mesh(semiSphereGeometry, lightGrayMaterial);
        semiSphere.scale.y = 0.5; // Flatten the sphere slightly.
        semiSphere.rotation.x = Math.PI; // Invert the sphere to create a concave bowl shape.
        semiSphere.position.y = 4;
        this.fountainGroup.add(semiSphere);

        // --- Water Surface
        const waterSurfaceGeometry = new THREE.CylinderGeometry(this.bowlRadius - 0.1, this.bowlRadius - 0.1, 0.1, 32); // A thin cylinder for the water surface.
        const waterSurface = new THREE.Mesh(waterSurfaceGeometry, waterMaterial);
        waterSurface.position.y = 4; // Position the water surface at the same height as the bowl.
        this.fountainGroup.add(waterSurface);

        // --- Central Column
        const columnGroup = new THREE.Group(); // Group to hold the column and its details.

        // Main column part
        const columnGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 16);
        const column = new THREE.Mesh(columnGeometry, lightGrayMaterial);
        column.position.y = 5.5;
        columnGroup.add(column);

        // Detail at the base of the column
        const columnBaseGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.5, 16);
        const columnBase = new THREE.Mesh(columnBaseGeometry, lightGrayMaterial);
        columnBase.position.y = 4.1;
        columnGroup.add(columnBase);

        this.fountainGroup.add(columnGroup);

        // Add the entire fountain group to the scene.
        this.fountainGroup.position.set(0, 0, 0);
        this.scene.add(this.fountainGroup);

        // Particle pool setup. Pre-creates a large number of water particles to be reused.
        const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        for (let i = 0; i < 2000; i++) {
            const particle = new THREE.Mesh(particleGeometry, waterMaterial);
            particle.visible = false; // Make them invisible initially.
            this.fountainGroup.add(particle);
            this.particlePool.push(particle);
        }
    }

    // A utility method to get an unused particle from the pool.
    getParticleFromPool() {
        for (let i = 0; i < this.particlePool.length; i++) {
            if (!this.particlePool[i].visible) {
                return this.particlePool[i];
            }
        }
        return null; // Return null if the pool is empty (all particles are in use).
    }

    // The update method is called on every frame to animate the fountain.
    update() {
        // Parameters for the spiral water stream effect.
        const streamStart = new THREE.Vector3(0, 7.1, 0); // Starting point of the water stream.
        const gravity = -0.05; // Gravity effect on the particles.
        const emissionRate = 0.1; // Probability of emitting a new particle each frame.
        const rotationSpeed = 0.03; // Speed of the spiral rotation.
        const spiralRadius = 1.5; // Radius of the spiral.

        // Emit a new particle based on the emission rate.
        if (Math.random() > emissionRate) {
            const newParticle = this.getParticleFromPool();
            if (newParticle) {
                // Calculate the position on the spiral path.
                const angle = Date.now() * rotationSpeed;
                const targetX = Math.cos(angle) * spiralRadius;
                const targetZ = Math.sin(angle) * spiralRadius;

                // Set initial position and velocity for the new particle.
                newParticle.position.copy(streamStart);
                newParticle.userData.velocity = new THREE.Vector3(
                    targetX * 0.1, // Horizontal velocity component.
                    Math.random() * 0.1 + 0.3, // Upward vertical velocity component.
                    targetZ * 0.1 // Horizontal velocity component.
                );
                newParticle.visible = true;
                this.waterParticles.push(newParticle);
            }
        }

        // Update positions of existing particles and check for collision with the bowl.
        for (let i = this.waterParticles.length - 1; i >= 0; i--) {
            const particle = this.waterParticles[i];
            // Apply gravity to the particle's velocity.
            particle.userData.velocity.y += gravity;
            // Update the particle's position based on its velocity.
            particle.position.add(particle.userData.velocity);

            // Check if the particle has fallen below the bowl's level or moved outside its radius.
            if (particle.position.y < 4 || Math.sqrt(particle.position.x * particle.position.x + particle.position.z * particle.position.z) > this.bowlRadius) {
                particle.visible = false; // Hide the particle.
                this.waterParticles.splice(i, 1); // Remove it from the active particles array.
            }
        }
    }
}