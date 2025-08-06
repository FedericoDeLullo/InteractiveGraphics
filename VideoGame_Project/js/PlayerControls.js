// PlayerControls.js

import { PointerLockControls } from 'https://unpkg.com/three@0.126.0/examples/jsm/controls/PointerLockControls.js';

export class PlayerControls {
    constructor(camera, domElement, THREE, gameWorld) {
        this.controls = new PointerLockControls(camera, domElement);
        this.THREE = THREE;
        this.gameWorld = gameWorld; // Riferimento al GameWorld
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.isGrounded = true;
        this.initEventListeners();
    }

    initEventListeners() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.isGrounded) {
                        this.velocity.y += 10;
                        this.isGrounded = false;
                    }
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    update(delta) {
        const { camera } = this.controls;
        const speed = 5.0;
        const gravity = -9.8;

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y += gravity * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const prevPosition = camera.position.clone();

        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * speed * delta;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * speed * delta;
        }

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
        camera.position.y += this.velocity.y * delta;

        // Gestione delle collisioni
        const hasCollided = this.gameWorld.checkCollision(camera);
        if (hasCollided) {
            // Se c'è una collisione, riporta la telecamera alla posizione precedente
            camera.position.copy(prevPosition);
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        if (camera.position.y < 1.6) {
            this.velocity.y = 0;
            camera.position.y = 1.6;
            this.isGrounded = true;
        }
    }
}