// Inventory.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

class InventoryItem {
    constructor(itemData, container) {
        this.container = container;
        this.itemData = itemData;

        const width = 100;
        const height = 100;

        // Inizializza la scena, la telecamera e il renderer per ogni mini-modello
        this.scene = new THREE.Scene();

        // Imposta lo sfondo della scena su null per renderlo trasparente
        this.scene.background = null;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10);
        this.camera.position.z = 1.5;

        // Aggiungi luci per rendere l'oggetto visibile
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 0, 5);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040));

        // Imposta 'alpha: true' nel renderer per abilitare la trasparenza
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.container.appendChild(this.renderer.domElement);

        const displayObject = itemData.model.clone();

        const box = new THREE.Box3().setFromObject(displayObject);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        console.log(`Modello ${itemData.name} - Dimensioni bounding box:`, size);

        displayObject.position.x += (displayObject.position.x - center.x);
        displayObject.position.y += (displayObject.position.y - center.y);
        displayObject.position.z += (displayObject.position.z - center.z);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        this.camera.position.z = cameraZ * 1.2;

        this.mesh = displayObject;
        this.scene.add(this.mesh);
    }

    animate() {
        if (this.mesh) {
            this.mesh.rotation.y += 0.01;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

export class Inventory {
    constructor(elementId) {
        this.items = [];
        this.itemInstances = [];
        this.container = document.getElementById(elementId);
    }

    addItem(item) {
        this.items.push(item);
        console.log("Oggetto aggiunto all'inventario:", item);
        this.render();
    }

    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            console.log("Oggetto rimosso dall'inventario:", item);
            this.render();
        }
    }

    render() {
        console.log("Sto per renderizzare l'inventario. Oggetti presenti:", this.items.length);
        this.container.innerHTML = '';
        this.itemInstances = [];

        if (this.items.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Il tuo inventario è vuoto.';
            this.container.appendChild(emptyMessage);
        } else {
            this.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('inventory-item');

                const canvasContainer = document.createElement('div');
                canvasContainer.classList.add('inventory-item-canvas');
                itemElement.appendChild(canvasContainer);

                const itemText = document.createElement('p');
                itemText.textContent = `Oggetto: ${item.name || 'Senza nome'}`;
                itemText.classList.add('inventory-item-text');
                itemElement.appendChild(itemText);

                const inventoryItem = new InventoryItem(item, canvasContainer);
                this.itemInstances.push(inventoryItem);

                this.container.appendChild(itemElement);
            });
        }
    }

    animate() {
        this.itemInstances.forEach(item => item.animate());
    }
}