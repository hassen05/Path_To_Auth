### Project Overview  
"Path to Authenticity" is an AI-powered interactive journal app that guides users through self-discovery using reflective questions, personalized insights, and progress tracking. Built with Expo, it combines secure journaling with GPT-driven growth suggestions.  

### Tech Stack  
- **Framework**: Expo (React Native)  
- **Language**: TypeScript  
- **Navigation**: Expo Router  
- **UI Library**: React Native Paper  
- **Backend/Auth**: Supabase (authentication, storage, real-time features)  
- **Deployment**: Expo Go  

### Expo Setup  
- Initialize Expo project with TypeScript template.  
- Configure Supabase for auth and data storage.  
- Set up Expo Router for file-based navigation.  

### Authentication Flow  
- Email/password or anonymous login via Supabase.  
- Secure session management with encrypted storage.  
- Optional onboarding for personalized features.  

### Core Features  

**1. Random Reflection Questions**  
- Daily/weekly AI-generated questions (GPT API) across growth themes.  
- Swipeable card interface (React Native Paper) for easy navigation.  

**2. Interactive Journal**  
- Clean rich text editor with auto-save functionality and offline support via Supabase.
- Two journaling modes:
  - **Daily Prompt Mode**: AI-generated reflective questions sent via notifications at user-defined times
  - **On-Demand Mode**: User-initiated entries with optional prompts or free writing
- Mood tracking with every entry (slider or emoji selection)
- Custom tagging system (manual or AI-suggested) for categorizing entries
- Voice note option for audio journaling (future enhancement)


**3. Personalized AI Insights**  
- GPT processes journal entries to generate reflections and suggestions.
- Insights provided as "Higher Self" guidance after milestone entries (e.g., every 10th entry).
- Analysis highlights emotional patterns and growth opportunities.
- Displayed in expandable cards with actionable takeaways and affirmations.
- Option to bookmark meaningful insights for future reference.


**4. Progress Tracking**  
- Interactive timeline view of all journal entries with visual mood indicators.
- Advanced filtering options by date range, tags, mood, and entry type.
- Emotional trend charts (using victory-native) visualizing mood patterns over time.
- Statistical summaries of most frequent moods and tags.
- Insights on personal growth trends and emotional stability.


**5. Daily Affirmations & Actions**  
- Push notifications for tailored affirmations.  
- Checklist interface for tracking goal steps.  

**6. Privacy & Security**  
- End-to-end encryption for journal entries.  
- Anonymous mode (Supabase unauthed sessions).  

### Mobile Considerations  
- Haptic feedback on key actions (question submission).  
- Pull-to-refresh for new questions.  
- Optimized for offline journaling with sync on reconnect.  

(Word count: 298)