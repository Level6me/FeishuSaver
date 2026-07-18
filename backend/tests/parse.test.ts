import Searcher from "../src/services/Searcher";

describe("Cloud Link Parsing", () => {
  it("should parse Aliyun drive links correctly", () => {
    const text = "这里是阿里云盘分享：https://www.aliyundrive.com/s/123456abcd 提取码: 1234";
    const result = (Searcher as any).extractCloudLinks(text);
    
    expect(result.cloudType).toBe("aliyun");
    expect(result.links.length).toBeGreaterThan(0);
    expect(result.links[0]).toContain("123456abcd");
  });

  it("should parse Quark drive links correctly", () => {
    const text = "夸克网盘链接：https://pan.quark.cn/s/abcdefg123 欢迎下载";
    const result = (Searcher as any).extractCloudLinks(text);
    
    expect(result.cloudType).toBe("quark");
    expect(result.links.length).toBeGreaterThan(0);
    expect(result.links[0]).toContain("abcdefg123");
  });

  it("should parse Baidu drive links correctly", () => {
    const text = "百度网盘: https://pan.baidu.com/s/1abc-def_ghi 提取码: 8888";
    const result = (Searcher as any).extractCloudLinks(text);
    
    expect(result.cloudType).toBe("baiduPan");
    expect(result.links.length).toBeGreaterThan(0);
    expect(result.links[0]).toContain("1abc-def_ghi");
  });

  it("should parse 123 pan links correctly", () => {
    const text = "123云盘: https://www.123pan.com/s/abc1234";
    const result = (Searcher as any).extractCloudLinks(text);
    
    expect(result.cloudType).toBe("pan123");
    expect(result.links.length).toBeGreaterThan(0);
    expect(result.links[0]).toContain("abc1234");
  });

  it("should handle text without cloud links", () => {
    const text = "没有网盘链接的普通文本";
    const result = (Searcher as any).extractCloudLinks(text);
    
    expect(result.cloudType).toBe("");
    expect(result.links).toHaveLength(0);
  });
});
