# 🚀 快速开始 - 5分钟打包成 Android APP

## 前提条件
- 已安装 Node.js
- 已安装 Android Studio 和 Android SDK
- 已配置好环境变量（参考完整指南）

## 打包步骤（只需 5 步）

### 1️⃣ 安装依赖
```bash
npm install
```

### 2️⃣ 初始化并添加 Android 平台
```bash
npx cap init
npx cap add android
```

### 3️⃣ 构建并同步
```bash
npm run build
npx cap sync android
```

### 4️⃣ 打开 Android Studio
```bash
npx cap open android
```

### 5️⃣ 运行应用
1. 连接手机（启用 USB 调试）
2. 在 Android Studio 中点击运行按钮 ▶️
3. 完成！

## 更新应用时
```bash
npm run android:sync
```

然后在 Android Studio 中重新运行即可。

## 生成 APK（安装包）
在 Android Studio 中：
```
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

APK 位置：`android/app/build/outputs/apk/debug/app-debug.apk`

---

**遇到问题？** 查看 `Android打包部署完整指南.md` 获取详细说明。
