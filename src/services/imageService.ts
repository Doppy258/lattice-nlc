/**
 * Business image (logo/banner) uploads to Supabase Storage. Validates file
 * type and size before uploading, then returns the public URL for storage
 * in the business record.
 */

import { supabase } from "./supabaseClient";
import { createId } from "../utils/ids";

/** Public Supabase Storage bucket holding business logos + banners. */
export const BUSINESS_IMAGE_BUCKET = "business-images";

/** Which type of business image is being uploaded. */
export type BusinessImageKind = "logo" | "banner";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Uploads a business logo/banner to Supabase Storage and returns its public URL.
 * Throws a friendly Error on misconfiguration, oversized files, or upload failure.
 */
export async function uploadBusinessImage(
  file: File,
  businessId: string,
  kind: BusinessImageKind,
): Promise<string> {
  if (!supabase) {
    throw new Error("Image storage isn't configured. Set up the business-images bucket in Supabase.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${businessId}/${kind}-${createId(kind)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUSINESS_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
  if (error) {
    throw new Error(error.message || "Upload failed. Check the business-images bucket exists.");
  }

  const { data } = supabase.storage.from(BUSINESS_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
