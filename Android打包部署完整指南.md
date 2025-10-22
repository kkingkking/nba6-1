# 篮球训练助手 - Android APP 打包部署完整指南

## 📱 简介
本指南将帮助你把这个 Web 应用打包成 Android APP，安装到你的手机上使用。完全离线运行，不需要联网。

---

## ✅ 准备工作

### 1. 安装必需软件

#### 1.1 安装 Node.js（如果还没安装）
- 下载地址：https://nodejs.org/
- 选择 LTS 版本（长期支持版本）
- 安装完成后，打开命令行输入 `node -v` 确认安装成功

#### 1.2 安装 Android Studio
- 下载地址：https://developer.android.com/studio
- 下载并安装完整版 Android Studio
- **重要**：安装时确保勾选 "Android SDK"、"Android SDK Platform" 和 "Android Virtual Device"

#### 1.3 配置 Android SDK
1. 打开 Android Studio
2. 点击 `More Actions` → `SDK Manager`
3. 在 `SDK Platforms` 标签页中，至少安装一个 Android 版本（推荐 Android 13 或 14）
4. 在 `SDK Tools` 标签页中，确保以下项目已勾选：
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools

#### 1.4 配置环境变量（Windows）

**方法一：通过系统设置**
1. 右键点击"此电脑" → 属性 → 高级系统设置 → 环境变量
2. 在"系统变量"中新建以下变量：
   ```
   变量名：ANDROID_HOME
   变量值：C:\Users\你的用户名\AppData\Local\Android\Sdk
   ```
3. 编辑 Path 变量，添加：
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

**验证配置**：
打开新的命令行窗口，输入 `adb version`，如果显示版本号说明配置成功。

#### 1.5 配置环境变量（Mac）
1. 打开终端
2. 编辑配置文件：
   ```bash
   nano ~/.zshrc  # 或 ~/.bash_profile
   ```
3. 添加以下内容：
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```
4. 保存并执行：
   ```bash
   source ~/.zshrc
   ```

---

## 🚀 打包步骤

### 第一步：安装项目依赖

1. 打开命令行（Windows: cmd 或 PowerShell；Mac: Terminal）
2. 进入项目文件夹：
   ```bash
   cd 项目文件夹路径
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
   等待所有依赖安装完成（可能需要几分钟）

### 第二步：初始化 Capacitor

```bash
npx cap init
```

如果提示输入信息，直接按回车使用默认值即可（已经在 capacitor.config.ts 中配置好了）。

### 第三步：添加 Android 平台

```bash
npx cap add android
```

这会创建一个 `android` 文件夹，包含完整的 Android 项目。

### 第四步：构建 Web 应用

```bash
npm run build
```

这会将你的 React 应用编译成静态文件。

### 第五步：同步到 Android

```bash
npx cap sync android
```

这会把编译好的 Web 文件同步到 Android 项目中。

### 第六步：在 Android Studio 中打开项目

**方法一：使用命令**
```bash
npx cap open android
```

**方法二：手动打开**
1. 打开 Android Studio
2. 选择 "Open an Existing Project"
3. 找到并选择项目文件夹中的 `android` 文件夹
4. 点击 OK

### 第七步：运行应用

#### 在真实设备上运行（推荐）

1. **启用开发者选项**（如果未启用）：
   - 进入手机设置 → 关于手机
   - 连续点击"版本号"7次
   - 返回设置，会出现"开发者选项"

2. **启用 USB 调试**：
   - 进入开发者选项
   - 开启"USB 调试"
   - 开启"USB 安装"（部分手机需要）

3. **连接手机到电脑**：
   - 用 USB 数据线连接手机
   - 手机上会弹出"允许 USB 调试"提示，点击"允许"

4. **在 Android Studio 中运行**：
   - 等待 Android Studio 完成项目同步（首次可能需要几分钟）
   - 顶部工具栏会显示你的手机设备名称
   - 点击绿色的"运行"按钮（▶️）
   - 等待应用安装到手机上

#### 在模拟器上运行

