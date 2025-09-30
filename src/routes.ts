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

router.post("/preferences/:userId", (req, res) => {
  db.setPreference(req.params.userId, req.body);
  res.json({ status: "ok" });
});

router.post("/notifications", async (req, res) => {
  const result = await service.sendRequest(req.body);
  res.json(result);
});

router.get("/notifications/:id", (req, res) => {
  const rec = service.getStatus(req.params.id);
  if (!rec) return res.status(404).json({ error: "Not found" });
  res.json(rec);
});

export default router;