import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import AddIcon from "@material-ui/icons/Add";
import api from "../../services/api";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  searchContainer: {
    padding: theme.spacing(1, 2),
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
  },
  contactsList: {
    flex: 1,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  contactItem: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  noContacts: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: theme.spacing(2),
    textAlign: "center",
  },
}));

const NewChat = ({ setCurrentChat }) => {
  const classes = useStyles();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/contacts");
        setContacts(data.contacts);
      } catch (err) {
        toast.error("Erro ao carregar contatos");
      }
      setLoading(false);
    };

    fetchContacts();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateChat = async (contactId) => {
    try {
      const { data } = await api.post("/chats", {
        contactId,
      });
      setCurrentChat(data);
    } catch (err) {
      toast.error("Erro ao criar chat");
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.searchContainer}>
        <TextField
          fullWidth
          placeholder="Buscar contatos"
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </div>
      <div className={classes.contactsList}>
        {loading ? (
          <div className={classes.noContacts}>
            <CircularProgress size={24} />
          </div>
        ) : filteredContacts.length > 0 ? (
          <List>
            {filteredContacts.map((contact) => (
              <ListItem
                key={contact.id}
                className={classes.contactItem}
                button
                onClick={() => handleCreateChat(contact.id)}
              >
                <ListItemAvatar>
                  <Avatar src={contact.profilePicUrl} alt={contact.name}>
                    {contact.name[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={contact.name}
                  secondary={contact.number}
                />
                <IconButton size="small">
                  <AddIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <div className={classes.noContacts}>
            <Typography variant="body2" color="textSecondary">
              {searchTerm
                ? "Nenhum contato encontrado"
                : "Nenhum contato disponível"}
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewChat;