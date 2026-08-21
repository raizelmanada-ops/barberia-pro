// ==========================================================================
// BARBERIA_PRO - Servicio Unificado de Supabase Storage & Upload de Imágenes
// Aislamiento Multi-Tenant estricto por business_id
// ==========================================================================

import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

const BUCKET_NAME = 'barberia_media';

export class ImageStorageService {
  /**
   * Comprime una imagen en el navegador usando HTML5 Canvas antes de subirla o guardarla.
   * Reduce fotos pesadas de 4-10MB tomadas con celular a ~150-250KB en alta definición.
   */
  public static async compressImage(
    fileOrDataUrl: File | Blob | string,
    maxWidth = 1080,
    quality = 0.82
  ): Promise<Blob> {
    const dataUrl = typeof fileOrDataUrl === 'string'
      ? fileOrDataUrl
      : await this.fileToDataUrl(fileOrDataUrl);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Mantener relación de aspecto redimensionando a un ancho máximo de 1080px
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          this.dataUrlToBlob(dataUrl).then(resolve).catch(reject);
          return;
        }

        // Dibujar con suavizado bilineal
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              this.dataUrlToBlob(dataUrl).then(resolve).catch(reject);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        this.dataUrlToBlob(dataUrl).then(resolve).catch(reject);
      };

      img.src = dataUrl;
    });
  }

  /**
   * Sube una imagen a Supabase Storage con compresión previa y aislamiento por businessId
   */
  public static async uploadImage(
    businessId: string,
    file: File | Blob | string,
    folder: 'gallery' | 'memories' | 'works' = 'gallery'
  ): Promise<string> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomSuffix}.jpg`;
    const filePath = `${businessId}/${folder}/${fileName}`;

    // 1. Comprimir siempre en cliente antes de enviar a Storage o procesar
    const compressedBlob = await this.compressImage(file);

    // 2. Si tenemos Supabase configurado, subimos al bucket
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, compressedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
            upsert: true,
          });

        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

          if (publicData?.publicUrl) {
            return publicData.publicUrl;
          }
        } else if (error) {
          console.warn('[ImageStorage] Error subiendo a Supabase Storage bucket, usando fallback:', error.message);
        }
      } catch (err) {
        console.warn('[ImageStorage] Excepción al procesar imagen en Supabase Storage:', err);
      }
    }

    // 3. Fallback garantizado: DataURL comprimida
    return await this.fileToDataUrl(compressedBlob);
  }

  /**
   * Convierte un archivo File/Blob a DataURL
   */
  public static fileToDataUrl(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convierte una DataURL Base64 a un Blob binario para upload
   */
  private static async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
  }
}

