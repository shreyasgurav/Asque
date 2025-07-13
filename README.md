# AsQue - AI Chatbot Platform

AsQue is a modern AI chatbot platform that allows users to create, train, and deploy intelligent chatbots with ease. Built with Next.js, TypeScript, and powered by OpenAI.

## 🚀 Features

- **Easy Bot Creation**: Create chatbots with custom names, descriptions, profile pictures, and welcome messages
- **Interactive Training**: Train your bots through natural conversation
- **Smart Deployment**: Deploy trained bots for public access
- **Real-time Chat**: Engage with deployed bots through a beautiful chat interface
- **Memory Bank**: View and manage your bot's training data
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Firebase Firestore (with mock database fallback)
- **AI**: OpenAI GPT-3.5 Turbo
- **Authentication**: Firebase Auth
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ and npm
- OpenAI API key (required)
- Firebase project (optional - mock database available)

## 🔧 Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AsQue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   **Required**: Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔑 Environment Variables

### Required
- `OPENAI_API_KEY`: Your OpenAI API key (get from https://platform.openai.com/api-keys)

### Optional (Firebase)
If not provided, the app will use a mock database for development:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 🎯 How to Use

1. **Create Your First Bot**
   - Click "Create New Bot" or visit `/create`
   - Add a name, description, and optional profile picture
   - Set a custom welcome message

2. **Train Your Bot**
   - After creation, you'll be redirected to the training page
   - Chat with your bot and teach it information
   - Use the Memory Bank to view and manage training data

3. **Deploy Your Bot**
   - Once trained, click "Deploy Bot"
   - Your bot will be available at `/bot/[botId]`
   - Share the public URL with others

4. **Manage Your Bots**
   - Visit `/my-bots` to see all your created bots
   - Continue training or chat with deployed bots

## 🛠️ Development Features

- **Mock Database**: Works without Firebase for local development
- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety
- **Error Handling**: Comprehensive error handling and logging
- **Responsive UI**: Mobile-first design

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Errors**
   - The app automatically falls back to mock database
   - Check your Firebase credentials in `.env.local`
   - Ensure private key format is correct

2. **OpenAI API Errors**
   - Verify your API key is valid
   - Check your OpenAI account has sufficient credits
   - Ensure API key has proper permissions

3. **Bot Not Visible**
   - Bots are stored in mock database during development
   - Check browser console for errors
   - Refresh the page or restart the dev server

### Debug Mode

Enable detailed logging by checking the browser console and terminal output. The app provides comprehensive logging for all operations.

## 📦 Project Structure

```
AsQue/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── ui/             # UI components
├── lib/                # Utility libraries
│   ├── ai/             # OpenAI integration
│   ├── auth/           # Authentication logic
│   └── database/       # Database operations
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   ├── bot/            # Bot-related pages
│   └── ...             # Other pages
├── styles/             # CSS styles
└── types.ts            # TypeScript types
```

## 🚀 Deployment

The app is ready for deployment on Vercel:

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please check the troubleshooting section above or create an issue in the repository. 