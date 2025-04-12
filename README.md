# Path to Authenticity

![Path to Authenticity](./logo.png)

A personal journaling and self-reflection mobile application that helps users track their emotional state, create journal entries, and receive AI-generated insights about their emotional patterns and well-being.

## 🌟 Features

- **Digital Journaling**: Create, edit, and manage journal entries with an intuitive interface
- **Mood Tracking**: Record and visualize your emotional states over time
- **AI-Powered Insights**: Receive personalized insights and patterns based on your journal entries
- **Progress Monitoring**: Track your emotional well-being journey
- **Physical Journal Integration**: Capture and digitize handwritten journal pages
- **Daily Reflection Prompts**: Get inspired with thoughtful prompts for reflection
- **Bookmarking**: Save favorite insights for future reference

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device for testing

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/username/path-to-authenticity.git
   cd path-to-authenticity
   ```

2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Copy the `.env.example` file to `.env` and fill in the required values:
   ```sh
   cp .env.example .env
   ```

4. Start the development server:
   ```sh
   npx expo start
   ```

5. Scan the QR code with the Expo Go app (Android) or the Camera app (iOS) to open the app on your mobile device.

## 📱 Usage

- **Authentication**: Sign up or log in to access your personal journal
- **Journal**: Create new entries, select your mood, and add tags
- **Insights**: Generate AI insights based on your journal entries
- **Progress**: View your emotional journey and growth over time
- **Settings**: Customize your experience and manage your account

## 💻 Tech Stack

- **Frontend**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **UI Components**: [React Native Paper](https://reactnativepaper.com/)
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **AI Integration**: OpenRouter API
- **Data Visualization**: [Victory Native](https://formidable.com/open-source/victory/docs/native/)

## 📁 Project Structure

- `/app`: Expo Router application code and screens
- `/components`: Reusable React components
- `/contexts`: React context providers
- `/hooks`: Custom React hooks
- `/lib`: Utilities and libraries
- `/services`: API services
- `/types`: TypeScript type definitions
- `/utils`: Helper functions

## 🛠️ Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Expo Team](https://expo.dev/) for the amazing development platform
- [Supabase](https://supabase.com/) for backend and authentication services
- All contributors and supporters of this project

---

Built with ❤️ for personal growth and emotional well-being.
