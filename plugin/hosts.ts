import CryptoJS from "crypto-js";

const KEY = "9C+^vMGy#9qynefGF2Bx1234";

// Convert text key → WordArray
const keyWords = CryptoJS.enc.Utf8.parse(KEY);

// Manually zero-pad to 32 bytes (AES-256)
while (keyWords.sigBytes < 32) {
  keyWords.words.push(0);
  keyWords.sigBytes++;
}

/**
 * Encrypt AES-256-CBC (PHP compatible)
 */
export function encryptData(data: string): string {
  const iv = CryptoJS.lib.WordArray.random(16);

  const encrypted = CryptoJS.AES.encrypt(data, keyWords, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return (
    CryptoJS.enc.Base64.stringify(iv) +
    ":" +
    encrypted.ciphertext.toString(CryptoJS.enc.Base64)
  );
}

/**
 * Decrypt AES-256-CBC (PHP compatible)
 */
export function decryptData(encryptedData: string) {
  try {
    const [ivB64, ctB64] = encryptedData.split(":");
    if (!ivB64 || !ctB64) return "";

    const iv = CryptoJS.enc.Base64.parse(ivB64);
    const ciphertext = CryptoJS.enc.Base64.parse(ctB64);

    const decrypted = CryptoJS.AES.decrypt({ ciphertext }, keyWords, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return "";
  }
}
