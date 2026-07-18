import { AxiosInstance } from "axios";
import { createAxiosInstance } from "../utils/axiosInstance";
import { ShareInfoResponse, FolderListResponse, SaveFileParams } from "../types/cloud";
import { injectable } from "inversify";
import { Request } from "express";
import { ICloudStorageService } from "@/types/services";
import { logger } from "../utils/logger";

@injectable()
export class AliyunService implements ICloudStorageService {
  private api: AxiosInstance;
  private cookie: string = "";

  constructor() {
    this.api = createAxiosInstance("https://api.aliyundrive.com");
  }

  setCookieString(cookie: string): void {
    this.cookie = cookie;
  }

  async setCookie(req: Request): Promise<void> {
    // Implement token extraction if needed
  }

  async getShareInfo(shareCode: string, receiveCode?: string): Promise<ShareInfoResponse> {
    throw new Error("阿里云盘转存解析尚未实现");
  }

  async getFolderList(parentCid = "root"): Promise<FolderListResponse> {
    // TODO: Implement actual aliyun drive folder list API
    // returning dummy for now since Aliyun requires complex oauth/refresh tokens
    return {
      data: [
        { cid: "dummy1", name: "⚠️ 阿里云盘接口待补充真实协议", path: [] }
      ]
    };
  }

  async saveSharedFile(params: SaveFileParams): Promise<any> {
    throw new Error("阿里云盘转存尚未实现");
  }
}
