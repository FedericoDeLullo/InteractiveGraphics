import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class WeaponHandler {
    constructor(scene, camera, gameWorld, currentWeapon) {
        this.scene = scene;
        this.camera = camera;
        this.gameWorld = gameWorld;
        this.currentWeapon = currentWeapon;

        this.equippedWeaponMesh = null;

        this.raycaster = new THREE.Raycaster();
        this.projectiles = [];

        this.recoil = {
            active: false,
            endTime: 0,
            initialQuaternion: new THREE.Quaternion()
        };

        this.isRifleShooting = false;
        this.burstIntervalId = null;

        this.pistolAudio = new Audio('sounds/pistol.mp3');
        this.rifleAudio = new Audio('sounds/rifle.mp3');
        this.rocketLauncherAudio = new Audio('sounds/rocketLauncher.mp3');

        this.muzzleFlash = this.createMuzzleFlash();
        this.scene.add(this.muzzleFlash);
        this.muzzleFlashState = {
            active: false,
            startTime: 0,
            duration: 100
        };
    }

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

    shoot() {
        if (this.currentWeapon.name === 'Fucile') {
            if (!this.isRifleShooting) {
                this.isRifleShooting = true;
                this.applyRecoil();
                this.applyWeaponRecoil();
                this.playShootSound();
                this.showMuzzleFlash();

                this.burstIntervalId = setInterval(() => {
                    this.handleProjectile();
                }, 100);

                setTimeout(() => {
                    clearInterval(this.burstIntervalId);
                    this.isRifleShooting = false;
                    this.burstIntervalId = null;
                }, 1000);
            }
        } else if (this.currentWeapon.name !== 'Pugno') {
            this.handleProjectile();
            this.applyRecoil();
            this.applyWeaponRecoil();
            this.playShootSound();
            this.showMuzzleFlash();
        }
    }

    playShootSound() {
        switch (this.currentWeapon.name) {
            case 'Pistola':
                this.pistolAudio.currentTime = 0;
                this.pistolAudio.play();
                break;
            case 'Fucile':
                this.rifleAudio.currentTime = 0;
                this.rifleAudio.play();
                break;
            case 'Lanciarazzi':
                this.rocketLauncherAudio.currentTime = 0;
                this.rocketLauncherAudio.play();
                break;
            default:
                break;
        }
    }

    applyRecoil() {
        let recoilAmount = 0;
        if (this.currentWeapon.name === 'Pistola') {
            recoilAmount = 0.01;
        } else if (this.currentWeapon.name === 'Fucile') {
            recoilAmount = 0.03;
        } else if (this.currentWeapon.name === 'Lanciarazzi') {
            recoilAmount = 0.05;
        }

        if (recoilAmount > 0) {
            this.recoil.active = true;
            this.recoil.endTime = Date.now() + 100;
            this.recoil.initialQuaternion.copy(this.camera.quaternion);

            const recoilQuaternion = new THREE.Quaternion();
            recoilQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), recoilAmount);
            this.camera.quaternion.multiplyQuaternions(recoilQuaternion, this.camera.quaternion);
        }
    }

    applyWeaponRecoil() {
        if (!this.equippedWeaponMesh) return;

        let recoilDistance = 0;
        switch (this.currentWeapon.name) {
            case 'Pistola':
                recoilDistance = 0.05;
                break;
            case 'Fucile':
                recoilDistance = 0.1;
                break;
            case 'Lanciarazzi':
                recoilDistance = 0.2;
                break;
            default:
                return;
        }

        this.equippedWeaponMesh.position.z += recoilDistance;

        setTimeout(() => {
            if (this.equippedWeaponMesh) {
                this.equippedWeaponMesh.position.z -= recoilDistance;
            }
        }, 50);
    }

    showMuzzleFlash() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        let flashColor = 0xffa500;
        let flashSize = 0.2;
        let flashDuration = 100;
        let offsetZ = 1.0; // Distanza iniziale dal centro della telecamera
        let offsetY = -0.2; // Spostamento verticale (alto/basso)
        let offsetX = 0.2; // Spostamento orizzontale (sinistra/destra)

        if (this.currentWeapon.name === 'Fucile') {
            flashColor = 0xffff00;
            flashSize = 0.3;
            flashDuration = 75;
            offsetZ = 2.5;
            offsetY = 0.2;
            offsetX = 0.5;
        } else if (this.currentWeapon.name === 'Lanciarazzi') {
            flashColor = 0xff0000;
            flashSize = 0.6;
            flashDuration = 150;
            offsetZ = 3;
            offsetY = -0.5;
            offsetX = 0.5;
        } else if (this.currentWeapon.name === 'Pistola') {
            offsetZ = 1.1; // Distanza iniziale dal centro della telecamera
            offsetY = -0.37; // Sposta leggermente più in alto per la pistola
            offsetX = 0.40; // Sposta leggermente a destra per la pistola
            flashSize = 0.04; // Dimensione più piccola per la pistola

        }


        // Rimuovi il flash dal genitore precedente per evitare problemi
        if (this.muzzleFlash.parent) {
             this.muzzleFlash.parent.remove(this.muzzleFlash);
        }

        // Aggiungi il flash alla scena principale (o alla telecamera, a seconda della tua gerarchia)
        this.scene.add(this.muzzleFlash);

        // Aggiorna le proprietà della geometria e del materiale
        if (this.muzzleFlash.geometry) {
            this.muzzleFlash.geometry.dispose();
        }
        this.muzzleFlash.geometry = new THREE.ConeGeometry(flashSize, flashSize * 4, 8);
        this.muzzleFlash.material.color.set(flashColor);

        // Posizionamento del flash rispetto alla telecamera
        const offsetVector = new THREE.Vector3(offsetX, offsetY, -offsetZ);
        offsetVector.applyQuaternion(this.camera.quaternion);
        this.muzzleFlash.position.copy(this.camera.position).add(offsetVector);
        this.muzzleFlash.quaternion.copy(this.camera.quaternion);
        this.muzzleFlash.rotateX(Math.PI / 2);

        this.muzzleFlash.visible = true;
        this.muzzleFlash.material.opacity = 1;
        this.muzzleFlashState.active = true;
        this.muzzleFlashState.startTime = Date.now();
        this.muzzleFlashState.duration = flashDuration;
    }

    handleProjectile() {
        let projectileGeometry, projectileMaterial;

        if (this.currentWeapon.name === 'Lanciarazzi') {
            projectileGeometry = new THREE.SphereGeometry(0.5, 16, 16);
            projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        } else {
            projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        }

        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        projectile.position.copy(this.camera.position);
        projectile.position.addScaledVector(direction, 2);

        projectile.velocity = direction.clone().multiplyScalar(50);
        projectile.creationTime = Date.now();
        projectile.range = this.currentWeapon.range;
        projectile.previousPosition = projectile.position.clone();

        this.scene.add(projectile);
        this.projectiles.push(projectile);
    }

    update(delta) {
        const projectilesToRemove = [];
        const aliveEnemies = this.gameWorld.enemies.filter(e => e.isAlive);
        const enemyMeshes = aliveEnemies.map(e => e.mesh);

        const collidableObjects = [...enemyMeshes, ...this.gameWorld.collidableObjects];

        if (this.recoil.active) {
            const timeElapsed = Date.now() - (this.recoil.endTime - 100);
            const t = Math.min(timeElapsed / 100, 1);
            this.camera.quaternion.slerp(this.recoil.initialQuaternion, t);
            if (t >= 1) {
                this.recoil.active = false;
            }
        }

        if (this.muzzleFlashState.active) {
            const timeElapsed = Date.now() - this.muzzleFlashState.startTime;
            const t = Math.min(timeElapsed / this.muzzleFlashState.duration, 1);
            this.muzzleFlash.material.opacity = 1 - t;

            if (t >= 1) {
                this.muzzleFlash.visible = false;
                this.muzzleFlashState.active = false;
            }
        }


        this.projectiles.forEach(projectile => {
            projectile.previousPosition.copy(projectile.position);

            projectile.position.addScaledVector(projectile.velocity, delta);

            const travelDistance = projectile.position.distanceTo(this.camera.position);

            if (travelDistance > projectile.range || (Date.now() - projectile.creationTime) > 3000) {
                projectilesToRemove.push(projectile);
            } else {
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
                    projectilesToRemove.push(projectile);
                }
            }
        });

        projectilesToRemove.forEach(projectile => {
            this.scene.remove(projectile);
            const index = this.projectiles.indexOf(projectile);
            if (index > -1) {
                this.projectiles.splice(index, 1);
            }
        });
    }
}