import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export class FeishuNotifier {
  private static async getTenantAccessToken(): Promise<string | null> {
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;

    if (!appId || !appSecret) {
      logger.warn("Feishu App ID or Secret not found in environment.");
      return null;
    }

    try {
      const response = await axios.post("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
        app_id: appId,
        app_secret: appSecret
      });
      if (response.data.code === 0) {
        return response.data.tenant_access_token;
      } else {
        logger.error("Failed to get tenant access token: " + JSON.stringify(response.data));
        return null;
      }
    } catch (error) {
      logger.error("Network error getting tenant access token: " + error);
      return null;
    }
  }

  public static async pushMessage(content: string) {
    try {
      const boundIdPath = path.join(process.cwd(), '.feishu_chat_id');
      if (!fs.existsSync(boundIdPath)) {
        logger.info("No Feishu chat ID bound yet.");
        return;
      }
      const chatId = fs.readFileSync(boundIdPath, 'utf-8').trim();
      if (!chatId) return;

      const token = await this.getTenantAccessToken();
      if (!token) return;

      const payload = {
        receive_id: chatId,
        msg_type: "text",
        content: JSON.stringify({ text: content })
      };

      const res = await axios.post(
        "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id",
        payload,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (res.data.code === 0) {
        logger.info(`Push notification sent successfully to ${chatId}`);
      } else {
        logger.error(`Feishu push error: ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      logger.error("Error pushing message to Feishu: " + e);
    }
  }
}
