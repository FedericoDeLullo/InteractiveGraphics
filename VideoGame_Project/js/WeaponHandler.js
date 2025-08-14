import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class WeaponHandler {
    constructor(scene, camera, gameWorld, currentWeapon) {
        this.scene = scene;
        this.camera = camera;
        this.gameWorld = gameWorld;
        this.currentWeapon = currentWeapon;
        this.projectiles = [];
        this.projectileSpeed = 100;
    }

    shoot() {
        if (!this.currentWeapon || this.currentWeapon.name === 'Pugno') {
            return;
        }

        let projectileGeometry;
        let projectileMaterial;
        let projectilePosition = new THREE.Vector3();

        // Determina la geometria e il materiale del proiettile
        // e calcola il punto di partenza in base all'arma
        if (this.currentWeapon.name === 'Lanciarazzi') {
            projectileGeometry = new THREE.SphereGeometry(1, 16, 16);
            projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            // Offset per il lanciarazzi: poco più in basso e a sinistra
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            projectilePosition.copy(this.camera.position);
            projectilePosition.add(direction.multiplyScalar(3));
            projectilePosition.add(new THREE.Vector3().crossVectors(this.camera.up, direction).normalize().multiplyScalar(-1.2));
            projectilePosition.y -= 0.9;
        } else if (this.currentWeapon.name === 'Fucile') {
            projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            // Offset per il fucile: poco più in alto e a destra
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            projectilePosition.copy(this.camera.position);
            projectilePosition.add(direction.multiplyScalar(2));
            projectilePosition.add(new THREE.Vector3().crossVectors(this.camera.up, direction).normalize().multiplyScalar(-0.9));
            projectilePosition.y += 0;
        } else if (this.currentWeapon.name === 'Pistola') {
            projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            // Offset per la pistola (rimasto invariato)
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            projectilePosition.copy(this.camera.position);
            projectilePosition.add(direction.multiplyScalar(1));
            projectilePosition.add(new THREE.Vector3().crossVectors(this.camera.up, direction).normalize().multiplyScalar(-0.7));
            projectilePosition.y -= 0.8;
        }

        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(projectilePosition);

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        projectile.velocity = direction.multiplyScalar(this.projectileSpeed);
        this.scene.add(projectile);
        this.projectiles.push(projectile);
    }

    update(delta) {
        const projectilesToRemove = [];

        this.projectiles.forEach(projectile => {
            projectile.position.add(projectile.velocity.clone().multiplyScalar(delta));

            // Controlla le collisioni con i nemici
            const aliveEnemies = this.gameWorld.enemies.filter(e => e.isAlive);
            aliveEnemies.forEach(enemy => {
                const distance = projectile.position.distanceTo(enemy.group.position);
                if (distance < 2 + projectile.geometry.parameters.radius) {
                    enemy.takeDamage(this.currentWeapon.damage);
                    projectilesToRemove.push(projectile);
                }
            });

            // Rimuovi il proiettile se esce dal raggio d'azione dell'arma
            if (projectile.position.distanceTo(this.camera.position) > this.currentWeapon.range) {
                projectilesToRemove.push(projectile);
            }
        });

        projectilesToRemove.forEach(projectile => {
            this.scene.remove(projectile);
            this.projectiles = this.projectiles.filter(p => p !== projectile);
        });
    }
}