"use strict";
var assert = require("assert");
var fs = require("fs");
var MarkdownIt = require("markdown-it");
var markdownItAnchor = require("markdown-it-anchor");
var markdownItAttrs = require("markdown-it-attrs");
var markdownItTOC = require("../../index");

// Defaults
var defaultContainerClass = "table-of-contents";
var defaultMarker = "[[toc]]";
var defaultListType = "ul";

// Fixtures
var simpleMarkdown = fs.readFileSync("test/fixtures/simple.md", "utf-8");
var simpleWithFormatting = fs.readFileSync("test/fixtures/simple-with-markdown-formatting.md", "utf-8");
var simpleWithFormattingHTML = fs.readFileSync("test/fixtures/simple-with-markdown-formatting.html", "utf-8");
var simpleDefaultHTML = fs.readFileSync("test/fixtures/simple-default.html", "utf-8");
var simple1LevelHTML = fs.readFileSync("test/fixtures/simple-1-level.html", "utf-8");
var simpleWithAnchorsHTML = fs.readFileSync("test/fixtures/simple-with-anchors.html", "utf-8");
var simpleWithHeaderFooterHTML = fs.readFileSync("test/fixtures/simple-with-header-footer.html", "utf-8");
var simpleWithTransformLink = fs.readFileSync("test/fixtures/simple-with-transform-link.html", "utf-8");
var simpleWithHeadingLink = fs.readFileSync("test/fixtures/simple-with-heading-links.md", "utf-8");
var simpleWithHeadingLinkHTML = fs.readFileSync("test/fixtures/simple-with-heading-links.html", "utf-8");
var simpleWithDuplicateHeadings = fs.readFileSync("test/fixtures/simple-with-duplicate-headings.md", "utf-8");
var simpleWithDuplicateHeadingsHTML = fs.readFileSync("test/fixtures/simple-with-duplicate-headings.html", "utf-8");
var emptyMarkdown = defaultMarker;
var emptyMarkdownHtml = fs.readFileSync("test/fixtures/empty.html", "utf-8");

var multiLevelMarkdown = fs.readFileSync("test/fixtures/multi-level.md", "utf-8");
var multiLevel1234HTML = fs.readFileSync("test/fixtures/multi-level-1234.html", "utf-8");
var multiLevel23HTML = fs.readFileSync("test/fixtures/multi-level-23.html", "utf-8");
var strangeOrderMarkdown = fs.readFileSync("test/fixtures/strange-order.md", "utf-8");
var strangeOrderHTML = fs.readFileSync("test/fixtures/strange-order.html", "utf-8");

var customAttrsMarkdown = fs.readFileSync("test/fixtures/custom-attrs.md", "utf-8");
var customAttrsHTML = fs.readFileSync("test/fixtures/custom-attrs.html", "utf-8");
var customAttrsWithAnchorsHTML = fs.readFileSync("test/fixtures/custom-attrs-with-anchors.html", "utf-8");

var fullExampleMarkdown = fs.readFileSync("test/fixtures/full-example.md", "utf-8");
var fullExampleHTML = fs.readFileSync("test/fixtures/full-example.html", "utf-8");


var slugify = (s) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));


var endOfLine = require('os').EOL;

function adjustEOL(text) {
  if ('\n'!==endOfLine) {
    text = text.replace( /([^\r])\n/g, '\$1'+endOfLine);
  }
  return text;
}

