# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.3.0](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/compare/v0.2.0...v0.3.0) (2023-12-19)

### Features

- gzip options ([092d0b8](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/commit/092d0b8fbdb14cfaa382dd18ec7b0cf44b459ee3))

## [0.2.0](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/compare/v0.1.2...v0.2.0) (2023-12-19)

### ⚠ BREAKING CHANGES

- sitemap plugin automaticaly split sitemap file when sitemap has more than 50,000 URLs
- you can provide formatting options for write file prettier

### Features

- add split sitemap, format options ([dea4b65](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/commit/dea4b65b6d1ae2f264728b9892f7f961577f7070))

### [0.1.2](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/compare/v0.1.1...v0.1.2) (2023-12-18)

### Features

- change xml creating method ([273b593](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/commit/273b5934b18bc9b713504b575da6f3e51f5666a0))

### Bug Fixes

- change copy option method (Object.assing => spread) ([2112613](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/commit/21126138c45f6ecfc3c0dbb4ad9ddfac4db624d0))
- options validation ([782f360](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/commit/782f360e2eebbbb6b8d80bfb4567eb5bc5734ad6))

### [0.1.1](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/compare/v0.1.0...v0.1.1) (2023-12-13)

### Bug Fixes

- options.baseURL validation error ([24a4634](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/commit/24a46341b2c5a34657622c12a120b1148bccd840))

## [0.1.0](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/compare/v0.0.0...v0.1.0) (2023-12-12)

### ⚠ BREAKING CHANGES

- add emitted.pattern to filter asset (glob pattern)

### Features

- emitted.pattern ([d4966d1](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/commit/d4966d17784b873ccb4e41815f356cca4210f1bd))

### Bug Fixes

- error when plugin option is undefined ([f6657a2](https://github.com/d0orHyeok/sitemap-generator-webpack-plugin/commit/f6657a2668a80b331ea2442131945957eae5fa22))
