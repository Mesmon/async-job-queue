import { describe, expect, it, vi } from "vitest";
import { createStorageProvider } from "./index.js";
import { AwsStorageProvider } from "./providers/aws.js";
import { AzureStorageProvider } from "./providers/azure.js";

// Mock Azure
vi.mock("@azure/storage-blob", () => {
  const BlockBlobClient = {
    generateSasUrl: vi.fn().mockResolvedValue("azure-url"),
    upload: vi.fn().mockResolvedValue({}),
    download: vi.fn().mockResolvedValue({
      readableStreamBody: {
        // biome-ignore lint/suspicious/noExplicitAny: mock
        on: vi.fn(function (this: any, event: string, cb: any) {
          if (event === "data") {
            cb(Buffer.from("test-data"));
          }
          if (event === "end") {
            cb();
          }
          return this;
        }),
      },
    }),
  };
  const ContainerClient = {
    createIfNotExists: vi.fn().mockResolvedValue({}),
    getBlockBlobClient: vi.fn().mockReturnValue(BlockBlobClient),
  };
  const BlobServiceClient = {
    fromConnectionString: vi.fn().mockReturnValue({
      getContainerClient: vi.fn().mockReturnValue(ContainerClient),
      setProperties: vi.fn().mockResolvedValue({}),
    }),
  };
  return { BlobServiceClient, BlobSASPermissions: { parse: vi.fn() } };
});

// Mock AWS
vi.mock("@aws-sdk/client-s3", () => {
  // biome-ignore lint/suspicious/noExplicitAny: mock
  const sendMock = vi.fn().mockImplementation(async (command: any) => {
    if (command?.constructor && command.constructor.name === "GetObjectCommand") {
      return {
        Body: {
          // biome-ignore lint/suspicious/noExplicitAny: mock
          on: vi.fn(function (this: any, event: string, cb: any) {
            if (event === "data") {
              cb(Buffer.from("aws-data"));
            }
            if (event === "end") {
              cb();
            }
            return this;
          }),
        },
      };
    }
    return {};
  });

  function S3Client() {
    return {
      send: sendMock,
    };
  }

  return {
    S3Client,
    // biome-ignore lint/suspicious/noExplicitAny: mock
    PutObjectCommand: function (this: any, args: any) {
      this.args = args;
      this.constructor = { name: "PutObjectCommand" };
    },
    // biome-ignore lint/suspicious/noExplicitAny: mock
    GetObjectCommand: function (this: any, args: any) {
      this.args = args;
      this.constructor = { name: "GetObjectCommand" };
    },
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("aws-url"),
}));

describe("Storage Package", () => {
  describe("Factory", () => {
    it("should create Azure provider", () => {
      const provider = createStorageProvider({
        provider: "azure",
        azure: {
          connectionString:
            "DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;",
        },
      });
      expect(provider).toBeInstanceOf(AzureStorageProvider);
    });

    it("should create AWS provider", () => {
      const provider = createStorageProvider({
        provider: "aws",
        aws: { region: "us-east-1", accessKeyId: "key", secretAccessKey: "secret" },
      });
      expect(provider).toBeInstanceOf(AwsStorageProvider);
    });

    it("should throw for unsupported provider", () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid provider
      expect(() => createStorageProvider({ provider: "unsupported" } as any)).toThrow();
    });
  });

  describe("AzureStorageProvider", () => {
    const config = {
      provider: "azure" as const,
      azure: {
        connectionString:
          "DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;",
        containerName: "cont",
      },
    };
    const provider = new AzureStorageProvider(config);

    it("should generate upload URL", async () => {
      const res = await provider.generateUploadUrl("path");
      expect(res.uploadUrl).toBe("azure-url");
    });

    it("should generate download URL", async () => {
      const res = await provider.generateDownloadUrl("path");
      expect(res).toBe("azure-url");
    });

    it("should upload data", async () => {
      await provider.upload("path", "data");
      await provider.upload("path", Buffer.from("data"));
    });

    it("should download data", async () => {
      const res = await provider.download("path");
      expect(res.toString()).toBe("test-data");
    });

    it("should throw on missing body during download", async () => {
      vi.mocked(
        // biome-ignore lint/suspicious/noExplicitAny: mocking response
        (provider as any).blobServiceClient.getContainerClient("").getBlockBlobClient("").download,
      ).mockResolvedValueOnce({
        readableStreamBody: undefined,
        // biome-ignore lint/suspicious/noExplicitAny: mocking response
      } as any);
      await expect(provider.download("path")).rejects.toThrow("No readable stream body");
    });

    it("should throw on invalid config", () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid config
      expect(() => new AzureStorageProvider({ provider: "aws" } as any)).toThrow();
    });
  });

  describe("AwsStorageProvider", () => {
    const config = {
      provider: "aws" as const,
      aws: { region: "us", accessKeyId: "k", secretAccessKey: "s" },
    };
    const provider = new AwsStorageProvider(config);

    it("should generate upload URL", async () => {
      const res = await provider.generateUploadUrl("path");
      expect(res.uploadUrl).toBe("aws-url");
    });

    it("should generate download URL", async () => {
      const res = await provider.generateDownloadUrl("path");
      expect(res).toBe("aws-url");
    });

    it("should upload data", async () => {
      await provider.upload("path", "data");
    });

    it("should download data", async () => {
      const res = await provider.download("path");
      expect(res.toString()).toBe("aws-data");
    });

    it("should throw on missing body during download", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: mocking response
      vi.mocked((provider as any).s3Client.send).mockResolvedValueOnce({
        Body: undefined,
        // biome-ignore lint/suspicious/noExplicitAny: mocking response
      } as any);
      await expect(provider.download("path")).rejects.toThrow("No body in response");
    });

    it("should throw on invalid config", () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid config
      expect(() => new AwsStorageProvider({ provider: "azure" } as any)).toThrow();
    });
  });
});