describe("Testing Markdown rendering", function() {
  it("Parses correctly with default settings", function(done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC);
    assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML);
    done();
  });

  it("Parses correctly with includeLevel set", function(done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC, {
      "includeLevel": [2]
    });
    assert.equal(adjustEOL(md.render(simpleMarkdown)), simple1LevelHTML);
    done();
  });

  it("Parses correctly with containerClass set", function(done) {
    var md = new MarkdownIt();
    var customContainerClass = "custom-container-class";
    md.use(markdownItTOC, {
      "containerClass": customContainerClass
    });
    assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML.replace(defaultContainerClass, customContainerClass));
    done();
  });

  it("Parses correctly with markerPattern set", function(done) {
    var md = new MarkdownIt();
    var customMarker = "[[custom-marker]]";
    md.use(markdownItTOC, {
      "markerPattern": /^\[\[custom-marker\]\]/im
    });
    assert.equal(adjustEOL(md.render(simpleMarkdown.replace(defaultMarker, customMarker))), simpleDefaultHTML);
    done();
  });

  it("Parses correctly with listType set", function(done) {
    var md = new MarkdownIt();
    var customListType = "ol";
    md.use(markdownItTOC, {
      "listType": customListType
    });
    assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML.replace(new RegExp(defaultListType, "g"), customListType));
    done();
  });

  it("Formats markdown by default", function(done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC);
    assert.equal(adjustEOL(md.render(simpleWithFormatting)), simpleWithFormattingHTML);
    done();
  });

  it("Parses correctly with custom formatting", function(done) {
    var md = new MarkdownIt();
    var customHeading = "Heading with custom formatting 123abc";
    md.use(markdownItTOC, {
      format: function(str) { return customHeading; }
    });
    assert.equal(md.render(simpleMarkdown).includes(customHeading), true);
    done();
  });

  it("Custom formatting includes markdown and link", function(done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC, {
      format: function(str, md, link) {
        assert.ok(MarkdownIt.prototype.isPrototypeOf(md));
        assert.notEqual(link, null);
        return "customHeading";
      }
    });
    assert.equal(md.render(simpleMarkdown).includes("customHeading"), true);
    done();
  });

  it("Slugs matches markdown-it-anchor", function(done) {
    var md = new MarkdownIt();
    md.use(markdownItAnchor);
    md.use(markdownItTOC);
    assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithAnchorsHTML);
    done();
  });

  it("Generates empty TOC", function(done) {
    var md = new MarkdownIt();
    md.use(markdownItAnchor);
    md.use(markdownItTOC);
    assert.equal(adjustEOL(md.render(emptyMarkdown)), emptyMarkdownHtml);
    done();
  });

  it("Throws an error if forceFullToc is enabled", function (done) {
    var md = new MarkdownIt();
    md.use(markdownItAnchor);
    md.use(markdownItTOC, {
      forceFullToc: true
    });
    assert.throws(() => md.render(simpleMarkdown), /forceFullToc was removed/);
    done();
  });

  it("Parses correctly with container header and footer html set", function (done) {
    var md = new MarkdownIt();
    md.use(markdownItAnchor);
    md.use(markdownItTOC,
      {
        slugify,
        containerHeaderHtml: `<div class="header">Contents</div>`,
        containerFooterHtml: `<div class="footer">Footer</div>`,
      });
    assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithHeaderFooterHTML);
    done();
  });

  it("Generates TOC, with custom transformed link", function (done) {
    var md = new MarkdownIt();
    md.use(markdownItAnchor);
    md.use(markdownItTOC,
      {
        slugify,
        transformLink: (href) => {
          return href+"&type=test";
        },
      });
    assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithTransformLink);
    done();
  });

  it("Parses correctly when headers are links", function (done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC);
    md.use(markdownItAnchor);
    assert.equal(adjustEOL(md.render(simpleWithHeadingLink)), simpleWithHeadingLinkHTML);
    done();
  });

  it("Parses correctly with duplicate headers", function (done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC, {
      "includeLevel": [1,2,3,4]
    });
    md.use(markdownItAnchor);
    assert.equal(adjustEOL(md.render(simpleWithDuplicateHeadings)), simpleWithDuplicateHeadingsHTML);
    done();
  });

  it("Parses correctly with multiple levels", function(done) {
    var md = new MarkdownIt();
    //md.use(markdownItAnchor);
    md.use(markdownItTOC, {
      "includeLevel": [1, 2, 3, 4]
    });
    assert.equal(adjustEOL(md.render(multiLevelMarkdown)), multiLevel1234HTML);
    done();
  });

  it("Parses correctly with subset of multiple levels", function(done) {
    var md = new MarkdownIt();
    //md.use(markdownItAnchor);
    md.use(markdownItTOC, {
      "includeLevel": [2, 3]
    });
    assert.equal(adjustEOL(md.render(multiLevelMarkdown)), multiLevel23HTML);
    done();
  });

  it("Can manage headlines in a strange order", function(done) {
    var md = new MarkdownIt();
    //md.use(markdownItAnchor);
    md.use(markdownItTOC, {
      "includeLevel": [1, 2, 3]
    });
    assert.equal(adjustEOL(md.render(strangeOrderMarkdown)), strangeOrderHTML);
    done();
  });

  it("Parses correctly with custom heading id attrs", function (done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC, {
      "includeLevel": [1,2,3,4]
    });
    md.use(markdownItAttrs);
    assert.equal(adjustEOL(md.render(customAttrsMarkdown)), customAttrsHTML);
    done();
  });

  it("Parses correctly when combining markdown-it-attrs and markdown-it-anchor", function (done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC, {
      "includeLevel": [1,2,3,4]
    });
    md.use(markdownItAttrs);
    assert.equal(adjustEOL(md.render(customAttrsMarkdown)), customAttrsWithAnchorsHTML);
    done();
  });

  it("Full example", function (done) {
    var md = new MarkdownIt();
    md.use(markdownItTOC, {
      "includeLevel": [2,3,4]
    });
    md.use(markdownItAttrs);
    md.use(markdownItAnchor);
    assert.equal(adjustEOL(md.render(fullExampleMarkdown)), fullExampleHTML);
    done();
  });

});
