import { validateContent } from '../src/content/validate.ts';
import { readContentFiles } from './content-files.ts';

const files = readContentFiles();
const { items, errors } = validateContent(files);

if (errors.length) {
  console.error(`✖ ${errors.length} content error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const count = (pred: (i: (typeof items)[number]) => boolean) => items.filter(pred).length;
console.log(
  `✔ ${items.length} items valid across ${files.length} files ` +
    `(${count((i) => i.type === 'card')} cards, ${count((i) => i.type === 'case')} cases, ` +
    `${count((i) => i.status === 'validated')} validated, ${count((i) => i.status === 'draft')} drafts)`,
);
