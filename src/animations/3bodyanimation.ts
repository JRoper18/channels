import ThreeAnimation from './threeanimation';
import * as THREE from 'three';
import { Vector3 } from 'three';

export default class ThreeBodyAnimation extends ThreeAnimation {
    bodyGeometries : Array<THREE.CircleGeometry>
    bodyMeshes : Array<THREE.Mesh>
    velocities : Array<THREE.Vector3>
    colors : Array<THREE.Color>
    masses : Array<number>
    bodyCount : number
    trails : Array<THREE.Line>
    trailMaterials : Array<THREE.Material>
    constructor(element : HTMLElement) {
        super(element);
        // nr of triangles with 3 vertices per triangle
        this.bodyCount = 3;
        this.bodyGeometries = []
        this.bodyMeshes = []
        this.velocities = []
        this.colors = [new THREE.Color(0xff0000), new THREE.Color(0x00ff00), new THREE.Color(0xff00ff)]
        this.masses = [3, 4, 5]
        this.velocities = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]
        const startingPos = this.generateStartingPoints();
        for ( let i = 0; i < this.bodyCount; i++ ) {
            // adding x,y,z
            this.bodyGeometries.push(new THREE.CircleGeometry( this.masses[i] * .02, 32 ));
            this.bodyMeshes.push(new THREE.Mesh( this.bodyGeometries[i], new THREE.MeshBasicMaterial( { color: this.colors[i] } )))
            this.bodyMeshes[i].position.copy(startingPos[i])
            this.scene.add(this.bodyMeshes[i]);
        }
        this.trails = [];
        this.trailMaterials = [];
        
    }
    generateStartingPoints() : Array<Vector3> {
        const points : Array<Vector3> = []
        let gAngle = Math.PI * (3 - Math.sqrt(5))
        let variance = Math.PI / 3
        let lastAngle = 0
        let radius = 1;
        for(let i = 0; i<3; i++){
            let rand = (Math.random() - 0.5) * 2 //Between -1 and 1
            lastAngle += (rand * variance) + gAngle
            points.push(new THREE.Vector3(Math.cos(lastAngle) * radius, Math.sin(lastAngle) * radius, 0))
        }
        return points
    }
    update(in_delta : number) : void {
        const delta = in_delta * 0.0003
        const oldCenter = new Vector3();
        const newCenter = new Vector3(0, 0, 0);
        const oldPositions : Array<Vector3> = []
        for(let i = 0; i<this.bodyMeshes.length; i++){
            let ipos = this.bodyMeshes[i].position.clone()
            oldPositions.push(ipos)
            oldCenter.add(ipos)
            let dv = new THREE.Vector3(0, 0, 0)
            for(let j = 0; j<this.bodyMeshes.length; j++){
                if(i == j){
                    continue;
                }
                let jpos = this.bodyMeshes[j].position.clone()
                let dist = jpos.clone().distanceTo(ipos)
                if(dist <= 0.1){
                    dist = 0.1
                    //They're super close, so they should rocket apart so that they dont get stuck together. 
                    // dv = dv.add(new THREE.Vector3(randFloat(0, 1), randFloat(0, 1), randFloat(0, 1)).multiplyScalar(10))
                }
                dv = dv.add(jpos.sub(ipos).multiplyScalar(this.masses[j]/(Math.pow(dist, 2))))
            }
            this.velocities[i].addScaledVector(dv, delta)
        }
        for(let i = 0; i<this.bodyMeshes.length; i++) {
            this.bodyMeshes[i].position.addScaledVector(this.velocities[i], delta);
            newCenter.add(this.bodyMeshes[i].position)

            // Now also draw/update the trails. 
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([oldPositions[i].clone(), this.bodyMeshes[i].position.clone()]);
            const lineMat = new THREE.LineBasicMaterial( { color: this.colors[i] })
            lineMat.transparent = true;
            const line = new THREE.Line( lineGeometry, lineMat );

            this.scene.add( line );
            this.trails.push( line );
            this.trailMaterials.push( lineMat );
            if(this.trails.length > 1000){
                this.scene.remove(this.trails.shift());
                this.trailMaterials.shift();
            }
            for(let j = 0; j<this.trailMaterials.length; j++){
                this.trailMaterials[j].opacity -= 0.001;
            }
        }
        oldCenter.divideScalar(this.bodyCount);
        newCenter.divideScalar(this.bodyCount);
        // Have the camera track the center. 
        this.camera.position.add(newCenter.sub(oldCenter))
    }
}