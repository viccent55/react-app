import { useState, useCallback } from "react";
import CryptoJS from "crypto-js";
import { decrypt } from "../plugin/crypto";

/* =====================================================
 * AES config (SAME as Vue)
 * ===================================================== */
const encryptionKey = CryptoJS.enc.Utf8.parse(
  "k9:3zeFq~]-EQMF,gpGx*uRw+x,n]xw9"
);
const iv = CryptoJS.enc.Utf8.parse("Zd3!t#t1YN=!fs)D");

/* =====================================================
 * Cache: imageUrl → base64
 * ===================================================== */
const imageCache = new Map<string, string>();

/* =====================================================
 * Helpers
 * ===================================================== */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Latin1.parse(binary));
}

/* =====================================================
 * Hook
 * ===================================================== */
export function useDecryption() {
  const [decryptedImage, setDecryptedImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -----------------------------------------------
   * Core decrypt (binary → base64)
   * --------------------------------------------- */
  const decryptAndToBase64 = useCallback(async (fullUrl: string) => {
    if (imageCache.has(fullUrl)) {
      return imageCache.get(fullUrl)!;
    }

    const res = await fetch(fullUrl);
    if (!res.ok) {
      throw new Error(`Image fetch failed: ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    const encryptedBytes = new Uint8Array(buffer);

    const cipherText = CryptoJS.lib.WordArray.create(encryptedBytes as any);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: cipherText } as any,
      encryptionKey,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    const decryptedBytes = new Uint8Array(
      decrypted.words.flatMap((word) => [
        (word >> 24) & 0xff,
        (word >> 16) & 0xff,
        (word >> 8) & 0xff,
        word & 0xff,
      ])
    ).slice(0, decrypted.sigBytes);

    if (!decryptedBytes.length) {
      throw new Error("Decryption failed (empty result)");
    }

    const base64 = uint8ArrayToBase64(decryptedBytes);

    // cache result
    imageCache.set(fullUrl, base64);

    return base64;
  }, []);

  /* -----------------------------------------------
   * Public API (same name as Vue)
   * --------------------------------------------- */
  const decryptImage = useCallback(
    async (imageUrl: string) => {
      setIsLoading(true);
      setError(null);
      setDecryptedImage("");

      try {
        const fullUrl = `${process.env.EXPO_PUBLIC_IMAGE_HOST}${imageUrl}`;
        const base64 = await decryptAndToBase64(fullUrl);

        // React Native Image-compatible URI
        const dataUri = `data:image/jpeg;base64,${base64}`;
        setDecryptedImage(dataUri);

        return dataUri;
      } catch (e: any) {
        setError(e.message ?? "decryptImage failed");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [decryptAndToBase64]
  );

  /* -----------------------------------------------
   * Clear cache (memory safety)
   * --------------------------------------------- */
  const clearCache = useCallback(() => {
    imageCache.clear();
  }, []);

  /* -----------------------------------------------
   * Keep encryptData helper (unchanged)
   * --------------------------------------------- */
  const encryptData = useCallback((res: Record<string, any>) => {
    const decrypted = decrypt(res.data);
    res.data = decrypted;
    return res.data;
  }, []);

  /* -----------------------------------------------
   * blobUrlToBase64 → identity in RN
   * --------------------------------------------- */
  const blobUrlToBase64 = useCallback(async (dataUri: string) => {
    // already base64 in RN
    return dataUri;
  }, []);

  return {
    decryptedImage,
    isLoading,
    error,
    decryptImage,
    clearCache,
    encryptData,
    blobUrlToBase64,
  };
}
