import { ClientState } from '../states/ClientState';
import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
import 'babylonjs-loaders';

export class GraphicsScene {
	private engine: BABYLON.Engine;
	private scene: BABYLON.Scene;
	private camera: BABYLON.ArcRotateCamera;
	private firstPersonCamera: BABYLON.FreeCamera;
	private loader: BABYLON.AssetsManager;
	private light: BABYLON.DirectionalLight;
	private light2: BABYLON.DirectionalLight;
	private ground: BABYLON.Mesh;
	private droneParts: Array<BABYLON.Mesh> = new Array();
	private drone: BABYLON.Mesh;
	private state: ClientState;
	private node: BABYLON.Mesh;

	constructor(state: ClientState) {
		this.state = state;
		this.state.UIState.firstPersonCamera
			.getStream()
			.changes()
			.onValue(firstPersonCamera => {
				if (firstPersonCamera) {
					this.scene.setActiveCameraByName(this.firstPersonCamera.name);
				} else {
					this.scene.setActiveCameraByName(this.camera.name);
				}
			});
	}

	public createScene(engine: BABYLON.Engine): BABYLON.Scene {
		this.engine = engine;
		this.scene = new BABYLON.Scene(this.engine);
		this.loader = new BABYLON.AssetsManager(this.scene);
		this.setCameraAndLights();
		this.setSkybox();
		this.setGround();
		this.setDrone();

		this.loader.onFinish = () => {
			this.setShadows();
			this.scene.setActiveCameraByName(this.firstPersonCamera.name);

			this.scene.registerBeforeRender(() => {
				this.constrainCamera();
			});
			this.scene.registerBeforeRender(() => {
				this.update();
			});
		};

		this.loader.load();
		return this.scene;
	}

	public setCameraAndLights(): void {
		this.scene.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
		this.camera = new BABYLON.ArcRotateCamera('ThirdPersonCamera', 0, 0, 10, BABYLON.Vector3.Zero(), this.scene);
		this.firstPersonCamera = new BABYLON.FreeCamera('FirstPersonCamera', new BABYLON.Vector3(0, 0, 2), this.scene);
		this.scene.setActiveCameraByName(this.camera.name);
		this.light = new BABYLON.DirectionalLight('dir01', new BABYLON.Vector3(0, -1, -0.2), this.scene);
		this.light2 = new BABYLON.DirectionalLight('dir02', new BABYLON.Vector3(-1, -2, -1), this.scene);
		this.light.position = new BABYLON.Vector3(0, 30, 0);
		this.light2.position = new BABYLON.Vector3(10, 20, 10);

		this.light.intensity = 0.6;
		this.light2.intensity = 0.6;

		this.camera.setPosition(new BABYLON.Vector3(0, 20, -20));
	}

	public setSkybox(): void {
		const skybox = BABYLON.Mesh.CreateBox('skyBox', 1000.0, this.scene);
		const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', this.scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('textures/night', this.scene);
		skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
		skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		skyboxMaterial.disableLighting = true;
		skybox.material = skyboxMaterial;
	}

	public setGround(): void {
		// Ground
		this.ground = BABYLON.Mesh.CreateGround('ground', 1000, 1000, 1, this.scene, false);
		const groundMaterial = new BABYLON.StandardMaterial('ground', this.scene);
		if (this.engine.getCaps().s3tc) {
			groundMaterial.diffuseTexture = new BABYLON.Texture('textures/grass.dds', this.scene);
		} else {
			groundMaterial.diffuseTexture = new BABYLON.Texture('textures/grass.jpg', this.scene);
		}

		(groundMaterial.diffuseTexture as any).uScale = 50;
		(groundMaterial.diffuseTexture as any).vScale = 50;
		groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		this.ground.position.y = -2.05;
		this.ground.material = groundMaterial;
	}

	public setDrone(): void {
		const droneTask = this.loader.addMeshTask('drone', '', 'drone2/', 'MQ-27.obj');
		droneTask.onError = (t, message) => {
			console.log('error loading mesh:' + message);
		};
		droneTask.onSuccess = (t: any) => {
			// Remove rotors.
			// last 4 meshes are the rotors!.
			t.loadedMeshes.slice(-4).forEach((m: BABYLON.Mesh) => {
				this.scene.removeMesh(m);
			});

			// Asociate parent.
			let parent: BABYLON.Mesh = null;
			t.loadedMeshes.slice(0, -4).forEach((m: BABYLON.Mesh) => {
				this.droneParts.push(m);
				if (parent == null) {
					parent = m;
				} else {
					m.parent = parent;
				}
			});

			// Set correct rotation.
			parent.rotation.y = -Math.PI / 2;

			// Scale
			parent.scaling = new BABYLON.Vector3(0.02, 0.02, 0.02);

			// Specific node for drone.
			this.drone = new BABYLON.Mesh('drone-node', this.scene);
			console.log('SCENE READY!');
			parent.parent = this.drone;

			this.firstPersonCamera.parent = this.drone;
			this.firstPersonCamera.rotation.y = Math.PI * 2;

			this.node = new BABYLON.Mesh('pivoto', this.scene);
			this.camera.parent = this.node;

			// this.camera.parent = this.drone;
		};
	}

	public setShadows(): void {
		const shadowGenerator = new BABYLON.ShadowGenerator(512, this.light);
		const shadowGenerator2 = new BABYLON.ShadowGenerator(512, this.light2);

		this.droneParts.forEach((m: BABYLON.Mesh) => {
			shadowGenerator.getShadowMap().renderList.push(m);
			shadowGenerator2.getShadowMap().renderList.push(m);
		});

		shadowGenerator.useVarianceShadowMap = true;
		shadowGenerator2.useVarianceShadowMap = true;

		this.ground.receiveShadows = true;
	}

	public constrainCamera(): void {
		if (this.camera.beta < 0.1) {
			this.camera.beta = 0.1;
		} else if (this.camera.beta > (Math.PI / 2) * 0.99) {
			this.camera.beta = (Math.PI / 2) * 0.99;
		}

		if (this.camera.radius > 150) {
			this.camera.radius = 150;
		}

		if (this.camera.radius < 5) {
			this.camera.radius = 5;
		}
	}

	public update(): void {
		if (!this.drone) {
			return;
		}

		const position = this.state.simulation.position.getValue();
		const orientation = this.state.simulation.orientation.getValue();

		this.drone.position = position.scale(10); // convert CANNON (m) to BABYLON
		this.drone.rotationQuaternion = orientation;
		this.node.position = this.drone.position;
		const yaw = this.drone.rotationQuaternion.toEulerAngles().y;
		this.node.rotationQuaternion = new BABYLON.Quaternion();
		BABYLON.Quaternion.RotationYawPitchRollToRef(yaw, 0, 0, this.node.rotationQuaternion);
	}
}
