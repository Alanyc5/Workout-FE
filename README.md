# Workout FE

前端專案使用 React + TypeScript + Vite 開發。

## 開發環境

### 安裝依賴
```bash
npm install
```

### 本地開發
```bash
npm run dev
```

### 建置專案
```bash
npm run build
```

## 環境變數

複製 `.env.example` 為 `.env` 並設定環境變數：

```bash
cp .env.example .env
```

環境變數說明：
- `VITE_API_BASE_URL`: 後端 API 的基礎 URL

## GitHub Pages 部署

此專案已設定自動部署到 GitHub Pages。

### 設定步驟

1. **啟用 GitHub Pages**
   - 前往 GitHub 專案頁面
   - 點擊 `Settings` > `Pages`
   - Source 選擇 `GitHub Actions`

2. **設定環境變數**
   - 前往 `Settings` > `Secrets and variables` > `Actions`
   - 點擊 `New repository secret`
   - 新增以下環境變數：
     - Name: `VITE_API_BASE_URL`
     - Secret: 你的後端 API URL 

3. **觸發部署**
   - 推送程式碼到 `main` 分支，自動觸發部署
   - 或手動觸發：前往 `Actions` > `Deploy to GitHub Pages` > `Run workflow`

4. **查看部署結果**
   - 部署完成後，網站會在 `https://<username>.github.io/<repository>/` 可供訪問
   - 可在 Actions 頁面查看部署狀態和日誌
