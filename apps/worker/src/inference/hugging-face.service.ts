import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class HuggingFaceService {
  private apiUrl: string;
  private apiToken: string;

  constructor(@Inject(ConfigService) private config: ConfigService) {
    const modelId = this.config.getOrThrow("HF_MODEL_ID");
    // UPDATED: Using the new router domain
    this.apiUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`; // TODO: fix this as now hugging face doesnt have this model.
    this.apiToken = this.config.getOrThrow("HF_API_TOKEN");
  }

  async generateImage(imageBuffer: Buffer, prompt: string): Promise<Buffer> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          inputs: imageBuffer.toString("base64"),
          parameters: { prompt },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
          },
          // Crucial: We must tell Axios to treat the response as a binary buffer
          responseType: "arraybuffer",
        },
      );

      return response.data;
    } catch (error) {
      // Improved error logging for HF specific issues
      if (axios.isAxiosError(error) && error.response) {
        const msg = Buffer.isBuffer(error.response.data)
          ? error.response.data.toString()
          : JSON.stringify(error.response.data);
        console.error(`[HF Service] Error ${error.response.status}:`, msg);
      }
      throw error;
    }
  }
}
