module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@features': './src/features',
            '@services': './src/services',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@lib': './src/lib',
            '@types': './src/types',
            '@theme': './src/theme',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  }
}
