# markdown-it-table-of-contents
A table of contents plugin for Markdown-it. Based on https://github.com/samchrisinger/markdown-it-toc but
simpler, a bit more customizable and with a default slugifier that matches that of https://www.npmjs.com/package/markdown-it-anchor.

## Usage

``` javascript
var MarkdownIt = require("markdown-it");
var md = new MarkdownIt();

md.use(require("markdown-it-anchor")); // Optional, but makes sense as you really want to link to something
md.use(require("markdown-it-table-of-contents"));
```

Then add `[[toc]]` where you want the table of contents to be added in your markdown.

## Example markdown

This markdown:
``` markdown
# Heading

[[toc]]

## Sub heading 1
Some nice text

## Sub heading 2
Some even nicer text
```

... would render this HTML using the default options specified in "usage" above:
``` html
<h1 id="heading">Heading</h1>

<div class="table-of-contents">
  <ul>
    <li><a href="#heading">Heading</a>
      <ul>
        <li><a href="#sub-heading-1">Sub heading 1</a></li>
        <li><a href="#sub-heading-2">Sub heading 2</a></li>
      </ul>
    </li>
  </ul>
</div>

<h2 id="sub-heading-1">Sub heading 1</h2>
<p>Some nice text</p>

<h2 id="sub-heading-2">Sub heading 2</h2>
<p>Some even nicer text</p>
```

## Options

You may specify options when `use`ing the plugin. like so:
``` javascript
md.use(require("markdown-it-table-of-contents"), options);
```

These options are available:

Name              | Description                                         | Default
------------------|-----------------------------------------------------|------------------------------------
"includeLevel"    | Headings levels to use (2 for h2:s etc)             | [1, 2]
"containerClass"  | The class for the container DIV                     | "table-of-contents"
"slugify"         | A custom slugification function                     | [string.js' `slugify`][slugify]
"markerPattern"   | Regex pattern of the marker to be replaced with TOC | `/^\[\[toc\]\]/im`
"listType"        | Type of list (`ul` for unordered, `ol` for ordered) | `ul`
"format"          | A function for formatting headings (see below)      | `undefined`


`format` is an optional function for changing how the headings are displayed in the TOC.
```js
function format(headingAsString) {
  // manipulate the headings as you like here.
  return manipulatedHeadingString;
}
```

[slugify]: http://stringjs.com/#methods/slugify
