import { EngineManager } from "managers/EngineManager";
import { SceneManager } from "managers/SceneManager";
import { StateManager } from "managers/StateManager";
import { InputManager } from "managers/InputManager";
import { GUIManager } from "managers/GUIManager";
import { NetworkManager } from "managers/NetworkManager";

export class App {
    constructor () {
        let stateManager = new StateManager();
        let networkManager = new NetworkManager(stateManager);
        let guiManager = new GUIManager(stateManager);
        let inputManager = new InputManager(stateManager);
        let engineManager = new EngineManager();
        let sceneManager = new SceneManager(stateManager);
        engineManager.loadScene((engine) => {
            return sceneManager.createScene(engine);
        });
    }
}