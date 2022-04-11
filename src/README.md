# Nature's Palette Validator

This is cross-platform offline validation tool built to help prepare submissions to Nature's Pallete.

## Prerequisites

- Node.js (built using v16.x)

## Setup development environment

- npm install
- npm start

## To Distribute

Distribution is handled by electron-builder. https://github.com/electron-userland/electron-builder

Then you can run `yarn app:dist` (to package in a distributable format (e.g. dmg, windows installer, deb package)) or `yarn app:dir` (only generates the package directory without really packaging it. This is useful for testing purposes).

## Resources for Learning Electron

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## License

MIT
