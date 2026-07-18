import Searcher from "../src/services/Searcher";

describe("HTML Parsing", () => {
  it("should parse HTML from Telegram web correctly", async () => {
    const mockHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <div class="tgme_header_link">
        <img src="https://example.com/logo.jpg" />
      </div>
      <div class="tgme_widget_message_wrap">
        <div class="tgme_widget_message" data-post="aliyun_share/1234">
          <div class="tgme_widget_message_text js-message_text">
            这是一个好电影标题<br>
            这是一些描述内容。
            <a href="https://www.aliyundrive.com/s/abcdefg">https://www.aliyundrive.com/s/abcdefg</a>
            <a href="#">#科幻电影</a>
          </div>
          <time datetime="2023-01-01T12:00:00Z"></time>
          <div class="tgme_widget_message_photo_wrap" style="background-image:url('https://example.com/photo.jpg')"></div>
        </div>
      </div>
    </body>
    </html>
    `;

    // Mock the Axios instance's get method safely
    const originalApi = (Searcher as any).api;
    (Searcher as any).api = {
      get: jest.fn().mockResolvedValue({ data: mockHtml })
    };

    try {
      const results = await Searcher.searchInWeb("/aliyun_share");
      
      expect(results.channelLogo).toBe("https://example.com/logo.jpg");
      expect(results.items).toHaveLength(1);
      
      const item = results.items[0];
      expect(item.messageId).toBe("1234");
      expect(item.title).toBe("这是一个好电影标题");
      expect(item.content).toContain("这是一些描述内容。");
      expect(item.cloudLinks).toBeDefined();
      expect(item.cloudLinks!.length).toBeGreaterThan(0);
      expect(item.cloudLinks![0]).toContain("abcdefg");
    } finally {
      // Restore the original API instance
      (Searcher as any).api = originalApi;
    }
  });
});
