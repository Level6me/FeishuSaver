import "reflect-metadata";
import Searcher from "../src/services/Searcher";

describe("Web Search Integration", () => {
  // Skipping by default as it relies on external network and real telegram channels
  // Remove .skip if you want to run this locally
  it.skip("should search and parse items from a public telegram channel", async () => {
    const testChannel = "/aliyun_share"; 
    const results = await Searcher.searchInWeb(testChannel);
    
    expect(results).toBeDefined();
    expect(results.items).toBeDefined();
    
    if (results.items.length > 0) {
      const item = results.items[0];
      expect(item).toHaveProperty("messageId");
      expect(item).toHaveProperty("content");
      
      const cloudItems = results.items.filter(item => item.cloudLinks && item.cloudLinks.length > 0);
      if (cloudItems.length > 0) {
        expect(typeof cloudItems[0].cloudLinks![0]).toBe("string");
      }
    }
  }, 10000); // 10 seconds timeout
});
