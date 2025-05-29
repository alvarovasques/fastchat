import * as Yup from "yup";
import AppError from "../errors/AppError";
import AIAssistant from "../models/AIAssistant";
import AISetting from "../models/AISetting";
import axios from "axios";

export const index = async (req, res) => {
  const { companyId } = req.user;
  const assistants = await AIAssistant.findAll({
    where: { companyId },
    order: [["name", "ASC"]]
  });

  return res.json(assistants);
};

export const show = async (req, res) => {
  const { id } = req.params;
  const { companyId } = req.user;

  const assistant = await AIAssistant.findOne({
    where: { id, companyId }
  });

  if (!assistant) {
    throw new AppError("Assistente não encontrado", 404);
  }

  return res.json(assistant);
};

export const store = async (req, res) => {
  const { companyId } = req.user;
  const schema = Yup.object().shape({
    name: Yup.string().required(),
    description: Yup.string(),
    provider: Yup.string().required(),
    apiKey: Yup.string(),
    model: Yup.string().required(),
    instructions: Yup.string(),
    isActive: Yup.boolean().default(true)
  });

  try {
    await schema.validate(req.body);
  } catch (err) {
    throw new AppError(err.message);
  }

  const assistant = await AIAssistant.create({
    ...req.body,
    companyId
  });

  return res.status(201).json(assistant);
};

export const update = async (req, res) => {
  const { id } = req.params;
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    name: Yup.string(),
    description: Yup.string(),
    provider: Yup.string(),
    apiKey: Yup.string(),
    model: Yup.string(),
    instructions: Yup.string(),
    isActive: Yup.boolean()
  });

  try {
    await schema.validate(req.body);
  } catch (err) {
    throw new AppError(err.message);
  }

  const assistant = await AIAssistant.findOne({
    where: { id, companyId }
  });

  if (!assistant) {
    throw new AppError("Assistente não encontrado", 404);
  }

  await assistant.update(req.body);

  return res.json(assistant);
};

export const remove = async (req, res) => {
  const { id } = req.params;
  const { companyId } = req.user;

  const assistant = await AIAssistant.findOne({
    where: { id, companyId }
  });

  if (!assistant) {
    throw new AppError("Assistente não encontrado", 404);
  }

  await assistant.destroy();

  return res.status(204).json();
};

export const sendMessage = async (req, res) => {
  const { companyId } = req.user;
  const { assistantId, message } = req.body;

  if (!assistantId || !message) {
    throw new AppError("Assistente e mensagem são obrigatórios");
  }

  const assistant = await AIAssistant.findOne({
    where: { id: assistantId, companyId, isActive: true }
  });

  if (!assistant) {
    throw new AppError("Assistente não encontrado ou inativo", 404);
  }

  let apiKey = assistant.apiKey;

  // Se não tiver API key específica, busca a global
  if (!apiKey) {
    const globalSettings = await AISetting.findOne({
      where: { companyId }
    });

    if (globalSettings && globalSettings.apiKey) {
      apiKey = globalSettings.apiKey;
    } else {
      throw new AppError("Chave API não configurada");
    }
  }

  try {
    let response;

    if (assistant.provider === "openai") {
      response = await callOpenAI(apiKey, assistant.model, message, assistant.instructions);
    } else if (assistant.provider === "anthropic") {
      response = await callAnthropic(apiKey, assistant.model, message, assistant.instructions);
    } else if (assistant.provider === "gemini") {
      response = await callGemini(apiKey, assistant.model, message, assistant.instructions);
    } else {
      throw new AppError("Provedor não suportado");
    }

    return res.json({ response });
  } catch (error) {
    console.error("Erro ao chamar API:", error);
    throw new AppError("Erro ao processar mensagem: " + (error.message || "Erro desconhecido"));
  }
};

export const saveSettings = async (req, res) => {
  const { companyId } = req.user;
  const { apiKey } = req.body;

  if (!apiKey) {
    throw new AppError("Chave API é obrigatória");
  }

  const [settings] = await AISetting.findOrCreate({
    where: { companyId },
    defaults: { apiKey, companyId }
  });

  if (settings.apiKey !== apiKey) {
    await settings.update({ apiKey });
  }

  return res.json({ success: true });
};

// Funções auxiliares para chamar as APIs de IA
async function callOpenAI(apiKey, model, message, instructions) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: instructions || "Você é um assistente útil." },
        { role: "user", content: message }
      ],
      temperature: 0.7
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      }
    }
  );

  return response.data.choices[0].message.content;
}

async function callAnthropic(apiKey, model, message, instructions) {
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model,
      messages: [
        { role: "user", content: message }
      ],
      system: instructions || "Você é um assistente útil.",
      max_tokens: 1024
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    }
  );

  return response.data.content[0].text;
}

async function callGemini(apiKey, model, message, instructions) {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
      systemInstruction: {
        parts: [{ text: instructions || "Você é um assistente útil." }]
      }
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}