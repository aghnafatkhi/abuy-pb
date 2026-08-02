import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MEME_DESCRIPTIONS: { [key: string]: { name: string; pose: string } } = {
  pikachu: {
    name: "Surprised Pikachu",
    pose: "Mouth wide open in a perfect 'O' shape, eyes wide and rounded with disbelief, looking slightly to the camera in absolute mock shock and astonishment."
  },
  drake: {
    name: "Drake Hotline Bling (Disapprove/No)",
    pose: "Hand flat up next to the face, palm facing outward as if pushing something away, head turned far to the opposite side with a disgusted, disapproving, or rejecting squint."
  },
  'success-kid': {
    name: "Success Kid",
    pose: "Determined, triumphant facial expression, squinted eyes, holding a tightly clenched fist up close to the chest, showing smug victory."
  },
  'distracted-bf': {
    name: "Stunned/Jaw-Dropped",
    pose: "Extremely exaggerated shocked look, eyes bulging, mouth open, looking backwards or sideways in pure awe and distraction."
  },
  chloe: {
    name: "Side-Eye Chloe",
    pose: "Extreme squinty side-eye looking horizontally out of the corner of the eyes with an unimpressed, suspicious, and highly judgmental mouth expression."
  }
};

export async function POST(req: NextRequest) {
  try {
    const { userImage, memeId } = await req.json();

    if (!userImage) {
      return NextResponse.json({ error: 'User image is required' }, { status: 400 });
    }

    const memeInfo = MEME_DESCRIPTIONS[memeId] || {
      name: "Free style / Custom Pose",
      pose: "A fun, energetic, or hilarious facial expression and pose."
    };

    // Remove metadata prefix (e.g., data:image/png;base64,) if present
    const base64Data = userImage.replace(/^data:image\/\w+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    };

    const textPart = {
      text: `Analyze this user's captured selfie photograph. They are trying to replicate the classic internet meme: "${memeInfo.name}".
The goal is to match this pose/expression: "${memeInfo.pose}".

Evaluate how well they succeeded. Be hilarious, lighthearted, and highly sarcastic or roasted.
Rate their similarity score out of 100 based on their facial features, posture, mouth shape, and overall vibe.
Give a funny roast or enthusiastic compliment (keep it light and humorous).
Provide a brief 1-sentence breakdown of what they nailed and what they need to work on.

Respond with valid JSON according to the schema.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.INTEGER,
              description: "The similarity score from 0 to 100."
            },
            roast: {
              type: Type.STRING,
              description: "A funny, sarcastic roast or hilarious comparison."
            },
            analysis: {
              type: Type.STRING,
              description: "A 1-sentence analytical breakdown of the pose compared to the meme."
            }
          },
          required: ["score", "roast", "analysis"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(resultText.trim());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Gemini error:', error);
    return NextResponse.json({ 
      score: Math.floor(Math.random() * 30) + 60, // Fallback score
      roast: "Our AI is currently stunned by your beauty (or overwhelmed by traffic) and couldn't process this. But you look like a 10/10 meme anyway!",
      analysis: "Unable to contact the AI judge. Let's assume you absolutely crushed it!"
    });
  }
}
