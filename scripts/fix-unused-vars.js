#!/usr/bin/env node
/**
 * Auto-fix unused variables from ESLint output.
 * Strategy:
 * - Unused imports: remove the import specifier (or whole line if only one)
 * - Unused destructured: prefix with _
 * - Unused local vars/functions/types: prefix with _ or export
 * - Unused function args: prefix with _
 */
const fs = require('fs');
const path = require('path');

// Parse ESLint output
const lintOutput = fs.readFileSync(
  path.join(__dirname, '..', 'lint-output2.txt'),
  'utf-8'
);
const lines = lintOutput.split('\n');

const fileWarnings = new Map(); // file -> [{line, col, name, type}]
let currentFile = null;

for (const line of lines) {
  if (line.startsWith('./')) {
    currentFile = line.trim();
    if (!fileWarnings.has(currentFile)) {
      fileWarnings.set(currentFile, []);
    }
  } else if (
    line.includes('Warning:') &&
    line.includes('@typescript-eslint/no-unused-vars')
  ) {
    const match = line.match(/^(\d+):(\d+)\s+Warning:\s+'([^']+)'/);
    if (match && currentFile) {
      const [, lineNum, col, name] = match;
      const isAssigned = line.includes('is assigned a value');
      const isDefined = line.includes('is defined but never used');
      const isDestructured = line.includes(
        'Allowed unused elements of array destructuring'
      );
      const isArg = line.includes('Allowed unused args');
      fileWarnings.get(currentFile).push({
        line: parseInt(lineNum),
        col: parseInt(col),
        name,
        isAssigned,
        isDefined,
        isDestructured,
        isArg,
      });
    }
  }
}

let totalFixes = 0;

