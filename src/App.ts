import { ClientState } from './states/ClientState';
import { GraphicsEngine } from './modules/GraphicsEngine';
import { GraphicsScene } from './modules/GraphicsScene';
import { UserInput } from './modules/UserInput';
import { GUIPanel } from './modules/GUIPanel';
import { HUD } from './modules/HUD';
import { Communication } from './modules/Communication';

export class App {
	public clientState: ClientState;
	public communication: Communication;
	public guiPanel: GUIPanel;
	public userInput: UserInput;
	public graphicsEngine: GraphicsEngine;
	public graphicsScene: GraphicsScene;
	public hud: HUD;

	constructor() {
		this.clientState = new ClientState();
		this.communication = new Communication(this.clientState);
		this.guiPanel = new GUIPanel(this.clientState);
		this.userInput = new UserInput(this.clientState);
		this.graphicsEngine = new GraphicsEngine();
		this.graphicsScene = new GraphicsScene(this.clientState);
		this.hud = new HUD(this.clientState);
	}

	public start() {
		this.graphicsEngine.loadScene((engine: any) => {
			return this.graphicsScene.createScene(engine);
		});
	}
}
