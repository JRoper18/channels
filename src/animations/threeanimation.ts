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
        requestAnimationFrame( this.frameAnimate.bind(this) );
    }
    abstract update(delta : number) : void

    // private getScreenPosition(pos : THREE.Vector3) : THREE.Vector2 {
    //     var width = window.innerWidth, height = window.innerHeight;
    //     var widthHalf = width / 2, heightHalf = height / 2;

    //     var pos = pos.clone();
    //     pos.project(this.camera);
    //     pos.x = ( pos.x * widthHalf ) + widthHalf;
    //     pos.y = - ( pos.y * heightHalf ) + heightHalf;
    //     return new THREE.Vector2(pos.x, pos.y);
    // }
}