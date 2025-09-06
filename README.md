# Sprkclub.fun - Solana Token Launchpad

A professional-grade decentralized token launchpad built on Solana blockchain, featuring advanced bonding curve technology for institutional-grade token launches. Create, launch, and manage your tokens with enterprise-level security and performance.

## 🚀 Features

- **Advanced Bonding Curve Technology**: Powered by Meteora's Dynamic Bonding Curve SDK
- **Solana Wallet Integration**: Seamless integration with Phantom and other Solana wallets
- **Real-time Token Management**: Create and manage token pools with live updates
- **Professional UI/UX**: Modern, responsive design with advanced animations
- **Metadata Management**: Integrated Cloudinary for secure image hosting
- **Database Integration**: MongoDB for persistent data storage
- **Type-safe Development**: Built with TypeScript for enhanced developer experience
- **Performance Optimized**: Next.js 15 with Turbopack for lightning-fast builds

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Canvas Confetti** - Celebration animations

### Blockchain
- **Solana Web3.js** - Solana blockchain interaction
- **Meteora Dynamic Bonding Curve SDK** - Advanced bonding curve implementation
- **Solana Wallet Adapter** - Multi-wallet support

### Backend & Storage
- **MongoDB** - Document database for metadata storage
- **Cloudinary** - Image and media management
- **Next.js API Routes** - Serverless API endpoints

### Development Tools
- **ESLint** - Code linting and formatting
- **Turbopack** - Ultra-fast bundler
- **PostCSS** - CSS processing

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Solana Wallet** (Phantom recommended)
- **MongoDB** instance (local or Atlas)
- **Cloudinary** account for image hosting

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/SprkClub/UI.git
cd UI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=launchpad

# Optional: Solana Network Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet  # or mainnet-beta
```

### 4. Setup External Services

#### MongoDB Setup
1. Create a MongoDB Atlas account or set up local MongoDB
2. Create a database named `launchpad`
3. Update the `MONGODB_URI` in your `.env.local`

#### Cloudinary Setup
1. Create a Cloudinary account
2. Get your cloud name, API key, and API secret
3. Create an upload preset for image uploads
4. Update the Cloudinary variables in your `.env.local`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗 Project Structure

```
src/
├── app/
│   ├── components/          # Reusable React components
│   │   ├── PoolCreator.tsx  # Main pool creation component
│   │   └── WalletProvider.tsx # Wallet connection provider
│   ├── create/              # Pool creation page
│   │   └── page.tsx
│   ├── api/                 # API routes
│   │   ├── tokens/          # Token management endpoints
│   │   └── metadata/        # Metadata handling endpoints
│   ├── utils/               # Utility functions
│   │   └── poolUtils.ts     # Pool-related helper functions
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Home page
public/                      # Static assets
├── 1.png, 2.png, 3.png, 4.png # Background shape images
└── *.svg                    # Icon assets
```

## 🔧 Configuration

### Solana Network Configuration

The application supports multiple Solana networks:

- **Devnet** (default): For development and testing
- **Mainnet Beta**: For production deployment

Configure the network in your environment variables or component settings.

### Wallet Configuration

Supported wallets:
- Phantom Wallet (primary)
- Solflare
- Other Solana-compatible wallets

## 📝 API Endpoints

### Token Management
- `GET /api/tokens` - Retrieve token listings
- `POST /api/tokens` - Create new token entry

### Metadata Management  
- `GET /api/metadata` - Fetch token metadata
- `POST /api/metadata` - Upload token metadata

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment:

- Cloudinary credentials
- MongoDB connection string
- Solana network configuration

## 🔒 Security Considerations

- **Private Keys**: Never expose private keys in client-side code
- **Environment Variables**: Keep sensitive data in server-side environment variables
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints include rate limiting for protection

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [sprkclub.fun](https://sprkclub.fun)
- **Documentation**: [GitHub Wiki](https://github.com/SprkClub/UI/wiki)
- **Support**: [GitHub Issues](https://github.com/SprkClub/UI/issues)

## 🆘 Support

For support and questions:

1. Check the [GitHub Issues](https://github.com/SprkClub/UI/issues)
2. Join our community discussions
3. Contact the development team

---

**Built with ❤️ for the Solana ecosystem**
