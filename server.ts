import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: '25mb' }));

// Server-side GoogleGenAI initialization with required telemetry user-agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Role system instructions for Gemini multi-turn chatbot
const ROLE_INSTRUCTIONS: Record<string, { model: string; systemInstruction: string }> = {
  botanist: {
    model: 'gemini-3.8-flash',
    systemInstruction:
      'You are Dr. Flora, a world-class Master Botanist, Plant Pathologist, and Soil Biochemist. ' +
      'You specialize in deep diagnostic analysis, cellular botany, deficiency symptoms, fungal and bacterial diseases, ' +
      'soil pH and cation exchange, and tailored plant revival regimens. ' +
      'Provide rigorous, scientifically accurate, yet clear and actionable guidance. ' +
      'Format your responses with clear markdown headers, bullet points, and distinct step-by-step recovery plans when diagnosing problems.',
  },
  care_guide: {
    model: 'gemini-3.8-flash',
    systemInstruction:
      'You are Willow, an encouraging and experienced Everyday Garden Care Companion. ' +
      'You help plant parents and home gardeners with practical watering routines, light placement, repotting, ' +
      'pruning techniques, seasonal planting schedules, companion planting, and general garden wellness. ' +
      'Keep your tone warm, accessible, friendly, and structured with bullet points and practical tips.',
  },
  quick_tips: {
    model: 'gemini-3.1-flash-lite',
    systemInstruction:
      'You are Sprout, a lightning-fast Botanical Quick-Fact and Safety Assistant. ' +
      'Your job is to provide direct, rapid, bulleted facts, instant pet toxicity checks, sunlight requirements, ' +
      'watering intervals, and immediate gardening answers in 2 to 3 concise sentences. No fluff, just accurate facts.',
  },
};

// Response schema for structured plant identification and care instructions
const plantAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING, description: 'Common popular name of the plant' },
    scientificName: { type: Type.STRING, description: 'Botanical binomial name' },
    family: { type: Type.STRING, description: 'Botanical plant family, e.g. Araceae' },
    confidence: { type: Type.NUMBER, description: 'Confidence score from 0 to 100' },
    healthStatus: {
      type: Type.STRING,
      description: 'One of: healthy, stressed, diseased, pest_infested',
    },
    healthSummary: { type: Type.STRING, description: 'Summary evaluation of the plant health and condition' },
    characteristics: { type: Type.STRING, description: 'Key visual and growth traits of the plant' },
    nativeRegion: { type: Type.STRING, description: 'Geographical origin and native habitat' },
    careInstructions: {
      type: Type.OBJECT,
      properties: {
        light: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            hours: { type: Type.STRING },
            direct: { type: Type.BOOLEAN },
            level: { type: Type.STRING, description: 'low, medium, bright_indirect, or direct_sun' },
          },
          required: ['summary', 'hours', 'direct', 'level'],
        },
        watering: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            frequencyDays: { type: Type.INTEGER },
            dryThreshold: { type: Type.STRING },
            seasonalTips: { type: Type.STRING },
          },
          required: ['summary', 'frequencyDays', 'dryThreshold', 'seasonalTips'],
        },
        soil: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            phRange: { type: Type.STRING },
            drainage: { type: Type.STRING },
            repottingCadenceMonths: { type: Type.INTEGER },
          },
          required: ['type', 'phRange', 'drainage', 'repottingCadenceMonths'],
        },
        temperature: {
          type: Type.OBJECT,
          properties: {
            idealMinC: { type: Type.INTEGER },
            idealMaxC: { type: Type.INTEGER },
            minToleranceC: { type: Type.INTEGER },
            humidityLevel: { type: Type.STRING },
          },
          required: ['idealMinC', 'idealMaxC', 'minToleranceC', 'humidityLevel'],
        },
        fertilizer: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            schedule: { type: Type.STRING },
            activeSeasonOnly: { type: Type.BOOLEAN },
          },
          required: ['type', 'schedule', 'activeSeasonOnly'],
        },
        toxicity: {
          type: Type.OBJECT,
          properties: {
            toxicToDogs: { type: Type.BOOLEAN },
            toxicToCats: { type: Type.BOOLEAN },
            toxicToHumans: { type: Type.BOOLEAN },
            details: { type: Type.STRING },
          },
          required: ['toxicToDogs', 'toxicToCats', 'toxicToHumans', 'details'],
        },
        propagation: {
          type: Type.OBJECT,
          properties: {
            methods: { type: Type.ARRAY, items: { type: Type.STRING } },
            bestSeason: { type: Type.STRING },
            difficulty: { type: Type.STRING, description: 'easy, moderate, or difficult' },
          },
          required: ['methods', 'bestSeason', 'difficulty'],
        },
      },
      required: ['light', 'watering', 'soil', 'temperature', 'fertilizer', 'toxicity', 'propagation'],
    },
    detectedIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING },
          severity: { type: Type.STRING, description: 'low, moderate, or high' },
          cause: { type: Type.STRING },
          actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['issue', 'severity', 'cause', 'actionPlan'],
      },
    },
    quickTips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'commonName',
    'scientificName',
    'family',
    'confidence',
    'healthStatus',
    'healthSummary',
    'characteristics',
    'nativeRegion',
    'careInstructions',
    'detectedIssues',
    'quickTips',
  ],
};

