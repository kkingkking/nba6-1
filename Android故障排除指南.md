# 🔧 Android 打包故障排除指南

## 环境配置问题

### ❌ 找不到 'adb' 命令
```
'adb' 不是内部或外部命令
```

**原因**：Android SDK 环境变量未配置

**解决方案**：
```bash
# Windows - 添加到系统环境变量 Path
C:\Users\你的用户名\AppData\Local\Android\Sdk\platform-tools

# Mac/Linux - 添加到 ~/.zshrc 或 ~/.bash_profile
export PATH=$PATH:$HOME/Library/Android/sdk/platform-tools
```

配置完成后，**重启命令行窗口**。

---

### ❌ ANDROID_HOME 未设置
```
Error: ANDROID_HOME is not set
```

**解决方案**：
```bash
# Windows
setx ANDROID_HOME "C:\Users\你的用户名\AppData\Local\Android\Sdk"

# Mac/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
```

---

### ❌ Java 版本问题
```
Unsupported class file major version
```

**解决方案**：
1. Android Studio 自带 JDK，使用它即可
2. 在 `android/gradle.properties` 中添加：
   ```properties
   org.gradle.java.home=/Applications/Android Studio.app/Contents/jbr/Contents/Home
   ```

---

## Capacitor 问题

### ❌ Capacitor 命令不存在
```
'cap' 不是内部或外部命令
```

**解决方案**：
使用 `npx cap` 而不是 `cap`：
```bash
npx cap init
npx cap add android
npx cap sync
```

---

### ❌ android 文件夹已存在
```
Error: android directory already exists
```

**解决方案**：
```bash
# 删除旧的 android 文件夹
rm -rf android

# 重新添加
npx cap add android
```

---

### ❌ 同步失败
```
Error: Unable to copy web assets
```

**解决方案**：
```bash
# 确保先构建
npm run build

# 检查 dist 文件夹是否存在
ls dist  # Mac/Linux
dir dist  # Windows

# 重新同步
npx cap sync android
```

---

## Gradle 问题

### ❌ Gradle 下载慢或失败
```
Could not download gradle-x.x.x-all.zip
```

**解决方案 1 - 使用国内镜像**：
编辑 `android/build.gradle`：
```gradle
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/public/' }
        maven { url 'https://maven.aliyun.com/repository/google/' }
        google()
        mavenCentral()
    }
}
```

**解决方案 2 - 手动下载**：
1. 访问 https://services.gradle.org/distributions/
2. 下载对应版本的 gradle-x.x.x-all.zip
3. 放到：`C:\Users\你的用户名\.gradle\wrapper\dists\gradle-x.x.x-all\xxxxxx\`

---

### ❌ Gradle 同步失败
```
Failed to sync Gradle project
```

**解决方案**：
```bash
# 方法1: 清除 Gradle 缓存
cd android
./gradlew clean  # Mac/Linux
gradlew.bat clean  # Windows

# 方法2: 在 Android Studio 中
File → Invalidate Caches / Restart → Invalidate and Restart

# 方法3: 删除缓存文件夹
rm -rf android/.gradle
rm -rf android/.idea
```

---

### ❌ 版本冲突
```
Conflict with dependency 'com.android.support:support-annotations'
```

**解决方案**：
在 `android/app/build.gradle` 中添加：
```gradle
configurations.all {
    resolutionStrategy {
        force 'com.android.support:support-annotations:28.0.0'
    }
}
```

---

## 设备连接问题

### ❌ 设备未识别
```
adb devices
List of devices attached
(空的)
```

**解决方案**：
1. **启用 USB 调试**：
   - 设置 → 关于手机 → 连续点击版本号 7 次
   - 设置 → 开发者选项 → 启用"USB 调试"

2. **重新连接**：
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

3. **安装驱动**（Windows）：
   - 小米：https://www.mi.com/service/bijiben/drivers/mi5
   - 华为：https://consumer.huawei.com/cn/support/hisuite/
   - 其他品牌：搜索"品牌名 + USB 驱动"

---

### ❌ 设备显示 unauthorized
```
List of devices attached
xxxxxx  unauthorized
```

**解决方案**：
1. 查看手机屏幕，点击"允许 USB 调试"
2. 勾选"始终允许这台计算机"
3. 如果没有弹窗：
   ```bash
   adb kill-server
   adb start-server
   ```

---

### ❌ 多个设备连接
```
error: more than one device/emulator
```

**解决方案**：
```bash
# 查看所有设备
adb devices

# 指定设备运行
adb -s 设备序列号 install app.apk
```

---

## 构建问题

### ❌ npm run build 失败
```
Build failed with errors
```

**解决方案**：
```bash
# 1. 清除缓存
rm -rf node_modules
rm package-lock.json

# 2. 重新安装
npm install

