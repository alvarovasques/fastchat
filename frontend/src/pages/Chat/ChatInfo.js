import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Typography, Paper, Grid, Button } from "@material-ui/core";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
    height: "100%",
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    marginBottom: theme.spacing(2),
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
  avatar: {
    marginRight: theme.spacing(1),
  },
  content: {
    flex: 1,
    overflowY: "auto",
  },
  infoItem: {
    marginBottom: theme.spacing(1),
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
  },
}));

const ChatInfo = ({ chat, loading }) => {
  const classes = useStyles();
  const [chatInfo, setChatInfo] = useState(null);

  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const { data } = await api.get(`/chats/${chat.id}`);
        setChatInfo(data);
      } catch (err) {
        toast.error("Erro ao carregar informações do chat");
      }
    };

    if (chat.id) {
      fetchChatInfo();
    }
  }, [chat.id]);

  if (loading || !chatInfo) {
    return (
      <div className={classes.root}>
        <Typography variant="body2" color="textSecondary">
          Carregando informações...
        </Typography>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Paper className={classes.paper} variant="outlined">
        <div className={classes.header}>
          <Typography variant="h6">Informações do Chat</Typography>
        </div>
        <div className={classes.content}>
          <Grid container spacing={2}>
            <Grid item xs={12} className={classes.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Título
              </Typography>
              <Typography variant="body1">{chatInfo.title || "Sem título"}</Typography>
            </Grid>
            <Grid item xs={12} className={classes.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Participantes
              </Typography>
              {chatInfo.users && chatInfo.users.length > 0 ? (
                chatInfo.users.map((user) => (
                  <Typography key={user.id} variant="body2">
                    {user.name}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2">Nenhum participante</Typography>
              )}
            </Grid>
            <Grid item xs={12} className={classes.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Criado em
              </Typography>
              <Typography variant="body2">
                {new Date(chatInfo.createdAt).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </div>
        <div className={classes.actions}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              // Implementar ação de atualizar
            }}
          >
            Atualizar
          </Button>
        </div>
      </Paper>
    </div>
  );
};

export default ChatInfo;