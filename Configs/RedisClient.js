import { createClient } from "redis";
import { REDIS_URL, REDIS_PASSWORD } from "./ProDevConfig.js";

const redisClient = createClient({
  url: REDIS_URL,
  password: REDIS_PASSWORD,
});
// redisClient.connect();
redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});
export default redisClient;
