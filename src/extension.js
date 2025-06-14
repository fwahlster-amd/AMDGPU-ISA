const vscode = require('vscode');
const list = require('./mnemonics.js');

function activate(context) {
    // Hover provider for mnemonics
    const hoverProvider = vscode.languages.registerHoverProvider('amdgpu', {
        async provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position, /\b[a-zA-Z0-9_]+\b/);
            const word = document.getText(range);

            if (word) {
                // Check if the word is a valid mnemonic
                if (list.x86x64Mnemonics.includes(word.toUpperCase())) {
                    const instructionInfo = await fetchInstructionInfo(word.toLowerCase());
                    if (instructionInfo) {
                        return new vscode.Hover(instructionInfo);
                    }
                } else {
                    return undefined;
                }
            }

            return undefined;
        }
    });

    // Definition provider (Ctrl+Click to jump)
    const definitionProvider = vscode.languages.registerDefinitionProvider('amdgpu', {
        async provideDefinition(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                return;
            }

            const word = document.getText(range);
            return await findDefinition(word);
        }
    });

    context.subscriptions.push(hoverProvider, definitionProvider);
}

async function fetchInstructionInfo(instruction) {
    try {
        // https://gpuopen.com/download/machine-readable-isa/latest/
        // https://github.com/GPUOpen-Tools/isa_spec_manager/blob/main/documentation/spec_documentation.md

        // Extract the title (instruction name)
        const instructionTitle = "instructionTitle";

        // Extract Opcode table and relevant details
        const opcode = "opcode";
        const instructionDescription = "description";

        // Extract the description section
        const descriptionSection = "description";

        // Combine the extracted information into a formatted output
        let hoverContent = `**${instructionTitle}**\n\n`;
        hoverContent += `**Opcode:** ${opcode}\n`;
        hoverContent += `**Description:** ${instructionDescription}\n\n`;
        hoverContent += `**Details:**\n${descriptionSection}\n\n`;

        return hoverContent;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.warn(`Instruction info not found for: ${instruction}`);
        } else {
            console.error(`Failed to fetch instruction info: ${error.message}`);
        }
        return null; // Return null if fetching fails
    }
}

async function findDefinition(word) {
    // Get all x86 assembly files in the workspace
    const files = await vscode.workspace.findFiles('**/*.s', '**/node_modules/**');

    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        const lines = text.split('\n');

        // Check for definitions in each file
        const location = searchForDefinition(lines, word, document);
        if (location) {
            return location;
        }
    }

    // If no definition is found, return undefined
    return undefined;
}

function searchForDefinition(lines, word, document) {
    const externRegex = new RegExp(`^extern\\s+${word}\\s*`, 'i');
    const globalRegex = new RegExp(`^global\\s+${word}\\s*`, 'i');
    const labelRegex = new RegExp(`^${word}:`, 'i');

    for (let i = 0; i < lines.length; i++) {
        if (externRegex.test(lines[i]) || globalRegex.test(lines[i]) || labelRegex.test(lines[i])) {
            return new vscode.Location(document.uri, new vscode.Position(i, 0));
        }
    }

    return undefined; // If no match is found
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};