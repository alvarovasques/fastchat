import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  makeStyles,
  Paper,
  Typography,
  Chip,
  LinearProgress,
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import PhotoIcon from "@material-ui/icons/Photo";
import CloseIcon from "@material-ui/icons/Close";
import GetAppIcon from "@material-ui/icons/GetApp";

import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import api from "../../services/api";
import { green } from "@material-ui/core/colors";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    overflow: "hidden",
    borderRadius: 0,
    height: "100%",
    borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
  },
  messageList: {
    position: "relative",
    overflowY: "auto",
    height: "100%",
    ...theme.scrollbarStyles,
    backgroundColor: theme.palette.chatlist,
  },
  inputArea: {
    position: "relative",
    height: "auto",
  },
  input: {
    padding: "20px",
  },
  buttonSend: {
    margin: theme.spacing(1),
  },
  boxLeft: {
    padding: "10px 10px 5px",
    margin: "10px",
    position: "relative",
    backgroundColor: "blue",
    maxWidth: 300,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    border: "1px solid rgba(0, 0, 0, 0.12)",
  },
  boxRight: {
    padding: "10px 10px 5px",
    margin: "10px 10px 10px auto",
    position: "relative",
    backgroundColor: "green",
    textAlign: "right",
    maxWidth: 300,
    borderRadius: 10,
    borderBottomRightRadius: 0,
    border: "1px solid rgba(0, 0, 0, 0.12)",
  },
  // NOVOS ESTILOS PARA UPLOAD
  attachmentContainer: {
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
  },
  filePreviewContainer: {
    padding: "8px 20px",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
    backgroundColor: "#f5f5f5",
  },
  filePreviewItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: "4px",
    padding: "4px 8px",
    backgroundColor: "white",
    borderRadius: "4px",
    border: "1px solid rgba(0, 0, 0, 0.12)",
  },
  fileIcon: {
    marginRight: "8px",
    fontSize: "20px",
  },
  fileName: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "200px",
  },
  dragOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    border: "2px dashed #2196f3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    borderRadius: "8px",
  },
  fileMessage: {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "4px",
    margin: "4px 0",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
  },
  fileInfo: {
    flex: 1,
    marginLeft: "8px",
  },
  hidden: {
    display: "none",
  },
}));

