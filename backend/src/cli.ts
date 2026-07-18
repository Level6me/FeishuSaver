import "reflect-metadata";
import { Command } from "commander";
import { container } from "./inversify.config";
import { TYPES } from "./core/types";
import { DatabaseService } from "./services/DatabaseService";
import Searcher from "./services/Searcher";
import { QuarkService } from "./services/QuarkService";
import { Cloud115Service } from "./services/Cloud115Service";
import { SettingService } from "./services/SettingService";

const program = new Command();

program
  .name("feishusaver-cli")
  .description("FeishuSaver 命令行界面，专为 Agent 和自动化设计")
  .version("1.0.0");

async function initDB() {
  const db = container.get<DatabaseService>(TYPES.DatabaseService);
  await db.initialize();
}

program
  .command("search <keyword>")
  .description("搜索资源")
  .action(async (keyword) => {
    try {
      await initDB();
      console.log(`[Search] 正在搜索: ${keyword}...`);
      const results = await Searcher.searchAll(keyword);
      console.log(JSON.stringify(results.data, null, 2));
      process.exit(0);
    } catch (error) {
      console.error("[Search Error]:", error);
      process.exit(1);
    }
  });

program
  .command("transfer-quark <pwdId> [passcode]")
  .description("使用夸克网盘转存")
  .action(async (pwdId, passcode) => {
    try {
      await initDB();
      const service = new QuarkService();
      // 获取用户设置（这里简化逻辑，直接用第一个管理员用户的 cookie 或在后面通过命令设置进去）
      const settingService = container.get<SettingService>(TYPES.SettingService);
      // NOTE: 在实际 Agent 用法中，可以传入 userId 或者通过 config-set 先配好 cookie
      console.log(`[Transfer-Quark] 获取分享信息...`);
      const shareInfo = await service.getShareInfo(pwdId, passcode || "");
      if (!shareInfo || !shareInfo.data || !shareInfo.data.list) {
          console.error("分享链接已失效或需要提取码");
          process.exit(1);
      }
      const folders = await service.getFolderList("0");
      if (!folders?.data?.length) {
          console.error("无法获取目标根目录，请检查 Cookie");
          process.exit(1);
      }
      const targetFolderId = folders.data[0].cid;
      console.log(`[Transfer-Quark] 执行转存到目录 ID: ${targetFolderId}...`);
      const result = await service.saveSharedFile({
        shareCode: pwdId,
        receiveCode: shareInfo.data.stoken || '',
        folderId: targetFolderId,
        fids: shareInfo.data.list.map((f: any) => f.fileId),
        fidTokens: shareInfo.data.list.map((f: any) => f.fileIdToken)
      });
      console.log("[Transfer-Quark Success]:", result);
      process.exit(0);
    } catch (error) {
      console.error("[Transfer-Quark Error]:", error);
      process.exit(1);
    }
  });

program
  .command("transfer-115 <shareCode> <receiveCode>")
  .description("使用 115 网盘转存")
  .action(async (shareCode, receiveCode) => {
    try {
      await initDB();
      const service = new Cloud115Service();
      console.log(`[Transfer-115] 获取分享信息...`);
      const shareInfo = await service.getShareInfo(shareCode, receiveCode);
      const folders = await service.getFolderList("0");
      if (!folders?.data?.length) {
          console.error("无法获取目标根目录，请检查 Cookie");
          process.exit(1);
      }
      const targetFolderId = folders.data[0].cid;
      console.log(`[Transfer-115] 执行转存到目录 ID: ${targetFolderId}...`);
      const result = await service.saveSharedFile({
        shareCode,
        receiveCode,
        folderId: targetFolderId,
        fids: shareInfo.data.list.map((f: any) => f.fileId)
      });
      console.log("[Transfer-115 Success]:", result);
      process.exit(0);
    } catch (error) {
      console.error("[Transfer-115 Error]:", error);
      process.exit(1);
    }
  });

program.parse();