1. 在 Android Studio 中点击 `Device Manager`
2. 点击 `Create Device`
3. 选择一个设备型号（推荐 Pixel 6）
4. 选择系统镜像（推荐最新的 Android 版本）
5. 完成创建后，点击运行按钮

---

## 📦 生成 APK 文件（安装包）

如果你想生成一个 APK 文件，方便安装到其他手机上：

### 方法一：Debug 版本（快速，适合自己使用）

1. 在 Android Studio 中，点击菜单：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 等待构建完成
3. 点击弹出提示中的 `locate` 链接
4. APK 文件位置：`android/app/build/outputs/apk/debug/app-debug.apk`
5. 将这个 APK 文件传到手机上安装即可

### 方法二：Release 版本（正式版本，需要签名）

#### 1. 生成签名密钥

在命令行中执行：
```bash
cd android/app
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

按提示输入密码和信息（记住密码！）

#### 2. 配置签名

编辑 `android/app/build.gradle`，在 `android` 块中添加：

```gradle
signingConfigs {
    release {
        storeFile file('my-release-key.keystore')
        storePassword '你的密码'
        keyAlias 'my-key-alias'
        keyPassword '你的密码'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... 其他配置保持不变
    }
}
```

#### 3. 生成 Release APK

在 Android Studio 中：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`

或使用命令行：
```bash
cd android
./gradlew assembleRelease
```

APK 文件位置：`android/app/build/outputs/apk/release/app-release.apk`

---

## 🔧 常见问题解决

### 问题 1：找不到 adb 或 Android SDK

**解决方案**：
- 确保已安装 Android Studio 和 SDK
- 检查环境变量配置是否正确
- 重启命令行窗口或重启电脑

### 问题 2：Gradle 同步失败

**解决方案**：
- 确保网络畅通
- 在 Android Studio 中点击 `File` → `Invalidate Caches / Restart`
- 删除 `android/.gradle` 文件夹，重新同步

### 问题 3：手机无法识别

**解决方案**：
- 确保已启用 USB 调试
- 尝试更换 USB 数据线或 USB 接口
- 安装手机厂商的 USB 驱动（部分手机需要）
- 在命令行输入 `adb devices` 检查设备是否被识别

### 问题 4：应用安装后闪退

**解决方案**：
- 在 Android Studio 的 Logcat 中查看错误日志
- 确保 `npm run build` 成功完成
- 重新执行 `npx cap sync android`

### 问题 5：录音功能不工作

**解决方案**：
应用会在首次使用录音时自动请求麦克风权限，如果没有弹出：
- 进入手机设置 → 应用管理 → 篮球训练助手
- 找到权限设置，手动开启"麦克风"权限

### 问题 6：数据丢失

**解决方案**：
所有数据都存储在应用本地，不会丢失。但如果卸载应用，数据会被清除。

---

## 🔄 更新应用

当你修改了代码需要重新打包时：

```bash
# 1. 重新构建
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 在 Android Studio 中点击运行按钮
```

或使用快捷命令：
```bash
npm run android:sync
npm run android:open
```

---

## 📝 应用权限说明

应用需要以下权限：
- **麦克风**：用于录制训练指令语音
- **存储**：用于保存训练数据和录音文件

这些权限会在首次使用相关功能时自动请求。

---

## 🎯 使用建议

1. **首次安装后**：
   - 打开应用，添加训练指令
   - 为每个指令录制语音
   - 设置训练参数

2. **日常使用**：
   - 应用完全离线运行，不需要网络
   - 所有数据保存在本地，不会丢失
   - 可以随时调整训练配置

3. **备份建议**：
   - 定期导出应用数据（通过 Android 备份功能）
   - 重要训练方案可以截图记录

---

## 💡 技术支持

如果遇到问题：
1. 检查本文档的"常见问题解决"部分
2. 确保所有软件版本是最新的
3. 查看 Android Studio 的 Logcat 日志获取详细错误信息

---

## 🎉 完成

恭喜！你已经成功将篮球训练助手打包成 Android APP。
现在可以在手机上尽情使用了！🏀

如果需要分享给朋友，只需将生成的 APK 文件发送给他们安装即可。
