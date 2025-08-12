// Inventory.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

// Classe per gestire la singola "vetrina" 3D di un oggetto
class InventoryItem {
    constructor(itemData, container) {
        this.container = container;
        this.itemData = itemData;

        // Creazione della mini-scena per l'oggetto
        const width = 100;
        const height = 100;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10);
        this.camera.position.z = 1.5;

        // Aggiungi luce alla mini-scena
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 0, 5);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040));

        // Crea il renderer per il canvas
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.container.appendChild(this.renderer.domElement);

        // Clona il materiale e la geometria dell'oggetto originale per la visualizzazione
        const geometry = itemData.geometry.clone();
        const material = itemData.material.clone();
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }

    animate() {
        if (this.mesh) {
            this.mesh.rotation.y += 0.01;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

// Classe principale dell'inventario
export class Inventory {
    constructor(elementId) {
        this.items = [];
        this.itemInstances = []; // Array per le istanze di InventoryItem
        this.container = document.getElementById(elementId);
    }

    addItem(item) {
        this.items.push(item);
        console.log("Oggetto aggiunto all'inventario:", item);
        this.render(); // Aggiorna la visualizzazione
    }

    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            console.log("Oggetto rimosso dall'inventario:", item);
            this.render(); // Aggiorna la visualizzazione
        }
    }

    // Metodo di rendering principale
    render() {
        this.container.innerHTML = '';
        this.itemInstances = []; // Resetta le istanze

        if (this.items.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Il tuo inventario è vuoto.';
            this.container.appendChild(emptyMessage);
        } else {
            this.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.style.padding = '10px';
                itemElement.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
                itemElement.style.display = 'flex';
                itemElement.style.alignItems = 'center';

                const canvasContainer = document.createElement('div');
                canvasContainer.style.width = '100px';
                canvasContainer.style.height = '100px';
                canvasContainer.style.marginRight = '10px';
                itemElement.appendChild(canvasContainer);

                const itemText = document.createElement('p');
                itemText.textContent = `Oggetto - Colore: #${item.material.color.getHexString()}`;
                itemElement.appendChild(itemText);

                this.container.appendChild(itemElement);

                // Crea una nuova istanza di InventoryItem per ogni oggetto
                const inventoryItem = new InventoryItem(item, canvasContainer);
                this.itemInstances.push(inventoryItem);
            });
        }
    }

    // Nuovo metodo di animazione per le vetrine 3D
    animate() {
        this.itemInstances.forEach(item => item.animate());
    }
}