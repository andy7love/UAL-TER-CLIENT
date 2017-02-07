import { ClientState } from "states/ClientState";
import { GraphicsEngine } from "modules/GraphicsEngine";
import { GraphicsScene } from "modules/GraphicsScene";
import { UserInput } from "modules/UserInput";
import { GUIPanel } from "modules/GUIPanel";
import { HUD } from "modules/HUD";
import { Communication } from "modules/Communication";

export class App {
    constructor () {
        let clientState = new ClientState();
        let communication = new Communication(clientState);
        let guiPanel = new GUIPanel(clientState);
        let userInput = new UserInput(clientState);
        let graphicsEngine = new GraphicsEngine();
        let graphicsScene = new GraphicsScene(clientState);
        let hud = new HUD(clientState);
        graphicsEngine.loadScene((engine) => {
            return graphicsScene.createScene(engine);
        });
    }
}