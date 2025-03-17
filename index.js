import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const execAsync = promisify(exec);

// Configure marked to not escape HTML
marked.setOptions({
  headerIds: true,
  mangle: false,
  sanitize: false,
  silent: false
});

async function convertMermaidToSvg(mermaidCode, outputPath) {
  // Write mermaid code to a temporary file
  const tempMmdFile = path.join(process.cwd(), 'temp.mmd');
  fs.writeFileSync(tempMmdFile, mermaidCode);

  // Use mmdc executable directly instead of importing the module
  const mmdcPath = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');

  try {
    await execAsync(`${mmdcPath} -i ${tempMmdFile} -o ${outputPath} -b transparent`);
    // Clean up temp file
    fs.unlinkSync(tempMmdFile);
    return true;
  } catch (error) {
    console.error('Error rendering Mermaid diagram:', error);
    // Clean up temp file
    if (fs.existsSync(tempMmdFile)) {
      fs.unlinkSync(tempMmdFile);
    }
    return false;
  }
}

export async function convertMarkdownToPdf(inputFile, outputFile) {
  // Read the markdown file
  const markdown = fs.readFileSync(inputFile, 'utf-8');

  // Extract all mermaid diagrams and render them to SVGs
  const mermaidBlocks = [];
  const mermaidRegex = /```mermaid\s*([\s\S]*?)\s*```/g;
  let match;

  while ((match = mermaidRegex.exec(markdown)) !== null) {
    const mermaidCode = match[1].trim();
    const svgPath = path.resolve(process.cwd(), `diagram-${mermaidBlocks.length}.svg`);

    const success = await convertMermaidToSvg(mermaidCode, svgPath);
    if (success) {
      mermaidBlocks.push({
        original: match[0],
        svgPath: svgPath
      });
    }
  }

  // Process the markdown content directly
  let htmlContent = '';
  let currentPos = 0;

  for (const block of mermaidBlocks) {
    // Find the position of the mermaid block
    const blockPos = markdown.indexOf(block.original, currentPos);
    if (blockPos === -1) continue;

    // Add the markdown content before the mermaid block
    const beforeBlock = markdown.substring(currentPos, blockPos);
    htmlContent += marked.parse(beforeBlock);

    // Add the SVG content
    const svgContent = fs.readFileSync(block.svgPath, 'utf-8');
    htmlContent += `<div class="mermaid-diagram">${svgContent}</div>`;

    // Update the current position
    currentPos = blockPos + block.original.length;
  }

  // Add any remaining markdown content
  if (currentPos < markdown.length) {
    const remainingContent = markdown.substring(currentPos);
    htmlContent += marked.parse(remainingContent);
  }

  // Create a full HTML document with proper styling
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${fs.readFileSync(path.join(process.cwd(), 'pdf-style.css'), 'utf-8')}
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  // Write the HTML to a temporary file
  const tempHtmlFile = path.join(process.cwd(), 'temp-processed.html');
  fs.writeFileSync(tempHtmlFile, fullHtml);

  // For debugging - save the HTML file
  fs.writeFileSync('debug-output.html', fullHtml);

  // Convert HTML to PDF using Puppeteer
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${path.resolve(tempHtmlFile)}`, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputFile, format: 'A4', printBackground: true });
  await browser.close();

  // Clean up SVG files and temp HTML
  mermaidBlocks.forEach(block => {
    if (fs.existsSync(block.svgPath)) {
      fs.unlinkSync(block.svgPath);
    }
  });

  if (fs.existsSync(tempHtmlFile)) {
    fs.unlinkSync(tempHtmlFile);
  }

  return outputFile;
}