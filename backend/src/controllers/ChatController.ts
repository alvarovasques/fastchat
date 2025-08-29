import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { processChatUpload, getFileInfo } from "../middleware/upload";

import CreateService from "../services/ChatService/CreateService";
import ListService from "../services/ChatService/ListService";
import ShowFromUuidService from "../services/ChatService/ShowFromUuidService";
import DeleteService from "../services/ChatService/DeleteService";
import FindMessages from "../services/ChatService/FindMessages";
import UpdateService from "../services/ChatService/UpdateService";
import CreateMessageService, { setTypingStatus, getTypingUsers } from "../services/ChatService/CreateMessageService";

import Chat from "../models/Chat";
import User from "../models/User";
import ChatUser from "../models/ChatUser";

type IndexQuery = {
  pageNumber: string;
  companyId: string | number;
  ownerId?: number;
};

type StoreData = {
  users: any[];
  title: string;
};

type FindParams = {
  companyId: number;
  ownerId?: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { pageNumber } = req.query as unknown as IndexQuery;
  const ownerId = +req.user.id;

  const { records, count, hasMore } = await ListService({
    ownerId,
    pageNumber
  });

  return res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const ownerId = +req.user.id;
  const data = req.body as StoreData;

  const record = await CreateService({
    ...data,
    ownerId,
    companyId
  });

  const io = getIO();

  record.users.forEach(user => {
    io.to(`user-${user.userId}`).emit(`company-${companyId}-chat-user-${user.userId}`, {
      action: "create",
      record,
      timestamp: new Date()
    });
    
    // Enviar notificação push
    io.to(`user-${user.userId}`).emit('notification', {
      type: 'chat-created',
      title: 'Novo chat criado',
      message: `Chat "${record.title}" foi criado`,
      chatId: record.id,
      timestamp: new Date(),
      sound: true
    });
  });

  return res.status(200).json(record);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body;
  const { id } = req.params;

  const record = await UpdateService({
    ...data,
    id: +id
  });

  const io = getIO();

  record.users.forEach(user => {
    io.to(`user-${user.userId}`).emit(`company-${companyId}-chat-user-${user.userId}`, {
      action: "update",
      record,
      timestamp: new Date()
    });
  });

  return res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowFromUuidService(id);

  return res.status(200).json(record);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteService(id);

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-chat`, {
    action: "delete",
    id,
    timestamp: new Date()
  });

  return res.status(200).json({ message: "Chat deleted" });
};

// NOVO: Salvar mensagem com suporte a arquivos
export const saveMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;
    const { message } = req.body;
    const { id } = req.params;
    const senderId = +req.user.id;
    const chatId = +id;

    let newMessage;
    
    // Verificar se há arquivos no upload
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (files && (files.files || files.image || files.audio)) {
      // Processar cada arquivo enviado
      const uploadedFiles = files.files || files.image || files.audio || [];
      const messagePromises = [];

      for (const file of uploadedFiles) {
        const fileInfo = getFileInfo(file, companyId.toString());
        
        const messageData = {
          chatId,
          senderId,
          message: message || '',
          mediaPath: fileInfo.mediaPath,
          mediaName: fileInfo.mediaName,
          messageType: fileInfo.fileType as any,
          fileInfo
        };

        messagePromises.push(CreateMessageService(messageData));
      }

      // Aguardar todas as mensagens serem criadas
      const createdMessages = await Promise.all(messagePromises);
      newMessage = createdMessages[0]; // Usar a primeira para compatibilidade
      
      // Se há múltiplos arquivos, criar mensagem agrupada
      if (createdMessages.length > 1) {
        newMessage.multipleFiles = createdMessages;
      }
      
    } else {
      // Mensagem de texto simples
      newMessage = await CreateMessageService({
        chatId,
        senderId,
        message: message || ''
      });
    }

    // Buscar chat atualizado
    const chat = await Chat.findByPk(chatId, {
      include: [
        { model: User, as: "owner" },
        { 
          model: ChatUser, 
          as: "users",
          include: [{ model: User, as: "user" }]
        }
      ]
    });

    const io = getIO();
    
    // Emitir para o canal específico do chat
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-chat-${chatId}`, {
      action: "new-message",
      newMessage,
      chat,
      timestamp: new Date()
    });

    // Emitir para o canal geral de chats (lista de chats)
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-chat`, {
      action: "new-message",
      newMessage,
      chat,
      timestamp: new Date()
    });

    // Enviar notificações para usuários específicos
    const sender = await User.findByPk(senderId);
    chat.users.forEach(chatUser => {
      if (chatUser.userId !== senderId) {
        io.to(`user-${chatUser.userId}`).emit('notification', {
          type: 'new-message',
          title: `${sender.name} - ${chat.title}`,
          message: newMessage.message,
          chatId: chat.id,
          senderId,
          senderName: sender.name,
          hasFile: !!newMessage.mediaPath,
          timestamp: new Date(),
          sound: true,
          desktop: true
        });
      }
    });

    return res.json(newMessage);
    
  } catch (error) {
    console.error("Erro ao salvar mensagem:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const checkAsRead = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { userId } = req.body;
  const { id } = req.params;

  const chatUser = await ChatUser.findOne({ where: { chatId: id, userId } });
  await chatUser.update({ 
    unreads: 0,
    hasNewMessage: false,
    lastSeenAt: new Date()
  });

  const chat = await Chat.findByPk(id, {
    include: [
      { model: User, as: "owner" },
      { 
        model: ChatUser, 
        as: "users",
        include: [{ model: User, as: "user" }]
      }
    ]
  });

  const io = getIO();
  
  // Emitir status de leitura
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-chat-${id}`, {
    action: "message-read",
    chat,
    userId,
    timestamp: new Date()
  });

  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-chat`, {
    action: "update",
    chat,
    timestamp: new Date()
  });

  return res.json(chat);
};

export const messages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { pageNumber } = req.query as unknown as IndexQuery;
  const { id: chatId } = req.params;
  const ownerId = +req.user.id;

  const { records, count, hasMore } = await FindMessages({
    chatId,
    ownerId,
    pageNumber
  });

  return res.json({ records, count, hasMore });
};

// NOVO: Gerenciar status de "digitando"
export const setTyping = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { isTyping } = req.body;
  const { id: chatId } = req.params;
  const userId = +req.user.id;

  await setTypingStatus(+chatId, userId, isTyping);

  const io = getIO();
  const user = await User.findByPk(userId, {
    attributes: ["id", "name"]
  });

  // Emitir status de digitação
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-chat-${chatId}`, {
    action: isTyping ? "user-typing" : "user-stopped-typing",
    user,
    chatId,
    timestamp: new Date()
  });

  return res.json({ success: true });
};

// NOVO: Buscar usuários digitando
export const getTyping = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id: chatId } = req.params;
  const userId = +req.user.id;

  const typingUsers = await getTypingUsers(+chatId, userId);

  return res.json(typingUsers);
};

// NOVO: Upload direto de arquivo
export const uploadFile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { companyId } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const fileInfo = getFileInfo(req.file, companyId.toString());

    return res.json({
      success: true,
      file: {
        ...fileInfo,
        downloadUrl: `/public/${fileInfo.mediaPath}`
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao fazer upload" });
  }
};