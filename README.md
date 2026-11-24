# dsh-plugin-index

Ain 的 DeepSeek Harness 第三方插件索引（format 1 靜態 JSON）。

## 用途

這個倉庫提供 DSH 第三方市集可讀取的靜態索引檔 [`index.json`](./index.json)。  
DSH 會抓取索引、驗證格式、顯示條目；真正安裝時才依各版本的 `source` 走 `pluginManager.installBundle`。

## GitHub Pages

1. 到 GitHub repo **Settings > Pages**。
2. Source 選 **Deploy from a branch**。
3. Branch 選 `main`，資料夾選 `/ (root)`。
4. 發佈後索引 URL 會是：

   `https://ainlee.github.io/dsh-plugin-index/index.json`

把這個 URL 加到 DSH 的第三方插件索引來源即可。

## 新增插件條目

在 `plugins[]` 新增條目，範例：

```json
{
  "name": "@ainlee/dsh-example-hello",
  "title": {
    "en": "Example Hello",
    "zh": "範例 Hello"
  },
  "description": {
    "en": "A minimal example bundle.",
    "zh": "最小範例 bundle。"
  },
  "author": "ainlee",
  "homepage": "https://github.com/ainlee/dsh-plugins",
  "repository": {
    "url": "https://github.com/ainlee/dsh-plugins",
    "directory": "packages/example-hello"
  },
  "metadata": {
    "category": "interface",
    "keywords": ["dsh", "example"],
    "labels": ["experimental"],
    "sortKeys": { "updated": 1790000000 }
  },
  "versions": [
    {
      "version": "0.1.0",
      "publishTimestamp": 1790000000,
      "source": {
        "type": "git",
        "url": "https://github.com/ainlee/dsh-plugins",
        "commit": "<40-char-lowercase-hex-commit-sha>",
        "path": "packages/example-hello"
      },
      "engines": {
        "dsh": "^0.2.0"
      }
    }
  ]
}
```

## 注意事項

- `format` 必須是 `1`。
- `LocalizedText` 物件形式必須包含 `en`。
- `metadata.category/labels/sortKeys` 只能引用頂層 `metadata` 已宣告的 id。
- `git` source 的 `commit` 必須是 **40 位小寫 hex SHA**，不能用 branch/tag。
- `publishTimestamp` 是 Unix 秒整數。
- 索引只描述「去哪安裝」，不是套件託管；實際安裝來源由 `versions[].source` 決定。
- 第三方插件安裝會影響整個 DSH profile，請自行審核來源與權限。

## 驗證

```bash
node scripts/validate-index.mjs
```

驗證腳本會檢查基本結構；若本機可解析 `@deepseek-ai/dsh-plugin-market-index`，會使用 DSH 官方 validator 做完整驗證。
