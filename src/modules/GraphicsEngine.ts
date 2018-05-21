import * as BABYLON from 'babylonjs';

export class GraphicsEngine {
	private engine: BABYLON.Engine;
	private scene: BABYLON.Scene;
	private canvas: HTMLCanvasElement;
	private divFps: HTMLElement;

	constructor() {
		this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
		this.divFps = document.getElementById('fps');

		// Babylon
		this.engine = new BABYLON.Engine(this.canvas, true, {
			// no additional options.
		});

		// Launch render loop
		this.engine.runRenderLoop(() => {
			this.render();
		});

		// Resize
		window.addEventListener('resize', () => {
			this.engine.resize();
		});
	}

	public loadScene(sceneBuilder: (engine: BABYLON.Engine) => BABYLON.Scene) {
		// Check support
		if (!BABYLON.Engine.isSupported()) {
			document.getElementById('notSupported').className = '';
		} else {
			this.loadCustomScene(sceneBuilder, () => {
				console.log('Scene Loaded.');
			});
		}
	}

	private render() {
		if (this.divFps) {
			// Fps
			this.divFps.innerHTML = this.engine.getFps().toFixed() + ' fps';
		}

		// Render scene
		if (this.scene) {
			this.scene.render();
		}
	}

	private loadCustomScene(
		sceneBuilder: (engine: BABYLON.Engine) => BABYLON.Scene,
		then: (scene: BABYLON.Scene) => void
	) {
		BABYLON.SceneLoader.ShowLoadingScreen = false;
		this.engine.displayLoadingUI();

		setTimeout(() => {
			this.scene = sceneBuilder(this.engine);

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
	}
}
