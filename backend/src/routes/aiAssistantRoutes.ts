import express from "express";
import isAuth from "../middleware/isAuth";

import * as AIAssistantController from "../controllers/AIAssistantController";

const aiAssistantRoutes = express.Router();

aiAssistantRoutes.get("/ai-assistants", isAuth, AIAssistantController.index);
aiAssistantRoutes.get("/ai-assistants/:id", isAuth, AIAssistantController.show);
aiAssistantRoutes.post("/ai-assistants", isAuth, AIAssistantController.store);
aiAssistantRoutes.put("/ai-assistants/:id", isAuth, AIAssistantController.update);
aiAssistantRoutes.delete("/ai-assistants/:id", isAuth, AIAssistantController.remove);
aiAssistantRoutes.post("/ai-chat", isAuth, AIAssistantController.sendMessage);
aiAssistantRoutes.post("/ai-settings", isAuth, AIAssistantController.saveSettings);

export default aiAssistantRoutes;