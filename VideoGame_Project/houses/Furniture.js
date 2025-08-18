import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js';

export class Furniture extends THREE.Group {
    constructor() {
        super();
        this.name = 'furnitureSet';

        // Definisco tutti i materiali una sola volta
        const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.1, roughness: 0.8 });
        const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.1, roughness: 0.8 });
        // Colore del divano cambiato in rosso scuro
        const sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000, metalness: 0.1, roughness: 0.8 });
        const mattressMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        // Colore del cuscino cambiato per risaltare di più
        const pillowMaterial = new THREE.MeshStandardMaterial({ color: 0xADD8E6, metalness: 0.1, roughness: 0.5 });
        const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F, metalness: 0.1, roughness: 0.8 });
        const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.8 });

        // Aggiungo i vari gruppi di mobili alla classe principale
        this.add(this.createTableAndChairs(woodMaterial, chairMaterial));
        this.add(this.createSofa(sofaMaterial));
        this.add(this.createBed(woodMaterial, mattressMaterial, pillowMaterial));
        this.add(this.createDeskAndLamp(deskMaterial, chairMaterial));
    }

    createTableAndChairs(tableMaterial, chairMaterial) {
        const tableGroup = new THREE.Group();
        tableGroup.name = 'tableAndChairs';

        // Piano del tavolo
        const tableTop = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.1, 1.5),
            tableMaterial
        );
        tableTop.position.y = 1;
        tableGroup.add(tableTop);

        // Gambe del tavolo
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

        const createSingleChair = () => {
            const chairGroup = new THREE.Group();

            // Sedile
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), chairMaterial);
            seat.position.y = 0.5;
            chairGroup.add(seat);

            // Schienale
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), chairMaterial);
            back.position.set(0, 0.75, -0.25);
            chairGroup.add(back);

            // Gambe delle sedie
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

        const chair1 = createSingleChair();
        chair1.position.set(0, 0, 1);
        chair1.rotation.y = Math.PI;
        tableGroup.add(chair1);

        const chair2 = createSingleChair();
        chair2.position.set(0, 0, -1);
        tableGroup.add(chair2);

        return tableGroup;
    }

    createSofa(sofaMaterial) {
        const sofaGroup = new THREE.Group();
        sofaGroup.name = 'sofa';

        // Cuscino della seduta
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.2, 0.8),
            sofaMaterial
        );
        seat.position.y = 0.25;
        sofaGroup.add(seat);

        // Schienale
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 0.8, 0.2),
            sofaMaterial
        );
        back.position.set(0, 0.7, -0.3);
        sofaGroup.add(back);

        // Braccioli
        const armrestGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.8);
        const armrest1 = new THREE.Mesh(armrestGeometry, sofaMaterial);
        armrest1.position.set(1.15, 0.4, 0);
        sofaGroup.add(armrest1);

        const armrest2 = new THREE.Mesh(armrestGeometry, sofaMaterial);
        armrest2.position.set(-1.15, 0.4, 0);
        sofaGroup.add(armrest2);

        return sofaGroup;
    }

    createBed(bedMaterial, mattressMaterial, pillowMaterial) {
        const bedGroup = new THREE.Group();
        bedGroup.name = 'bed';

        // Base del letto
        const bedBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 3.5), bedMaterial);
        bedBase.position.y = 0.2;
        bedGroup.add(bedBase);

        // Gambe del letto
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

        // Materasso
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 3.3), mattressMaterial);
        mattress.position.y = 0.4;
        bedGroup.add(mattress);

        // Cuscino (rotazione rimossa per renderlo dritto)
        const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.75), pillowMaterial);
        pillow.position.set(0, 0.55, -1.25);
        // La riga successiva è stata rimossa per raddrizzare il cuscino
        // pillow.rotation.z = Math.PI / 16;
        bedGroup.add(pillow);

        // Testiera
        const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 0.2), bedMaterial);
        headboard.position.set(0, 0.7, -1.75);
        bedGroup.add(headboard);

        return bedGroup;
    }

    createDeskAndLamp(deskMaterial, chairMaterial) {
        const deskGroup = new THREE.Group();
        deskGroup.name = 'desk';

        // Piano della scrivania (dimensioni aumentate)
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.5), deskMaterial);
        deskTop.position.y = 0.7;
        deskGroup.add(deskTop);

        // Gambe della scrivania
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

        const createSingleChair = () => {
            const chairGroup = new THREE.Group();

            // Sedile
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), chairMaterial);
            seat.position.y = 0.5;
            chairGroup.add(seat);

            // Schienale
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), chairMaterial);
            back.position.set(0, 0.75, -0.25);
            chairGroup.add(back);

            // Gambe delle sedie
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

        // Aggiungo la sedia alla scrivania
        const deskChair = createSingleChair();
        deskChair.position.set(0, 0, -1.25);
        deskChair.rotation.y = 0;
        deskGroup.add(deskChair);

        return deskGroup;
    }
}
