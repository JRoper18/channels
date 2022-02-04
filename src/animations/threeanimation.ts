import * as THREE from 'three';

export default abstract class ThreeAnimation {
    renderer : THREE.WebGLRenderer
    scene : THREE.Scene
    camera : THREE.PerspectiveCamera
    previousTime : DOMHighResTimeStamp
    currentTime : DOMHighResTimeStamp
    constructor(element : HTMLElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.z = 5;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        element.appendChild( this.renderer.domElement );
    }
    start() : void {
        this.frameAnimate(0);
    }
    private frameAnimate(newTime : DOMHighResTimeStamp) : void {
        if(this.previousTime === undefined) {
            this.previousTime = newTime;
        } else {
            const delta = newTime - this.previousTime;
            this.previousTime = newTime;
            this.update(delta)
            this.renderer.render( this.scene, this.camera );    
        }
        this.currentTime = newTime;
        requestAnimationFrame( this.frameAnimate.bind(this) );
    }
    abstract update(delta : number) : void
}