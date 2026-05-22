import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function downloadMedia(url: string, originalName?: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    
    const extension = blob.type.split("/")[1] || "jpg";
    const cleanName = originalName 
      ? originalName.replace(/\.[^/.]+$/, "")
      : `media_${Date.now()}`;
    link.download = `Chatify_${cleanName}.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Failed to download image", error);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `Chatify_${originalName || "image"}`;
    link.click();
  }
}

