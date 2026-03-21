const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Stub für native Module die nicht in Expo Go verfügbar sind
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-health': path.resolve(__dirname, 'stubs/react-native-health.js'),
};

module.exports = withNativeWind(config, { input: './global.css' });
