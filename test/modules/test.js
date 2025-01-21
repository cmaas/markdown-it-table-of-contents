//@ts-check
'use strict';

const assert = require('assert');
const fs = require('fs');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItAnchorOpts = { tabIndex: false, uniqueSlugStartIndex: 2 };
const markdownItAttrs = require('markdown-it-attrs');
const markdownItTOC = require('../../index.js');

// Defaults
const defaultContainerClass = 'table-of-contents';
const defaultMarker = '[[toc]]';
const defaultListType = 'ul';

// Fixtures
const simpleMarkdown = fs.readFileSync('test/fixtures/simple.md', 'utf-8');
const simpleWithFormatting = fs.readFileSync('test/fixtures/simple-with-markdown-formatting.md', 'utf-8');
const simpleWithFormattingHTML = fs.readFileSync('test/fixtures/simple-with-markdown-formatting.html', 'utf-8');
const simpleDefaultHTML = fs.readFileSync('test/fixtures/simple-default.html', 'utf-8');
const simple1LevelHTML = fs.readFileSync('test/fixtures/simple-1-level.html', 'utf-8');
const simpleWithAnchorsHTML = fs.readFileSync('test/fixtures/simple-with-anchors.html', 'utf-8');
const simpleWithHeaderFooterHTML = fs.readFileSync('test/fixtures/simple-with-header-footer.html', 'utf-8');
const simpleWithTransformLink = fs.readFileSync('test/fixtures/simple-with-transform-link.html', 'utf-8');
const simpleWithHeadingLink = fs.readFileSync('test/fixtures/simple-with-heading-links.md', 'utf-8');
const simpleWithHeadingLinkHTML = fs.readFileSync('test/fixtures/simple-with-heading-links.html', 'utf-8');
const simpleWithDuplicateHeadings = fs.readFileSync('test/fixtures/simple-with-duplicate-headings.md', 'utf-8');
const simpleWithDuplicateHeadingsHTML = fs.readFileSync('test/fixtures/simple-with-duplicate-headings.html', 'utf-8');
const emptyMarkdown = defaultMarker;
const emptyMarkdownHtml = fs.readFileSync('test/fixtures/empty.html', 'utf-8');

const multiLevelMarkdown = fs.readFileSync('test/fixtures/multi-level.md', 'utf-8');
const multiLevel1234HTML = fs.readFileSync('test/fixtures/multi-level-1234.html', 'utf-8');
const multiLevel23HTML = fs.readFileSync('test/fixtures/multi-level-23.html', 'utf-8');
const strangeOrderMarkdown = fs.readFileSync('test/fixtures/strange-order.md', 'utf-8');
const strangeOrderHTML = fs.readFileSync('test/fixtures/strange-order.html', 'utf-8');

const customAttrsMarkdown = fs.readFileSync('test/fixtures/custom-attrs.md', 'utf-8');
const customAttrsHTML = fs.readFileSync('test/fixtures/custom-attrs.html', 'utf-8');
const customAttrsWithAnchorsHTML = fs.readFileSync('test/fixtures/custom-attrs-with-anchors.html', 'utf-8');

const fullExampleMarkdown = fs.readFileSync('test/fixtures/full-example.md', 'utf-8');
const fullExampleHTML = fs.readFileSync('test/fixtures/full-example.html', 'utf-8');
const fullExampleCustomContainerHTML = fs.readFileSync('test/fixtures/full-example-custom-container.html', 'utf-8');

const basicMarkdown = fs.readFileSync('test/fixtures/basic.md', 'utf-8');
const basicHTML = fs.readFileSync('test/fixtures/basic.html', 'utf-8');

const anchorsSpecialCharsMarkdown = fs.readFileSync('test/fixtures/anchors-special-chars.md', 'utf-8');
const anchorsSpecialCharsHTML = fs.readFileSync('test/fixtures/anchors-special-chars.html', 'utf-8');

const omitMarkdown = fs.readFileSync('test/fixtures/omit.md', 'utf-8');
const omitHTML = fs.readFileSync('test/fixtures/omit.html', 'utf-8');


