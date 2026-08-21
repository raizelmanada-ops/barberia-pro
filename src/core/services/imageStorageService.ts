// ==========================================================================
// BARBERIA_PRO - Servicio Unificado de Supabase Storage & Upload de Imágenes
// Aislamiento Multi-Tenant estricto por business_id
// ==========================================================================

import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

const BUCKET_NAME = 'barberia_media';

export class ImageStorageService {
  /**
   * Sube una imagen a Supabase Storage con aislamiento por businessId
   * @param businessId ID del negocio activo (Tenant)
   * @param file Archivo File, Blob o DataURL (Base64)
   * @param folder Subcarpeta ('gallery', 'memories', 'works')
   * @returns URL pública persistente de la imagen
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

    // Si tenemos Supabase configurado, subimos al bucket de almacenamiento
    if (isSupabaseConfigured()) {
      try {
        let blob: Blob;

        if (typeof file === 'string') {
          // Convertir Base64 / DataURL a Blob binario optimizado
          blob = await this.dataUrlToBlob(file);
        } else {
          blob = file;
        }

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, blob, {
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

    // Fallback garantizado: si es un File, convertir a DataURL para uso inmediato
    if (typeof file !== 'string') {
      return await this.fileToDataUrl(file);
    }

    return file;
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
