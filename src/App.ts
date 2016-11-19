import { EngineManager } from "managers/EngineManager";
import { SceneManager } from "managers/SceneManager";

export class App {
    constructor () {
        let engineManager = new EngineManager();
        let virtualScene = new SceneManager();
        engineManager.loadScene(virtualScene.createScene);
    }
}