const fs = require('fs');
let code = fs.readFileSync('src/proxy.ts', 'utf8');

if (!code.includes("'/__clerk/:path*'")) {
  code = code.replace(
    '"/(api|trpc)(.*)",',
    '"/(api|trpc)(.*)",\n    "/__clerk/:path*",'
  );
  fs.writeFileSync('src/proxy.ts', code);
  console.log('Patched proxy.ts matcher');
}
