export class Inventory {
    constructor(containerId) {
        this.items = [];
        this.container = document.getElementById(containerId);
        this.onDiscardCallback = null;
        this.onEquipCallback = null;
    }

    addItem(item) {
        this.items.push(item);
        console.log(`Oggetto aggiunto all'inventario: ${item.name}`);
        this.render();
    }

    removeItem(itemToRemove) {
        this.items = this.items.filter(item => item !== itemToRemove);
        console.log(`Oggetto rimosso dall'inventario: ${itemToRemove.name}`);
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        if (this.items.length === 0) {
            this.container.innerHTML = '<p>Il tuo inventario è vuoto.</p>';
            return;
        }

        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';

            // Immagine
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'inventory-item-image';
            const image = document.createElement('img');
            image.src = item.imagePath;
            image.alt = item.name;
            imageWrapper.appendChild(image);
            itemElement.appendChild(imageWrapper);

            // Testo (Nome e Statistiche)
            const textWrapper = document.createElement('div');
            textWrapper.className = 'inventory-item-text';

            const name = document.createElement('h4');
            name.textContent = item.name;
            textWrapper.appendChild(name);

            // NUOVO: Elemento per le statistiche
            const stats = document.createElement('div');
            stats.className = 'inventory-item-stats';
            stats.innerHTML = `Danno: ${item.damage}<br>Portata: ${item.range}`;
            textWrapper.appendChild(stats);

            itemElement.appendChild(textWrapper);

            // Pulsanti
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'inventory-button-container';

            const equipButton = document.createElement('button');
            equipButton.className = 'equip-button';
            equipButton.textContent = 'Equipaggia';
            equipButton.onclick = () => {
                if (this.onEquipCallback) {
                    this.onEquipCallback(item);
                }
            };
            buttonContainer.appendChild(equipButton);

            const discardButton = document.createElement('button');
            discardButton.className = 'discard-button';
            discardButton.textContent = 'Scarta';
            discardButton.onclick = () => {
                if (this.onDiscardCallback) {
                    this.onDiscardCallback(item);
                }
                this.removeItem(item);
            };
            buttonContainer.appendChild(discardButton);

            itemElement.appendChild(buttonContainer);

            this.container.appendChild(itemElement);
        });
    }
}