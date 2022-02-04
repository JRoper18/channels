import ThreeAnimation from './threeanimation';
import * as THREE from 'three';

export default class TestAnimation extends ThreeAnimation {
    vShader = `
    precision mediump float;
    precision mediump int;

    uniform mat4 modelViewMatrix; // optional
    uniform mat4 projectionMatrix; // optional

    attribute vec3 position;

    varying vec3 vPosition;
    varying vec4 vColor;

    void main()	{

        vPosition = position;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`

    fShader = `
    precision mediump float;
    precision mediump int;

    uniform float time;

    varying vec3 vPosition;

    void main()	{

        vec4 color = vec4( vPosition, 1.0);
        color.r += sin( time * 0.01 ) * 0.5;

        gl_FragColor = color;

    }`

    material : THREE.RawShaderMaterial = new THREE.RawShaderMaterial( {

        uniforms: {
            time: { value: this.currentTime }
        },
        vertexShader: this.vShader,
        fragmentShader: this.fShader,
        side: THREE.DoubleSide,
        transparent: true

    } );
    constructor(element : HTMLElement) {
        super(element);
        // nr of triangles with 3 vertices per triangle
        const vertexCount = 200 * 3;

        const geometry = new THREE.BufferGeometry();

        const positions = [];

        for ( let i = 0; i < vertexCount; i ++ ) {

            // adding x,y,z
            positions.push( Math.random() - 0.5 );
            positions.push( Math.random() - 0.5 );
            positions.push( Math.random() - 0.5 );
        }

        const positionAttribute = new THREE.Float32BufferAttribute( positions, 3 );
            
        geometry.setAttribute( 'position', positionAttribute );
       

        const mesh = new THREE.Mesh( geometry, this.material );
        this.scene.add(mesh);
    }
    
    update(_ : number) : void {
        this.material.uniforms.time.value = this.currentTime;
    }
}