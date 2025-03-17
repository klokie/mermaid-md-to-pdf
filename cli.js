#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import { convertMarkdownToPdf } from './index.js';

program
  .name('mermaid-md-to-pdf')
  .description('Convert Markdown files with Mermaid diagrams to PDF')
  .argument('<input-file>', 'Input Markdown file')
  .option('-o, --output <output-file>', 'Output PDF file')
  .action(async (inputFile, options) => {
    const outputFile = options.output || `${path.basename(inputFile, path.extname(inputFile))}.pdf`;

    console.log(`Converting ${inputFile} to ${outputFile}...`);

    try {
      await convertMarkdownToPdf(inputFile, outputFile);
      console.log(`Successfully created ${outputFile}`);
    } catch (error) {
      console.error('Error converting file:', error);
      process.exit(1);
    }
  });

program.parse();