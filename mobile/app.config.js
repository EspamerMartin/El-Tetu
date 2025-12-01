module.exports = {
  expo: {
    name: "El-Tetu",
    slug: "el-tetu",
    version: "1.0.0",
    owner: "espamerit",
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
      package: "com.eltetu.app",
      // Asegura que las capturas/grabaciones de pantalla NO estén bloqueadas
      blockScreenshots: false
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "6acb7627-96cb-4d31-b3b4-a441b27ae8db"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api"
    }
  }
};
