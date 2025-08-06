// GameWorld.js
import { Box3, PlaneGeometry, MeshStandardMaterial, Mesh, MathUtils, Vector3, TextureLoader, CylinderGeometry, RepeatWrapping } from 'https://unpkg.com/three@0.126.0/build/three.module.js';

export class GameWorld {
    constructor(scene) {
        this.scene = scene;
        this.walls = [];
        this.coins = [];
        this.roadTexture;
        this.loadAssets();
    }

    loadAssets() {
        const textureLoader = new TextureLoader();

        textureLoader.load(
            './textures/road_texture.jpg',
            (roadTexture) => {
                this.roadTexture = roadTexture;
                this.createWorld();
            },
            undefined,
            (err) => {
                console.error('An error happened while loading the road texture.', err);
                this.createWorld();
            }
        );
    }

    createWorld() {
        const groundGeometry = new PlaneGeometry(100, 100);

        const groundMaterial = new MeshStandardMaterial({
            map: this.roadTexture,
        });

        if (this.roadTexture) {
            this.roadTexture.wrapS = RepeatWrapping;
            this.roadTexture.wrapT = RepeatWrapping;
            this.roadTexture.repeat.set(20, 20);
        }

        const ground = new Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -MathUtils.degToRad(90);
        this.scene.add(ground);

        this.createCoin(new Vector3(0, 1, -10));
    }

    createCoin(position) {
        const coinGeometry = new CylinderGeometry(0.5, 0.5, 0.1, 32);
        const coinMaterial = new MeshStandardMaterial({ color: 0xffff00 });
        const coin = new Mesh(coinGeometry, coinMaterial);
        coin.position.copy(position);
        coin.rotation.x = MathUtils.degToRad(90);
        this.scene.add(coin);
        this.coins.push(coin);
    }

    checkCollision(player) {
        for (const wall of this.walls) {
            const playerBox = new Box3().setFromObject(player);
            const wallBox = new Box3().setFromObject(wall);

            if (playerBox.intersectsBox(wallBox)) {
                return true;
            }
        }
        return false;
    }

    checkCoinCollision(player) {
        const playerBox = new Box3().setFromObject(player);
        for (const coin of this.coins) {
            const coinBox = new Box3().setFromObject(coin);
            if (playerBox.intersectsBox(coinBox)) {
                return coin;
            }
        }
        return null;
    }
}