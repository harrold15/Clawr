import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { ethers } from "ethers";

const walletRouter = new Hono();

const createWalletSchema = z.object({
  blockchain: z.enum(["ethereum", "solana"]),
});

walletRouter.post(
  "/create",
  zValidator("json", createWalletSchema),
  async (c) => {
    const { blockchain } = c.req.valid("json");

    try {
      if (blockchain === "solana") {
        // Generate an Ed25519 keypair (same as Solana's Keypair.generate())
        const keypair = nacl.sign.keyPair();
        // The public key is 32 bytes; encode it as base58 to get a Solana address
        const address = bs58.encode(keypair.publicKey);

        return c.json({
          data: {
            address,
            blockchain: "solana" as const,
          },
        });
      }

      if (blockchain === "ethereum") {
        const wallet = ethers.Wallet.createRandom();
        const address = wallet.address;

        return c.json({
          data: {
            address,
            blockchain: "ethereum" as const,
          },
        });
      }

      // This should never be reached due to zod validation, but satisfies TypeScript
      return c.json({ error: { message: "Unsupported blockchain", code: "INVALID_BLOCKCHAIN" } }, 400);
    } catch (err) {
      console.error("Wallet creation error:", err);
      return c.json(
        { error: { message: "Failed to generate wallet", code: "WALLET_GENERATION_ERROR" } },
        500
      );
    }
  }
);

export { walletRouter };
