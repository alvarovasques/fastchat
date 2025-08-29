import { Op } from "sequelize";
import Chat from "../../models/Chat";
import ChatMessage from "../../models/ChatMessage";
import ChatUser from "../../models/ChatUser";
import User from "../../models/User";

export interface ChatMessageData {
  senderId: number;
  chatId: number;
  message?: string;
  mediaPath?: string;
  mediaName?: string;
  messageType?: 'text' | 'file' | 'image' | 'audio' | 'video' | 'document';
  fileInfo?: {
    fileType: string;
    fileSize: string;
    mimeType: string;
  };
}

export default async function CreateMessageService({
  senderId,
  chatId,
  message = "",
  mediaPath,
  mediaName,
  messageType = 'text',
  fileInfo
}: ChatMessageData) {
  
  // Determinar o tipo da mensagem automaticamente
  let finalMessageType = messageType;
  let displayMessage = message;

  if (mediaPath && mediaName) {
    finalMessageType = fileInfo?.fileType as any || 'file';
    
    // Criar mensagem de exibição baseada no tipo
    switch (finalMessageType) {
      case 'image':
        displayMessage = message || '📷 Imagem';
        break;
      case 'audio':
        displayMessage = message || '🎵 Áudio';
        break;
      case 'video':
        displayMessage = message || '🎬 Vídeo';
        break;
      case 'document':
      case 'pdf':
        displayMessage = message || `📄 ${mediaName}`;
        break;
      default:
        displayMessage = message || `📎 ${mediaName}`;
    }
  }

  // Criar mensagem no banco
  const newMessage = await ChatMessage.create({
    senderId,
    chatId,
    message: displayMessage,
    mediaPath: mediaPath || null,
    mediaName: mediaName || null,
    // Adicionar campos extras se não existirem no modelo
    ...(fileInfo && {
      messageType: finalMessageType,
      fileType: fileInfo.fileType,
      fileSize: fileInfo.fileSize,
      mimeType: fileInfo.mimeType
    })
  });

  // Recarregar com relacionamentos
  await newMessage.reload({
    include: [
      { model: User, as: "sender", attributes: ["id", "name", "profile"] },
      {
        model: Chat,
        as: "chat",
        include: [{ model: ChatUser, as: "users" }]
      }
    ]
  });

  // Atualizar última mensagem do chat
  const sender = await User.findByPk(senderId);
  const lastMessageText = mediaPath 
    ? `${sender.name}: ${displayMessage}` 
    : `${sender.name}: ${message}`;
    
  await newMessage.chat.update({ 
    lastMessage: lastMessageText,
    lastMessageAt: new Date()
  });

  // Atualizar contadores de mensagens não lidas
  const chatUsers = await ChatUser.findAll({
    where: { chatId }
  });

  for (let chatUser of chatUsers) {
    if (chatUser.userId === senderId) {
      await chatUser.update({ 
        unreads: 0,
        lastSeenAt: new Date()
      });
    } else {
      await chatUser.update({ 
        unreads: chatUser.unreads + 1,
        hasNewMessage: true
      });
    }
  }

  // Adicionar informações extras para retorno
  return {
    ...newMessage.toJSON(),
    fileInfo,
    messageType: finalMessageType,
    isFile: !!mediaPath,
    downloadUrl: mediaPath ? `/public/${mediaPath}` : null
  };
}

// Service adicional para marcar como "digitando"
export async function setTypingStatus(chatId: number, userId: number, isTyping: boolean) {
  const chatUser = await ChatUser.findOne({
    where: { chatId, userId }
  });

  if (chatUser) {
    await chatUser.update({
      isTyping,
      lastTypingAt: isTyping ? new Date() : null
    });
  }

  return chatUser;
}

// Service para buscar usuários digitando
export async function getTypingUsers(chatId: number, excludeUserId: number) {
  const typingUsers = await ChatUser.findAll({
    where: {
      chatId,
      userId: { [Op.ne]: excludeUserId },
      isTyping: true,
      lastTypingAt: {
        [Op.gte]: new Date(Date.now() - 10000) // Últimos 10 segundos
      }
    },
    include: [
      { model: User, as: "user", attributes: ["id", "name"] }
    ]
  });

  return typingUsers.map(cu => cu.user);
}