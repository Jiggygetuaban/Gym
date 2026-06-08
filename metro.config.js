const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude mysql2's aws-ssl-profiles temp directories from Metro's file watcher
// (mysql2 is only used by the api-server, not the Expo app)
const blockList = config.resolver?.blockList ?? [];
const blockListArray = Array.isArray(blockList) ? blockList : [blockList];
config.resolver = {
  ...config.resolver,
  blockList: [
    ...blockListArray,
    /node_modules\/.*\/aws-ssl-profiles.*/,
    /node_modules\/.pnpm\/aws-ssl-profiles.*/,
    /node_modules\/.pnpm\/mysql2.*/,
  ],
};

module.exports = config;
