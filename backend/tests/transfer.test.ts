import { Cloud115Service } from "../src/services/Cloud115Service";
import { QuarkService } from "../src/services/QuarkService";

describe("Cloud Transfer Services", () => {
  describe("115 Cloud", () => {
    // Skipping because it requires valid cookies and share codes
    it.skip("should fetch share info and folders", async () => {
      const service = new Cloud115Service();
      (service as any).cookie = "YOUR_115_COOKIE_HERE";
      
      const shareCode = "YOUR_SHARE_CODE";
      const receiveCode = "YOUR_RECEIVE_CODE"; 
      
      const shareInfo = await service.getShareInfo(shareCode, receiveCode);
      expect(shareInfo).toBeDefined();
      expect(shareInfo.data).toBeDefined();

      const folders = await service.getFolderList("0");
      expect(folders).toBeDefined();
      expect(folders.data).toBeDefined();
    });
  });

  describe("Quark Cloud", () => {
    // Skipping because it requires valid cookies
    it.skip("should fetch folders and share info", async () => {
      const service = new QuarkService();
      // Use process.env in real CI
      (service as any).cookie = "ctoken=YOUR_COOKIE...";
      
      const folders = await service.getFolderList("0");
      expect(folders).toBeDefined();
      
      const pwdId = "YOUR_PWD_ID";
      const passcode = "YOUR_PASSCODE";
      
      try {
        await service.getShareInfo(pwdId, passcode);
      } catch (error: any) {
        // We expect it to fail if the pwdId is invalid
        expect(error).toBeDefined();
      }
    });
  });
});
