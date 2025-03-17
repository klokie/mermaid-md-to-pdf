# Mermaid-MD-to-PDF

A command-line tool to convert Markdown files containing Mermaid diagrams to PDF documents.

## Features

- Converts Markdown files to PDF
- Renders Mermaid diagrams as SVG images in the PDF
- Preserves all standard Markdown formatting
- Simple command-line interface

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm

### Install from source

1. Clone the repository:

```bash
git clone https://github.com/klokie/mermaid-md-to-pdf.git
cd mermaid-md-to-pdf
```

2. Install dependencies:

```bash
npm install
```

3. Make the CLI available globally

```bash
npm link
```

## Usage

```bash
mermaid-md-to-pdf <input-file> [options]
```

### Options

- `-o, --output <output-file>`: Output PDF file name (default: `input-file.pdf`)
- `-h, --help`: Show help

```markdown
# Document with Mermaid Diagram

This is a sample document with a Mermaid diagram.

```mermaid
graph TD
A[Start] --> B{Is it working?}
B -->|Yes| C[Great!]
B -->|No| D[Debug]
D --> B
```

The diagram above shows a simple flowchart.

Running `mermaid-md-to-pdf README.md` will create `README.pdf` with the rendered Mermaid diagram.

## How It Works

1. Parses the Markdown file to find Mermaid diagram code blocks
2. Renders each Mermaid diagram to SVG using @mermaid-js/mermaid-cli
3. Processes the Markdown content and embeds the SVG diagrams
4. Converts the processed content to PDF using Puppeteer

## Customization

You can customize the PDF styling by modifying the `pdf-style.css` file.

## License

MIT
