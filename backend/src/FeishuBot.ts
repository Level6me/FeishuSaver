import * as lark from '@larksuiteoapi/node-sdk';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';
import Searcher from './services/Searcher';
import { QuarkService } from './services/QuarkService';
import { Cloud115Service } from './services/Cloud115Service';
import { AliyunService } from './services/AliyunService';
import { TianyiService } from './services/TianyiService';
import { Pan123Service } from './services/Pan123Service';
import { container } from './inversify.config';
import { TYPES } from './core/types';
import { DatabaseService } from './services/DatabaseService';
import { DoubanService } from './services/DoubanService';

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


import axios from 'axios';
import { config } from './config/index';

const imageKeyCache = new Map<string, string>();
const userStates = new Map<string, string>();

function getChannelsList() {
  try {
    const channelsStr = process.env.TELE_CHANNELS;
    if (channelsStr) return JSON.parse(channelsStr);
  } catch (e) {}
  return config.telegram.channels;
}

function buildChannelManageCard(page = 0) {
  const channels = getChannelsList();
  const PAGE_SIZE = 15;
  const totalPages = Math.ceil(channels.length / PAGE_SIZE) || 1;
  const currentChannels = channels.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const elements: any[] = [];
  
  elements.push({
    "tag": "markdown",
    "content": `**已订阅 TG 频道 (共 ${channels.length} 个)**\n当前第 ${page + 1}/${totalPages} 页`
  });
  
  elements.push({ "tag": "hr" });

  currentChannels.forEach((c: any) => {
    elements.push({
      "tag": "column_set",
      "flex_mode": "none",
      "background_style": "default",
      "columns": [
        {
          "tag": "column",
          "width": "weighted",
          "weight": 3,
          "vertical_align": "center",
          "elements": [
            { "tag": "markdown", "content": `**${c.name}**\n<font color='grey'>ID: ${c.id}</font>` }
          ]
        },
        {
          "tag": "column",
          "width": "auto",
          "weight": 1,
          "vertical_align": "center",
          "elements": [
            {
              "tag": "button",
              "text": { "content": "❌ 删除", "tag": "plain_text" },
              "type": "danger",
              "value": { "action": "delete_tele_channel_by_id", "channel_id": c.id, "page": page }
            }
          ]
        }
      ]
    });
  });

  const paginationActions = [];
  if (page > 0) {
    paginationActions.push({
      "tag": "button",
      "text": { "content": "⬅️ 上一页", "tag": "plain_text" },
      "type": "default",
      "value": { "action": "manage_tele_channels_page", "page": page - 1 }
    });
  }
  if (page < totalPages - 1) {
    paginationActions.push({
      "tag": "button",
      "text": { "content": "下一页 ➡️", "tag": "plain_text" },
      "type": "default",
      "value": { "action": "manage_tele_channels_page", "page": page + 1 }
    });
  }

  if (paginationActions.length > 0) {
    elements.push({ "tag": "hr" });
    elements.push({
      "tag": "action",
      "actions": paginationActions
    });
  }

  elements.push({ "tag": "hr" });
  elements.push({
    "tag": "action",
    "actions": [
      {
        "tag": "button",
        "text": { "content": "➕ 新增频道", "tag": "plain_text" },
        "type": "primary",
        "value": { "action": "add_tele_channel" }
      },
      {
        "tag": "button",
        "text": { "content": "🔙 返回主配置", "tag": "plain_text" },
        "type": "default",
        "value": { "action": "back_to_main_config" }
      }
    ]
  });

  return {
    "config": { "update_multi": true },
    "header": {
      "title": { "tag": "plain_text", "content": "📡 TG 频道管理面板" },
      "template": "blue"
    },
    "elements": elements
  };
}

function buildConfigCard() {
  const quarkConfigured = !!process.env.QUARK_COOKIE;
  const cloud115Configured = !!process.env.CLOUD115_COOKIE;
  const aliyunConfigured = !!process.env.ALIYUN_COOKIE;
  const tianyiAccConfigured = !!process.env.TIANYI_ACCOUNT;
  const tianyiPwdConfigured = !!process.env.TIANYI_PASSWORD;
  const pan123AccConfigured = !!process.env.PAN123_ACCOUNT;
  const pan123PwdConfigured = !!process.env.PAN123_PASSWORD;
  
  return {
    "config": { "update_multi": true },
    "header": {
      "title": { "tag": "plain_text", "content": "⚙️ 系统配置面板" },
      "template": "blue"
    },
    "elements": [
      {
        "tag": "column_set",
        "flex_mode": "none",
        "background_style": "default",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "vertical_align": "center",
            "elements": [
              { "tag": "markdown", "content": "**☁️ 夸克网盘 Cookie**\n状态: " + (quarkConfigured ? "<font color='green'>✅ 已配置</font>" : "<font color='red'>❌ 未配置</font>") }
            ]
          },
          {
            "tag": "column",
            "width": "auto",
            "weight": 1,
            "vertical_align": "center",
            "elements": [
              {
                "tag": "button",
                "text": { "content": "配置", "tag": "plain_text" },
                "type": quarkConfigured ? "default" : "primary",
                "value": { "action": "set_quark_cookie" }
              },
              ...(quarkConfigured ? [{
                "tag": "button",
                "text": { "content": "📂 查看目录", "tag": "plain_text" },
                "type": "default",
                "value": { "action": "view_quark_dir", "parent_id": "0", "page": 1 }
              }] : [])
            ]
          }
        ]
      },
      { "tag": "hr" },
      {
        "tag": "column_set",
        "flex_mode": "none",
        "background_style": "default",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "vertical_align": "center",
            "elements": [
              { "tag": "markdown", "content": "**☁️ 115网盘 Cookie**\n状态: " + (cloud115Configured ? "<font color='green'>✅ 已配置</font>" : "<font color='red'>❌ 未配置</font>") }
            ]
          },
          {
            "tag": "column",
            "width": "auto",
            "weight": 1,
            "vertical_align": "center",
            "elements": [
              {
                "tag": "button",
                "text": { "content": "配置", "tag": "plain_text" },
                "type": cloud115Configured ? "default" : "primary",
                "value": { "action": "set_cloud115_cookie" }
              },
              ...(cloud115Configured ? [{
                "tag": "button",
                "text": { "content": "📂 查看目录", "tag": "plain_text" },
                "type": "default",
                "value": { "action": "view_115_dir", "parent_id": "0", "page": 1 }
              }] : [])
            ]
          }
        ]
      },
      { "tag": "hr" },

      {
        "tag": "column_set",
        "flex_mode": "none",
        "background_style": "default",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "vertical_align": "center",
            "elements": [
              { "tag": "markdown", "content": "**📡 TG 频道订阅管理**\n共 " + getChannelsList().length + " 个频道" }
            ]
          },
          {
            "tag": "column",
            "width": "auto",
            "weight": 1,
            "vertical_align": "center",
            "elements": [
              {
                "tag": "button",
                "text": { "content": "管理频道", "tag": "plain_text" },
                "type": "default",
                "value": { "action": "manage_tele_channels" }
              },
              {
                "tag": "button",
                "text": { "content": "频道列表", "tag": "plain_text" },
                "type": "primary",
                "value": { "action": "view_channels_list" }
              }
            ]
          }
        ]
      },
      { "tag": "hr" },
      {
        "tag": "markdown",
        "content": "💡 **提示:** 点击配置后，请直接在聊天框内回复。"
      }
    ]
  };
}


