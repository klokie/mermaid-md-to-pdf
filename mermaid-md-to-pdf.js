#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const markdownpdf = require('markdown-pdf');
const mermaid = require('@mermaid-js/mermaid-cli');
const tmp = require('tmp');
const cheerio = require('cheerio');

program
  .name('mermaid-md-to-pdf')
  .description('Convert markdown files with mermaid diagrams to PDF')
  .version('1.0.0')
  .argument('<input>', 'Input markdown file')
  .option('-o, --output <output>', 'Output PDF file')
  .action(async (input, options) => {
    try {
      const inputPath = path.resolve(input);
      const outputPath = options.output
        ? path.resolve(options.output)
        : inputPath.replace(/\.md$/, '.pdf');

      console.log(`Converting ${inputPath} to ${outputPath}...`);

      // Read markdown content
      const markdown = fs.readFileSync(inputPath, 'utf8');

      // Create temp directory for mermaid diagrams
      const tmpDir = tmp.dirSync({ unsafeCleanup: true });

      // Extract and render mermaid diagrams
      const mermaidBlocks = extractMermaidBlocks(markdown);
      const processedMarkdown = await processMermaidBlocks(markdown, mermaidBlocks, tmpDir.name);

      // Write processed markdown to temp file
      const tempMdFile = tmp.fileSync({ postfix: '.md' });
      fs.writeFileSync(tempMdFile.name, processedMarkdown);

      // Convert to PDF
      await new Promise((resolve, reject) => {
        markdownpdf({
          cssPath: path.join(__dirname, 'pdf-style.css'),
          remarkable: {
            html: true,
            breaks: true,
          }
        })
          .from(tempMdFile.name)
          .to(outputPath, () => {
            console.log(`PDF created at ${outputPath}`);
            resolve();
          })
          .on('error', reject);
      });

      // Cleanup
      tmpDir.removeCallback();
      tempMdFile.removeCallback();

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();

function extractMermaidBlocks(markdown) {
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  const blocks = [];
  let match;

  while ((match = mermaidRegex.exec(markdown)) !== null) {
    blocks.push({
      full: match[0],
      content: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return blocks;
}

async function processMermaidBlocks(markdown, blocks, outputDir) {
  let result = markdown;
  let offset = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const diagramPath = path.join(outputDir, `diagram-${i}.svg`);

    // Write mermaid content to temp file
    const mmdFile = tmp.fileSync({ postfix: '.mmd' });
    fs.writeFileSync(mmdFile.name, block.content);

    // Render mermaid diagram to SVG
    await mermaid.run(mmdFile.name, diagramPath);
    mmdFile.removeCallback();

    // Read SVG content
    const svgContent = fs.readFileSync(diagramPath, 'utf8');

    // Replace mermaid block with SVG image
    const replacement = `<div class="mermaid-diagram">\n${svgContent}\n</div>`;
    result = result.substring(0, block.start + offset) +
      replacement +
      result.substring(block.end + offset);

    // Update offset for next replacement
    offset += replacement.length - block.full.length;
  }

  return result;
}