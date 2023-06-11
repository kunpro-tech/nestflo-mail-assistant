module.exports = {
  packagerConfig: {
    osxSign: {
      identity:
        "Developer ID Application: Root Sports Investment (Beijing) Co., Ltd.",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {},
    },
    {
      name: '@electron-forge/maker-wix',
      config: {}
    }
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "doom-9",
          name: "mail",
        },
        draft: true,
        prerelease: false,
      },
    },
  ],
};