async function getDoubanAbstract(subjectId: string): Promise<string> {
  try {
    const res = await axios.get("https://movie.douban.com/j/subject_abstract?subject_id=" + subjectId, {
      headers: { 'Referer': 'https://movie.douban.com/' },
      timeout: 3000
    });
    if (res.data && res.data.subject) {
      const s = res.data.subject;
      const arr = [];
      if (s.release_year) arr.push(s.release_year);
      if (s.region) arr.push(s.region);
      if (s.types && s.types.length > 0) arr.push(s.types.join(' '));
      if (s.duration) arr.push(s.duration);
      if (s.directors && s.directors.length > 0) arr.push(s.directors.join('/'));
      if (s.actors && s.actors.length > 0) arr.push(s.actors.slice(0,3).join('/'));
      return arr.join(' / ');
    }
  } catch (e) {
    // Ignore abstract error
  }
  return "";
}

async function getFeishuImageKey(coverUrl: string, client: lark.Client): Promise<string | null> {
  if (imageKeyCache.has(coverUrl)) {
    return imageKeyCache.get(coverUrl)!;
  }
  try {
    const res = await axios.get(coverUrl, {
      responseType: 'arraybuffer',
      headers: { 'Referer': 'https://movie.douban.com/' },
      timeout: 5000
    });
    const uploadRes = await client.im.image.create({
      data: {
        image_type: 'message',
        image: res.data
      }
    });
    if (uploadRes?.image_key) {
      imageKeyCache.set(coverUrl, uploadRes.image_key);
      return uploadRes.image_key;
    }
  } catch (e) {
    logger.error('Upload image error:', e);
  }
  return null;
}

const searchCache = new Map<string, any>();
const cardStateCache = new Map<string, any>();



async function buildDoubanCard(type: string, tag: string, movies: any[], client: lark.Client, page: number = 0): Promise<any> {
  const tabs = [
    { title: "🔥热门电影", type: "movie", tag: "热门" },
    { title: "🆕最新电影", type: "movie", tag: "最新" },
    { title: "💎高分电影", type: "movie", tag: "豆瓣高分" },
    { title: "🧊冷门电影", type: "movie", tag: "冷门佳片" },
    { title: "🇨🇳华语电影", type: "movie", tag: "华语" },
    { title: "🇺🇸欧美电影", type: "movie", tag: "欧美" },
    { title: "📺热门剧集", type: "tv", tag: "热门" },
    { title: "🇨🇳国产剧集", type: "tv", tag: "国产剧" },
    { title: "🇺🇸热门美剧", type: "tv", tag: "美剧" },
    { title: "🇰🇷热门韩剧", type: "tv", tag: "韩剧" },
    { title: "🎈热门综艺", type: "tv", tag: "综艺" },
    { title: "🐼热门动漫", type: "tv", tag: "动漫" }
  ];

  const headerText = "🍿 发现好片";
  
  const actions = tabs.map((t) => ({
    "tag": "button",
    "text": { "content": (t.type === type && t.tag === tag ? '✅ ' : '') + t.title, "tag": "plain_text" },
    "type": t.type === type && t.tag === tag ? "primary" : "default",
    "value": { "action": "douban_discover", "type": t.type, "tag": t.tag, "page": 0 }
  }));

  const elements: any[] = [];

    const imgKeys = await Promise.all(movies.map(m => getFeishuImageKey(m.cover, client)));
    const abstracts = await Promise.all(movies.map(m => getDoubanAbstract(m.id)));
    
    // Split actions into rows if there are more than 10 (Feishu max per action element)
    const topActions = actions.slice(0, 6);
    const bottomActions = actions.slice(6);
    
    elements.push({ "tag": "action", "layout": "bisected", "actions": topActions });
    if (bottomActions.length > 0) {
      elements.push({ "tag": "action", "layout": "bisected", "actions": bottomActions });
    }
    elements.push({ "tag": "hr" });

    if (movies.length === 0) {
      elements.push({
        "tag": "div",
        "text": {
          "content": "⏳ 正在拉取数据，请稍候...",
          "tag": "plain_text"
        }
      });
    } else {
      for (let i = 0; i < movies.length; i += 2) {
        const pair = movies.slice(i, i + 2);
        const pairImgKeys = imgKeys.slice(i, i + 2);
        const pairAbstracts = abstracts.slice(i, i + 2);
        
        const columns = pair.map((movie, index) => {
          const imgKey = pairImgKeys[index];
          const abstract = pairAbstracts[index];
          
          const colElements: any[] = [];
          if (imgKey) {
            colElements.push({
              "tag": "img",
              "img_key": imgKey,
              "alt": { "content": movie.title, "tag": "plain_text" }
            });
          }
          
          // Add title and abstract
          colElements.push({
            "tag": "markdown",
            "content": "**" + movie.title + "**\n⭐️ 评分: " + (movie.rate || '暂无') + (movie.is_new ? ' 🆕' : '')
          });
          
          if (abstract) {
            colElements.push({
              "tag": "markdown",
              "content": "<font color='grey'>" + abstract + "</font>"
            });
          }
          
          return {
            "tag": "column",
            "width": "weighted",
            "weight": 1,
            "vertical_align": "top",
            "elements": colElements
          };
        });

        elements.push({
          "tag": "column_set",
          "flex_mode": "none",
          "background_style": "default",
          "columns": columns
        });
        
        // 在 column_set 下方添加对应的按钮，使用 bisected 保证强制对齐
        const pairActions = pair.map(movie => ({
          "tag": "button",
          "text": { "content": "🎬 搜资源", "tag": "plain_text" },
          "type": "default",
          "value": { "action": "search_douban", "keyword": movie.title }
        }));
        
        elements.push({
          "tag": "action",
          "layout": "bisected",
          "actions": pairActions
        });
        
        elements.push({ "tag": "hr" });
      }
    }
    const paginationActions: any[] = [];
    if (page > 0) {
      paginationActions.push({
        "tag": "button",
        "text": { "content": "⬅️ 上一页", "tag": "plain_text" },
        "type": "default",
        "value": { "action": "douban_discover", "type": type, "tag": tag, "page": page - 1 }
      });
    }
    if (movies.length === 10) {
      paginationActions.push({
        "tag": "button",
        "text": { "content": "下一页 ➡️", "tag": "plain_text" },
        "type": "default",
        "value": { "action": "douban_discover", "type": type, "tag": tag, "page": page + 1 }
      });
    }
    
    if (paginationActions.length > 0) {
      elements.push({
        "tag": "action",
        "actions": paginationActions
      });
    }
  return {
    "config": { "wide_screen_mode": true },
    "header": { "title": { "content": headerText, "tag": "plain_text" }, "template": "turquoise" },
    "elements": elements
  };
}

