export class Inventory {
    constructor(containerId) {
        this.items = [];
        this.container = document.getElementById(containerId);
        this.onDiscardCallback = null;
        this.onEquipCallback = null;
    }

    addItem(item) {
        this.items.push(item);
        console.log(`Item added to inventory: ${item.name}`);
        this.render();
    }

    removeItem(itemToRemove) {
        this.items = this.items.filter(item => item !== itemToRemove);
        console.log(`Item removed from inventory: ${itemToRemove.name}`);
        this.render();
    }

    render() {
        // Clears the entire content of the inventory container.
        this.container.innerHTML = '';

        // If the inventory is empty, show a message and stop.
        if (this.items.length === 0) {
            this.container.innerHTML = '<p>Your inventory is empty.</p>';
            return;
        }

        // Loop through each item in the inventory and render it.
        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';

            // Image section
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'inventory-item-image';
            const image = document.createElement('img');
            image.src = item.imagePath;
            image.alt = item.name;
            imageWrapper.appendChild(image);
            itemElement.appendChild(imageWrapper);

            // Text section (Name and Stats)
            const textWrapper = document.createElement('div');
            textWrapper.className = 'inventory-item-text';

            const name = document.createElement('h4');
            name.textContent = item.name;
            textWrapper.appendChild(name);

            // Element for stats
            const stats = document.createElement('div');
            stats.className = 'inventory-item-stats';
            stats.innerHTML = `Damage: ${item.damage}<br>Range: ${item.range}`;
            textWrapper.appendChild(stats);

            itemElement.appendChild(textWrapper);

            // Buttons section
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'inventory-button-container';

            const equipButton = document.createElement('button');
            equipButton.className = 'equip-button';
            equipButton.textContent = 'Equip';
            equipButton.onclick = () => {
                if (this.onEquipCallback) {
                    this.onEquipCallback(item);
                }
            };
            buttonContainer.appendChild(equipButton);

            const discardButton = document.createElement('button');
            discardButton.className = 'discard-button';
            discardButton.textContent = 'Discard';
            discardButton.onclick = () => {
                if (this.onDiscardCallback) {
                    this.onDiscardCallback(item);
                }
                this.removeItem(item);
            };
            buttonContainer.appendChild(discardButton);

            itemElement.appendChild(buttonContainer);

            // Append the new item element to the container.
            this.container.appendChild(itemElement);
        });
    }
}