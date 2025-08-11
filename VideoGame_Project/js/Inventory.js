// Inventory.js
// Questa classe gestirà l'inventario del giocatore e la sua visualizzazione.
export class Inventory {
    constructor(elementId) {
        this.items = [];
        this.container = document.getElementById(elementId);
    }

    // Aggiunge un oggetto all'inventario
    addItem(item) {
        // Supponiamo che l'oggetto sia un Mesh (il cubo)
        this.items.push(item);
        console.log("Oggetto aggiunto all'inventario:", item);
        this.render(); // Aggiorna la visualizzazione ogni volta che un oggetto viene aggiunto
    }

    // Rimuove un oggetto dall'inventario
    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            console.log("Oggetto rimosso dall'inventario:", item);
            this.render(); // Aggiorna la visualizzazione
        }
    }

    // Mostra il contenuto dell'inventario
    render() {
        // Pulisce il contenitore prima di aggiungere nuovi elementi
        this.container.innerHTML = '';

        if (this.items.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Il tuo inventario è vuoto.';
            this.container.appendChild(emptyMessage);
        } else {
            this.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.style.padding = '5px';
                itemElement.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
                itemElement.textContent = `Oggetto - Colore: #${item.material.color.getHexString()}`;
                this.container.appendChild(itemElement);
            });
        }
    }
}