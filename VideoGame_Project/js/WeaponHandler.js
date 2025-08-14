// WeaponHandler.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class WeaponHandler {
    constructor(scene, camera, gameWorld, currentWeapon) {
        this.scene = scene;
        this.camera = camera;
        this.gameWorld = gameWorld;
        this.currentWeapon = currentWeapon;

        this.raycaster = new THREE.Raycaster();
        this.projectiles = [];
        this.recoil = {
            active: false,
            endTime: 0,
            initialQuaternion: new THREE.Quaternion()
        };

        // Aggiunto per gestire lo sparo a raffica del fucile
        this.isRifleShooting = false;
        this.burstIntervalId = null;

        // Inizializza i suoni usando il tuo metodo con i nomi dei file corretti
        this.pistolAudio = new Audio('sounds/pistol.mp3');
        this.rifleAudio = new Audio('sounds/rifle.mp3');
        this.rocketLauncherAudio = new Audio('sounds/rocketLauncher.mp3');

        // Aggiunge la rotazione per l'effetto visivo di sparo
        this.muzzleFlash = this.createMuzzleFlash();
        this.scene.add(this.muzzleFlash);
        this.muzzleFlashState = {
            active: false,
            startTime: 0,
            duration: 100 // ms - Aumentato a 100ms per una maggiore visibilità
        };
    }

    createMuzzleFlash() {
        // Aumentato il raggio e l'altezza del cono per un effetto più visibile
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

    /**
     * Gestisce lo sparo di un proiettile se l'arma non è il pugno.
     */
    shoot() {
        // Se l'arma corrente non è il pugno, spara un proiettile.
        if (this.currentWeapon.name === 'Fucile') {
            // Gestisce la raffica del fucile
            if (!this.isRifleShooting) {
                this.isRifleShooting = true;
                // Applica il suono, il rinculo e il lampo una sola volta all'inizio della raffica
                this.applyRecoil();
                this.playShootSound();
                this.showMuzzleFlash();

                this.burstIntervalId = setInterval(() => {
                    this.handleProjectile();
                }, 100); // Spara un proiettile ogni 100ms

                // Ferma la raffica dopo 3 secondi
                setTimeout(() => {
                    clearInterval(this.burstIntervalId);
                    this.isRifleShooting = false;
                    this.burstIntervalId = null;
                }, 1000);
            }
        } else if (this.currentWeapon.name !== 'Pugno') {
            // Per tutte le altre armi (pistola, lanciarazzi) spara un singolo proiettile
            this.handleProjectile();
            this.applyRecoil();
            this.playShootSound();
            this.showMuzzleFlash();
        }
        // Altrimenti, non fa nulla, prevenendo l'attacco a mani nude.
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
        // Applica il rinculo in base all'arma
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
            this.recoil.endTime = Date.now() + 100; // Il rinculo dura 100ms
            this.recoil.initialQuaternion.copy(this.camera.quaternion);

            const recoilQuaternion = new THREE.Quaternion();
            recoilQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), recoilAmount);
            this.camera.quaternion.multiplyQuaternions(recoilQuaternion, this.camera.quaternion);
        }
    }

    showMuzzleFlash() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        // Posiziona il lampo in base alla direzione e alla posizione della telecamera
        this.muzzleFlash.position.copy(this.camera.position);
        this.muzzleFlash.position.addScaledVector(direction, 1.5);
        this.muzzleFlash.quaternion.copy(this.camera.quaternion);
        this.muzzleFlash.rotateX(Math.PI / 2);

        this.muzzleFlash.visible = true;
        this.muzzleFlash.material.opacity = 1;
        this.muzzleFlashState.active = true;
        this.muzzleFlashState.startTime = Date.now();
    }

    /**
     * Crea e gestisce un proiettile.
     */
    handleProjectile() {
        // Crea un proiettile a sfera gialla standard per tutte le armi.
        const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        // Imposta la posizione iniziale del proiettile leggermente più avanti rispetto alla telecamera.
        projectile.position.copy(this.camera.position);
        projectile.position.addScaledVector(direction, 2);

        // Definisce la velocità del proiettile.
        projectile.velocity = direction.clone().multiplyScalar(50);
        // Imposta il tempo di creazione e il raggio d'azione.
        projectile.creationTime = Date.now();
        projectile.range = this.currentWeapon.range;
        // Salva la posizione precedente per la collisione.
        projectile.previousPosition = projectile.position.clone();

        this.scene.add(projectile);
        this.projectiles.push(projectile);
    }

    /**
     * Aggiorna la posizione dei proiettili e gestisce le collisioni.
     * @param {number} delta - Il tempo trascorso dall'ultimo frame.
     */
    update(delta) {
        const projectilesToRemove = [];
        const aliveEnemies = this.gameWorld.enemies.filter(e => e.isAlive);
        const enemyMeshes = aliveEnemies.map(e => e.mesh);

        // Combina tutti gli oggetti con cui il proiettile può collidere (nemici e mondo).
        const collidableObjects = [...enemyMeshes, ...this.gameWorld.collidableObjects];

        // Gestisce il ritorno del rinculo
        if (this.recoil.active) {
            const timeElapsed = Date.now() - (this.recoil.endTime - 100);
            const t = Math.min(timeElapsed / 100, 1);
            this.camera.quaternion.slerp(this.recoil.initialQuaternion, t);
            if (t >= 1) {
                this.recoil.active = false;
            }
        }

        // Gestisce il fade-out del lampo di sparo
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
            // Salva la posizione precedente prima di aggiornare.
            projectile.previousPosition.copy(projectile.position);

            // Aggiorna la posizione del proiettile.
            projectile.position.addScaledVector(projectile.velocity, delta);

            const travelDistance = projectile.position.distanceTo(this.camera.position);

            // Controlla se il proiettile ha superato il suo raggio d'azione o è esistito troppo a lungo.
            if (travelDistance > projectile.range || (Date.now() - projectile.creationTime) > 3000) {
                projectilesToRemove.push(projectile);
            } else {
                // Imposta un raycaster che va dalla posizione precedente a quella attuale.
                const directionVector = projectile.position.clone().sub(projectile.previousPosition).normalize();
                const distanceToCheck = projectile.position.distanceTo(projectile.previousPosition);
                this.raycaster.set(projectile.previousPosition, directionVector);
                this.raycaster.far = distanceToCheck;

                const intersects = this.raycaster.intersectObjects(collidableObjects, true);

                if (intersects.length > 0) {
                    const firstIntersection = intersects[0];
                    const hitEnemy = aliveEnemies.find(e => e.mesh === firstIntersection.object);

                    // Se il proiettile ha colpito un nemico, infligge danno.
                    if (hitEnemy) {
                        hitEnemy.takeDamage(this.currentWeapon.damage);
                    }
                    // In ogni caso, se ha colpito qualcosa, il proiettile viene rimosso.
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
