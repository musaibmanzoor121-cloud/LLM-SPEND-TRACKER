import { encrypt, decrypt } from '../src/lib/encryption';
import * as crypto from 'crypto';

describe('Encryption Module', () => {
  beforeAll(() => {
    // Generate a valid 64-character hex key (32 bytes) for testing
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  });

  it('should encrypt and decrypt correctly', () => {
    const originalText = 'sk-test-secret-api-key-12345';
    const encrypted = encrypt(originalText);
    
    expect(encrypted).not.toBe(originalText);
    expect(encrypted).toContain(':'); // Ensure it contains IV and Auth Tag
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should fail with invalid format', () => {
    expect(() => decrypt('invalid-format-string')).toThrow('Invalid encrypted data format');
  });
});