for (const [relFile, warnings] of fileWarnings) {
  const absFile = path.resolve(__dirname, '..', relFile);
  if (!fs.existsSync(absFile)) continue;

  const content = fs.readFileSync(absFile, 'utf-8');
  const fileLines = content.split('\n');
  let modified = false;

  // Sort warnings by line number descending so we can modify from bottom up
  warnings.sort((a, b) => b.line - a.line || b.col - a.col);

  for (const w of warnings) {
    const lineIdx = w.line - 1;
    if (lineIdx >= fileLines.length) continue;
    const fileLine = fileLines[lineIdx];

    // Check if it's an import line
    const isImportLine = fileLine.trim().startsWith('import ');

    if (isImportLine) {
      // Try to remove just the specifier from the import
      // Pattern: import { A, B, C } from '...'
      const importMatch = fileLine.match(/import\s*\{([^}]+)\}\s*from/);
      if (importMatch) {
        const specifiers = importMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (specifiers.length === 1 && specifiers[0] === w.name) {
          // Only import - remove the whole line
          fileLines.splice(lineIdx, 1);
          // Check if next line is empty and prev was empty too - clean up
          modified = true;
          totalFixes++;
          continue;
        }
        // Multiple imports - remove just this one
        const newSpecifiers = specifiers.filter(
          (s) => s !== w.name && s !== `type ${w.name}`
        );
        if (newSpecifiers.length < specifiers.length) {
          const newImport = fileLine.replace(
            /\{[^}]+\}/,
            `{ ${newSpecifiers.join(', ')} }`
          );
          fileLines[lineIdx] = newImport;
          modified = true;
          totalFixes++;
          continue;
        }
      }

      // Type import: import type { A } from '...'
      const typeImportMatch = fileLine.match(
        /import\s+type\s*\{([^}]+)\}\s*from/
      );
      if (typeImportMatch) {
        const specifiers = typeImportMatch[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (specifiers.length === 1 && specifiers[0] === w.name) {
          fileLines.splice(lineIdx, 1);
          modified = true;
          totalFixes++;
          continue;
        }
        const newSpecifiers = specifiers.filter((s) => s !== w.name);
        if (newSpecifiers.length < specifiers.length) {
          const newImport = fileLine.replace(
            /\{[^}]+\}/,
            `{ ${newSpecifiers.join(', ')} }`
          );
          fileLines[lineIdx] = newImport;
          modified = true;
          totalFixes++;
          continue;
        }
      }

      // Default import: import X from '...'
      const defaultImportMatch = fileLine.match(/import\s+(\w+)\s+from/);
      if (defaultImportMatch && defaultImportMatch[1] === w.name) {
        fileLines.splice(lineIdx, 1);
        modified = true;
        totalFixes++;
        continue;
      }
    }

    // For unused destructured array elements: prefix with _
    if (w.isDestructured) {
      const regex = new RegExp(`\\b${w.name}\\b`);
      if (regex.test(fileLine)) {
        fileLines[lineIdx] = fileLine.replace(regex, `_${w.name}`);
        modified = true;
        totalFixes++;
        continue;
      }
    }

    // For unused args in function signatures: prefix with _
    if (w.isArg) {
      // Only replace at the exact column position
      const colIdx = w.col - 1;
      const before = fileLine.substring(0, colIdx);
      const after = fileLine.substring(colIdx);
      if (after.startsWith(w.name)) {
        fileLines[lineIdx] = before + '_' + after;
        modified = true;
        totalFixes++;
        continue;
      }
    }

    // For unused local types (type X = ..., interface X) - prefix with _
    const typeMatch = fileLine.match(/^(\s*)(type|interface)\s+(\w+)/);
    if (typeMatch && typeMatch[3] === w.name) {
      fileLines[lineIdx] = fileLine.replace(
        new RegExp(`(type|interface)\\s+${w.name}`),
        `$1 _${w.name}`
      );
      modified = true;
      totalFixes++;
      continue;
    }

    // For unused functions: function X(...) or const X =
    const funcMatch = fileLine.match(/^(\s*)function\s+(\w+)/);
    if (funcMatch && funcMatch[2] === w.name) {
      fileLines[lineIdx] = fileLine.replace(
        `function ${w.name}`,
        `function _${w.name}`
      );
      modified = true;
      totalFixes++;
      continue;
    }

    // For unused const/let/var assignments
    const constMatch = fileLine.match(
      /^(\s*)(export\s+)?(const|let|var)\s+(\w+)/
    );
    if (constMatch && constMatch[4] === w.name) {
      fileLines[lineIdx] = fileLine.replace(
        new RegExp(`(const|let|var)\\s+${w.name}\\b`),
        `$1 _${w.name}`
      );
      modified = true;
      totalFixes++;
      continue;
    }

    // For class definitions: class X
    const classMatch = fileLine.match(/^(\s*)(export\s+)?class\s+(\w+)/);
    if (classMatch && classMatch[3] === w.name) {
      fileLines[lineIdx] = fileLine.replace(
        `class ${w.name}`,
        `class _${w.name}`
      );
      modified = true;
      totalFixes++;
      continue;
    }

    // For destructured const: const { x, y } = ... where x is unused
    if (w.isAssigned && fileLine.includes('{') && fileLine.includes(w.name)) {
      const regex = new RegExp(`\\b${w.name}\\b(?!\\s*[:(])`);
      if (regex.test(fileLine)) {
        fileLines[lineIdx] = fileLine.replace(regex, `_${w.name}`);
        modified = true;
        totalFixes++;
        continue;
      }
    }

    // Generic fallback: try simple rename at exact position
    if (!w.name.startsWith('_')) {
      const colIdx = w.col - 1;
      const before = fileLine.substring(0, colIdx);
      const after = fileLine.substring(colIdx);
      if (after.startsWith(w.name)) {
        fileLines[lineIdx] = before + '_' + after;
        modified = true;
        totalFixes++;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(absFile, fileLines.join('\n'), 'utf-8');
    console.log(`Fixed: ${relFile} (${warnings.length} warnings)`);
  }
}

console.log(`\nTotal fixes applied: ${totalFixes}`);
