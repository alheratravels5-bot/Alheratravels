/**
 * Client-side image compression utility
 * Prevents localStorage QuotaExceededError and Supabase HTTP 413 (Payload Too Large)
 */

export async function compressImage(
  fileOrBase64: File | string,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    // If it's already an HTTP/HTTPS URL, return as-is
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('http')) {
      resolve(fileOrBase64);
      return;
    }

    const img = new Image();

    const processImage = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (!width || !height) {
          resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
          return;
        }

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
      }
    };

    img.onload = processImage;
    img.onerror = () => {
      resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrBase64);
    }
  });
}
