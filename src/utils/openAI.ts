import { GoogleGenerativeAI } from '@fuyun/generative-ai'

const apiKey = (import.meta.env.GEMINI_API_KEY)
const modelenv = import.meta.env.GEMINI_API_MODEL || 'gemini-pro'; // 设置默认值
const apiBaseUrl = (import.meta.env.API_BASE_URL)?.trim().replace(/\/$/, '')

const genAI = apiBaseUrl
  ? new GoogleGenerativeAI(apiKey, apiBaseUrl)
  : new GoogleGenerativeAI(apiKey)

export function listAllModels() {
  try {
    const models = genAI.listModels();
    let modelListHTML = '';
    for (const model of models) {
      modelListHTML += `<p>Name: ${model.name}, Display Name: ${model.display_name}</p>`;
    }

    // 使用 alert 弹框显示模型列表
    alert(modelListHTML);

  } catch (exception) {
    // 使用 alert 弹框显示错误信息
    alert(`Error listing models: ${exception}`);
  }
}

export const startChatAndSendMessageStream = async(history: ChatMessage[], newMessage: string) => {
  const model = genAI.getGenerativeModel({ model: modelenv })

  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role,
      parts: msg.parts.map(part => part.text).join(''), // Join parts into a single string
    })),
    generationConfig: {
      maxOutputTokens: 8000,
    },
    safetySettings: [
      {category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'},
      {category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE'}
      ],
  })

  // Use sendMessageStream for streaming responses
  const result = await chat.sendMessageStream(newMessage)

  const encodedStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const chunk of result.stream) {
        const text = await chunk.text()
        const encoded = encoder.encode(text)
        controller.enqueue(encoded)
      }
      controller.close()
    },
  })

  return encodedStream
}
