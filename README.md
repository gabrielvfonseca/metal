# Metal: AI-Powered Context Switching CLI Tool

Metal is a background CLI tool designed to eliminate the productivity loss caused by context switching. It uses AI to bridge the gap between interruption and resumption by capturing work state, understanding context, and providing intelligent resumption assistance.

## Features

- **Automatic State Capture**: Tracks file changes, git state, terminal history, and more
- **Intelligent Context Analysis**: Uses AI to understand your work context
- **Smart Resumption Assistance**: Provides intelligent prompts to help you get back to work
- **Interruption Management**: Detects and manages interruptions gracefully

## Prerequisites

- Node.js 18 or higher
- pnpm 8.15.4 or higher
- Git

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/gabrielvfonseca/metal.git
   cd metal
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:

   ```bash
   pnpm build
   ```

4. Start development:
   ```bash
   pnpm dev
   ```

## Project Structure

```
metal/
├── apps/
│   ├── cli/                 # Main CLI application
│   ├── daemon/              # Background service
│   └── dashboard/           # Optional web interface
├── packages/
│   ├── core/               # Shared business logic
│   ├── ai/                 # AI integration layer
│   ├── capture/            # State capture utilities
│   ├── config/             # Configuration management
│   └── types/              # Shared TypeScript types
└── tools/
    ├── eslint-config/
    └── tsconfig/
```

## Development

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages and applications
- `pnpm test` - Run all tests
- `pnpm lint` - Run linting
- `pnpm type-check` - Run type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Acknowledgments

- OpenAI and Anthropic for AI capabilities
- The Node.js community for excellent tooling
- All contributors who help make Metal better
