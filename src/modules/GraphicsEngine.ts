/// <reference path="../../bower_components/babylonjs/dist/babylon.2.4.d.ts" />

export class GraphicsEngine {
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private divFps: HTMLElement;

    constructor () {
        this.canvas = <HTMLCanvasElement> document.getElementById("renderCanvas");
        this.divFps = document.getElementById("fps");

        var sceneChecked: any;

        // Babylon
        this.engine = new BABYLON.Engine(this.canvas, true, {
            // no additional options.
        });

        // Launch render loop
        this.engine.runRenderLoop(() => {
            this.render();
        });

        // Resize
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    private render () {
        if (this.divFps) {
            // Fps
            this.divFps.innerHTML = this.engine.getFps().toFixed() + " fps";
        }

        // Render scene
        if (this.scene) {
            this.scene.render();
        }
    };

    private loadCustomScene (demoConstructor: Function, then: Function) {
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        this.engine.displayLoadingUI();

        setTimeout(() => {
            this.scene = demoConstructor(this.engine);

            this.scene.activeCamera.attachControl(this.canvas, false);

            this.scene.executeWhenReady(() => {
                this.canvas.style.opacity = (1).toString();
                this.engine.hideLoadingUI();
                BABYLON.SceneLoader.ShowLoadingScreen = true;
                if (then) {
                    then(this.scene);
                }
            });
        }, 15);

        return;
    };

    public loadScene(sceneBuilder: Function) {
        // Check support
        if (!BABYLON.Engine.isSupported()) {
            document.getElementById("notSupported").className = "";
        } else {
            this.loadCustomScene(sceneBuilder, () => {
                console.log('Scene Loaded.');
            });
        };
    }
}