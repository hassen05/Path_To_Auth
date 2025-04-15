module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Other plugins might be here
      'react-native-reanimated/plugin',
    ],
  };
};
