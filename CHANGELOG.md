### [1.0.2](https://github.com/cheminfo/zenodo/compare/v1.0.1...v1.0.2) (2021-02-25)


### Bug Fixes

* update axios ([2c121db](https://github.com/cheminfo/zenodo/commit/2c121db6e24bccd94468dad9ed2698463a19b5a4))

<a name="1.0.1"></a>
## [4.0.0](https://github.com/cheminfo/zenodo/compare/v3.0.0...v4.0.0) (2025-08-15)


### ⚠ BREAKING CHANGES

* using new API ([#18](https://github.com/cheminfo/zenodo/issues/18))
* removed JSON schema and validation

### Features

* added details in fetchZenodo's logs ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* added ORCID check ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* added records ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* added recursiveRemoveEmptyAndNull for parsing sent data ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* added reserveDOI ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))


### Bug Fixes

* added details to fetch fails ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* added isPublished to listFiles() ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* link as object not array ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* removed old urls ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* retrieve versions now returns record ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))


### Code Refactoring

* removed JSON schema and validation ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))
* using new API ([#18](https://github.com/cheminfo/zenodo/issues/18)) ([7dccdc3](https://github.com/cheminfo/zenodo/commit/7dccdc371b67242d026859baf268772776eb425b))

## [3.0.0](https://github.com/cheminfo/zenodo/compare/v2.0.0...v3.0.0) (2025-07-25)


### ⚠ BREAKING CHANGES

* removed retry in file creation (retry functionalities are already in fetchZenodo)
* changed all_versions to allVersions for consistency in the library
* remove submitForReview, rename submitForReviewBrowser to submitForReview
* changed addToCommunity return to allow submitting API via browser
* update tsconfig and package.json
* added createFilesAsZip and changed createFile logic

### Features

* add logger options ([2e12d54](https://github.com/cheminfo/zenodo/commit/2e12d54868fdd38fb0148e9c1afea01987d90dfc))
* added addToCommunity to deposition ([8511316](https://github.com/cheminfo/zenodo/commit/8511316c4e39ecc356b48551cddc3e5bf963434f))
* added createFilesAsZip and changed createFile logic ([8eff57e](https://github.com/cheminfo/zenodo/commit/8eff57ebb3c15a4ae11b845d6ee9108baa0cfb92))
* added deleteAllFiles to deposition ([ffd946a](https://github.com/cheminfo/zenodo/commit/ffd946a20ea7d71f63eb91f20629f3cea6b17897))
* added file zipping ([0c785f4](https://github.com/cheminfo/zenodo/commit/0c785f4684dc5218defae7cc47f1313e29a82f2b))
* added ORCID validation ([809f0bb](https://github.com/cheminfo/zenodo/commit/809f0bb57bd8d0668f6899a45abad88555e6ec62))
* added parallel upload with retries for depositions ([6dd170a](https://github.com/cheminfo/zenodo/commit/6dd170a5598da120ea9bed1503d7a330330a2831))
* added record and reviews ([c15cebb](https://github.com/cheminfo/zenodo/commit/c15cebb5fe14a4ff1aa180220df22fda888e0c77))
* added retrieveVersions (returns unvalidated depositions) ([e5f84cb](https://github.com/cheminfo/zenodo/commit/e5f84cbd868d1fbc3ab2a30aa5533228166c19aa))
* added retry to fetchZenodo ([04e7703](https://github.com/cheminfo/zenodo/commit/04e770335f891a6932470ef66c2d7e03d52f2677))
* added static Zenodo.create for API token validation ([c8dbed5](https://github.com/cheminfo/zenodo/commit/c8dbed57736037fe8da801c7c7583bd1b0d06861))
* added validation JSONscheme + automatic type creation ([0a3d530](https://github.com/cheminfo/zenodo/commit/0a3d5304cb1eeea5c4bb3aebf76256a803103c4a))
* moved publishing and versioning test + added submit for review ([ec5d137](https://github.com/cheminfo/zenodo/commit/ec5d1370f3ad8c92c641b3ee8e37e0e5647390b6))
* removed zod and used JSONschema for validation ([8890552](https://github.com/cheminfo/zenodo/commit/88905522869b9347849b9447dad12714bbe15be5))


### Bug Fixes

* adapted logs length for CI ([fb7df4e](https://github.com/cheminfo/zenodo/commit/fb7df4ec6585ad4e67178228e75e6ac4d6f4142f))
* added .npmignore for test package ([f533840](https://github.com/cheminfo/zenodo/commit/f53384044cb3d5c23a3502b4af1c44d3da61c663))
* added authentication states to fix the random authentication error bug ([67531d2](https://github.com/cheminfo/zenodo/commit/67531d271cacbeef38d22240c3d94961cd3942fb))
* added properties to metadata schema ([56fb113](https://github.com/cheminfo/zenodo/commit/56fb1137e8836ba37a0fa70b704891afe5a0e2bd))
* added ts-expect error ([2bda6b7](https://github.com/cheminfo/zenodo/commit/2bda6b7259551b087d25ad44bcd5ac1c85c1c85f))
* changed addToCommunity return to allow submitting API via browser ([149b0e8](https://github.com/cheminfo/zenodo/commit/149b0e8a380aea49c69a7093f08f1d8f57e4cdaf))
* fixed eslint errors ([ceeb96a](https://github.com/cheminfo/zenodo/commit/ceeb96a637fd3475ea65b84b3c03208c8d6018a8))
* fixed submitForReview route ([aa058e2](https://github.com/cheminfo/zenodo/commit/aa058e24bd170720952ad327404eaef4ea85837a))
* fixed type validation ([2323db2](https://github.com/cheminfo/zenodo/commit/2323db2497c7eb85b56f3c850618d4f4ee637ead))
* license enumeration bug ([82a6855](https://github.com/cheminfo/zenodo/commit/82a68553e385faf6265427c1699e955aae6aaa8e))
* made validation more lenient to adapt to differences in production API ([8dad798](https://github.com/cheminfo/zenodo/commit/8dad7985aa5103c993f06c90117420bf1d290124))
* making sure test passes ([ab8984e](https://github.com/cheminfo/zenodo/commit/ab8984eeac86ca9e5ad3f9a25eec7057b38fe0d2))
* modified retrieveRecord for non public use ([2694eab](https://github.com/cheminfo/zenodo/commit/2694eab9e8fd0b237cb771cdb1a98b98eb4f6f2a))
* moved delay from devDep to dep ([f64523c](https://github.com/cheminfo/zenodo/commit/f64523c3f4f2ac452fd1d7db2d001d3c5df190aa))
* removed useless check ([98be2ad](https://github.com/cheminfo/zenodo/commit/98be2ada02c8ec75bc404d447d25ba1961eb57d6))
* schema validation ([3f63eff](https://github.com/cheminfo/zenodo/commit/3f63eff114713211c5f33031e45cbb50af752ca1))
* zip.js web compatibility ([6c9633b](https://github.com/cheminfo/zenodo/commit/6c9633b94a93b2277c9ec9f5253acdf4a769e6f7))


### Code Refactoring

* changed all_versions to allVersions for consistency in the library ([f611cc1](https://github.com/cheminfo/zenodo/commit/f611cc15906ff3fa19faab5039db32a27c1f4f8b))
* remove submitForReview, rename submitForReviewBrowser to submitForReview ([7f0615b](https://github.com/cheminfo/zenodo/commit/7f0615b3dc346d76c4f6ec5ef363b9771f909ffd))
* removed retry in file creation (retry functionalities are already in fetchZenodo) ([2344961](https://github.com/cheminfo/zenodo/commit/2344961a7b44a97641d110c0091422c285a449a8))
* update tsconfig and package.json ([cfbcb1e](https://github.com/cheminfo/zenodo/commit/cfbcb1e0a2994017f731eb1786bdfdfb0fd33376))

## [2.0.0](https://github.com/cheminfo/zenodo/compare/v1.0.2...v2.0.0) (2025-02-21)


### ⚠ BREAKING CHANGES

* rebuilt project in TS with API validation with Zod ([#10](https://github.com/cheminfo/zenodo/issues/10))

### Features

* rebuilt project in TS with API validation with Zod ([#10](https://github.com/cheminfo/zenodo/issues/10)) ([0da6971](https://github.com/cheminfo/zenodo/commit/0da69719092ae190c92351dfc227484833c27d20))

## [1.0.1](https://github.com/cheminfo/zenodo/compare/v1.0.0...v1.0.1) (2018-04-26)



<a name="1.0.0"></a>
# [1.0.0](https://github.com/cheminfo/zenodo/compare/v0.4.1...v1.0.0) (2018-04-26)


### Features

* add depositions.newversion ([534b816](https://github.com/cheminfo/zenodo/commit/534b816)), closes [#2](https://github.com/cheminfo/zenodo/issues/2)



<a name="0.4.1"></a>
## [0.4.1](https://github.com/cheminfo/zenodo/compare/v0.4.0...v0.4.1) (2018-04-11)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/cheminfo/zenodo/compare/v0.3.0...v0.4.0) (2018-04-11)


### Features

* add method to get list of files and sort files ([709876b](https://github.com/cheminfo/zenodo/commit/709876b))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/cheminfo/zenodo/compare/v0.2.0...v0.3.0) (2018-04-11)


### Features

* specify maxContentLength to Infinity ([f131a0d](https://github.com/cheminfo/zenodo/commit/f131a0d))
* specify maxContentLength to Infinity ([c1ec338](https://github.com/cheminfo/zenodo/commit/c1ec338))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/cheminfo/zenodo/compare/v0.1.1...v0.2.0) (2018-04-11)


### Features

* switch request library to axios ([4f2be59](https://github.com/cheminfo/zenodo/commit/4f2be59))



<a name="0.1.1"></a>
## [0.1.1](https://github.com/cheminfo/zenodo/compare/v0.1.0...v0.1.1) (2017-12-01)


### Bug Fixes

* remove slash at the end of urls ([5b526b2](https://github.com/cheminfo/zenodo/commit/5b526b2))



<a name="0.1.0"></a>
# 0.1.0 (2017-04-03)