const slugify = (s) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));


const endOfLine = require('os').EOL;

function adjustEOL(text) {
    if ('\n' !== endOfLine) {
        text = text.replace(/([^\r])\n/g, '$1' + endOfLine);
    }
    return text;
}

describe('Testing Markdown rendering', function () {
    it('Parses correctly with default settings', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC);
        assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML);
        done();
    });

    it('Parses correctly with includeLevel set', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            'includeLevel': [2]
        });
        assert.equal(adjustEOL(md.render(simpleMarkdown)), simple1LevelHTML);
        done();
    });

    it('Parses correctly with containerClass set', function (done) {
        const md = new MarkdownIt();
        const customContainerClass = 'custom-container-class';
        md.use(markdownItTOC, {
            'containerClass': customContainerClass
        });
        assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML.replace(defaultContainerClass, customContainerClass));
        done();
    });

    it('Parses correctly with markerPattern set', function (done) {
        const md = new MarkdownIt();
        const customMarker = '[[custom-marker]]';
        md.use(markdownItTOC, {
            'markerPattern': /^\[\[custom-marker\]\]/im
        });
        assert.equal(adjustEOL(md.render(simpleMarkdown.replace(defaultMarker, customMarker))), simpleDefaultHTML);
        done();
    });

    it('Parses correctly with listType set', function (done) {
        const md = new MarkdownIt();
        const customListType = 'ol';
        md.use(markdownItTOC, {
            'listType': customListType
        });
        assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML.replace(new RegExp(defaultListType, 'g'), customListType));
        done();
    });

    it('Formats markdown by default', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC);
        assert.equal(adjustEOL(md.render(simpleWithFormatting)), simpleWithFormattingHTML);
        done();
    });

    it('Parses correctly with custom formatting', function (done) {
        const md = new MarkdownIt();
        const customHeading = 'Heading with custom formatting 123abc';
        md.use(markdownItTOC, {
            format: function (str) { return customHeading; }
        });
        assert.equal(md.render(simpleMarkdown).includes(customHeading), true);
        done();
    });

    it('Custom formatting includes markdown and link', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            format: function (str, md, link) {
                assert.ok(MarkdownIt.prototype.isPrototypeOf(md));
                assert.notEqual(link, null);
                return 'customHeading';
            }
        });
        assert.equal(md.render(simpleMarkdown).includes('customHeading'), true);
        done();
    });

    it('Slugs match markdown-it-anchor', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItAnchor, markdownItAnchorOpts);
        md.use(markdownItTOC);
        assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithAnchorsHTML);
        done();
    });

    it('Slugs match markdown-it-anchor with special chars', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItAnchor, markdownItAnchorOpts);
        md.use(markdownItTOC);
        assert.equal(adjustEOL(md.render(anchorsSpecialCharsMarkdown)), anchorsSpecialCharsHTML);
        done();
    });

    it('Generates empty TOC', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItAnchor, markdownItAnchorOpts);
        md.use(markdownItTOC);
        assert.equal(adjustEOL(md.render(emptyMarkdown)), emptyMarkdownHtml);
        done();
    });

    it('Parses correctly with container header and footer html set', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItAnchor, markdownItAnchorOpts);
        md.use(markdownItTOC,
            {
                slugify,
                containerHeaderHtml: '<div class="header">Contents</div>',
                containerFooterHtml: '<div class="footer">Footer</div>',
            });
        assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithHeaderFooterHTML);
        done();
    });

    it('Generates TOC, with custom transformed link', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItAnchor, markdownItAnchorOpts);
        md.use(markdownItTOC,
            {
                slugify,
                transformLink: (href) => {
                    return href + '&type=test';
                },
            });
        assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithTransformLink);
        done();
    });

    it('Parses correctly when headers are links', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC);
        md.use(markdownItAnchor, markdownItAnchorOpts);
        assert.equal(adjustEOL(md.render(simpleWithHeadingLink)), simpleWithHeadingLinkHTML);
        done();
    });

    it('Parses correctly with duplicate headers', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            'includeLevel': [1, 2, 3, 4]
        });
        md.use(markdownItAnchor, markdownItAnchorOpts);
        assert.equal(adjustEOL(md.render(simpleWithDuplicateHeadings)), simpleWithDuplicateHeadingsHTML);
        done();
    });

    it('Parses correctly with multiple levels', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            'includeLevel': [1, 2, 3, 4]
        });
        assert.equal(adjustEOL(md.render(multiLevelMarkdown)), multiLevel1234HTML);
        done();
    });

    it('Parses correctly with subset of multiple levels', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            'includeLevel': [2, 3]
        });
        assert.equal(adjustEOL(md.render(multiLevelMarkdown)), multiLevel23HTML);
        done();
    });

    it('Can manage headlines in a strange order', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            'includeLevel': [1, 2, 3]
        });
        assert.equal(adjustEOL(md.render(strangeOrderMarkdown)), strangeOrderHTML);
        done();
    });

    it('Parses correctly with custom heading id attrs', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            'includeLevel': [1, 2, 3, 4]
        });
        md.use(markdownItAttrs);
        assert.equal(adjustEOL(md.render(customAttrsMarkdown)), customAttrsHTML);
        done();
    });

    it('Parses correctly when combining markdown-it-attrs and markdown-it-anchor', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            'includeLevel': [1, 2, 3, 4]
        });
        md.use(markdownItAttrs);
        assert.equal(adjustEOL(md.render(customAttrsMarkdown)), customAttrsWithAnchorsHTML);
        done();
    });

    it('Full example', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            'includeLevel': [2, 3, 4]
        });
        md.use(markdownItAttrs);
        md.use(markdownItAnchor, markdownItAnchorOpts);
        assert.equal(adjustEOL(md.render(fullExampleMarkdown)), fullExampleHTML);
        done();
    });

    it('Full example with a custom container', (done) => {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            includeLevel: [2, 3, 4],
            transformContainerOpen: () => {
                return '<nav class="my-toc"><button>Toggle</button><h3>Table of Contents</h3>';
            },
            transformContainerClose: () => {
                return '</nav>';
            }
        });
        md.use(markdownItAttrs);
        md.use(markdownItAnchor, markdownItAnchorOpts);
        assert.equal(adjustEOL(md.render(fullExampleMarkdown)), fullExampleCustomContainerHTML);
        done();
    });

    it('Lets you emulate the old behavior', (done) => {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            includeLevel: [2, 3, 4],
            transformContainerOpen: () => {
                return '<nav class="my-toc"><button>Toggle</button><h3>Table of Contents</h3>';
            },
            transformContainerClose: () => {
                return '</nav>';
            }
        });
        md.use(markdownItAttrs);
        md.use(markdownItAnchor, markdownItAnchorOpts);
        assert.equal(adjustEOL(md.render(fullExampleMarkdown)), fullExampleCustomContainerHTML);
        done();
    });

    it('lets you emulate old behavior', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            transformContainerOpen: () => {
                return '<p><div class="table-of-contents">';
            },
            transformContainerClose: () => {
                return '</div></p>';
            }
        });
        assert.equal(adjustEOL(md.render(basicMarkdown)), basicHTML);
        done();
    });

    it('getTokensText', function (done) {
        const md = new MarkdownIt();
        md.use(markdownItTOC, {
            getTokensText: tokens => tokens.filter(t => ['text', 'image'].includes(t.type)).map(t => t.content).join('')
        });
        assert.equal(
            md.render('# H1 ![image](link) `code` _em_' + '\n' + '[[toc]]'),
            '<h1>H1 <img src="link" alt="image"> <code>code</code> <em>em</em></h1>\n' +
            '<div class="table-of-contents"><ul><li><a href="#h1-image-em">H1 image  em</a></li></ul></div>\n'
        );
        done();
    });

	it('Omits headlines', function (done) {
        const md = new MarkdownIt({ html: true });
        md.use(markdownItTOC, { omitTag: '<!-- omit from toc -->'});
        assert.equal(adjustEOL(md.render(omitMarkdown)), omitHTML);
        done();
    });
});