/**
 * Endpoint 1: Identify Plant from Image & Generate Care Instructions
 */
app.post('/api/identify-plant', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', notes } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const promptText = `
You are an expert botanical identification and plant care AI system.
Carefully examine this photo of the plant, including leaves, stems, venation, color patterns, nodes, and any visible potting or soil conditions.
${notes ? `User observations/notes: "${notes}"` : ''}

Tasks:
1. Identify the exact common name and scientific botanical binomial name.
2. Determine botanical family and native habitat region.
3. Diagnose its current health status (healthy, stressed, diseased, or pest_infested) and describe visible symptoms or overall vigor.
4. Provide a comprehensive, detailed care matrix (Light, Watering frequency in days, Soil & pH, Temperature in Celsius & humidity, Fertilizer regimen, Pet and child toxicity, and Propagation methods).
5. Highlight any detected issues with practical remedies and action steps.
6. Provide 3-4 golden grower tips for thriving growth.

Return strictly valid JSON adhering to the specified response schema.
`;

    // Attempt identification using gemini-3.8-flash for fast and accurate multimodal reasoning
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: plantAnalysisSchema,
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    const parsedData = JSON.parse(text);

    // Attach unique ID and timestamp
    const result = {
      ...parsedData,
      id: `plant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error identifying plant:', error);
    res.status(500).json({
      error: error.message || 'Failed to identify plant. Please try again with a clearer photo.',
    });
  }
});

/**
 * Endpoint 2: Multi-Turn Gardening Chatbot
 */
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, roleId = 'care_guide', plantContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const selectedRole = ROLE_INSTRUCTIONS[roleId] || ROLE_INSTRUCTIONS.care_guide;

    // Ground with plant context if user asked about a specific plant
    let contextualSystemInstruction = selectedRole.systemInstruction;
    if (plantContext) {
      contextualSystemInstruction += `\n\nCurrent Plant Context: The user is discussing "${plantContext.commonName}" (${plantContext.scientificName}), Family: ${plantContext.family || 'Unknown'}, Health: ${plantContext.healthStatus || 'unknown'}. Reference this specific plant where relevant to answer their questions accurately.`;
    }

    // Format messages for @google/genai SDK
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: selectedRole.model,
      contents: formattedContents,
      config: {
        systemInstruction: contextualSystemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm sorry, I couldn't formulate a response. Could you please rephrase?";

    res.json({
      reply,
      roleId,
      modelUsed: selectedRole.model,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in gardening chat:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate response. Please try again.',
    });
  }
});

/**
 * Endpoint 3: Botanical Symptom Doctor / Multimodal Diagnostic helper
 */
app.post('/api/diagnose-symptoms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { plantName, symptoms, environment, imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!symptoms && !imageBase64) {
      res.status(400).json({ error: 'Symptoms description or plant photo is required' });
      return;
    }

    const prompt = `
Plant Specimen: ${plantName || 'Indoor / Outdoor Garden Plant'}
Observed Symptoms: ${symptoms || 'Visual inspection requested from attached photo'}
Environment Details: ${environment || 'Standard household indoor / balcony'}

Tasks:
1. Conduct an in-depth clinical botanical pathology evaluation.
${imageBase64 ? '2. Closely examine the provided photo for leaf chlorosis, fungal lesions, necrosis, pest residue, webbing, or soil compaction.' : ''}
3. Diagnose the primary and secondary causes (e.g. root rot, spider mites, nitrogen deficiency, powdery mildew, guttation, thermal shock).
4. Provide a structured, clinical rescue protocol formatted in clear markdown:
- **Primary Clinical Diagnosis**
- **Underlying Etiology & Causes**
- **Immediate Rescue Actions (Next 24-48 Hours)**
- **14-Day Recovery & Rehabilitation Protocol**
- **Preventive Maintenance Guidelines**
`;

    let contentsPayload: any = prompt;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        systemInstruction:
          'You are Dr. Flora, Chief of Clinical Botanical Pathology. Deliver actionable, scientifically grounded emergency triage.',
        temperature: 0.3,
      },
    });

    res.json({
      diagnosis: response.text,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error diagnosing symptoms:', error);
    res.status(500).json({ error: error.message || 'Diagnostic failed.' });
  }
});

// Response schema for AI Garden Sweep
const gardenSweepSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: 'Executive summary of garden status' },
    urgentCount: { type: Type.INTEGER, description: 'Number of plants requiring immediate action today' },
    recommendedActions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          plantId: { type: Type.STRING },
          plantName: { type: Type.STRING },
          action: { type: Type.STRING, description: 'water, fertilize, inspect, quarantine, relocate, or mist' },
          reason: { type: Type.STRING, description: 'Botanical justification' },
          priority: { type: Type.STRING, description: 'urgent, today, or upcoming' },
        },
        required: ['plantId', 'plantName', 'action', 'reason', 'priority'],
      },
    },
    weatherImpactAdvice: { type: Type.STRING, description: 'Weather and microclimate recommendations' },
    overallVitalityQuote: { type: Type.STRING, description: 'Inspiring or practical botanical insight' },
  },
  required: ['summary', 'urgentCount', 'recommendedActions', 'weatherImpactAdvice', 'overallVitalityQuote'],
};

