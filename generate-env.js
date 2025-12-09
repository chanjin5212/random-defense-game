const fs = require('fs');

const envContent = `window.ENV = {
    SUPABASE_URL: '${process.env.SUPABASE_URL || ""}',
    SUPABASE_KEY: '${process.env.SUPABASE_KEY || ""}'
};`;

fs.writeFileSync('js/env.js', envContent);
console.log('js/env.js generated successfully!');
