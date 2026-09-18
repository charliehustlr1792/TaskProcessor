const Redis = require("ioredis");
require("dotenv").config();

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const QUEUE_KEY = process.env.QUEUE_KEY || "workqueue:jobs";

module.exports = { redis, QUEUE_KEY };