async function buildSearchCard(searchId: string, page: number, client: lark.Client): Promise<any> {
  const cacheVal = searchCache.get(searchId);
  const items = cacheVal && !Array.isArray(cacheVal) ? (cacheVal.items || []) : (cacheVal || []);
  const keyword = cacheVal && !Array.isArray(cacheVal) ? (cacheVal.keyword || '') : '';
  const total = items.length;
  const pageSize = 10;
  const maxPage = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, maxPage));
  
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = items.slice(startIdx, startIdx + pageSize);

   const imgPromises = pageItems.map((item: any) => {
    if (item.image) return getFeishuImageKey(item.image, client);
    return Promise.resolve(null);
  });
  const imgKeys = await Promise.all(imgPromises);

  const elements: any[] = [];
  pageItems.forEach((item: any, index: number) => {
    const pwdId = item.pwdId; 
    const imgKey = imgKeys[index];
    
    // 构造左图右文的布局
    const colSet: any = {
      "tag": "column_set",
      "flex_mode": "none",
      "background_style": "default",
      "columns": []
    };

    if (imgKey) {
      colSet.columns.push({
        "tag": "column",
        "width": "weighted",
        "weight": 1,
        "vertical_align": "top",
        "elements": [
          {
            "tag": "img",
            "img_key": imgKey,
            "alt": { "content": item.title || "cover", "tag": "plain_text" }
          }
        ]
      });
    }

    let mdContent = `**${startIdx + index + 1}. ${item.title}**\n`;
    if (item.cloudType) mdContent += `☁️ 云盘类型: ${item.cloudType}\n`;
    if (item.content) {
       let cleanDesc = item.content.replace(/^名称[:：].*?描述[:：]\s*/, '').replace(/^描述[:：]\s*/, '');
       
       let desc = cleanDesc;
       const terms = keyword ? keyword.toLowerCase().split(/\s+/).filter((t: string) => t.length > 0) : [];
       const titleContainsAll = terms.every((term: string) => (item.title || '').toLowerCase().includes(term));
       
       if (!titleContainsAll && terms.length > 0) {
           let matchedTermIndex = -1;
           for (const term of terms) {
               const idx = cleanDesc.toLowerCase().indexOf(term);
               if (idx !== -1) {
                   matchedTermIndex = idx;
                   break;
               }
           }
           if (matchedTermIndex !== -1) {
               const start = Math.max(0, matchedTermIndex - 30);
               const end = Math.min(cleanDesc.length, matchedTermIndex + 45);
               desc = (start > 0 ? '...' : '') + cleanDesc.substring(start, end) + (end < cleanDesc.length ? '...' : '');
           } else {
               desc = cleanDesc.length > 75 ? cleanDesc.substring(0, 75) + '...' : cleanDesc;
           }
       } else {
           desc = cleanDesc.length > 75 ? cleanDesc.substring(0, 75) + '...' : cleanDesc;
       }
       
       mdContent += `📝 介绍: <font color='grey'>${desc}</font>\n`;
    }
    
    if (item.channel) {
       mdContent += `<font color='grey'>来源于: ${item.channel}</font>\n`;
    }

    colSet.columns.push({
      "tag": "column",
      "width": "weighted",
      "weight": imgKey ? 2 : 3, // 如果有图，文字占2/3宽度；没图占满
      "vertical_align": "top",
      "elements": [
        {
          "tag": "markdown",
          "content": mdContent.trim()
        }
      ]
    });
    
    elements.push(colSet);
    
    // 按钮放在最下方
    elements.push({
      "tag": "action",
      "layout": "bisected",
      "actions": [
        {
          "tag": "button",
          "text": { "content": "📑 资源详情", "tag": "plain_text" },
          "type": "default",
          "value": { "action": "view_details", "pwdId": pwdId }
        },
        {
          "tag": "button",
          "text": { "content": "💾 一键转存", "tag": "plain_text" },
          "type": "primary",
          "value": { "action": "transfer", "pwdId": pwdId }
        }
      ]
    });
    if (index < pageItems.length - 1) {
       elements.push({ "tag": "hr" });
    }
  });

  if (elements.length === 0) {
    elements.push({ "tag": "div", "text": { "content": "没有找到已配置支持的资源~", "tag": "lark_md" } });
  }

  if (maxPage > 1) {
    const pageActions = [];
    if (currentPage > 1) {
      pageActions.push({
        "tag": "button",
        "text": { "content": "⬅️ 上一页", "tag": "plain_text" },
        "value": { "action": "change_page", "searchId": searchId, "page": currentPage - 1 }
      });
    }
    pageActions.push({
      "tag": "button",
      "text": { "content": `${currentPage} / ${maxPage}`, "tag": "plain_text" },
      "type": "default",
      "value": { "action": "noop" }
    });
    if (currentPage < maxPage) {
      pageActions.push({
        "tag": "button",
        "text": { "content": "下一页 ➡️", "tag": "plain_text" },
        "value": { "action": "change_page", "searchId": searchId, "page": currentPage + 1 }
      });
    }
    
    elements.push({ "tag": "hr" });
    elements.push({
      "tag": "action",
      "actions": pageActions
    });
  }

  return {
    "config": { "wide_screen_mode": true },
    "header": { "title": { "content": `🔍 搜索结果 (${total}条可用)`, "tag": "plain_text" }, "template": "blue" },
    "elements": elements
  };
}

