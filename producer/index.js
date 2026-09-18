const express = require("express");
const crypto = require("crypto");
require("dotenv").config();

const { redis, QUEUE_KEY } = require("../shared/redisClient");

const app = express();
app.use(express.json());

app.post("/enqueue", async (req, res) => {
  const { type, retries, payload } = req.body;

  if (!type) {
    return res.status(400).json({ error: "task type is required" });
  }
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "payload is required" });
  }

  const task = {
    taskId: crypto.randomUUID(),
    type,
    retries: retries ?? 0,
    payload,
    attempts: 0,
  };

  await redis.lpush(QUEUE_KEY, JSON.stringify(task));

  res.status(201).json({ status: "queued", taskId: task.taskId });
});

const PORT = process.env.PORT_PRODUCER || 4000;
app.listen(PORT, () => {
  console.log(`Producer listening on port ${PORT}`);
});