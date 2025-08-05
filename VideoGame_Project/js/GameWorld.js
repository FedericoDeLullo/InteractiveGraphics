// GameWorld.js

export class GameWorld {
    constructor(scene, THREE) {
        this.scene = scene;
        this.THREE = THREE;
        this.walls = [];
        this.textureLoader = new THREE.TextureLoader();
        this.wallTexture;
        this.loadAssets();
    }

    loadAssets() {
        this.textureLoader.load(
            './textures/bricks.jpg',
            (texture) => {
                this.wallTexture = texture;
                this.createWorld();
            },
            undefined,
            (err) => {
                console.error('An error happened while loading the texture.', err);
                this.createWorld();
            }
        );
    }

    createWorld() {
        const { PlaneGeometry, MeshStandardMaterial, Mesh, Vector3, BoxGeometry, MathUtils } = this.THREE;

        // Crea il piano di gioco
        const groundGeometry = new PlaneGeometry(100, 100);
        const groundMaterial = new MeshStandardMaterial({ color: 0x6b8e23 });
        const ground = new Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -MathUtils.degToRad(90);
        this.scene.add(ground);

        // -- MURI E STRUTTURA DELLA CASA --

        // Muro posteriore
        this.createWall(new Vector3(0, 1.5, 35), new Vector3(20, 3, 1));

        // Muro sinistro
        this.createWall(new Vector3(-10, 1.5, 20), new Vector3(1, 3, 30));

        // Muro destro
        this.createWall(new Vector3(10, 1.5, 20), new Vector3(1, 3, 30));

        // -- Muro anteriore con una porta --
        // Muro anteriore sinistro
        this.createWall(new Vector3(-6, 1.5, 5), new Vector3(8, 3, 1));

        // Muro anteriore destro
        this.createWall(new Vector3(6, 1.5, 5), new Vector3(8, 3, 1));

        // Architrave (parte superiore della porta)
        this.createWall(new Vector3(0, 3, 5), new Vector3(4, 1, 1));

        // Tetto
        this.createWall(new Vector3(0, 3.5, 20), new Vector3(21, 1, 31));
    }

    createWall(position, size) {
        const { BoxGeometry, MeshStandardMaterial, Mesh } = this.THREE;

        const wallGeometry = new BoxGeometry(size.x, size.y, size.z);

        let wallMaterial;

        if (this.wallTexture) {
            // Clona la texture caricata
            const wallTextureCopy = this.wallTexture.clone();

            // Logica per gestire la ripetizione in base all'orientamento del muro
            if (size.x > size.z) {
                // Muro frontale/posteriore o tetto
                wallTextureCopy.repeat.set(size.x, size.y);
            } else {
                // Muro laterale (sinistro o destro)
                wallTextureCopy.repeat.set(size.z, size.y);
            }

            wallTextureCopy.wrapS = this.THREE.RepeatWrapping;
            wallTextureCopy.wrapT = this.THREE.RepeatWrapping;

            // Dici a Three.js di aggiornare la texture con le nuove impostazioni
            wallTextureCopy.needsUpdate = true;

            wallMaterial = new MeshStandardMaterial({ map: wallTextureCopy });
        } else {
            wallMaterial = new MeshStandardMaterial({ color: 0xffffff });
        }

        const wall = new Mesh(wallGeometry, wallMaterial);
        wall.position.copy(position);
        this.scene.add(wall);
        this.walls.push(wall);
    }

    checkCollision(player) {
        for (const wall of this.walls) {
            const playerBox = new this.THREE.Box3().setFromObject(player);
            const wallBox = new this.THREE.Box3().setFromObject(wall);

            if (playerBox.intersectsBox(wallBox)) {
                return true;
            }
        }
        return false;
    }
}