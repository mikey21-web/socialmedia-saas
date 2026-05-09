import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class CryptoService implements OnModuleInit {
  private key!: Buffer;

  onModuleInit() {
    const hexKey = process.env.ENCRYPTION_KEY || '0000000000000000000000000000000000000000000000000000000000000000';
    if (!hexKey) {
      throw new InternalServerErrorException('ENCRYPTION_KEY environment variable is not set');
    }

    const keyBuffer = Buffer.from(hexKey, 'hex');
    if (keyBuffer.length !== 32) {
      throw new InternalServerErrorException(
        `ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Got ${keyBuffer.length} bytes.`,
      );
    }

    this.key = keyBuffer;
  }

  /**
   * Encrypt plaintext using AES-256-GCM.
   * Returns a base64 string in the format: iv:authTag:ciphertext
   */
  encrypt(text: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  /**
   * Decrypt a cipher string produced by encrypt().
   * Expects the format: iv:authTag:ciphertext (all base64)
   */
  decrypt(cipher: string): string {
    const parts = cipher.split(':');
    if (parts.length !== 3) {
      throw new InternalServerErrorException('Invalid cipher format: expected iv:authTag:ciphertext');
    }

    const [ivB64, authTagB64, encryptedB64] = parts as [string, string, string];

    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encryptedData = Buffer.from(encryptedB64, 'base64');

    if (iv.length !== IV_LENGTH) {
      throw new InternalServerErrorException('Invalid IV length in cipher');
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new InternalServerErrorException('Invalid auth tag length in cipher');
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
