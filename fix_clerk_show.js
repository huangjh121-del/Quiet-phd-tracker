const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Replace imports
code = code.replace(
  "import { SignInButton, SignUpButton, SignedOut, SignedIn, UserButton } from '@clerk/nextjs';",
  "import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';"
);

// Replace SignedOut with Show when="signed-out"
code = code.replace(/<SignedOut>/g, '<Show when="signed-out">');
code = code.replace(/<\/SignedOut>/g, '</Show>');

// Replace SignedIn with Show when="signed-in"
code = code.replace(/<SignedIn>/g, '<Show when="signed-in">');
code = code.replace(/<\/SignedIn>/g, '</Show>');

fs.writeFileSync('src/app/page.tsx', code);
console.log('Fixed Clerk v6/Core3 components!');
