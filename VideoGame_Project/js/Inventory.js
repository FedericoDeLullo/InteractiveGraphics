// Inventory.js
export class Inventory {
    constructor(elementId) {
        this.items = [];
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
        this.container.innerHTML = '';

        if (this.items.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Il tuo inventario è vuoto.';
            this.container.appendChild(emptyMessage);
        } else {
            this.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('inventory-item');

                const imageContainer = document.createElement('div');
                imageContainer.classList.add('inventory-item-image');

                // Creiamo un elemento immagine
                const itemImage = document.createElement('img');
                itemImage.src = item.imagePath; // Usa il percorso dell'immagine
                itemImage.alt = item.name;

                imageContainer.appendChild(itemImage);
                itemElement.appendChild(imageContainer);

                const itemText = document.createElement('p');
                itemText.textContent = `Oggetto: ${item.name || 'Senza nome'}`;
                itemText.classList.add('inventory-item-text');
                itemElement.appendChild(itemText);

                this.container.appendChild(itemElement);
            });
        }
    }


}