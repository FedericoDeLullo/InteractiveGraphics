import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Chest {
    constructor(scene, position = new THREE.Vector3(0, 0, 0)) {
        this.scene = scene;
        this.isOpen = false;

        this.group = new THREE.Group();
        this.group.position.copy(position);

        // Corpo della cassa più grande
        const bodyGeometry = new THREE.BoxGeometry(3, 2, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Per il "guscio" vuoto interno:
        // puoi anche usare wireframe: bodyMaterial.wireframe = true;
        // ma qui manteniamo materiale normale

        this.body.position.y = 1; // metà altezza, perché box è centrato in origine
        this.group.add(this.body);

        // Coperchio della cassa più grande
        const lidGeometry = new THREE.BoxGeometry(3, 0.5, 2);
        const lidMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        this.lid = new THREE.Mesh(lidGeometry, lidMaterial);

        // Posiziona il coperchio sopra il corpo, pivot per apertura sull'asse X posteriore
        this.lid.position.y = 2.25; // sopra il corpo (1 + 0.25)
        this.lid.position.z = -0.5; // spostalo leggermente indietro per ruotare sull'asse X

        // Cambia pivot: sposta il pivot del coperchio sul bordo posteriore
        this.lid.geometry.translate(0, 0, 1);

        this.group.add(this.lid);

        scene.add(this.group);
    }

    open() {
        if (this.isOpen) return;

        this.isOpen = true;

        // Anima l'apertura ruotando il coperchio (metodo semplice)
        const targetRotation = -Math.PI / 2; // apertura a 90 gradi

        // Animazione semplice con tween o loop manuale
        const duration = 0.5; // secondi
        const startRotation = this.lid.rotation.x;
        const startTime = performance.now();

        const animateOpen = (time) => {
            let elapsed = (time - startTime) / 1000;
            if (elapsed < duration) {
                this.lid.rotation.x = THREE.MathUtils.lerp(startRotation, targetRotation, elapsed / duration);
                requestAnimationFrame(animateOpen);
            } else {
                this.lid.rotation.x = targetRotation;
            }
        };

        requestAnimationFrame(animateOpen);
    }
}
