const fs = require('fs');

function replaceFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (const [target, replacement] of replacements) {
    content = content.replace(target, replacement);
  }
  fs.writeFileSync(path, content);
}

// 1. Invoices
replaceFile('app/dashboard/invoices/[id]/page.js', [
  ['../../../../lib/supabaseClient', '../../../lib/supabaseClient'],
  ['../../../../lib/demoData', '../../../lib/demoData'],
  ['../../invoices.module.css', '../invoices.module.css']
]);

// 2. Jobs
replaceFile('app/dashboard/jobs/[id]/page.js', [
  ['../../../../lib/supabaseClient', '../../../lib/supabaseClient'],
  ['../../../../lib/demoData', '../../../lib/demoData'],
  ['../../jobs.module.css', '../jobs.module.css']
]);

// 3. Customers
replaceFile('app/dashboard/customers/[id]/page.js', [
  ['../../../../lib/supabaseClient', '../../../lib/supabaseClient'],
  ['../../customers.module.css', '../customers.module.css']
]);

// 4. Approve
replaceFile('app/approve/[id]/page.js', [
  ['../../../lib/supabaseClient', '../../lib/supabaseClient'],
  ['../../approve.module.css', '../approve.module.css']
]);

console.log('Fixed paths!');
