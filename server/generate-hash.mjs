#!/usr/bin/env node
import argon2 from 'argon2';

const password = 'Demo@12345';

(async () => {
    try {
        const hash = await argon2.hash(password);
        console.log('\n✅ Hash for "Demo@12345":');
        console.log(hash);
        console.log('\nCopy the hash above and use it in the SQL INSERT statement.\n');
    } catch (error) {
        console.error('Error generating hash:', error);
    }
})();
