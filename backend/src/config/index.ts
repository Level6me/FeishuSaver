import dotenv from "dotenv";

// 加载.env文件
dotenv.config();

interface Channel {
  id: string;
  name: string;
}

interface CloudPatterns {
  baiduPan: RegExp;
  tianyi: RegExp;
  aliyun: RegExp;
  pan115: RegExp;
  pan123: RegExp;
  quark: RegExp;
  yidong: RegExp;
}

interface Config {
  jwtSecret: string;
  telegram: {
    baseUrl: string;
    channels: Channel[];
  };
  cloudPatterns: CloudPatterns;
  app: {
    port: number;
    env: string;
  };
  database: {
    type: string;
    path: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

// 从环境变量读取频道配置
const getTeleChannels = (): Channel[] => {
  try {
    const channelsStr = process.env.TELE_CHANNELS;
    if (channelsStr) {
      return JSON.parse(channelsStr);
    }
  } catch (error) {
    console.warn("无法解析 TELE_CHANNELS 环境变量，使用默认配置");
  }

  // 默认配置
  return [
    { name: "115影视资源分享频道", id: "guaguale115" },
    { name: "115网盘资源分享频道", id: "hao115" },
    { name: "网盘资源收藏（夸克）", id: "yunpanshare" },
    { name: "网盘(高品质)影视", id: "alyp_1" },
    { name: "阿里云盘发布频道", id: "shareAliyun" },
    { name: "肯德基の4K影视综合电影云盘站", id: "XiangxiuNB" },
    { name: "夸克云盘综合资源", id: "Quark_Movies" },
    { name: "阿里云盘4K影视", id: "Aliyun_4K_Movies" },
    { name: "阿里云盘资源", id: "zaihuayun" },
    { name: "资源宇宙", id: "tgsearchers" },
    { name: "爱影115资源分享频道", id: "pan115_share" },
    { name: "盘酱酱Club", id: "PanjClub" },
    { name: "天翼云盘资源频道", id: "tianyirigeng" },
    { name: "123云盘资源频道", id: "xx123pan" },
    { name: "123云盘综合频道", id: "zyzhpd123" },
    { name: "天翼云盘资源发布频道", id: "cloudtianyi" },
    { name: "天翼云盘综合频道", id: "tyypzhpd" },
    { name: "奥斯卡4K蓝光（精品）影视磁力站", id: "Oscar_4Kmovies" },
    { name: "移动云盘资源分享", id: "ydypzyfx" },
    { name: "百度网盘综合频道", id: "bdwpzhpd" },
    { name: "综合频道", id: "yunpanall" },
    { name: "夸克浏览器二三事", id: "NewQuark" },
    { name: "阿里云盘吧（新）", id: "NewAliPan" },
    { name: "阿里云盘吧", id: "Q66share" },
    { name: "百度网盘资源分享", id: "BaiduCloudDisk" },
    { name: "网盘资源收藏（移动云盘）", id: "yunpan139" },
    { name: "网盘资源收藏（UC网盘）", id: "yunpanuc" },
    { name: "云盘盘", id: "yunpanpan" },
    { name: "云盘资源发布频道", id: "qixingzhenren" },
    { name: "爱影夸克频道", id: "pankuake_share" },
    { name: "热门短剧/擦边短剧/精选短剧/在线预览", id: "duanjucabian" },
    { name: "YOYO资源|夸克|短剧", id: "yoyokuakeduanju" },
    { name: "Shares_115_Channel", id: "Channel_Shares_115" },
    { name: "爷青回动画分享", id: "yeqingjie_GJG666" },
    { name: "迅雷云盘", id: "gotopan" },
    { name: "影巢", id: "oneonefivewpfx" },
    { name: "学习频道", id: "xxziliao" },
    { name: "学习频道2", id: "sndkdkdl" },
    { name: "学习频道3", id: "hsndn1" },
    { name: "学习频道4", id: "xuexixiaonengshou1" },
    { name: "帧影时光", id: "zhenyingsg" },
    { name: "【热门网剧在线】", id: "movielover8888_TV" },
    { name: "UC夸克百度迅雷资源分享", id: "ucquark" },
    { name: "短剧大全资源", id: "weichengduanju666" },
    { name: "影享空间", id: "yingxiangkj" },
    { name: "网盘资源(动画/动漫)频道", id: "alyp_Animation" },
    { name: "网盘资源（电影）频道", id: "alyp_4K_Movies" },
    { name: "bt网盘", id: "BTCloudlinks" }
  ];
};

export const config: Config = {
  app: {
    port: parseInt(process.env.PORT || "8009"),
    env: process.env.NODE_ENV || "development",
  },
  database: {
    type: "sqlite",
    path: "./data/database.sqlite",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: "6h",
  },
  jwtSecret: process.env.JWT_SECRET || "uV7Y$k92#LkF^q1b!",

  telegram: {
    baseUrl: process.env.TELEGRAM_BASE_URL || "https://t.me/s",
    channels: getTeleChannels(),
  },
  cloudPatterns: {
    baiduPan: /https?:\/\/(?:pan|yun)\.baidu\.com\/[^\s<>"]+/g,
    tianyi: /https?:\/\/cloud\.189\.cn\/[^\s<>"]+/g,
    aliyun: /https?:\/\/\w+\.(?:alipan|aliyundrive)\.com\/[^\s<>"]+/g,
    // pan115有两个域名 115.com 和 anxia.com 和 115cdn.com
    pan115: /https?:\/\/(?:115|anxia|115cdn)\.com\/s\/[^\s<>"]+/g,
    // 修改为匹配所有以123开头的域名
    // eslint-disable-next-line no-useless-escape
    pan123: /https?:\/\/(?:www\.)?123[^\/\s<>"]+\.com\/s\/[^\s<>"]+/g,
    quark: /https?:\/\/pan\.quark\.cn\/[^\s<>"]+/g,
    yidong: /https?:\/\/caiyun\.139\.com\/[^\s<>"]+/g,
  },
};
