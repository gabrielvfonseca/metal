# Metal CLI Usage Guide

Metal is an AI-powered context switching tool that helps you manage and resume your development sessions efficiently. This guide explains how to use the Metal CLI to capture, manage, and resume your work context.

## Installation

```bash
# Install Metal globally
npm install -g @metal/cli

# Or using pnpm
pnpm add -g @metal/cli
```

## Basic Commands

### Starting Metal

```bash
metal start
```

Starts the Metal daemon that captures and manages your development context.

### Checking Status

```bash
metal status
```

Shows your current development context, including:

- Git status (branch, modified files, staged changes)
- Tracked files and their last modified times
- Running processes

### Pausing State Capture

```bash
metal pause
```

Temporarily pauses the state capture process. Useful when you want to stop tracking changes for a while.

### Getting Resumption Assistance

```bash
metal resume
```

Provides AI-powered assistance to help you resume your work context, including:

- Summary of your previous work
- Suggested next steps
- Important changes to review

### Viewing History

```bash
metal history
```

Shows your past development sessions. You can limit the number of states shown:

```bash
metal history --limit 10
```

### Configuration Management

```bash
# List all configuration values
metal config --list

# Get a specific configuration value
metal config --get capture.interval

# Set a configuration value
metal config --set capture.interval=30000
```

### Stopping Metal

```bash
metal stop
```

Stops the Metal daemon and cleans up resources.

## Configuration Options

Metal can be configured through the `config` command. Here are the available settings:

### Capture Settings

- `capture.interval`: Time between state captures (in milliseconds)
- `capture.includeGit`: Whether to track Git changes
- `capture.includeFiles`: Whether to track file changes
- `capture.includeProcesses`: Whether to track running processes

### Storage Settings

- `storage.dbPath`: Path to the Metal database

### AI Settings

- `ai.provider`: AI provider to use (e.g., 'openai')
- `ai.model`: AI model to use (e.g., 'gpt-4')
- `ai.apiKey`: API key for the AI provider

## Examples

### Basic Workflow

1. Start Metal when beginning your work:

```bash
metal start
```

2. Check your current context:

```bash
metal status
```

3. When taking a break:

```bash
metal pause
```

4. When returning to work:

```bash
metal resume
```

5. View your work history:

```bash
metal history
```

6. Stop Metal when done:

```bash
metal stop
```

### Configuration Examples

Set capture interval to 30 seconds:

```bash
metal config --set capture.interval=30000
```

Enable Git tracking:

```bash
metal config --set capture.includeGit=true
```

View current capture settings:

```bash
metal config --get capture
```

## Tips

- Use `metal status` regularly to keep track of your current context
- The `metal resume` command is particularly useful after breaks or context switches
- Configure capture intervals based on your work patterns
- Use `metal history` to review your work patterns and progress

## Troubleshooting

If you encounter issues:

1. Check if the daemon is running:

```bash
metal status
```

2. Try restarting the daemon:

```bash
metal stop
metal start
```

3. Check your configuration:

```bash
metal config --list
```

4. If problems persist, try clearing the database and starting fresh:

```bash
rm -rf ./data/metal.db
metal start
```

## Contributing

Metal is an open-source project. Feel free to contribute by:

- Reporting issues
- Suggesting features
- Submitting pull requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.
