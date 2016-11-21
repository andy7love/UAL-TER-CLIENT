import { EngineManager } from "managers/EngineManager";
import { SceneManager } from "managers/SceneManager";
import { StateManager } from "managers/StateManager";
import { InputManager } from "managers/InputManager";
import { GUIManager } from "managers/GUIManager";

export class App {
    constructor () {
        let stateManager = new StateManager();
        let guiManager = new GUIManager(stateManager);
        let inputManager = new InputManager(stateManager);
        let engineManager = new EngineManager();
        let sceneManager = new SceneManager(stateManager);
        engineManager.loadScene((engine) => {
            return sceneManager.createScene(engine);
        });
    }
}