import express from "express";
import isAuth from "../middleware/isAuth";
import { processChatUpload, uploadChatFile } from "../middleware/upload";
import * as ChatController from "../controllers/ChatController";

const routes = express.Router();

// Rotas básicas do chat
routes.get("/chats", isAuth, ChatController.index);
routes.get("/chats/:id", isAuth, ChatController.show);
routes.get("/chats/:id/messages", isAuth, ChatController.messages);
routes.post("/chats", isAuth, ChatController.store);
routes.put("/chats/:id", isAuth, ChatController.update);
routes.delete("/chats/:id", isAuth, ChatController.remove);

// ROTAS ATUALIZADAS: Mensagens com suporte a arquivos
routes.post("/chats/:id/messages", isAuth, processChatUpload, ChatController.saveMessage);

// NOVAS ROTAS: Funcionalidades avançadas
routes.post("/chats/:id/read", isAuth, ChatController.checkAsRead);
routes.post("/chats/:id/typing", isAuth, ChatController.setTyping);
routes.get("/chats/:id/typing", isAuth, ChatController.getTyping);

// NOVA ROTA: Upload direto de arquivo
routes.post("/chats/upload", isAuth, uploadChatFile.single('file'), ChatController.uploadFile);

export default routes;