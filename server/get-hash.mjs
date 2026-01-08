#!/usr/bin/env node
import argon2 from 'argon2';

const password = 'Demo@12345';

try {
    const hash = await argon2.hash(password);
    console.log(hash);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
