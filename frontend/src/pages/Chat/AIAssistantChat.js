import React, { useState, useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
} from "@material-ui/core";
import { Send as SendIcon } from "@material-ui/icons";
import AndroidIcon from "@material-ui/icons/Android";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#f5f5f5",
    padding: theme.spacing(2),
  },
  chatContainer: {
    flex: 1,
    overflowY: "auto",
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    background: "#fff",
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    boxShadow: theme.shadows[1],
  },
  messageInput: {
    flex: 1,
    marginRight: theme.spacing(1),
  },
  userMessage: {
    background: "#e3f2fd",
    padding: theme.spacing(1, 2),
    borderRadius: "18px 18px 0 18px",
    marginBottom: theme.spacing(1),
    maxWidth: "80%",
    alignSelf: "flex-end",
    wordBreak: "break-word",
  },
  assistantMessage: {
    background: "#f1f1f1",
    padding: theme.spacing(1, 2),
    borderRadius: "18px 18px 18px 0",
    marginBottom: theme.spacing(1),
    maxWidth: "80%",
    alignSelf: "flex-start",
    wordBreak: "break-word",
  },
  messageContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: theme.spacing(2),
  },
  assistantHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  assistantIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  assistantSelector: {
    marginBottom: theme.spacing(2),
    background: "#fff",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    boxShadow: theme.shadows[1],
  },
  messageTime: {
    fontSize: "0.7rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1),
    borderRadius: "18px",
    background: "#f1f1f1",
    width: "fit-content",
    marginBottom: theme.spacing(1),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: theme.palette.text.secondary,
    margin: theme.spacing(0, 0.5),
    animation: "$bounce 1.4s infinite ease-in-out both",
    "&:nth-child(1)": {
      animationDelay: "-0.32s",
    },
    "&:nth-child(2)": {
      animationDelay: "-0.16s",
    },
  },
  "@keyframes bounce": {
    "0%, 80%, 100%": {
      transform: "scale(0)",
    },
    "40%": {
      transform: "scale(1)",
    },
  },
}));

const AIAssistantChat = () => {
  const classes = useStyles();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    loadAssistants();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const loadAssistants = async () => {
    try {
      const { data } = await api.get("/ai-assistants");
      setAssistants(data.filter(assistant => assistant.isActive));
      if (data.length > 0) {
        setSelectedAssistant(data[0].id);
      }
    } catch (err) {
      toastError(err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedAssistant) return;
    
    const userMessage = {
      content: message,
      role: "user",
      timestamp: new Date().toISOString(),
    };
    
    setMessages([...messages, userMessage]);
    setMessage("");
    setIsTyping(true);
    
    try {
      const { data } = await api.post("/ai-chat", {
        assistantId: selectedAssistant,
        message: message.trim(),
      });
      
      setIsTyping(false);
      
      const assistantMessage = {
        content: data.response,
        role: "assistant",
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setIsTyping(false);
      toast.error("Erro ao enviar mensagem para o assistente");
      toastError(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={classes.root}>
      <div className={classes.assistantSelector}>
        <FormControl variant="outlined" fullWidth>
          <InputLabel>Selecione um Assistente</InputLabel>
          <Select
            value={selectedAssistant}
            onChange={(e) => setSelectedAssistant(e.target.value)}
            label="Selecione um Assistente"
            disabled={loading}
          >
            {assistants.map((assistant) => (
              <MenuItem key={assistant.id} value={assistant.id}>
                {assistant.name} ({assistant.provider} - {assistant.model})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      
      <Paper className={classes.chatContainer} ref={chatContainerRef}>
        {assistants.length > 0 && selectedAssistant && (
          <div className={classes.assistantHeader}>
            <AndroidIcon className={classes.assistantIcon} />
            <Typography variant="subtitle1">
              {assistants.find(a => a.id === selectedAssistant)?.name || "Assistente IA"}
            </Typography>
          </div>
        )}
        
        <Divider style={{ margin: "8px 0 16px" }} />
        
        {messages.length === 0 ? (
          <Typography variant="body2" color="textSecondary" align="center">
            Envie uma mensagem para começar a conversa com o assistente.
          </Typography>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={classes.messageContainer}
              style={{
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                className={
                  msg.role === "user"
                    ? classes.userMessage
                    : classes.assistantMessage
                }
              >
                <Typography variant="body1">{msg.content}</Typography>
                <Typography className={classes.messageTime}>
                  {formatTimestamp(msg.timestamp)}
                </Typography>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className={classes.typingIndicator}>
            <div className={classes.dot}></div>
            <div className={classes.dot}></div>
            <div className={classes.dot}></div>
          </div>
        )}
      </Paper>
      
      <div className={classes.inputContainer}>
        <TextField
          className={classes.messageInput}
          variant="outlined"
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isTyping || !selectedAssistant}
          multiline
          rowsMax={4}
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!message.trim() || isTyping || !selectedAssistant}
        >
          {isTyping ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </div>
    </div>
  );
};

export default AIAssistantChat;