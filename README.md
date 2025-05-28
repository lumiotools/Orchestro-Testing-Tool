# LLM Accuracy Dashboard

A modern Next.js dashboard for monitoring and managing LLM accuracy metrics, built with React 19, TypeScript, and Tailwind CSS.

## Features

- 📊 **Dashboard**: Comprehensive analytics and metrics visualization
- 📝 **Prompt Manager**: Create and manage prompts for LLM testing
- 📋 **Contracts**: Manage testing contracts and agreements
- 🎯 **Accuracy Tracking**: Monitor and analyze LLM performance metrics
- 🎨 **Modern UI**: Built with Radix UI components and Tailwind CSS
- 🌙 **Dark Mode**: Theme switching support with next-themes
- 📱 **Responsive**: Mobile-first responsive design

## Tech Stack

- **Framework**: Next.js 15.2.4
- **Runtime**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **pnpm** (recommended package manager)

### Installing pnpm

If you don't have pnpm installed, you can install it globally:

```bash
npm install -g pnpm
```

Or using other methods:
```bash
# Using npm
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm

# Using winget (Windows)
winget install pnpm

# Using Chocolatey (Windows)
choco install pnpm
```

## Getting Started

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd llm-accuracy-dashboard
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint to check for code issues

## Project Structure

```
llm-accuracy-dashboard/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard pages
│   ├── prompts/           # Prompt management pages
│   ├── prompt-manager/    # Advanced prompt management
│   ├── contracts/         # Contract management pages
│   ├── accuracy/          # Accuracy tracking pages
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── hooks/                 # Custom React hooks
├── styles/                # Additional styling files
├── public/                # Static assets
└── ...config files
```

## Development

### Code Style

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Tailwind CSS** for styling
- **Prettier** (recommended for code formatting)

### Building for Production

1. **Build the application**:
   ```bash
   pnpm build
   ```

2. **Start the production server**:
   ```bash
   pnpm start
   ```

## Configuration

The project includes several configuration files:

- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - UI components configuration

## Troubleshooting

### Common Issues

1. **Port already in use**: If port 3000 is busy, Next.js will automatically use the next available port.

2. **Dependencies issues**: Try clearing the node_modules and reinstalling:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **Build errors**: The project is configured to ignore TypeScript and ESLint errors during builds, but you may want to fix them for better code quality.

### Getting Help

If you encounter any issues:

1. Check the [Next.js documentation](https://nextjs.org/docs)
2. Review the [pnpm documentation](https://pnpm.io/motivation)
3. Check the project's issue tracker (if available)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting: `pnpm lint`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is private and proprietary.

---

**Happy coding! 🚀** 