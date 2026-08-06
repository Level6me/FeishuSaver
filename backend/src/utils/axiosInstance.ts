import axios, { AxiosInstance, AxiosRequestHeaders } from "axios";
import tunnel from "tunnel";

interface ProxyConfig {
  host: string;
  port: number;
}

export function createAxiosInstance(
  baseURL: string,
  headers?: AxiosRequestHeaders,
  useProxy: boolean = false,
  proxyConfig?: ProxyConfig,
  timeout: number = 10000
): AxiosInstance {
  let agent;
  if (useProxy && proxyConfig) {
    agent = tunnel.httpsOverHttp({
      proxy: proxyConfig,
    });
  }

  return axios.create({
    baseURL,
    timeout,
    headers,
    httpsAgent: useProxy ? agent : undefined,
    withCredentials: true,
  });
}
