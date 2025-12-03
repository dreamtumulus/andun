import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Message, AssessmentData, ApiConfig } from "../types";

// Helper to get effective config
const getEffectiveConfig = (config: ApiConfig) => {
  return {
    apiKey: config.apiKey || process.env.API_KEY || '',
    model: config.model || (config.provider === 'openrouter' ? 'google/gemini-2.0-flash-001' : 'gemini-2.5-flash'),
    provider: config.provider
  };
};

/**
 * OpenRouter / OpenAI-compatible Fetch Helper
 */
const callOpenRouter = async (
  messages: { role: string; content: string }[],
  model: string,
  apiKey: string,
  temperature: number,
  jsonMode: boolean = false
): Promise<string> => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href, // OpenRouter requirement
        "X-Title": "Police Psychological Assessment System"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        response_format: jsonMode ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter Error:", err);
      throw new Error(`OpenRouter API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Call OpenRouter Failed", error);
    throw error;
  }
};

/**
 * Agent 1: Assessment Agent (With Memory)
 */
export const sendAssessmentMessage = async (
  history: Message[],
  newMessage: string,
  agentName: string,
  config: ApiConfig,
  currentReport: AssessmentData | null = null
): Promise<string> => {
  const { apiKey, model, provider } = getEffectiveConfig(config);
  
  // Memory Injection
  const memoryContext = currentReport 
    ? `【长期记忆/历史评估档案】：
       此前评估时间：${currentReport.lastUpdated}
       已知主要压力源：${currentReport.stressSources.map(s => s.category).join(', ')}
       当前风险等级：${currentReport.riskLevel}
       
       请基于以上记忆与用户继续对话。如果用户提到情况好转或恶化，请在对话中予以回应。`
    : "这是初次对话，暂无历史评估档案。";

  const systemInstruction = `
    你叫“${agentName}”，是警务安盾系统中的专业心理评估助手。
    你的目标是通过自然、轻松的聊天，评估用户的心理状态（重点关注：压力水平、PTSD迹象、职业倦怠、家庭关系支持）。
    
    ${memoryContext}

    关键规则：
    1. **绝对不要**使用问卷调查式或生硬的提问。像一个值得信赖的战友或老朋友一样聊天。
    2. 循序渐进。先聊日常，工作强度，再慢慢深入情绪感受。
    3. 表现出高度的同理心。警务人员工作压力大，你要多给予肯定和理解。
    4. 记住用户的回答，并在后续对话中自然引用（长效记忆）。
    5. 你的回复简短有力，不要长篇大论，鼓励用户多说。
    6. 控制对话节奏，不要让用户感到被审问。
  `;

  try {
    // --- GEMINI PROVIDER ---
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
        history: history.filter(h => h.role !== 'system').map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }],
        })),
      });

      const result = await chat.sendMessage({ message: newMessage });
      return result.text || "";
    } 
    
    // --- OPENROUTER PROVIDER ---
    else {
      const messages = [
        { role: 'system', content: systemInstruction },
        ...history.filter(h => h.role !== 'system').map(h => ({
          role: h.role === 'model' ? 'assistant' : 'user', // Map 'model' -> 'assistant'
          content: h.text
        })),
        { role: 'user', content: newMessage }
      ];
      
      return await callOpenRouter(messages, model, apiKey, 0.5);
    }

  } catch (error) {
    console.error("Assessment Chat Error:", error);
    return "系统连接稍微有点不稳定，我们刚才聊到哪了？";
  }
};

/**
 * Generate (or Regenerate) Assessment Report
 */
export const generateAssessmentReport = async (
  history: Message[], 
  config: ApiConfig,
  existingReport: AssessmentData | null = null
): Promise<AssessmentData | null> => {
  const { apiKey, model, provider } = getEffectiveConfig(config);

  const conversationText = history
    .filter(h => h.role !== 'system')
    .map(h => `${h.role === 'user' ? '警员' : '评估助手'}: ${h.text}`)
    .join('\n');

  const updateInstruction = existingReport 
    ? `注意：这是一次更新评估。之前的风险等级为 ${existingReport.riskLevel}。请根据最新的对话内容，判断情况是改善了、恶化了还是保持不变，并更新报告数据。`
    : "";

  const prompt = `
    作为资深警务心理学家，请根据以下对话记录，生成一份专业的《警务人员心理健康评估报告》。
    请严格按照 JSON 格式输出，不要包含 Markdown 格式标记。
    
    ${updateInstruction}

    【对话记录】：
    ${conversationText}
    
    【分析要求】：
    1. 使用专业的临床心理学术语（如：过度警觉、替代性创伤、共情疲劳、情感隔离、防御机制等）。
    2. 结合警务工作特点（轮班制、高风险、应激源）进行具体分析。
    3. 保持客观、中立、建设性的专业口吻。
    
    【JSON 数据结构】：
    {
      "summary": "一段简明扼要的总体评估摘要（150字以内，包含核心心理特征概括）",
      "stressSources": [
        { 
          "category": "来源类别", 
          "description": "具体的压力表现描述", 
          "severity": 1-10的整数 
        }
      ],
      "psychologicalStatus": {
        "emotionalStability": "情绪稳定性评估",
        "burnoutLevel": "职业倦怠程度",
        "socialSupport": "社会支持系统评估"
      },
      "riskLevel": "low" | "medium" | "high",
      "riskAnalysis": "风险等级判定依据",
      "recommendations": [
        { "title": "建议标题", "content": "具体建议内容", "type": "immediate" | "lifestyle" | "professional" }
      ]
    }
  `;

  try {
    let text = "";

    // --- GEMINI PROVIDER ---
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3, 
        }
      });
      text = result.text || "";
    } 
    
    // --- OPENROUTER PROVIDER ---
    else {
      const messages = [
        { role: 'system', content: "You are a psychological assessment system. Output strictly valid JSON." },
        { role: 'user', content: prompt }
      ];
      text = await callOpenRouter(messages, model, apiKey, 0.3, true);
    }

    if (!text) return null;

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText) as AssessmentData;
    
    // Add Timestamp
    parsed.lastUpdated = new Date().toISOString();
    return parsed;

  } catch (error) {
    console.error("Report Generation Error:", error);
    return null;
  }
};

/**
 * Update Report based on Counseling feedback (Memory Update)
 */
export const updateAssessmentReport = async (
  currentReport: AssessmentData,
  recentHistory: Message[],
  config: ApiConfig
): Promise<AssessmentData | null> => {
  const { apiKey, model, provider } = getEffectiveConfig(config);

  const conversationText = recentHistory
    .slice(-10) // Only look at recent context to save tokens/focus on recent changes
    .map(h => `${h.role === 'user' ? '用户' : '疏导助手'}: ${h.text}`)
    .join('\n');

  const prompt = `
    作为心理评估系统的主控中心，你需要根据最新的【疏导对话】来更新已有的【心理评估报告】。
    
    【当前评估报告 (JSON)】:
    ${JSON.stringify(currentReport)}
    
    【最近的疏导对话】:
    ${conversationText}
    
    任务：
    判断用户的心理状态是否发生变化（如：情绪是否平复、是否采纳了建议、是否有新的压力源）。
    请修改 JSON 数据中的 summary, stressSources (severity), psychologicalStatus, riskLevel 等字段以反映最新状态。
    如果变化不大，保留原值。
    
    请严格返回完整的、更新后的 JSON 对象。不要使用 Markdown 标记。
  `;

  try {
    let text = "";

    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2, // Lower temperature for data updates
        }
      });
      text = result.text || "";
    } else {
      const messages = [
        { role: 'system', content: "You are a data updater. Output strictly valid JSON." },
        { role: 'user', content: prompt }
      ];
      text = await callOpenRouter(messages, model, apiKey, 0.2, true);
    }

    if (!text) return null;

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText) as AssessmentData;
    parsed.lastUpdated = new Date().toISOString();
    return parsed;

  } catch (error) {
    console.error("Update Report Error:", error);
    return null;
  }
}

/**
 * Agent 2: Counseling Agent (With Memory Access)
 */
export const sendCounselingMessage = async (
  history: Message[],
  newMessage: string,
  assessmentData: AssessmentData | null,
  uploadedContext: string[],
  agentName: string,
  config: ApiConfig
): Promise<string> => {
  const { apiKey, model, provider } = getEffectiveConfig(config);

  const combinedContext = uploadedContext.join("\n\n---\n\n");
  const reportContext = assessmentData ? JSON.stringify(assessmentData) : "暂无详细报告";

  const systemInstruction = `
    你叫“${agentName}”，是警务系统的资深心理咨询专家。
    你的任务是基于用户的心理评估报告和历史档案，进行个性化的心理疏导和咨询。
    
    【重要：这是你的长期记忆 - 用户的最新心理画像】：
    ${reportContext}
    
    【用户上传的历史档案】：
    ${combinedContext}
    
    指导原则：
    1. **专业且温暖**：你了解警务工作的特殊性（高风险、高负荷、必须时刻保持警惕）。
    2. **解决方案导向**：不仅要倾听，还要提供可执行的减压技巧（如呼吸法、认知重构、睡眠建议）。
    3. **动态跟踪**：如果你感觉到用户的情绪有好转，请给予积极的反馈。
    4. 隐私与信任：强调对话的保密性，建立安全感。
    5. 根据用户的具体困扰，结合CBT（认知行为疗法）或正念技术进行引导。
  `;

  try {
    // --- GEMINI PROVIDER ---
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
        history: history.filter(h => h.role !== 'system').map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }],
        })),
      });

      const result = await chat.sendMessage({ message: newMessage });
      return result.text || "";
    } 
    
    // --- OPENROUTER PROVIDER ---
    else {
      const messages = [
        { role: 'system', content: systemInstruction },
        ...history.filter(h => h.role !== 'system').map(h => ({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.text
        })),
        { role: 'user', content: newMessage }
      ];
      return await callOpenRouter(messages, model, apiKey, 0.6);
    }

  } catch (error) {
    console.error("Counseling Chat Error:", error);
    return `${agentName}正在深入思考，请稍等...`;
  }
};