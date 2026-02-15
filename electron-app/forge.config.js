const { MakerZIP } = require('@electron-forge/maker-zip');

module.exports = {
  packagerConfig: {
    name: 'Financial Snapshot',
    executableName: 'Financial Snapshot',
    icon: './icon',           // optional – drop icon.icns here if you want a custom icon
    asar: true,
    osxSign: false,           // set to {} if you have an Apple Developer cert
    appBundleId: 'com.jasonrubin.financial-snapshot'
  },
  makers: [
    new MakerZIP({}, ['darwin']),
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO'
      }
    }
  ]
};
