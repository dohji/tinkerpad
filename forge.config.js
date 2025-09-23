const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    // ✅ Use the same base icon path (no extension) for cross-platform
    icon: './assets/icon',
    extraResource: [
      './assets/'
    ],
      executableName: 'tinkerpad'
  },
  rebuildConfig: {},
  makers: [
    // {
    //   // name: '@electron-forge/maker-squirrel', // Windows installer
    //   config: {
    //     setupIcon: './assets/icon.ico',
    //   },
    //   name: '@electron-forge/maker-zip',
    //   platforms: ['win32'],
    // },
      {
          name: '@electron-forge/maker-squirrel',
          config: {
              setupIcon: './assets/icon.ico',
          },
      },
      // {
      //     name: '@electron-forge/maker-zip',
      //     platforms: ['win32'],
      // },
    {
      name: '@electron-forge/maker-zip', // macOS zip build
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-dmg', // macOS dmg installer
      config: {
        format: 'ULFO',
        icon: './assets/icon.icns',
      },
    },
    {
      name: '@electron-forge/maker-deb', // Linux deb
      config: {
        options: {
          icon: './assets/icon.png',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm', // Linux rpm
      config: {
        options: {
          icon: './assets/icon.png',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
        devContentSecurityPolicy: "connect-src 'self' 'unsafe-eval'",
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};


// const { FusesPlugin } = require('@electron-forge/plugin-fuses');
// const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// module.exports = {
//   packagerConfig: {
//     asar: true,
//   },
//   rebuildConfig: {},
//   makers: [
//     {
//       name: '@electron-forge/maker-squirrel',
//       config: {},
//     },
//     {
//       name: '@electron-forge/maker-zip',
//       platforms: ['darwin'],
//     },
//     {
//       name: '@electron-forge/maker-deb',
//       config: {},
//     },
//     {
//       name: '@electron-forge/maker-rpm',
//       config: {},
//     },
//   ],
//   plugins: [
//     {
//       name: '@electron-forge/plugin-auto-unpack-natives',
//       config: {},
//     },
//     {
//       name: '@electron-forge/plugin-webpack',
//       config: {
//         mainConfig: './webpack.main.config.js',
//         renderer: {
//           config: './webpack.renderer.config.js',
//           entryPoints: [
//             {
//               html: './src/index.html',
//               js: './src/renderer.js',
//               name: 'main_window',
//               preload: {
//                 js: './src/preload.js',
//               },
//             },
//           ],
//         },
//         devContentSecurityPolicy: "connect-src 'self' 'unsafe-eval'",
//       },
//     },
//     // Fuses are used to enable/disable various Electron functionality
//     // at package time, before code signing the application
//     new FusesPlugin({
//       version: FuseVersion.V1,
//       [FuseV1Options.RunAsNode]: false,
//       [FuseV1Options.EnableCookieEncryption]: true,
//       [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
//       [FuseV1Options.EnableNodeCliInspectArguments]: false,
//       [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
//       [FuseV1Options.OnlyLoadAppFromAsar]: true,
//     }),
//   ],
// };