/**
 * Endpoint 4: AI Automated Garden Sweep & Daily Routine Planner
 */
app.post('/api/automated-garden-sweep', async (req: Request, res: Response): Promise<void> => {
  try {
    const { plants, weather } = req.body;

    if (!plants || !Array.isArray(plants) || plants.length === 0) {
      res.status(400).json({ error: 'At least one garden plant is required to run a sweep.' });
      return;
    }

    const plantSummaries = plants.map((p: any) => {
      const msSinceWatered = Date.now() - (p.lastWateredAt || Date.now());
      const daysSinceWatered = Math.round(msSinceWatered / (24 * 60 * 60 * 1000));
      return {
        id: p.id,
        name: p.nickname || p.commonName,
        scientificName: p.scientificName,
        location: p.location,
        healthStatus: p.healthStatus,
        frequencyDays: p.careInstructions?.watering?.frequencyDays || 7,
        daysSinceWatered,
        isOverdue: daysSinceWatered >= (p.careInstructions?.watering?.frequencyDays || 7),
        lastFertilizedAt: p.lastFertilizedAt ? new Date(p.lastFertilizedAt).toLocaleDateString() : 'Never',
      };
    });

    const prompt = `
You are FloraCare AI's Automated Garden Orchestration Engine.
Conduct an automated diagnostic sweep of the user's garden collection under current microclimate conditions.

Current Microclimate / Weather:
- Condition: ${weather?.label || 'Moderate spring day'} (${weather?.weatherCondition || 'moderate'})
- Temperature: ${weather?.tempC || 21}°C
- Ambient Humidity: ${weather?.humidityPercent || 50}%
- Season: ${weather?.season || 'spring'}
- Context: ${weather?.description || 'Standard growing conditions'}

Registered Garden Specimens:
${JSON.stringify(plantSummaries, null, 2)}

Instructions:
1. Analyze each specimen's moisture deficit, health status, and sensitivity to the current microclimate (e.g. high heat vs cool dormancy).
2. Generate prioritized actions (urgent, today, or upcoming) for each specimen that needs water, misting, feeding, quarantine, or repositioning.
3. Formulate clear advice on how today's weather impacts their routine.
4. Output strictly valid JSON conforming to the schema.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: gardenSweepSchema,
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      ...parsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error running automated garden sweep:', error);
    res.status(500).json({ error: error.message || 'Garden sweep failed.' });
  }
});

/**
 * Endpoint 5: AI Custom Microclimate Care Calibration
 */
app.post('/api/generate-custom-care', async (req: Request, res: Response): Promise<void> => {
  try {
    const { plant, conditions } = req.body;

    if (!plant) {
      res.status(400).json({ error: 'Plant data is required.' });
      return;
    }

    const prompt = `
Plant: ${plant.commonName} (${plant.scientificName}), Family: ${plant.family || 'Unknown'}
Baseline Watering Cadence: Every ${plant.careInstructions?.watering?.frequencyDays || 7} days
Baseline Light: ${plant.careInstructions?.light?.summary || 'Bright indirect'}
Baseline Temperature: ${plant.careInstructions?.temperature?.idealMinC || 18}°C to ${plant.careInstructions?.temperature?.idealMaxC || 26}°C

User's Specific Microclimate Conditions:
- Room Temperature: ${conditions?.tempC ? `${conditions.tempC}°C` : 'Standard room'}
- Air Humidity: ${conditions?.humidityLevel || 'moderate'}
- Indoor Environment: ${conditions?.indoorEnvironment || 'standard household'}
- Specific Notes: ${conditions?.notes || 'None'}

Provide calibrated botanical guidance:
1. Recommended adjusted watering interval in days.
2. Specific adjustments needed for light and humidity.
3. Potential stress risks in this specific environment.
Format with clean bullet points and actionable advice.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an environmental plant physiology specialist.',
        temperature: 0.3,
      },
    });

    res.json({
      calibratedAdvice: response.text,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error generating custom care:', error);
    res.status(500).json({ error: error.message || 'Calibration failed.' });
  }
});

/**
 * Endpoint 6: AI Voice Briefing (Text-to-Speech via gemini-3.8-flash-lite-tts)
 */
app.post('/api/generate-audio', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voiceName = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text prompt is required for audio generation.' });
      return;
    }

    // Limit text to ~500 chars for snappy audio response
    const trimmedText = text.slice(0, 600);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: 'Clear, encouraging, warm botanical expert',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('No audio returned from Gemini TTS model.');
    }

    // Unary generateContent returns a complete WAV file (audio/wav, RIFF header, 24kHz mono 16-bit)
    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error generating audio briefing:', error);
    res.status(500).json({ error: error.message || 'TTS audio generation failed.' });
  }
});

async function startServer() {
  if (!isProduction) {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static build in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`FloraCare AI server running on port ${PORT} (dev mode: ${!isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
