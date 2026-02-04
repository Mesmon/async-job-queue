import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenAI, toFile } from "openai";

@Injectable()
export class AzureFluxService {
  private client: OpenAI;
  private deploymentName: string;

  constructor(@Inject(ConfigService) private config: ConfigService) {
    this.deploymentName = this.config.getOrThrow<string>("AZURE_AI_DEPLOYMENT");
    const endpoint = this.config.getOrThrow<string>("AZURE_AI_ENDPOINT");
    const apiKey = this.config.getOrThrow<string>("AZURE_AI_API_KEY");

    const validEndpoint = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;

    // Initialize OpenAI Client pointing to Azure AI Foundry
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: `${validEndpoint}v1`,
      defaultHeaders: { "api-key": apiKey },
    });
  }

  /**
   * Generates a new image based on a prompt and an input image (Image-to-Image)
   */
  async generateImage(inputImageBuffer: Buffer, prompt: string): Promise<Buffer> {
    try {
      const imageFile = await toFile(inputImageBuffer, "input.png", { type: "image/png" });

      const response = await this.client.images.edit({
        prompt: prompt,
        model: this.deploymentName,
        n: 1,
        size: "1024x1024",
        image: imageFile,
      });

      // 3. Extract the result
      const resultBase64 = response.data[0].b64_json;
      if (!resultBase64) {
        throw new Error("No image data returned from Azure Flux");
      }

      // 4. Convert back to Buffer
      return Buffer.from(resultBase64, "base64");
    } catch (error) {
      console.error("Azure FLUX Error:", error);
      throw error;
    }
  }
}
