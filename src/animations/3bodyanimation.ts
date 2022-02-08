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

    backgroundVShader = `
    precision mediump float;
    precision mediump int;
    
    uniform mat4 modelViewMatrix; // optional
    uniform mat4 projectionMatrix; // optional
    
    attribute vec3 position;
    
    varying vec3 vPosition;
    
    void main()	{
    
        vPosition = position;
    
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    
    }`

    backgroundFShader = `
    precision mediump float;
    precision mediump int;

    uniform float time;
    uniform float startsystime;

    varying vec3 vPosition;
    
    float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main()	{
        // we need two randoms because mediump isn't enough to check if a value is <0.00001. 
        // best it can do is <0.001
        // also add startsystime so that its different each time you start. 
        float rVal1 = rand(floor((vPosition.xy * 8.0) + startsystime));
        float rVal2 = rand(floor((vPosition.xy * -8.0) + startsystime));
        if(rVal1 < 0.001 && rVal2 < 0.1) {
            float c = (sin((time * 0.001) + (rVal2 * 50.0)) + 1.0) / 2.0;
            gl_FragColor = vec4(c, c, c, 1);
        }
        else {
            gl_FragColor = vec4(0, 0, 0, 1);
        }
    }`
    
    backgroundMaterial : THREE.RawShaderMaterial = new THREE.RawShaderMaterial( {

        uniforms: {
            time: { value: this.currentTime },
            startsystime : { value : Date.now() % 100 /* unix timestamps are too big for webgl so mod them */}
        },
        fragmentShader: this.backgroundFShader,
        vertexShader: this.backgroundVShader,
        side: THREE.DoubleSide,
        transparent: true

    } );
    constructor(element : HTMLElement) {
        super(element);
        // nr of triangles with 3 vertices per triangle
        this.bodyCount = 3;
        this.bodyGeometries = []
        this.bodyMeshes = []
        this.velocities = []
        this.colors = [new THREE.Color(0xcc4400), new THREE.Color(0x009977), new THREE.Color(0x9900cc)]
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
        const backgroundPlane = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), this.backgroundMaterial )
        const camDir = new THREE.Vector3()
        this.camera.getWorldDirection(camDir)
        backgroundPlane.position.copy(this.camera.position.clone().addScaledVector(camDir, 20))
        this.scene.add(backgroundPlane)
        
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
            lineMat.linewidth = this.masses[i] * 0.5;
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
        // Update the uniform time. 
        this.backgroundMaterial.uniforms.time.value = this.currentTime;
    }
}