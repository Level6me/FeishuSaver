import { AxiosInstance } from "axios";
import { createAxiosInstance } from "../utils/axiosInstance";
import { ShareInfoResponse, FolderListResponse, SaveFileParams } from "../types/cloud";
import { injectable } from "inversify";
import { Request } from "express";
import { ICloudStorageService } from "@/types/services";
import { logger } from "../utils/logger";

@injectable()
export class TianyiService implements ICloudStorageService {
  private api: AxiosInstance;
  private account = "";
  private password = "";

  constructor() {
    this.api = createAxiosInstance("https://cloud.189.cn");
  }

  setAuth(account: string, password: string): void {
    this.account = account;
    this.password = password;
  }

  async setCookie(req: Request): Promise<void> {}

  async getShareInfo(shareCode: string, receiveCode?: string): Promise<ShareInfoResponse> {
    throw new Error("天翼云盘转存尚未实现");
  }

  async getFolderList(parentCid = "0"): Promise<FolderListResponse> {
    return {
      data: [
        { cid: "dummy1", name: "⚠️ 天翼云盘接口待补充真实协议", path: [] }
      ]
    };
  }

  async saveSharedFile(params: SaveFileParams): Promise<any> {
    throw new Error("天翼云盘转存尚未实现");
  }
}
