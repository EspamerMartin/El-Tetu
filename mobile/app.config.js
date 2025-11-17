module.exports = {
  expo: {
    name: "El-Tetu",
    slug: "el-tetu-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.eltetu.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.eltetu.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "301fbcd6-7b42-412e-b33e-e7401ab0bb6f"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api"
    }
  }
};
