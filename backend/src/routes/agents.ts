import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../prisma";

const agentsRouter = new Hono();

/**
 * Generate a 6-character alphanumeric code
 */
function generateSessionId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * POST /api/agents/pair/init - Initialize a pairing session
 * Generates a 6-character session ID and creates a pairing session with 10 minute TTL
 */
agentsRouter.post(
  "/pair/init",
  zValidator("json", z.object({ agentName: z.string().optional() })),
  async (c) => {
    const { agentName } = c.req.valid("json");

    // Generate unique session ID
    let sessionId = generateSessionId();
    let exists = true;
    while (exists) {
      const existing = await prisma.pairingSession.findUnique({
        where: { sessionId },
      });
      if (!existing) {
        exists = false;
      } else {
        sessionId = generateSessionId();
      }
    }

    // Create pairing session with 10 minute expiry
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const qrCode = sessionId; // For now, QR code data is just the sessionId

    const pairingSession = await prisma.pairingSession.create({
      data: {
        sessionId,
        qrCode,
        expiresAt,
        agentName: agentName || undefined,
        status: "pending",
      },
    });

    return c.json(
      {
        data: {
          sessionId: pairingSession.sessionId,
          qrCode: pairingSession.qrCode,
          expiresAt: pairingSession.expiresAt.toISOString(),
        },
      },
      201
    );
  }
);

/**
 * POST /api/agents/pair - Complete pairing
 * Validates the sessionId exists and hasn't expired, returns mock agent data
 */
agentsRouter.post(
  "/pair",
  zValidator(
    "json",
    z.object({
      sessionId: z.string().min(6).max(6),
      pairingCode: z.string().optional(),
    })
  ),
  async (c) => {
    const { sessionId, pairingCode } = c.req.valid("json");

    // Find the pairing session
    const pairingSession = await prisma.pairingSession.findUnique({
      where: { sessionId },
    });

    if (!pairingSession) {
      return c.json(
        {
          error: {
            message: "Pairing session not found",
            code: "SESSION_NOT_FOUND",
          },
        },
        404
      );
    }

    // Check if expired
    if (new Date() > pairingSession.expiresAt) {
      // Mark as expired
      await prisma.pairingSession.update({
        where: { id: pairingSession.id },
        data: { status: "expired" },
      });

      return c.json(
        {
          error: {
            message: "Pairing session has expired",
            code: "SESSION_EXPIRED",
          },
        },
        400
      );
    }

    // Mark session as connected
    await prisma.pairingSession.update({
      where: { id: pairingSession.id },
      data: { status: "connected" },
    });

    // Return mock agent data
    const agent = {
      id: `agent-${sessionId}`,
      name: pairingSession.agentName || "Local Agent",
      type: "local" as const,
      pairingCode: pairingCode || sessionId,
      status: "connected" as const,
    };

    // Delete the pairing session after successful pairing
    await prisma.pairingSession.delete({
      where: { id: pairingSession.id },
    });

    return c.json({ data: { agent } }, 200);
  }
);

/**
 * GET /api/agents/pair/status/:sessionId - Check pairing status
 * Returns the current status of a pairing session
 */
agentsRouter.get("/pair/status/:sessionId", async (c) => {
  const { sessionId } = c.req.param();

  const pairingSession = await prisma.pairingSession.findUnique({
    where: { sessionId },
  });

  if (!pairingSession) {
    return c.json(
      {
        error: {
          message: "Pairing session not found",
          code: "SESSION_NOT_FOUND",
        },
      },
      404
    );
  }

  // Check if expired
  let status = pairingSession.status;
  if (status === "pending" && new Date() > pairingSession.expiresAt) {
    status = "expired";
    // Update the session status
    await prisma.pairingSession.update({
      where: { id: pairingSession.id },
      data: { status: "expired" },
    });
  }

  return c.json(
    {
      data: {
        status: status as "pending" | "connected" | "expired",
      },
    },
    200
  );
});

export { agentsRouter };
