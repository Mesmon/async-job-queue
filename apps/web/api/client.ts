import axios from "axios";
import { env } from "@/lib/config";

export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// For direct Azure uploads where we don't want the baseURL
export const blobClient = axios.create({
  headers: {
    "x-ms-blob-type": "BlockBlob",
  },
});
