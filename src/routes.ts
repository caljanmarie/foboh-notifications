import { Router } from "express";
import rateLimit from "express-rate-limit";
import { InMemoryDb } from "./db/InMemoryDb";
import { NotificationService } from "./services/NotificationService";

const router = Router();
const db = new InMemoryDb();
const service = new NotificationService(db);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
});

router.use(limiter);

/**
 * @openapi
 * /preferences/{userId}:
 *   post:
 *     summary: Set user preferences
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [email, webhook]
 *               template:
 *                 type: string
 *               variables:
 *                 type: object
 *               target:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.post("/preferences/:userId", (req, res) => {
  db.setPreference(req.params.userId, req.body);
  res.json({ status: "ok" });
});

/**
 * @openapi
 * /notifications:
 *   post:
 *     summary: Send a notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [email, webhook]
 *               template:
 *                 type: string
 *               variables:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification enqueued
 */
router.post("/notifications", async (req, res) => {
  const result = await service.sendRequest(req.body);
  res.json(result);
});

/**
 * @openapi
 * /notifications/{notificationId}:
 *   get:
 *     summary: Get notification status
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         status: Delivered
 */
router.get("/notifications/:id", (req, res) => {
  const rec = service.getStatus(req.params.id);
  if (!rec) return res.status(404).json({ error: "Not found" });
  res.json(rec);
});

export default router;