import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class WeaponHandler {
    // The constructor initializes the weapon handler with necessary Three.js components and game data.
    // It takes `collidableObjects` to enable projectile collision with the environment.
    constructor(scene, camera, gameWorld, currentWeapon, collidableObjects) {
        this.scene = scene; // The main scene where objects are rendered.
        this.camera = camera; // The player's camera, used for shooting direction and recoil.
        this.gameWorld = gameWorld; // Reference to the game world to access enemies.
        this.currentWeapon = currentWeapon; // The currently equipped weapon's stats.
        this.equippedWeaponMesh = null; // The 3D model of the weapon itself.
        this.raycaster = new THREE.Raycaster(); // Used for projectile collision detection.
        this.projectiles = []; // Array to store active projectiles.
        this.recoil = {
            active: false,
            endTime: 0,
            initialQuaternion: new THREE.Quaternion()
        };
        this.isRifleShooting = false; // Flag for handling automatic rifle fire.
        this.burstIntervalId = null; // Stores the interval ID for rifle's burst fire.

        this.pistolAudio = null;
        this.rifleAudio = null;
        this.rocketLauncherAudio = null;
        this.loadAudio(); // Load all sound files.

        this.muzzleFlash = this.createMuzzleFlash(); // Create the visual effect for the muzzle flash.
        this.scene.add(this.muzzleFlash);
        this.muzzleFlashState = {
            active: false,
            startTime: 0,
            duration: 100
        };

        // Store a reference to objects that projectiles can collide with.
        this.collidableObjects = collidableObjects;
    }

    // This function attempts to load audio files. It includes a fallback to prevent errors
    // if the files are not available, ensuring the game doesn't crash.
    loadAudio() {
        try {
            this.pistolAudio = new Audio('sounds/pistol.mp3');
            this.rifleAudio = new Audio('sounds/rifle.mp3');
            this.rocketLauncherAudio = new Audio('sounds/rocketLauncher.mp3');
        } catch (e) {
            console.warn("Error loading audio files. Sounds may not work.");
            // Create dummy objects with a play method to prevent runtime errors.
            this.pistolAudio = { play: () => {}, currentTime: 0 };
            this.rifleAudio = { play: () => {}, currentTime: 0 };
            this.rocketLauncherAudio = { play: () => {}, currentTime: 0 };
        }
    }

    // Creates the visual mesh for the muzzle flash.
    createMuzzleFlash() {
        const flashGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffa500,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.visible = false;
        return flash;
    }

    // Main function to handle shooting logic.
    shoot() {
        if (this.currentWeapon.name === 'Rifle') {
            // Handle burst fire for the rifle.
            if (!this.isRifleShooting) {
                this.isRifleShooting = true;
                this.applyRecoil();
                this.applyWeaponRecoil();
                this.playShootSound();
                this.showMuzzleFlash();

                // Fire projectiles in a quick burst.
                this.burstIntervalId = setInterval(() => {
                    this.handleProjectile();
                }, 100);

                // Stop the burst after a short duration.
                setTimeout(() => {
                    clearInterval(this.burstIntervalId);
                    this.isRifleShooting = false;
                    this.burstIntervalId = null;
                }, 1000);
            }
        } else if (this.currentWeapon.name !== 'Fist') {
            // Handle single-fire weapons.
            this.handleProjectile();
            this.applyRecoil();
            this.applyWeaponRecoil();
            this.playShootSound();
            this.showMuzzleFlash();
        }
    }

    // Plays the sound associated with the current weapon.
    playShootSound() {
        switch (this.currentWeapon.name) {
            case 'Gun':
                if (this.pistolAudio) {
                    this.pistolAudio.currentTime = 0; // Reset sound to the start.
                    this.pistolAudio.play();
                }
                break;
            case 'Rifle':
                if (this.rifleAudio) {
                    this.rifleAudio.currentTime = 0;
                    this.rifleAudio.play();
                }
                break;
            case 'RPG':
                if (this.rocketLauncherAudio) {
                    this.rocketLauncherAudio.currentTime = 0;
                    this.rocketLauncherAudio.play();
                }
                break;
            default:
                break;
        }
    }

    // Applies camera recoil (screen shake) based on the weapon.
    applyRecoil() {
        let recoilAmount = 0;
        if (this.currentWeapon.name === 'Gun') {
            recoilAmount = 0.01;
        } else if (this.currentWeapon.name === 'Rifle') {
            recoilAmount = 0.03;
        } else if (this.currentWeapon.name === 'RPG') {
            recoilAmount = 0.05;
        }

        if (recoilAmount > 0) {
            this.recoil.active = true;
            this.recoil.endTime = Date.now() + 100; // Recoil effect lasts for 100ms.
            this.recoil.initialQuaternion.copy(this.camera.quaternion); // Save the current camera rotation.

            const recoilQuaternion = new THREE.Quaternion();
            recoilQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), recoilAmount);
            // Apply the recoil rotation to the camera's current rotation.
            this.camera.quaternion.multiplyQuaternions(recoilQuaternion, this.camera.quaternion);
        }
    }

    // Applies a visual recoil animation to the weapon model.
    applyWeaponRecoil() {
        if (!this.equippedWeaponMesh) return;

        let recoilDistance = 0;
        switch (this.currentWeapon.name) {
            case 'Gun':
                recoilDistance = 0.05;
                break;
            case 'Rifle':
                recoilDistance = 0.1;
                break;
            case 'RPG':
                recoilDistance = 0.2;
                break;
            default:
                return;
        }

        this.equippedWeaponMesh.position.z += recoilDistance;

        // Animate the weapon snapping back to its original position.
        setTimeout(() => {
            if (this.equippedWeaponMesh) {
                this.equippedWeaponMesh.position.z -= recoilDistance;
            }
        }, 50);
    }

    // Displays a temporary muzzle flash effect.
    showMuzzleFlash() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        let flashColor = 0xffa500;
        let flashSize = 0.2;
        let flashDuration = 100;
        let offsetZ = 1.0;
        let offsetY = -0.2;
        let offsetX = 0.2;

        // Adjust muzzle flash properties based on the weapon.
        if (this.currentWeapon.name === 'Rifle') {
            flashColor = 0xffff00;
            flashSize = 0.3;
            flashDuration = 75;
            offsetZ = 2.5;
            offsetY = 0.2;
            offsetX = 0.5;
        } else if (this.currentWeapon.name === 'RPG') {
            flashColor = 0xff0000;
            flashSize = 0.6;
            flashDuration = 150;
            offsetZ = 3;
            offsetY = -0.5;
            offsetX = 0.5;
        } else if (this.currentWeapon.name === 'Gun') {
            offsetZ = 1.1;
            offsetY = -0.37;
            offsetX = 0.40;
            flashSize = 0.04;
        }



        this.scene.add(this.muzzleFlash);


        this.muzzleFlash.geometry = new THREE.ConeGeometry(flashSize, flashSize * 4, 8);
        this.muzzleFlash.material.color.set(flashColor);

        // Calculate flash position relative to the camera.
        const offsetVector = new THREE.Vector3(offsetX, offsetY, -offsetZ);
        offsetVector.applyQuaternion(this.camera.quaternion);
        this.muzzleFlash.position.copy(this.camera.position).add(offsetVector);
        this.muzzleFlash.quaternion.copy(this.camera.quaternion);
        this.muzzleFlash.rotateX(Math.PI / 2);

        // Make it visible and activate its state for the update loop.
        this.muzzleFlash.visible = true;
        this.muzzleFlash.material.opacity = 1;
        this.muzzleFlashState.active = true;
        this.muzzleFlashState.startTime = Date.now();
        this.muzzleFlashState.duration = flashDuration;
    }

    // Creates and launches a new projectile.
    handleProjectile() {
        let projectileGeometry, projectileMaterial;

        // Choose projectile type based on the weapon.
        if (this.currentWeapon.name === 'RPG') {
            projectileGeometry = new THREE.SphereGeometry(0.5, 16, 16);
            projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        } else {
            projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        }

        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        // Position the projectile slightly in front of the camera.
        projectile.position.copy(this.camera.position);
        projectile.position.addScaledVector(direction, 2);

        // Set the projectile's velocity and other properties.
        projectile.velocity = direction.clone().multiplyScalar(50);
        projectile.creationTime = Date.now();
        projectile.range = this.currentWeapon.range;
        projectile.previousPosition = projectile.position.clone();

        this.scene.add(projectile);
        this.projectiles.push(projectile);
    }

    // Main update loop for the weapon handler, called on every frame.
    update(delta) {
        const projectilesToRemove = [];
        const aliveEnemies = this.gameWorld.enemies.filter(e => e.isAlive);
        const enemyMeshes = aliveEnemies.map(e => e.mesh);

        // Combine enemy and environment meshes for collision detection.
        const collidableObjects = [...enemyMeshes, ...this.collidableObjects];

        // Animate camera recoil smoothly returning to normal.
        if (this.recoil.active) {
            const timeElapsed = Date.now() - (this.recoil.endTime - 100);
            const t = Math.min(timeElapsed / 100, 1);
            // Use spherical linear interpolation (slerp) for a smooth transition.
            this.camera.quaternion.slerp(this.recoil.initialQuaternion, t);
            if (t >= 1) {
                this.recoil.active = false;
            }
        }

        // Animate the muzzle flash fading away.
        if (this.muzzleFlashState.active) {
            const timeElapsed = Date.now() - this.muzzleFlashState.startTime;
            const t = Math.min(timeElapsed / this.muzzleFlashState.duration, 1);
            this.muzzleFlash.material.opacity = 1 - t;

            if (t >= 1) {
                this.muzzleFlash.visible = false;
                this.muzzleFlashState.active = false;
            }
        }

        // Update each projectile's position and check for collisions.
        this.projectiles.forEach(projectile => {
            projectile.previousPosition.copy(projectile.position);
            projectile.position.addScaledVector(projectile.velocity, delta);

            const travelDistance = projectile.position.distanceTo(this.camera.position);

            // Remove projectiles that are too far away or have been active for too long.
            if (travelDistance > projectile.range || (Date.now() - projectile.creationTime) > 3000) {
                projectilesToRemove.push(projectile);
            } else {
                // Perform raycasting for collision detection.
                const directionVector = projectile.position.clone().sub(projectile.previousPosition).normalize();
                const distanceToCheck = projectile.position.distanceTo(projectile.previousPosition);
                this.raycaster.set(projectile.previousPosition, directionVector);
                this.raycaster.far = distanceToCheck;

                const intersects = this.raycaster.intersectObjects(collidableObjects, true);

                if (intersects.length > 0) {
                    const firstIntersection = intersects[0];
                    const hitEnemy = aliveEnemies.find(e => e.mesh === firstIntersection.object);

                    if (hitEnemy) {
                        hitEnemy.takeDamage(this.currentWeapon.damage);
                    }
                    projectilesToRemove.push(projectile); // Remove projectile on hit.
                }
            }
        });

        // Clean up projectiles that need to be removed.
        projectilesToRemove.forEach(projectile => {
            this.scene.remove(projectile);
            const index = this.projectiles.indexOf(projectile);
            if (index > -1) {
                this.projectiles.splice(index, 1);
            }
        });
    }
}