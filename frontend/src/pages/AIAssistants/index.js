import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Table,
  Paper,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
} from "@material-ui/core";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  SmartToy,
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    margin: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tableContainer: {
    flex: 1,
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  tab: {
    minWidth: 100,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: "100%",
  },
  textField: {
    margin: theme.spacing(1),
    minWidth: "100%",
  },
}));

const AIAssistants = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [assistants, setAssistants] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    provider: "openai",
    apiKey: "",
    model: "gpt-4",
    instructions: "",
    isActive: true,
  });

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/ai-assistants");
      setAssistants(data);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (assistant = null) => {
    if (assistant) {
      setSelectedAssistant(assistant);
      setFormData({
        name: assistant.name,
        description: assistant.description,
        provider: assistant.provider,
        apiKey: assistant.apiKey,
        model: assistant.model,
        instructions: assistant.instructions,
        isActive: assistant.isActive,
      });
    } else {
      setSelectedAssistant(null);
      setFormData({
        name: "",
        description: "",
        provider: "openai",
        apiKey: "",
        model: "gpt-4",
        instructions: "",
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAssistant(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveAssistant = async (e) => {
    e.preventDefault();
    try {
      if (selectedAssistant) {
        await api.put(`/ai-assistants/${selectedAssistant.id}`, formData);
        toast.success("Assistente atualizado com sucesso!");
      } else {
        await api.post("/ai-assistants", formData);
        toast.success("Assistente criado com sucesso!");
      }
      handleCloseDialog();
      loadAssistants();
    } catch (err) {
      toastError(err);
    }
  };

  const handleDeleteAssistant = async (id) => {
    try {
      await api.delete(`/ai-assistants/${id}`);
      toast.success("Assistente excluído com sucesso!");
      loadAssistants();
      setConfirmModalOpen(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenConfirmModal = (id) => {
    setSelectedAssistant({ id });
    setConfirmModalOpen(true);
  };

  const handleSaveApiKey = async () => {
    try {
      await api.post("/ai-settings", { apiKey });
      toast.success("Chave API salva com sucesso!");
      setApiKey("");
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title="Excluir Assistente"
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteAssistant(selectedAssistant?.id)}
      >
        Tem certeza que deseja excluir este assistente?
      </ConfirmationModal>
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAssistant ? "Editar Assistente" : "Novo Assistente"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl variant="outlined" fullWidth margin="dense">
                <InputLabel>Provedor</InputLabel>
                <Select
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  label="Provedor"
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="anthropic">Anthropic</MenuItem>
                  <MenuItem value="gemini">Google Gemini</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Chave API"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                variant="outlined"
                type="password"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl variant="outlined" fullWidth margin="dense">
                <InputLabel id="model-select-label">Modelo</InputLabel>
                <Select
                  labelId="model-select-label"
                  id="model-select"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  label="Modelo"
                >
                  {formData.provider === "openai" && [
                    <MenuItem key="gpt-4" value="gpt-4">GPT-4</MenuItem>,
                    <MenuItem key="gpt-4-turbo" value="gpt-4-turbo">GPT-4 Turbo</MenuItem>,
                    <MenuItem key="gpt-3.5-turbo" value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                  ]}
                  {formData.provider === "anthropic" && [
                    <MenuItem key="claude-3-opus" value="claude-3-opus">Claude 3 Opus</MenuItem>,
                    <MenuItem key="claude-3-sonnet" value="claude-3-sonnet">Claude 3 Sonnet</MenuItem>,
                    <MenuItem key="claude-3-haiku" value="claude-3-haiku">Claude 3 Haiku</MenuItem>
                  ]}
                  {formData.provider === "gemini" && [
                    <MenuItem key="gemini-pro" value="gemini-pro">Gemini Pro</MenuItem>,
                    <MenuItem key="gemini-ultra" value="gemini-ultra">Gemini Ultra</MenuItem>
                  ]}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Instruções"
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                fullWidth
                margin="dense"
                variant="outlined"
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl variant="outlined" fullWidth margin="dense">
                <InputLabel>Status</InputLabel>
                <Select
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleInputChange}
                  label="Status"
                >
                  <MenuItem value={true}>Ativo</MenuItem>
                  <MenuItem value={false}>Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancelar
          </Button>
          <Button onClick={(e) => handleSaveAssistant(e)} color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <MainHeader>
        <Title>Assistentes IA</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Novo Assistente
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab className={classes.tab} label="Assistentes" />
          <Tab className={classes.tab} label="Configurações" />
        </Tabs>

        {tabValue === 0 && (
          <div className={classes.tableContainer}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
                <CircularProgress />
              </div>
            ) : (
              <>
                {assistants.length === 0 ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
                    <Typography variant="body1">
                      Nenhum assistente encontrado. Crie um novo assistente para começar.
                    </Typography>
                  </div>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Provedor</TableCell>
                        <TableCell>Modelo</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assistants.map((assistant) => (
                        <TableRow key={assistant.id}>
                          <TableCell>{assistant.name}</TableCell>
                          <TableCell>{assistant.description}</TableCell>
                          <TableCell>{assistant.provider}</TableCell>
                          <TableCell>{assistant.model}</TableCell>
                          <TableCell>
                            <Chip
                              label={assistant.isActive ? "Ativo" : "Inativo"}
                              color={assistant.isActive ? "primary" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(assistant)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenConfirmModal(assistant.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </div>
        )}

        {tabValue === 1 && (
          <div style={{ padding: 20 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Configurações Globais
                    </Typography>
                    <TextField
                      label="Chave API Global"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      type="password"
                      helperText="Esta chave será usada como padrão quando não for especificada uma chave para o assistente"
                    />
                  </CardContent>
                  <CardActions>
                    <Button
                      color="primary"
                      variant="contained"
                      onClick={handleSaveApiKey}
                    >
                      Salvar Configurações
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </div>
        )}
      </Paper>
    </MainContainer>
  );
};

export default AIAssistants;