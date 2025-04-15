module.exports = {
  expo: {
    scheme: "acme",
    plugins: [
      "expo-router",
      [
        "react-native-reanimated/plugin",
        {
          relativeSourceLocation: true
        }
      ]
    ],
    name: "path-to-authenticity",
    slug: "path-to-authenticity",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff"
      }
    },
    extra: {
      eas: {
        projectId: "path-to-authenticity"
      },
      // Force enable reanimated
      reanimatedEnabled: true
    },
    // Ensure new architecture is enabled
    newArchEnabled: true,
    // Add jsEngine options for reanimated
    jsEngine: "hermes",
  }
};