export default function ChatMessages({
  chat,
  messages,
  handleSendMessage,
  handleLoadMore,
  scrollToBottomRef,
  pageInfo,
  loading,
}) {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { datetimeToClient } = useDate();
  const baseRef = useRef();

  // ESTADOS EXISTENTES
  const [contentMessage, setContentMessage] = useState("");

  // NOVOS ESTADOS PARA UPLOAD
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // REFS PARA INPUTS DE ARQUIVO
  const fileInputRef = useRef();
  const imageInputRef = useRef();

  const scrollToBottom = () => {
    if (baseRef.current) {
      baseRef.current.scrollIntoView({});
    }
  };

  const unreadMessages = (chat) => {
    if (chat !== undefined) {
      const currentUser = chat.users.find((u) => u.userId === user.id);
      return currentUser.unreads > 0;
    }
    return 0;
  };

  useEffect(() => {
    if (unreadMessages(chat) > 0) {
      try {
        api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) {}
    }
    scrollToBottomRef.current = scrollToBottom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    if (!pageInfo.hasMore || loading) return;
    if (scrollTop < 600) {
      handleLoadMore();
    }
  };

  // FUNÇÕES PARA UPLOAD DE ARQUIVOS
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    // Limpar input
    event.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // FUNÇÃO PARA ENVIO DE MENSAGEM COM ARQUIVOS
  const handleSendWithFiles = async () => {
    if (contentMessage.trim() === "" && selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('message', contentMessage);
      
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await api.post(`/chats/${chat.id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setContentMessage("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
    setUploading(false);
  };

  // FUNÇÃO PARA RENDERIZAR ÍCONE DO ARQUIVO
  const getFileIcon = (fileName, mediaPath) => {
    if (!fileName && !mediaPath) return "📄";
    
    const extension = fileName ? fileName.split('.').pop().toLowerCase() : '';
    const path = mediaPath || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) || path.includes('image')) {
      return "🖼️";
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension) || path.includes('audio')) {
      return "🎵";
    }
    if (['mp4', 'avi', 'webm', 'mov'].includes(extension) || path.includes('video')) {
      return "🎬";
    }
    if (['pdf'].includes(extension)) {
      return "📕";
    }
    if (['doc', 'docx'].includes(extension)) {
      return "📄";
    }
    if (['xls', 'xlsx'].includes(extension)) {
      return "📊";
    }
    return "📎";
  };

  // FUNÇÃO PARA RENDERIZAR ARQUIVOS NAS MENSAGENS
  const renderFileInMessage = (message) => {
    if (!message.mediaPath || !message.mediaName) return null;

    return (
      <div className={classes.fileMessage}>
        <span className={classes.fileIcon}>
          {getFileIcon(message.mediaName, message.mediaPath)}
        </span>
        <div className={classes.fileInfo}>
          <Typography variant="body2" className={classes.fileName}>
            {message.mediaName}
          </Typography>
          {message.fileSize && (
            <Typography variant="caption" color="textSecondary">
              {message.fileSize}
            </Typography>
          )}
        </div>
        <IconButton 
          size="small" 
          onClick={() => window.open(`/public/${message.mediaPath}`, '_blank')}
          style={{ color: 'inherit' }}
        >
          <GetAppIcon fontSize="small" />
        </IconButton>
      </div>
    );
  };

  return (
    <Paper className={classes.mainContainer}>
      {/* Inputs ocultos para arquivos */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className={classes.hidden}
        onChange={handleFileSelect}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className={classes.hidden}
        onChange={handleFileSelect}
      />

      {/* Área de mensagens com drag & drop */}
      <div 
        onScroll={handleScroll} 
        className={classes.messageList}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ position: 'relative' }}
      >
        {/* Overlay de drag & drop */}
        {isDragging && (
          <div className={classes.dragOverlay}>
            <div style={{ textAlign: 'center', color: '#2196f3' }}>
              <AttachFileIcon style={{ fontSize: 48, marginBottom: 16 }} />
              <Typography variant="h6">
                Solte os arquivos aqui
              </Typography>
            </div>
          </div>
        )}

        {Array.isArray(messages) &&
          messages.map((item, key) => {
            if (item.senderId === user.id) {
              return (
                <Box key={key} className={classes.boxRight}>
                  <Typography variant="subtitle2">
                    {item.sender.name}
                  </Typography>
                  
                  {/* Renderizar arquivo se existir */}
                  {renderFileInMessage(item)}
                  
                  {/* Renderizar mensagem de texto */}
                  {item.message && (
                    <div style={{ marginTop: item.mediaPath ? 8 : 0 }}>
                      {item.message}
                    </div>
                  )}
                  
                  <Typography variant="caption" display="block">
                    {datetimeToClient(item.createdAt)}
                  </Typography>
                </Box>
              );
            } else {
              return (
                <Box key={key} className={classes.boxLeft}>
                  <Typography variant="subtitle2">
                    {item.sender.name}
                  </Typography>
                  
                  {/* Renderizar arquivo se existir */}
                  {renderFileInMessage(item)}
                  
                  {/* Renderizar mensagem de texto */}
                  {item.message && (
                    <div style={{ marginTop: item.mediaPath ? 8 : 0 }}>
                      {item.message}
                    </div>
                  )}
                  
                  <Typography variant="caption" display="block">
                    {datetimeToClient(item.createdAt)}
                  </Typography>
                </Box>
              );
            }
          })}
        <div ref={baseRef}></div>
      </div>

      {/* Preview de arquivos selecionados */}
      {selectedFiles.length > 0 && (
        <div className={classes.filePreviewContainer}>
          <Typography variant="subtitle2" style={{ marginBottom: 8 }}>
            Arquivos selecionados:
          </Typography>
          {selectedFiles.map((file, index) => (
            <div key={index} className={classes.filePreviewItem}>
              <span className={classes.fileIcon}>
                {getFileIcon(file.name)}
              </span>
              <Typography variant="body2" className={classes.fileName}>
                {file.name}
              </Typography>
              <Typography variant="caption" color="textSecondary" style={{ marginRight: 8 }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => removeFile(index)}
                color="secondary"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          ))}
        </div>
      )}

      {/* Barra de progresso durante upload */}
      {uploading && (
        <LinearProgress />
      )}

      {/* Área de input */}
      <div className={classes.inputArea}>
        <FormControl variant="outlined" fullWidth>
          <Input
            multiline
            value={contentMessage}
            onChange={(e) => setContentMessage(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !uploading) {
                e.preventDefault();
                if (contentMessage.trim() !== "" || selectedFiles.length > 0) {
                  handleSendWithFiles();
                }
              }
            }}
            className={classes.input}
            placeholder="Digite sua mensagem..."
            disabled={uploading}
            startAdornment={
              <InputAdornment position="start" className={classes.attachmentContainer}>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  size="small"
                  disabled={uploading}
                  title="Anexar arquivo"
                >
                  <AttachFileIcon />
                </IconButton>
                <IconButton
                  onClick={() => imageInputRef.current?.click()}
                  size="small"
                  disabled={uploading}
                  title="Anexar imagem"
                >
                  <PhotoIcon />
                </IconButton>
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    if (!uploading && (contentMessage.trim() !== "" || selectedFiles.length > 0)) {
                      handleSendWithFiles();
                    }
                  }}
                  className={classes.buttonSend}
                  disabled={uploading}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
      </div>
    </Paper>
  );
}