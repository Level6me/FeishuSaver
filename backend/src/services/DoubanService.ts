import { AxiosHeaders, AxiosInstance } from "axios";
import { createAxiosInstance } from "../utils/axiosInstance";

interface DoubanSubject {
  id: string;
  title: string;
  rate: string;
  cover: string;
  url: string;
  is_new: boolean;
}

export class DoubanService {
  private baseUrl: string;
  private api: AxiosInstance;

  constructor() {
    this.baseUrl = "https://movie.douban.com/j";
    this.api = createAxiosInstance(
      this.baseUrl,
      AxiosHeaders.from({
        accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        priority: "u=1, i",
        "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132", "Microsoft Edge";v="132"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        Referer: "https://movie.douban.com/",
        "Referrer-Policy": "unsafe-url",
      })
    );
  }

  async getHotList(params: {
    type: string;
    tag: string;
    page_limit: string;
    page_start: string;
  }): Promise<{ data: DoubanSubject[] }> {
    try {
      const response = await this.api.get("/search_subjects", {
        params: params,
      });
      if (response.data && response.data.subjects) {
        return {
          data: response.data.subjects,
        };
      } else {
        return {
          data: [],
        };
      }
    } catch (error) {
      console.error("Error fetching hot list:", error);
      throw error;
    }
  }
}
