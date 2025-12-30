#!/usr/bin/env python3
"""
NGA 自动回帖脚本
用于定时回复帖子以保持招募帖活跃
"""

import os
import sys
import random
import time
import yaml
import requests
from datetime import datetime
from pathlib import Path

# 预设回复内容池
DEFAULT_REPLIES = [
    "招人中，欢迎加入！",
    "持续招募，诚邀加入~",
    "团队招新，期待你的到来！",
    "活跃招募中，速来！",
    "欢迎新朋友加入战斗！",
    "招人招人，缺你一个~",
    "空位虚席以待！",
    "团建进行中，快来！",
]


def load_config():
    """加载配置，优先使用环境变量（GitHub Actions），其次使用本地配置文件"""
    
    # GitHub Actions 环境变量模式
    if os.environ.get("NGA_COOKIE"):
        return {
            "cookie": os.environ["NGA_COOKIE"],
            "tid": os.environ.get("NGA_TID", ""),
            "fid": os.environ.get("NGA_FID", "306"),
        }
    
    # 本地配置文件模式
    config_path = Path(__file__).parent / "config.yaml"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    
    print("❌ 错误：未找到配置。请设置环境变量或创建 config.yaml")
    sys.exit(1)


def load_replies():
    """加载自定义回复内容，若无则使用默认"""
    replies_path = Path(__file__).parent / "replies.txt"
    if replies_path.exists():
        with open(replies_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
            if lines:
                return lines
    return DEFAULT_REPLIES


def parse_cookies(cookie_string: str) -> dict:
    """将 Cookie 字符串解析为字典"""
    cookies = {}
    for item in cookie_string.split(";"):
        item = item.strip()
        if "=" in item:
            key, value = item.split("=", 1)
            cookies[key.strip()] = value.strip()
    return cookies


def reply_post(config: dict, content: str) -> bool:
    """
    发送回帖请求
    
    NGA 回帖 API: POST https://bbs.nga.cn/post.php
    """
    url = "https://bbs.nga.cn/post.php"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": f"https://bbs.nga.cn/read.php?tid={config['tid']}",
        "Origin": "https://bbs.nga.cn",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    
    cookies = parse_cookies(config["cookie"])
    
    data = {
        "action": "reply",
        "fid": config["fid"],
        "tid": config["tid"],
        "post_content": content,
        "step": 2,
    }
    
    try:
        resp = requests.post(url, headers=headers, cookies=cookies, data=data, timeout=30)
        
        # NGA 返回的是 GBK 编码的 HTML
        resp.encoding = "gbk"
        
        # 检查是否成功（根据返回内容判断）
        if "发帖成功" in resp.text or "操作成功" in resp.text:
            return True
        elif "您需要登录" in resp.text or "未登录" in resp.text:
            print("❌ Cookie 已失效，请更新 Cookie")
            return False
        elif "您发帖太快" in resp.text or "请稍后" in resp.text:
            print("⚠️ 发帖频率过高，请稍后再试")
            return False
        else:
            # 可能成功也可能失败，打印部分响应供调试
            print(f"⚠️ 响应内容（前500字符）: {resp.text[:500]}")
            # 如果没有明显错误信息，假设成功
            return "错误" not in resp.text and "失败" not in resp.text
            
    except requests.RequestException as e:
        print(f"❌ 网络请求失败: {e}")
        return False


def main():
    print(f"🕐 执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    config = load_config()
    replies = load_replies()
    
    # 随机选择一条回复
    content = random.choice(replies)
    
    print(f"📝 帖子 ID: {config['tid']}")
    print(f"💬 回复内容: {content}")
    
    # 随机延迟 1-30 秒，避免过于精确的定时触发
    delay = random.randint(1, 30)
    print(f"⏳ 随机延迟 {delay} 秒...")
    time.sleep(delay)
    
    success = reply_post(config, content)
    
    if success:
        print("✅ 回帖成功！")
        sys.exit(0)
    else:
        print("❌ 回帖失败！")
        sys.exit(1)


if __name__ == "__main__":
    main()
