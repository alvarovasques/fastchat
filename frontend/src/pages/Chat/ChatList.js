import React, { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  CircularProgress,
  Badge,
  Divider,
} from "@material-ui/core";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  chatsList: {
    flex: 1,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  chatItem: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  selectedChat: {
    backgroundColor: theme.palette.action.selected,
  },
  chatInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  messagePreview: {
    maxWidth: "70%",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  noChats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: theme.spacing(2),
    textAlign: "center",
  },
  unreadBadge: {
    backgroundColor: theme.palette.primary.main,
    color: "white",
  },
}));

const ChatList = ({ setCurrentChat }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await api.get("/chats");
        setChats(data);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message") {
        updateChatLastMessage(data.chat);
      }
      if (data.action === "update") {
        updateChat(data.chat);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const updateChatLastMessage = (updatedChat) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((chat) => chat.id === updatedChat.id);
      if (chatIndex !== -1) {
        const newChats = [...prevChats];
        newChats[chatIndex] = {
          ...newChats[chatIndex],
          lastMessage: updatedChat.lastMessage,
          updatedAt: updatedChat.updatedAt,
        };

        // Update unread count for current user
        if (newChats[chatIndex].users) {
          newChats[chatIndex].users = newChats[chatIndex].users.map((chatUser) => {
            if (chatUser.userId === user.id && chatUser.userId !== updatedChat.lastMessage.senderId) {
              return {
                ...chatUser,
                unreads: chatUser.unreads + 1,
              };
            }
            return chatUser;
          });
        }

        // Sort chats by updatedAt
        return newChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }
      return [...prevChats, updatedChat].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const updateChat = (updatedChat) => {
    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((chat) => chat.id === updatedChat.id);
      if (chatIndex !== -1) {
        const newChats = [...prevChats];
        newChats[chatIndex] = updatedChat;
        return newChats;
      }
      return prevChats;
    });
  };

  const handleSelectChat = async (chat) => {
    setSelectedChatId(chat.id);
    setCurrentChat(chat);

    // Mark messages as read
    try {
      await api.put(`/chats/${chat.id}/read`);
      
      // Update unread count locally
      setChats((prevChats) => {
        return prevChats.map((c) => {
          if (c.id === chat.id) {
            return {
              ...c,
              users: c.users.map((chatUser) => {
                if (chatUser.userId === user.id) {
                  return {
                    ...chatUser,
                    unreads: 0,
                  };
                }
                return chatUser;
              }),
            };
          }
          return c;
        });
      });
    } catch (err) {
      toastError(err);
    }
  };

  const getUnreadCount = (chat) => {
    if (!chat.users) return 0;
    const currentUser = chat.users.find((chatUser) => chatUser.userId === user.id);
    return currentUser ? currentUser.unreads : 0;
  };

  const formatMessageDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className={classes.noChats}>
        <CircularProgress size={24} />
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <div className={classes.chatsList}>
        {chats.length > 0 ? (
          <List>
            {chats.map((chat) => {
              const unreadCount = getUnreadCount(chat);
              return (
                <React.Fragment key={chat.id}>
                  <ListItem
                    className={`${classes.chatItem} ${
                      selectedChatId === chat.id ? classes.selectedChat : ""
                    }`}
                    button
                    onClick={() => handleSelectChat(chat)}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="primary"
                        badgeContent={unreadCount}
                        invisible={unreadCount === 0}
                        classes={{ badge: classes.unreadBadge }}
                      >
                        <Avatar src={chat.avatar || ""}>
                          {chat.title ? chat.title[0] : "?"}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <div className={classes.chatInfo}>
                          <Typography variant="subtitle2" noWrap>
                            {chat.title || "Chat sem título"}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {chat.updatedAt && formatMessageDate(chat.updatedAt)}
                          </Typography>
                        </div>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          className={classes.messagePreview}
                        >
                          {chat.lastMessage?.body || "Nenhuma mensagem"}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <div className={classes.noChats}>
            <Typography variant="body2" color="textSecondary">
              Nenhum chat disponível
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;