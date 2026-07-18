import "reflect-metadata";
import { container } from "./inversify.config";
import { TYPES } from "./core/types";
import { DatabaseService } from "./services/DatabaseService";
import { startFeishuBot } from "./FeishuBot";
import { logger } from "./utils/logger";

async function run() {
  try {
    // 1. 初始化 SQLite 数据库
    const db = container.get<DatabaseService>(TYPES.DatabaseService);
    await db.initialize();
    logger.info("数据库初始化成功");

    // 2. 仅启动飞书机器人长连接（不启动 Express HTTP 网页后台服务）
    startFeishuBot();
    logger.info("飞书机器人已独立启动！正在监听飞书消息...");
  } catch (error) {
    logger.error("机器人启动失败:", error);
    process.exit(1);
  }
}

run();
