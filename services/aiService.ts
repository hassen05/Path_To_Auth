import Constants from 'expo-constants';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }[];
}

interface ChatResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
}

export class AIService {
  private static readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private static readonly MODEL = 'meta-llama/llama-4-maverick:free';

  private static async makeRequest(messages: Message[]): Promise<ChatResponse> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.openrouterApiKey}`,
          'HTTP-Referer': Constants.expoConfig?.extra?.appUrl,
          'X-Title': 'Path to Authenticity',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI Service error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  static async chatWithJournal(entry: string, userMessage: string): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are an empathetic and insightful AI companion helping users reflect on their journal entries. Your goal is to facilitate meaningful self-discovery through thoughtful conversation.

Your approach should be:
- Personalized: Reference specific details from their journal entry
- Thought-provoking: Ask questions that encourage deeper reflection
- Supportive: Validate emotions without judgment
- Interactive: Respond directly to their questions and invite further exploration
- Growth-oriented: Gently suggest patterns or alternative perspectives when helpful

Avoid generic platitudes, overly formal language, or trying to solve their problems. Instead, be a thoughtful conversation partner who helps them explore their own thoughts and feelings more deeply.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Here's my journal entry: "${entry}"

My question/comment: ${userMessage}`,
          },
        ],
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Failed to chat with journal:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
    }
  }

  static async chatWithAllJournals(entriesSummary: string, userMessage: string): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are an empathetic and insightful AI companion helping users reflect on their journal entries over time. Your goal is to identify patterns, growth, and provide meaningful insights based on their journaling history.

Your approach should be:
- Holistic: Consider the entire journaling history to identify trends and patterns
- Personalized: Reference specific details from their journal entries
- Thought-provoking: Ask questions that encourage deeper reflection
- Supportive: Validate emotions without judgment
- Growth-oriented: Highlight progress and positive changes when evident

You're using the llama model to provide thoughtful, personalized responses. Be conversational and warm, while offering genuine insights based on the journal data.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Here is a summary of my recent journal entries:

${entriesSummary}

My question/comment: ${userMessage}`,
          },
        ],
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Failed to chat with all journals:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
    }
  }

  static async generateInsight(entries: string[]): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an insightful AI that analyzes journal entries to provide meaningful patterns, observations, and gentle suggestions for personal growth.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Here are my recent journal entries:\n\n${entries.join('\n\n')}\n\nWhat insights can you share about patterns, themes, or areas for reflection in these entries?`,
          },
        ],
      },
    ];

    try {
      const response = await this.makeRequest(messages);
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Failed to generate insight:', error);
      return 'I apologize, but I\'m having trouble analyzing your entries right now. Please try again later.';
    }
  }

  // For demo purposes only - replace with real OCR service in production
  static async recognizeTextFromImage(base64Image: string): Promise<string> {
    console.log("Processing image for text recognition...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, analyze the base64 image data length to create 
    // a deterministic but seemingly random response based on the actual image
    const imageHash = base64Image.length % 1000;
    
    // Collection of realistic journal entries of different styles and moods
    const journalTexts = [
      "Today was challenging but rewarding. I managed to complete the presentation I've been working on, and despite my nerves, the feedback was positive. Need to remember that my anxiety often lies to me about my capabilities.",
      
      "Feeling tired but content. Spent the afternoon in the park reading, watching the leaves change colors. These quiet moments help me recharge in ways that social events rarely do.",
      
      "Frustrated with my progress on the project. Keep hitting roadblocks and feeling stuck. Tomorrow I'll try breaking it down into smaller pieces and just focus on one step at a time.",
      
      "Had a great conversation with Mom today. We talked about her childhood and stories I'd never heard before. I should call more often - these connections matter more than I sometimes remember.",
      
      "Can't sleep again. Mind racing with all the tasks for tomorrow. Writing them down now to get them out of my head: 1) Email client 2) Finish report 3) Schedule doctor appointment 4) Buy groceries",
      
      "Proud of myself for standing up in the meeting when I usually stay quiet. My idea wasn't perfect, but speaking up felt like a small victory. Building confidence requires practice.",
      
      "Today I practiced mindfulness while walking to work. Noticed the smell of rain, the sound of birds, the feeling of the cool air. These small moments of presence make a difference.",
      
      "My anxiety was really bad today. Breathing exercises helped somewhat, but it was still hard to focus. Need to be gentler with myself on days like this.",
      
      "Started reading that book I've been putting off. Already can't put it down! It's a reminder that I need to make more time for things that bring me joy rather than just productivity.",
      
      "Had an argument with Alex. We're both stressed, but that's no excuse. Going to apologize and try to be more patient. Our relationship deserves better communication."
    ];
    
    // Use the image hash to select a journal entry
    const selectedText = journalTexts[imageHash % journalTexts.length];
    
    return selectedText;
  }
}
