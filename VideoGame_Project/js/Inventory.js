// Inventory.js
export class Inventory {
    constructor(elementId) {
        this.items = [];
        this.container = document.getElementById(elementId);
        this.onDiscardCallback = () => {};
        this.onEquipCallback = () => {}; // Aggiungi il nuovo callback per l'equipaggiamento
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

    onItemDiscarded(item, index) {
        console.log("Oggetto scartato dall'inventario:", item);
        const discardedItem = this.items.splice(index, 1)[0];
        this.onDiscardCallback(discardedItem);
        this.render();
    }

    // Nuovo metodo per gestire l'equipaggiamento
    onItemEquipped(item) {
        console.log("Oggetto equipaggiato:", item);
        this.onEquipCallback(item);
    }

    render() {
        this.container.innerHTML = '';

        if (this.items.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Il tuo inventario è vuoto.';
            this.container.appendChild(emptyMessage);
        } else {
            this.items.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('inventory-item');

                const imageContainer = document.createElement('div');
                imageContainer.classList.add('inventory-item-image');

                const itemImage = document.createElement('img');
                itemImage.src = item.imagePath;
                itemImage.alt = item.name;

                imageContainer.appendChild(itemImage);
                itemElement.appendChild(imageContainer);

                const itemText = document.createElement('p');
                itemText.textContent = `Oggetto: ${item.name || 'Senza nome'}`;
                itemText.classList.add('inventory-item-text');
                itemElement.appendChild(itemText);
               
                // Contenitore per i pulsanti
                const buttonContainer = document.createElement('div');
                buttonContainer.classList.add('inventory-button-container');

                // Pulsante per equipaggiare l'arma
                const equipButton = document.createElement('button');
                equipButton.textContent = 'Equipaggia';
                equipButton.classList.add('equip-button');
                buttonContainer.appendChild(equipButton);

                // Pulsante per scartare l'arma
                const discardButton = document.createElement('button');
                discardButton.textContent = 'Scarta';
                discardButton.classList.add('discard-button');
                buttonContainer.appendChild(discardButton);

                itemElement.appendChild(buttonContainer);
                this.container.appendChild(itemElement);

                equipButton.addEventListener('click', () => {
                    this.onItemEquipped(item);
                });
                discardButton.addEventListener('click', () => {
                    this.onItemDiscarded(item, index);
                });
            });
        }
    }
}