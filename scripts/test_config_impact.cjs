/**
 * Test whether setting STRICT_VERIFIED_EVIDENCE_ENABLED="0" and CASE_RECOGNITION_MODE="shadow"
 * allows gpt-6-luna's full answer to be returned!
 */
const { execSync } = require('child_process');

console.log('Testing configuration impact...');