# 3. 重新构建
npm run build
```

---

### ❌ 内存不足
```
JavaScript heap out of memory
```

**解决方案**：
在 `package.json` 中修改 build 脚本：
```json
"scripts": {
  "build": "node --max-old-space-size=4096 node_modules/vite/bin/vite.js build"
}
```

---

### ❌ TypeScript 错误
```
TS2307: Cannot find module
```

**解决方案**：
```bash
# 安装类型定义
npm install --save-dev @types/node

# 或忽略 TypeScript 错误（临时）
npm run build -- --force
```

---

## Android Studio 问题

### ❌ Gradle sync failed: Plugin with id 'com.android.application' not found

**解决方案**：
检查 `android/build.gradle`：
```gradle
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.0'
    }
}
```

---

### ❌ SDK location not found

**解决方案**：
创建 `android/local.properties`：
```properties
sdk.dir=C\:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
```

Mac:
```properties
sdk.dir=/Users/你的用户名/Library/Android/sdk
```

---

### ❌ 模拟器启动失败
```
The emulator process has terminated
```

**解决方案**：
1. 在 BIOS 中启用虚拟化（VT-x/AMD-V）
2. Windows：启用 Hyper-V
3. Mac：安装 HAXM
4. 或使用真实设备测试

---

## 运行时问题

### ❌ 白屏或空白页

**解决方案**：
1. 检查 `vite.config.ts` 中的 `base` 设置：
   ```typescript
   base: './'  // 必须是相对路径
   ```

2. 重新构建和同步：
   ```bash
   npm run build
   npx cap sync android
   ```

3. 在 Chrome 中调试：
   - 手机连接电脑
   - 打开 Chrome 访问：chrome://inspect
   - 点击应用下的"inspect"查看错误

---

### ❌ 录音功能不工作

**解决方案**：
1. 检查 `android/app/src/main/AndroidManifest.xml`：
   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
   ```

2. 在应用中检查权限：
   - 设置 → 应用 → 篮球训练助手 → 权限 → 麦克风

---

### ❌ 应用闪退

**解决方案**：
查看 Logcat 日志：
1. 在 Android Studio 中打开 Logcat（底部工具栏）
2. 选择你的设备
3. 筛选器选择"Error"
4. 重现问题，查看错误信息

常见错误：
- `ClassNotFoundException`: 缺少依赖
- `OutOfMemoryError`: 内存不足
- `SecurityException`: 权限问题

---

## APK 生成问题

### ❌ 签名失败
```
Failed to sign APK
```

**解决方案**：
生成新的签名密钥：
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

---

### ❌ APK 无法安装
```
App not installed
```

**解决方案**：
1. 卸载旧版本
2. 检查签名是否一致（覆盖安装时）
3. 检查存储空间
4. 启用"允许未知来源"

---

## 性能优化

### ❌ 应用启动慢

**解决方案**：
1. 在 `android/app/build.gradle` 中启用 ProGuard：
   ```gradle
   buildTypes {
       release {
           minifyEnabled true
           shrinkResources true
       }
   }
   ```

2. 优化图片和资源大小

---

### ❌ 应用体积大

**解决方案**：
```bash
# 生成 Bundle 而不是 APK
cd android
./gradlew bundleRelease
```

Bundle 文件在：`android/app/build/outputs/bundle/release/`

---

## 调试技巧

### Chrome 远程调试
1. 手机连接电脑，启用 USB 调试
2. 打开应用
3. 在电脑 Chrome 中访问：`chrome://inspect`
4. 点击应用下的"inspect"
5. 可以查看控制台、网络请求等

### Android Studio Logcat
```bash
# 查看所有日志
adb logcat

# 过滤应用日志
adb logcat | grep "com.basketball.trainer"

# 清除日志
adb logcat -c
```

### 查看应用信息
```bash
# 查看已安装的应用
adb shell pm list packages | grep basketball

# 查看应用路径
adb shell pm path com.basketball.trainer

# 查看应用权限
adb shell dumpsys package com.basketball.trainer | grep permission
```

---

## 快速诊断清单

遇到问题时，按以下顺序检查：

- [ ] Node.js 和 npm 是否安装正确？
- [ ] Android Studio 和 SDK 是否安装？
- [ ] 环境变量是否配置正确？
- [ ] `npm install` 是否成功？
- [ ] `npm run build` 是否成功？
- [ ] dist 文件夹是否存在且有内容？
- [ ] `npx cap sync` 是否成功？
- [ ] Android Studio 是否正常打开项目？
- [ ] Gradle 同步是否成功？
- [ ] 设备/模拟器是否正常连接？
- [ ] 应用权限是否已授予？

---

**仍然无法解决？** 

1. 记录完整的错误信息
2. 截图关键步骤
3. 查看 Android Studio 的 Build Output 和 Logcat
4. 搜索错误信息获取解决方案

**祝你成功！** 🎉
