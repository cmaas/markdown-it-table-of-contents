# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

–

## [0.6.0] - 2021-11-12

The TOC generator was rewritten, because the old *on-the-fly* generator couldn't deal with unexpected order of headings and double-indentations. It is now a three-step process:

1. Gather all headings in a list.
2. Turn that list into a nested tree.
3. Generate HTML code based on the nested tree.

Although all tests pass, this release could introduce some **breaking changes** for you, if you relied on the old way of doing things. Check the test cases to get a better understanding how this plugin handles various cases.

* **Added**: Support for `markdown-it-attrs` (fixes #54)
* **Changed**: Respects unexpected nesting order (fixes #55)
* **Changed**: Uses anchor targets from existing id attributes (for example, set by `markdown-it-attrs` or `markdown-it-anchor`)
* **Changed**: Now nests list correctly if there is a jump (for example: h2, h2, h4 -> h4 is now double-indented)
* **Removed**: unused tests