export function startFeishuBot() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    logger.warn('Feishu bot credentials not configured, skipping bot startup.');
    return;
  }

  const client = new lark.Client({ appId, appSecret });
  const wsClient = new lark.WSClient({ appId, appSecret });

  const eventDispatcher = new lark.EventDispatcher({}).register({
    'im.message.receive_v1': async (data) => {
      const chatId = data.message.chat_id;
      const messageId = data.message.message_id;
      
      try {
        fs.writeFileSync(path.join(process.cwd(), '.feishu_chat_id'), chatId);
      } catch (e) {
        logger.error(`Failed to bind chat_id: ${e}`);
      }

      if (data.message.message_type !== 'text') return;
      
      const content = JSON.parse(data.message.content);
      const text = content.text ? content.text.trim() : '';
      const openId = data.sender?.sender_id?.open_id;

      if (openId && userStates.has(openId)) {
        const state = userStates.get(openId);
        let envKey = '';
        let successMsg = '';

        if (state === 'quark_cookie') {
          envKey = 'QUARK_COOKIE';
          successMsg = '✅ 夸克 Cookie 已更新保存！';
        } else if (state === 'cloud115_cookie') {
          envKey = 'CLOUD115_COOKIE';
          successMsg = '✅ 115网盘 Cookie 已更新保存！';
        } else if (state === 'aliyun_cookie') {
          envKey = 'ALIYUN_COOKIE';
          successMsg = '✅ 阿里云盘 Cookie 已更新保存！';
        } else if (state === 'tianyi_auth') {
          successMsg = '✅ 天翼云盘配置 已更新保存！';
        } else if (state === 'pan123_auth') {
          successMsg = '✅ 123网盘配置 已更新保存！';
        } else if (state === 'add_tele_channel') {
          envKey = 'TELE_CHANNELS';
          successMsg = '✅ 频道添加成功！';
        }
        
        if (envKey || state === 'tianyi_auth' || state === 'pan123_auth') {
          let envValue = text;
          
          if (state === 'tianyi_auth' || state === 'pan123_auth') {
            const parts = text.split(/,|，/);
            if (parts.length >= 2) {
              const account = parts[0].trim();
              const password = parts[1].trim();
              
              const accountKey = state === 'tianyi_auth' ? 'TIANYI_ACCOUNT' : 'PAN123_ACCOUNT';
              const passwordKey = state === 'tianyi_auth' ? 'TIANYI_PASSWORD' : 'PAN123_PASSWORD';
              
              process.env[accountKey] = account;
              process.env[passwordKey] = password;
              
              try {
                let envContent = '';
                if (fs.existsSync(path.join(process.cwd(), '.env'))) {
                  envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
                }
                const regexAcc = new RegExp(`^${accountKey}=.*`, 'm');
                if (regexAcc.test(envContent)) {
                  envContent = envContent.replace(regexAcc, `${accountKey}=${account}`);
                } else {
                  envContent += `\n${accountKey}=${account}\n`;
                }
                
                const regexPwd = new RegExp(`^${passwordKey}=.*`, 'm');
                if (regexPwd.test(envContent)) {
                  envContent = envContent.replace(regexPwd, `${passwordKey}=${password}`);
                } else {
                  envContent += `\n${passwordKey}=${password}\n`;
                }
                
                fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
              } catch (e) {
                logger.error('Failed to update .env', e);
              }
            } else {
              return client.im.message.reply({ path: { message_id: messageId }, data: { content: JSON.stringify({ text: "❌ 格式错误，请使用: 账号,密码" }), msg_type: 'text' }});
            }
          } else {
            if (state === 'add_tele_channel') {
              const parts = text.split(/,|，/);
              if (parts.length >= 2) {
                const channels = getChannelsList();
                const newId = parts[1].trim();
                const newName = parts[0].trim();
                if (channels.some((c: any) => c.id === newId)) {
                  userStates.delete(openId);
                  return client.im.message.reply({ path: { message_id: messageId }, data: { content: JSON.stringify({ text: `❌ 频道添加失败，频道ID ${newId} 已存在！` }), msg_type: 'text' }});
                }
                channels.push({ name: newName, id: newId });
                envValue = JSON.stringify(channels);
              } else {
                return client.im.message.reply({ path: { message_id: messageId }, data: { content: JSON.stringify({ text: "❌ 格式错误，请使用: 频道名,频道ID" }), msg_type: 'text' }});
              }
            }
            
            process.env[envKey] = envValue;
            try {
              let envContent = '';
              if (fs.existsSync(path.join(process.cwd(), '.env'))) {
                envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
              }
              const regex = new RegExp(`^${envKey}=.*`, 'm');
              if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${envKey}=${envValue}`);
              } else {
                envContent += `\n${envKey}=${envValue}\n`;
              }
              fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
            } catch (e) {
              logger.error('Failed to update .env', e);
            }
          }
          
          userStates.delete(openId);
          
          await client.im.message.reply({
            path: { message_id: messageId },
            data: { content: JSON.stringify({ text: successMsg }), msg_type: 'text' }
          });
          
          if (state === 'add_tele_channel') {
            await client.im.message.reply({
              path: { message_id: messageId },
              data: { content: JSON.stringify(buildChannelManageCard(0)), msg_type: 'interactive' }
            });
          } else {
            await client.im.message.reply({
              path: { message_id: messageId },
              data: { content: JSON.stringify(buildConfigCard()), msg_type: 'interactive' }
            });
          }
          return null;
        }
      }

      if (text === '/config') {
        client.im.message.reply({
          path: { message_id: messageId },
          data: { content: JSON.stringify(buildConfigCard()), msg_type: 'interactive' }
        });
        return null;
      }

      if (text.startsWith('/search ')) {
        const keyword = text.slice(8).trim();
        if (!keyword) return;
        
        client.im.message.reply({
          path: { message_id: messageId },
          data: { content: JSON.stringify({ text: `⏳ 正在搜索: ${keyword}...` }), msg_type: 'text' }
        });

        Searcher.searchAll(keyword).then(async (results) => {
          const allItems = results.data.flatMap((channel: any) => channel.list || []);
          
          const hasQuark = !!process.env.QUARK_COOKIE;
          const maybeValidItems: any[] = [];
          for (const item of allItems) {
            const quarkLink = item.cloudLinks?.find((link: string) => /https?:\/\/pan\.quark\.cn\/[^\s<>"]+/.test(link));
            if (quarkLink && hasQuark) {
              const match = quarkLink.match(/\/s\/([a-zA-Z0-9]+)/);
              const pwdId = match ? match[1] : item.messageId;
              if (pwdId) {
                maybeValidItems.push({
                  ...item,
                  pwdId,
                  cloudType: 'quark',
                  cloudLinks: [quarkLink]
                });
              }
            }
          }
          
          const validItems: any[] = [];
          const service = new QuarkService();
          service.setCookieString(process.env.QUARK_COOKIE || "");
          
          for (let i = 0; i < maybeValidItems.length; i += 10) {
             const chunk = maybeValidItems.slice(i, i + 10);
             const promises = chunk.map(async (item) => {
                const isValid = await service.checkShareValid(item.pwdId);
                return { item, isValid };
             });
             const res = await Promise.all(promises);
             validItems.push(...res.filter(r => r.isValid).map(r => r.item));
          }
          
          // Sort items by title matching relevance with normalization
          const normalizeText = (text: string): string => {
            if (!text) return '';
            return text.toLowerCase().replace(/[\u00b7\u2022\u2027\u30fb\.\s\-\_]/g, '');
          };
          const normalizedTerms = keyword 
            ? keyword.split(/\s+/).map((t: string) => normalizeText(t)).filter((t: string) => t.length > 0) 
            : [];
          validItems.sort((a: any, b: any) => {
            const aTitleMatch = normalizedTerms.every((term: string) => normalizeText(a.title || '').includes(term));
            const bTitleMatch = normalizedTerms.every((term: string) => normalizeText(b.title || '').includes(term));
            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;
            return 0;
          });
          
          const searchId = messageId;
          searchCache.set(searchId, { keyword, items: validItems });
          
          const cardJson = await buildSearchCard(searchId, 1, client);

          await client.im.message.reply({
            path: { message_id: messageId },
            data: { content: JSON.stringify(cardJson), msg_type: 'interactive' }
          });
        }).catch(async (error) => {
          await client.im.message.reply({
            path: { message_id: messageId },
            data: { content: JSON.stringify({ text: `❌ 搜索失败: ${error}` }), msg_type: 'text' }
          });
        });
        return null;
      
      } else if (text.startsWith('/hot') || text.startsWith('/discover')) {
        const type = 'movie';
        const tag = '热门';
        
        client.im.message.reply({
          path: { message_id: messageId },
          data: { content: JSON.stringify({ text: "⏳ 正在为您拉取豆瓣榜单..." }), msg_type: 'text' }
        }).then(async (msgResp) => {
          try {
             const ds = container.get<DoubanService>(TYPES.DoubanService);
             const res = await ds.getHotList({ type, tag, page_limit: "10", page_start: "0" });
             const cardJson = await buildDoubanCard(type, tag, res.data || [], client);
             const msgResp2 = await client.im.message.reply({
                path: { message_id: messageId },
                data: { content: JSON.stringify(cardJson), msg_type: 'interactive' }
             });
             if (msgResp2.data && msgResp2.data.message_id) {
               cardStateCache.set(msgResp2.data.message_id, cardJson);
             }
          } catch(e) {
             logger.error('Douban Hot Error:', e);
          }
        });
        return null;
} else if (text.startsWith('/transfer-quark ')) {
        const args = text.slice(16).trim().split(' ');
        const pwdId = args[0];
        const passcode = args[1] || '';
        
        if (!pwdId) return;

        client.im.message.reply({
          path: { message_id: messageId },
          data: { content: JSON.stringify({ text: `⏳ 正在为您获取夸克网盘目录结构，请稍候...` }), msg_type: 'text' }
        });

        (async () => {
          try {
            const db = container.get<DatabaseService>(TYPES.DatabaseService);
            if (!db) throw new Error("Database not initialized");

            const service = new QuarkService();
            service.setCookieString(process.env.QUARK_COOKIE || "");
            
            // Check share link first
            const shareInfo = await service.getShareInfo(pwdId, passcode);
            if (!shareInfo || !shareInfo.data || !shareInfo.data.list) {
              throw new Error("分享链接已失效或需要提取码");
            }

            const folders = await service.getFolderList("0");
            const items = folders?.data || [];
            
            await client.im.message.reply({
              path: { message_id: messageId },
              data: {
                content: JSON.stringify(buildSaveDirCard("夸克网盘", pwdId, passcode, items, "0", 1)),
                msg_type: 'interactive'
              }
            });
          } catch (error: any) {
            await client.im.message.reply({
              path: { message_id: messageId },
              data: { content: JSON.stringify({ text: `❌ 无法加载目录: ${error.message || error}` }), msg_type: 'text' }
            });
          }
        })();
        return null;
      } else {
          await client.im.message.reply({
             path: { message_id: messageId },
             data: { content: JSON.stringify({ text: `🤖 欢迎使用 FeishuSaver Bot!\n支持的命令：\n/search <关键字>\n/transfer-quark <分享ID> [提取码]` }), msg_type: 'text' }
           });
      }
    },
    'card.action.trigger': async (data: any) => {
      logger.info('Card action triggered with data: ' + JSON.stringify(data));
      const actionValue = data.action.value;
      const pwdId = actionValue.pwdId;

      if (actionValue.action === 'set_quark_cookie') {
        const openId = data.operator?.open_id || data.open_id;
        if (openId) { userStates.set(openId, 'quark_cookie'); return { toast: { type: "info", content: "请在对话框中发送您的夸克 Cookie" } }; }
      }
      if (actionValue.action === 'set_cloud115_cookie') {
        const openId = data.operator?.open_id || data.open_id;
        if (openId) { userStates.set(openId, 'cloud115_cookie'); return { toast: { type: "info", content: "请在对话框中发送您的 115网盘 Cookie" } }; }
      }
      if (actionValue.action === 'set_aliyun_cookie') {
        const openId = data.operator?.open_id || data.open_id;
        if (openId) { userStates.set(openId, 'aliyun_cookie'); return { toast: { type: "info", content: "请在对话框中发送您的阿里云盘 Cookie" } }; }
      }
      if (actionValue.action === 'set_tianyi_auth') {
        const openId = data.operator?.open_id || data.open_id;
        if (openId) { userStates.set(openId, 'tianyi_auth'); return { toast: { type: "info", content: "请回复格式: 账号,密码 (例如: username,123456)" } }; }
      }
      if (actionValue.action === 'set_pan123_auth') {
        const openId = data.operator?.open_id || data.open_id;
        if (openId) { userStates.set(openId, 'pan123_auth'); return { toast: { type: "info", content: "请回复格式: 账号,密码 (例如: username,123456)" } }; }
      }

      if (actionValue.action === 'view_quark_dir') {
        try {
          const service = new QuarkService();
          service.setCookieString(process.env.QUARK_COOKIE || "");
          const res = await service.getFolderList(actionValue.parent_id || "0");
          const items = res.data || [];
          return { card: { type: "raw", data: buildDirCard("夸克网盘", items, actionValue.parent_id || "0", Number(actionValue.page) || 1) } };
        } catch (e: any) {
          return { toast: { type: "error", content: "读取夸克目录失败: " + e.message } };
        }
      }

      if (actionValue.action === 'view_115_dir') {
        try {
          const service = new Cloud115Service();
          service.setCookieString(process.env.CLOUD115_COOKIE || "");
          const res = await service.getFolderList(actionValue.parent_id || "0");
          const items = res.data || [];
          return { card: { type: "raw", data: buildDirCard("115网盘", items, actionValue.parent_id || "0", Number(actionValue.page) || 1) } };
        } catch (e: any) {
          return { toast: { type: "error", content: "读取115目录失败: " + e.message } };
        }
      }

      if (actionValue.action === 'view_aliyun_dir') {
        try {
          const service = new AliyunService();
          service.setCookieString(process.env.ALIYUN_COOKIE || "");
          const res = await service.getFolderList(actionValue.parent_id || "root");
          const items = res.data || [];
          return { card: { type: "raw", data: buildDirCard("阿里云盘", items, actionValue.parent_id || "root", Number(actionValue.page) || 1) } };
        } catch (e: any) {
          return { toast: { type: "error", content: "读取阿里云目录失败: " + e.message } };
        }
      }

      if (actionValue.action === 'view_tianyi_dir') {
        try {
          const service = new TianyiService();
          service.setAuth(process.env.TIANYI_ACCOUNT || "", process.env.TIANYI_PASSWORD || "");
          const res = await service.getFolderList(actionValue.parent_id || "0");
          const items = res.data || [];
          return { card: { type: "raw", data: buildDirCard("天翼云盘", items, actionValue.parent_id || "0", Number(actionValue.page) || 1) } };
        } catch (e: any) {
          return { toast: { type: "error", content: "读取天翼云目录失败: " + e.message } };
        }
      }

      if (actionValue.action === 'view_pan123_dir') {
        try {
          const service = new Pan123Service();
          service.setAuth(process.env.PAN123_ACCOUNT || "", process.env.PAN123_PASSWORD || "");
          const res = await service.getFolderList(actionValue.parent_id || "0");
          const items = res.data || [];
          return { card: { type: "raw", data: buildDirCard("123网盘", items, actionValue.parent_id || "0", Number(actionValue.page) || 1) } };
        } catch (e: any) {
          return { toast: { type: "error", content: "读取123网盘目录失败: " + e.message } };
        }
      }

      if (actionValue.action === 'nav_save_dir') {
        try {
           let items: any[] = [];
           if (actionValue.drive === '夸克网盘') {
             const service = new QuarkService();
             service.setCookieString(process.env.QUARK_COOKIE || "");
             const res = await service.getFolderList(actionValue.parent_id);
             items = res.data || [];
           } else if (actionValue.drive === '115网盘') {
             const service = new Cloud115Service();
             service.setCookieString(process.env.CLOUD115_COOKIE || "");
             const res = await service.getFolderList(actionValue.parent_id);
             items = res.data || [];
           }
           return { card: { type: "raw", data: buildSaveDirCard(actionValue.drive, actionValue.pwdId, actionValue.passcode, items, actionValue.parent_id, Number(actionValue.page) || 1) } };
        } catch (e: any) {
           return { toast: { type: "error", content: "加载目录失败: " + e.message } };
        }
      }

      if (actionValue.action === 'do_save_dir') {
         try {
           if (actionValue.drive === '夸克网盘') {
              const service = new QuarkService();
              service.setCookieString(process.env.QUARK_COOKIE || "");
              const shareInfo = await service.getShareInfo(actionValue.pwdId, actionValue.passcode);
              if (!shareInfo || !shareInfo.data || !shareInfo.data.list) throw new Error("分享链接失效或提取码错误");
              await service.saveSharedFile({
                shareCode: actionValue.pwdId,
                receiveCode: shareInfo.data.stoken || '',
                folderId: actionValue.target_id,
                fids: shareInfo.data.list.map((f: any) => f.fileId),
                fidTokens: shareInfo.data.list.map((f: any) => f.fileIdToken)
              });
           } else if (actionValue.drive === '115网盘') {
              const service = new Cloud115Service();
              service.setCookieString(process.env.CLOUD115_COOKIE || "");
              // NOTE: 115 share parser logic here requires different implementation, but left here for future.
           }
           return { card: { type: "raw", data: {
             "config": { "update_multi": true },
             "header": { "title": { "content": "✅ 转存成功", "tag": "plain_text" }, "template": "green" },
             "elements": [ { "tag": "markdown", "content": `资源已成功保存到您的 **${actionValue.drive}** 指定目录中！` } ]
           } } };
         } catch (e: any) {
           return { toast: { type: "error", content: "转存失败: " + e.message } };
         }
      }

      if (actionValue.action === 'manage_tele_channels') {
        return { card: { type: "raw", data: buildChannelManageCard(0) } };
      }
      if (actionValue.action === 'view_channels_list') {
        return { card: { type: "raw", data: buildChannelsListCard() } };
      }
      if (actionValue.action === 'manage_tele_channels_page') {
        return { card: { type: "raw", data: buildChannelManageCard(Number(actionValue.page) || 0) } };
      }
      if (actionValue.action === 'back_to_main_config') {
        return { card: { type: "raw", data: buildConfigCard() } };
      }
      if (actionValue.action === 'add_tele_channel') {
        const openId = data.operator?.open_id || data.open_id;
        if (openId) {
          userStates.set(openId, 'add_tele_channel');
          return { toast: { type: "info", content: "请在对话框发送频道信息 (格式: 频道名称,频道ID)" } };
        }
      }
      if (actionValue.action === 'delete_tele_channel_by_id') {
        const idToDelete = actionValue.channel_id;
        const page = Number(actionValue.page) || 0;
        let channels = getChannelsList();
        channels = channels.filter((c: any) => c.id !== idToDelete);
        const text = JSON.stringify(channels);
        process.env.TELE_CHANNELS = text;
        try {
          let envContent = '';
          if (fs.existsSync(path.join(process.cwd(), '.env'))) {
            envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
          }
          const regex = new RegExp(`^TELE_CHANNELS=.*`, 'm');
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `TELE_CHANNELS=${text}`);
          } else {
            envContent += `\nTELE_CHANNELS=${text}\n`;
          }
          fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
        } catch (e) {
          logger.error('Failed to update .env', e);
        }
        return { card: { type: "raw", data: buildChannelManageCard(page) }, toast: { type: "success", content: "✅ 删除成功" } };
      }

      if (actionValue.action === 'douban_discover') {
        const type = actionValue.type;
        const tag = actionValue.tag;
        const page = Number(actionValue.page) || 0;
        const pageStart = (page * 10).toString();
        const openMessageId = data.context?.open_message_id;
        if (!openMessageId) return;

        (async () => {
          try {
             const ds = container.get<DoubanService>(TYPES.DoubanService);
             const res = await ds.getHotList({ type, tag, page_limit: "10", page_start: pageStart });
             const cardJson = await buildDoubanCard(type, tag, res.data || [], client, page);
             cardStateCache.set(openMessageId, cardJson);
             await client.im.message.patch({
                path: { message_id: openMessageId },
                data: { content: JSON.stringify(cardJson) }
             });
          } catch(e) {
             logger.error('Douban Discover Update Error:', e);
          }
        })();
        
        const loadingCard = await buildDoubanCard(type, tag, [], client, page);
        return {
           card: { type: "raw", data: loadingCard },
           toast: { type: "info", content: "🎬 正在为您拉取豆瓣榜单..." }
        };
      }

      if (actionValue.action === 'search_douban') {
        const keyword = actionValue.keyword;
        const openMessageId = data.context?.open_message_id;
        
        (async () => {
           try {
              // Same logic as /search
              const results = await Searcher.searchAll(keyword);
              const allItems = results.data.flatMap((channel: any) => channel.list || []);
              const hasQuark = !!process.env.QUARK_COOKIE;
              const maybeValidItems: any[] = [];
              for (const item of allItems) {
                const quarkLink = item.cloudLinks?.find((link: string) => /https?:\/\/pan\.quark\.cn\/[^\s<>"]+/.test(link));
                if (quarkLink && hasQuark) {
                  const match = quarkLink.match(/\/s\/([a-zA-Z0-9]+)/);
                  const pwdId = match ? match[1] : item.messageId;
                  if (pwdId) {
                    maybeValidItems.push({
                      ...item,
                      pwdId,
                      cloudType: 'quark',
                      cloudLinks: [quarkLink]
                    });
                  }
                }
              }
              const validItems: any[] = [];
              const service = new QuarkService();
              service.setCookieString(process.env.QUARK_COOKIE || "");
              for (let i = 0; i < maybeValidItems.length; i += 10) {
                 const chunk = maybeValidItems.slice(i, i + 10);
                 const promises = chunk.map(async (item) => {
                    const isValid = await service.checkShareValid(item.pwdId);
                    return { item, isValid };
                 });
                 const res = await Promise.all(promises);
                 validItems.push(...res.filter(r => r.isValid).map(r => r.item));
              }
              // Sort items by title matching relevance with normalization
              const normalizeText = (text: string): string => {
                if (!text) return '';
                return text.toLowerCase().replace(/[\u00b7\u2022\u2027\u30fb\.\s\-\_]/g, '');
              };
              const normalizedTerms = keyword 
                ? keyword.split(/\s+/).map((t: string) => normalizeText(t)).filter((t: string) => t.length > 0) 
                : [];
              validItems.sort((a: any, b: any) => {
                const aTitleMatch = normalizedTerms.every((term: string) => normalizeText(a.title || '').includes(term));
                const bTitleMatch = normalizedTerms.every((term: string) => normalizeText(b.title || '').includes(term));
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                return 0;
              });
              
              const searchId = openMessageId + '_' + Date.now();
              searchCache.set(searchId, { keyword, items: validItems });
              const cardJson = await buildSearchCard(searchId, 1, client);
              
              if (fs.existsSync(path.join(process.cwd(), '.feishu_chat_id'))) {
                 const chatId = fs.readFileSync(path.join(process.cwd(), '.feishu_chat_id'), 'utf8');
                 await client.im.message.create({
                    params: { receive_id_type: 'chat_id' },
                    data: {
                       receive_id: chatId,
                       msg_type: 'interactive',
                       content: JSON.stringify(cardJson)
                    }
                 });
              } else {
                 await client.im.message.reply({
                   path: { message_id: openMessageId },
                   data: { content: JSON.stringify(cardJson), msg_type: 'interactive' }
                 });
              }
           } catch(e) {
              logger.error('Search Douban Error:', e);
           }
        })();
        return { toast: { type: "info", content: "🔍 正在为您搜索: " + keyword } };
      }

      if (actionValue.action === 'change_page') {
        const searchId = actionValue.searchId;
        const page = Number(actionValue.page) || 1;
        
        if (!searchCache.has(searchId)) {
          return { toast: { type: "error", content: "搜索结果已过期，请重新搜索" } };
        }
        
        const cardJson = await buildSearchCard(searchId, page, client);
        return {
          card: { type: "raw", data: cardJson },
          toast: { type: "info", content: `已切换至第 ${page} 页` }
        };
      }

      if (actionValue.action === 'view_details' || actionValue.action === 'view_details_page') {
        const openMessageId = data.context?.open_message_id;
        if (!openMessageId) return { toast: { type: "error", content: "无法获取原消息上下文" } };
        const page = Number(actionValue.page) || 1;

        (async () => {
          try {
            const service = new QuarkService();
            service.setCookieString(process.env.QUARK_COOKIE || "");
            const shareInfo = await service.getShareInfoDeep(pwdId, "", page);
            if (!shareInfo || !shareInfo.data || !shareInfo.data.list) {
              throw new Error("分享链接已失效或需要提取码");
            }
            
            const fileList = shareInfo.data.list.map((f: any) => {
               const sizeStr = f.size ? ` (${formatBytes(f.size)})` : '';
               return `📄 ${f.file_name || f.fileName || '未知文件'}${sizeStr}`;
            }).join('\n');
            let fileStr = fileList || "目录为空";
            if (fileStr.length > 2000) {
               fileStr = fileStr.substring(0, 2000) + "\n... (更多文件已省略)";
            }
            
            const elements: any[] = [
              { "tag": "div", "text": { "content": fileStr, "tag": "lark_md" } }
            ];
            
            if (shareInfo.data.hasMore || page > 1) {
              const pageActions = [];
              if (page > 1) {
                  pageActions.push({
                      "tag": "button",
                      "text": { "content": "⬅️ 上一页", "tag": "plain_text" },
                      "value": { "action": "view_details_page", "pwdId": pwdId, "page": page - 1 }
                  });
              }
              if (shareInfo.data.hasMore) {
                  pageActions.push({
                      "tag": "button",
                      "text": { "content": "下一页 ➡️", "tag": "plain_text" },
                      "value": { "action": "view_details_page", "pwdId": pwdId, "page": page + 1 }
                  });
              }
              if (pageActions.length > 0) {
                  elements.push({ "tag": "hr" });
                  elements.push({ "tag": "action", "actions": pageActions });
              }
            }

            const detailCard = {
              "config": { "wide_screen_mode": true },
              "header": { "title": { "content": `📑 资源文件列表 (第${page}页)`, "tag": "plain_text" }, "template": "turquoise" },
              "elements": elements
            };
            
            if (actionValue.action === 'view_details') {
              await client.im.message.reply({
                path: { message_id: openMessageId },
                data: { content: JSON.stringify(detailCard), msg_type: 'interactive' }
              });
            } else {
              await client.im.message.patch({
                path: { message_id: openMessageId },
                data: { content: JSON.stringify(detailCard) }
              });
            }
          } catch (error: any) {
            const errMsg = error.response?.data?.message || error.message || "未知错误";
            await client.im.message.reply({
              path: { message_id: openMessageId },
              data: { content: JSON.stringify({ text: `❌ 无法获取详情: ${errMsg}` }), msg_type: 'text' }
            });
          }
        })();
        return { toast: { type: "info", content: "⏳ 正在获取详情..." } };
      }

      if (actionValue.action === 'transfer') {
        const openMessageId = data.context?.open_message_id;
        (async () => {
          try {
            const service = new QuarkService();
            service.setCookieString(process.env.QUARK_COOKIE || "");
            
            const shareInfo = await service.getShareInfo(pwdId, "");
            if (!shareInfo || !shareInfo.data || !shareInfo.data.list) {
              throw new Error("无效的分享链接或提取码错误");
            }
            
            const folders = await service.getFolderList("0");
            const items = folders?.data || [];

            await client.im.message.reply({
              path: { message_id: openMessageId },
              data: { content: JSON.stringify(buildSaveDirCard("夸克网盘", pwdId, "", items, "0", 1)), msg_type: 'interactive' }
            });
          } catch (err: any) {
            logger.error('获取目录失败:', err);
            await client.im.message.reply({
              path: { message_id: openMessageId },
              data: { content: JSON.stringify({ text: `❌ 无法加载目录: ${err.message || err}` }), msg_type: 'text' }
            });
          }
        })();

        return { toast: { type: "info", content: "⏳ 正在获取网盘目录..." } };
      }

      return null;
    }
  });

  wsClient.start({ eventDispatcher });
  logger.info('🚀 Feishu WebSocket Bot started successfully!');
}
export function buildDirCard(driveName: string, items: any[], parentId: string, page: number = 1): any {
  const pageSize = 20;
  const maxPage = Math.ceil(items.length / pageSize) || 1;
  const currentItems = items.slice((page - 1) * pageSize, page * pageSize);

  const elements: any[] = [];
  
  if (items.length === 0) {
    elements.push({ "tag": "markdown", "content": "*(目录为空或获取失败)*" });
  } else {
    for (const item of currentItems) {
      elements.push({
        "tag": "div",
        "text": { "content": `📁 ${item.name}`, "tag": "plain_text" }
      });
      elements.push({ "tag": "hr" });
    }
  }

  // Pagination and back buttons
  const footerActions: any[] = [];
  
  if (page > 1) {
    footerActions.push({
      "tag": "button",
      "text": { "content": "⬅️ 上一页", "tag": "plain_text" },
      "value": { "action": driveName === "夸克网盘" ? "view_quark_dir" : "view_115_dir", "parent_id": parentId, "page": page - 1 }
    });
  }
  
  if (page < maxPage) {
    footerActions.push({
      "tag": "button",
      "text": { "content": "下一页 ➡️", "tag": "plain_text" },
      "value": { "action": driveName === "夸克网盘" ? "view_quark_dir" : "view_115_dir", "parent_id": parentId, "page": page + 1 }
    });
  }
  
  footerActions.push({
    "tag": "button",
    "text": { "content": "🔙 返回主配置", "tag": "plain_text" },
    "type": "default",
    "value": { "action": "back_to_main_config" }
  });

  elements.push({
    "tag": "action",
    "actions": footerActions
  });

  return {
    "config": { "update_multi": true },
    "header": { "title": { "content": `☁️ ${driveName} - 目录浏览`, "tag": "plain_text" }, "template": "blue" },
    "elements": elements
  };
}
export function buildSaveDirCard(driveName: string, pwdId: string, passcode: string, items: any[], parentId: string, page: number = 1): any {
  const pageSize = 10;
  const maxPage = Math.ceil(items.length / pageSize) || 1;
  const currentItems = items.slice((page - 1) * pageSize, page * pageSize);

  const elements: any[] = [];
  
  elements.push({
    "tag": "action",
    "actions": [{
      "tag": "button",
      "text": { "content": "✅ 确定保存到本层目录", "tag": "plain_text" },
      "type": "primary",
      "value": { "action": "do_save_dir", "drive": driveName, "pwdId": pwdId, "passcode": passcode, "target_id": parentId }
    }]
  });
  elements.push({ "tag": "hr" });

  if (items.length === 0) {
    elements.push({ "tag": "markdown", "content": "*(该目录为空)*" });
  } else {
    for (const item of currentItems) {
      elements.push({
        "tag": "column_set",
        "flex_mode": "none",
        "background_style": "default",
        "columns": [
          {
            "tag": "column",
            "width": "weighted",
            "weight": 2,
            "vertical_align": "center",
            "elements": [
              { "tag": "markdown", "content": `📁 **${item.name}**` }
            ]
          },
          {
            "tag": "column",
            "width": "auto",
            "weight": 1,
            "vertical_align": "center",
            "elements": [
              {
                "tag": "button",
                "text": { "content": "进入", "tag": "plain_text" },
                "type": "default",
                "value": { "action": "nav_save_dir", "drive": driveName, "pwdId": pwdId, "passcode": passcode, "parent_id": item.cid, "page": 1 }
              }
            ]
          }
        ]
      });
      elements.push({ "tag": "hr" });
    }
  }

  const footerActions: any[] = [];
  if (page > 1) {
    footerActions.push({
      "tag": "button",
      "text": { "content": "⬅️ 上一页", "tag": "plain_text" },
      "value": { "action": "nav_save_dir", "drive": driveName, "pwdId": pwdId, "passcode": passcode, "parent_id": parentId, "page": page - 1 }
    });
  }
  if (page < maxPage) {
    footerActions.push({
      "tag": "button",
      "text": { "content": "下一页 ➡️", "tag": "plain_text" },
      "value": { "action": "nav_save_dir", "drive": driveName, "pwdId": pwdId, "passcode": passcode, "parent_id": parentId, "page": page + 1 }
    });
  }
  
  if (parentId !== "0" && parentId !== "root") {
    footerActions.push({
      "tag": "button",
      "text": { "content": "🏠 返回根目录", "tag": "plain_text" },
      "type": "default",
      "value": { "action": "nav_save_dir", "drive": driveName, "pwdId": pwdId, "passcode": passcode, "parent_id": driveName === "阿里云盘" ? "root" : "0", "page": 1 }
    });
  }

  if (footerActions.length > 0) {
    elements.push({
      "tag": "action",
      "actions": footerActions
    });
  }

  return {
    "config": { "update_multi": true },
    "header": { "title": { "content": `🎯 选择 ${driveName} 转存位置`, "tag": "plain_text" }, "template": "blue" },
    "elements": elements
  };
}

function buildChannelsListCard() {
  const channels = getChannelsList();
  let content = "**频道列表 (ID - 名称)**\n\n";
  if (channels.length === 0) {
    content += "暂无频道。";
  } else {
    channels.forEach((c: any) => {
      content += `- \`${c.id}\` : ${c.name}\n`;
    });
  }

  return {
    "config": { "update_multi": true },
    "header": { "title": { "content": "📋 所有频道列表", "tag": "plain_text" }, "template": "turquoise" },
    "elements": [
      {
        "tag": "markdown",
        "content": content.trim()
      },
      { "tag": "hr" },
      {
        "tag": "action",
        "actions": [
          {
            "tag": "button",
            "text": { "content": "🔙 返回主配置", "tag": "plain_text" },
            "type": "default",
            "value": { "action": "back_to_main_config" }
          }
        ]
      }
    ]
  };
}
