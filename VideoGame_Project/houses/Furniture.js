import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Furniture extends THREE.Group {
    // The constructor initializes the Furniture group.
    constructor() {
        super(); // Call the constructor of the parent class, THREE.Group.
        this.name = 'furnitureSet'; // Assign a name for easy identification in the scene.

        // Define materials once to reuse them across different furniture pieces.
        const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.1, roughness: 0.8 });
        const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.1, roughness: 0.8 });
        const sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000, metalness: 0.1, roughness: 0.8 }); // Dark red for the sofa.
        const mattressMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White for the mattress.
        const pillowMaterial = new THREE.MeshStandardMaterial({ color: 0xADD8E6, metalness: 0.1, roughness: 0.5 }); // Light blue for the pillow.
        const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F, metalness: 0.1, roughness: 0.8 }); // A green-brown color for the desk.
        const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.8 }); // Yellow, with emissive properties to make it glow.

        // Add various furniture sets to the main group.
        this.add(this.createTableAndChairs(woodMaterial, chairMaterial));
        this.add(this.createSofa(sofaMaterial));
        this.add(this.createBed(woodMaterial, mattressMaterial, pillowMaterial));
        this.add(this.createDeskAndLamp(deskMaterial, chairMaterial));
    }

    // Creates a table and two chairs.
    createTableAndChairs(tableMaterial, chairMaterial) {
        const tableGroup = new THREE.Group();
        tableGroup.name = 'tableAndChairs';

        // Table top, a simple box geometry.
        const tableTop = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.1, 1.5),
            tableMaterial
        );
        tableTop.position.y = 1;
        tableGroup.add(tableTop);

        // Table legs, thin cylinders.
        const tableLegGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1, 16);
        const leg1 = new THREE.Mesh(tableLegGeometry, tableMaterial);
        leg1.position.set(1.1, 0.5, 0.6);
        tableGroup.add(leg1);

        const leg2 = new THREE.Mesh(tableLegGeometry, tableMaterial);
        leg2.position.set(-1.1, 0.5, 0.6);
        tableGroup.add(leg2);

        const leg3 = new THREE.Mesh(tableLegGeometry, tableMaterial);
        leg3.position.set(1.1, 0.5, -0.6);
        tableGroup.add(leg3);

        const leg4 = new THREE.Mesh(tableLegGeometry, tableMaterial);
        leg4.position.set(-1.1, 0.5, -0.6);
        tableGroup.add(leg4);

        // A helper function to create a single chair.
        const createSingleChair = () => {
            const chairGroup = new THREE.Group();

            // Seat of the chair.
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), chairMaterial);
            seat.position.y = 0.5;
            chairGroup.add(seat);

            // Back of the chair.
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), chairMaterial);
            back.position.set(0, 0.75, -0.25);
            chairGroup.add(back);

            // Chair legs.
            const chairLegGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
            const legC1 = new THREE.Mesh(chairLegGeometry, chairMaterial);
            legC1.position.set(0.2, 0.25, 0.2);
            chairGroup.add(legC1);

            const legC2 = new THREE.Mesh(chairLegGeometry, chairMaterial);
            legC2.position.set(-0.2, 0.25, 0.2);
            chairGroup.add(legC2);

            const legC3 = new THREE.Mesh(chairLegGeometry, chairMaterial);
            legC3.position.set(0.2, 0.25, -0.2);
            chairGroup.add(legC3);

            const legC4 = new THREE.Mesh(chairLegGeometry, chairMaterial);
            legC4.position.set(-0.2, 0.25, -0.2);
            chairGroup.add(legC4);

            return chairGroup;
        };

        // Create and position the two chairs around the table.
        const chair1 = createSingleChair();
        chair1.position.set(0, 0, 1);
        chair1.rotation.y = Math.PI; // Rotate the chair to face the table.
        tableGroup.add(chair1);

        const chair2 = createSingleChair();
        chair2.position.set(0, 0, -1);
        tableGroup.add(chair2);

        return tableGroup;
    }

    // Creates a sofa.
    createSofa(sofaMaterial) {
        const sofaGroup = new THREE.Group();
        sofaGroup.name = 'sofa';

        // Seat cushion.
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.2, 0.8),
            sofaMaterial
        );
        seat.position.y = 0.25;
        sofaGroup.add(seat);

        // Backrest.
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.8, 0.2),
            sofaMaterial
        );
        back.position.set(0, 0.7, -0.3);
        sofaGroup.add(back);

        // Armrests.
        const armrestGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.8);
        const armrest1 = new THREE.Mesh(armrestGeometry, sofaMaterial);
        armrest1.position.set(1.15, 0.4, 0);
        sofaGroup.add(armrest1);

        const armrest2 = new THREE.Mesh(armrestGeometry, sofaMaterial);
        armrest2.position.set(-1.15, 0.4, 0);
        sofaGroup.add(armrest2);

        return sofaGroup;
    }

    // Creates a bed with a mattress and pillow.
    createBed(bedMaterial, mattressMaterial, pillowMaterial) {
        const bedGroup = new THREE.Group();
        bedGroup.name = 'bed';

        // Bed base.
        const bedBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 3.5), bedMaterial);
        bedBase.position.y = 0.2;
        bedGroup.add(bedBase);

        // Bed legs.
        const bedLegGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8);
        const leg1 = new THREE.Mesh(bedLegGeometry, bedMaterial);
        leg1.position.set(0.9, 0.2, 1.5);
        bedGroup.add(leg1);

        const leg2 = new THREE.Mesh(bedLegGeometry, bedMaterial);
        leg2.position.set(-0.9, 0.2, 1.5);
        bedGroup.add(leg2);

        const leg3 = new THREE.Mesh(bedLegGeometry, bedMaterial);
        leg3.position.set(0.9, 0.2, -1.5);
        bedGroup.add(leg3);

        const leg4 = new THREE.Mesh(bedLegGeometry, bedMaterial);
        leg4.position.set(-0.9, 0.2, -1.5);
        bedGroup.add(leg4);

        // Mattress.
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 3.3), mattressMaterial);
        mattress.position.y = 0.4;
        bedGroup.add(mattress);

        // Pillow, positioned on top of the mattress.
        const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.75), pillowMaterial);
        pillow.position.set(0, 0.55, -1.25);
        bedGroup.add(pillow);

        // Headboard.
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 0.2), bedMaterial);
        headboard.position.set(0, 0.7, -1.75);
        bedGroup.add(headboard);

        return bedGroup;
    }

    // Creates a desk and a chair.
    createDeskAndLamp(deskMaterial, chairMaterial) {
        const deskGroup = new THREE.Group();
        deskGroup.name = 'desk';

        // Desk top.
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.5), deskMaterial);
        deskTop.position.y = 0.7;
        deskGroup.add(deskTop);

        // Desk legs.
        const legGeometry = new THREE.BoxGeometry(0.1, 0.7, 0.1);
        const deskLeg1 = new THREE.Mesh(legGeometry, deskMaterial);
        deskLeg1.position.set(1.4, 0.35, 0.6);
        deskGroup.add(deskLeg1);

        const deskLeg2 = new THREE.Mesh(legGeometry, deskMaterial);
        deskLeg2.position.set(-1.4, 0.35, 0.6);
        deskGroup.add(deskLeg2);

        const deskLeg3 = new THREE.Mesh(legGeometry, deskMaterial);
        deskLeg3.position.set(1.4, 0.35, -0.6);
        deskGroup.add(deskLeg3);

        const deskLeg4 = new THREE.Mesh(legGeometry, deskMaterial);
        deskLeg4.position.set(-1.4, 0.35, -0.6);
        deskGroup.add(deskLeg4);

        // Helper function for creating a chair.
        const createSingleChair = () => {
            const chairGroup = new THREE.Group();
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), chairMaterial);
            seat.position.y = 0.5;
            chairGroup.add(seat);
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), chairMaterial);
            back.position.set(0, 0.75, -0.25);
            chairGroup.add(back);
            const chairLegGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
            const legC1 = new THREE.Mesh(chairLegGeometry, chairMaterial);
            legC1.position.set(0.2, 0.25, 0.2);
            chairGroup.add(legC1);
            const legC2 = new THREE.Mesh(chairLegGeometry, chairMaterial);
            legC2.position.set(-0.2, 0.25, 0.2);
            chairGroup.add(legC2);
            const legC3 = new THREE.Mesh(chairLegGeometry, chairMaterial);
            legC3.position.set(0.2, 0.25, -0.2);
            chairGroup.add(legC3);
            const legC4 = new THREE.Mesh(chairLegGeometry, chairMaterial);
            legC4.position.set(-0.2, 0.25, -0.2);
            chairGroup.add(legC4);
            return chairGroup;
        };

        // Add the chair to the desk group.
        const deskChair = createSingleChair();
        deskChair.position.set(0, 0, -1.25);
        deskChair.rotation.y = 0;
        deskGroup.add(deskChair);

        return deskGroup;
    }
}