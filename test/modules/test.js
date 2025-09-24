//@ts-check

import assert from 'node:assert';
import test, { describe } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItAttrs from 'markdown-it-attrs';
import markdownItTOC from '../../index.mjs';

const markdownItAnchorOpts = { tabIndex: false, uniqueSlugStartIndex: 2 };

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

const headingWithFormattingHTML = fs.readFileSync('test/fixtures/heading-with-formatting.html', 'utf-8');

const slugify = (s) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));

const endOfLine = os.EOL;

/**
 * @param {string} text
 */
function adjustEOL(text) {
	if ('\n' !== endOfLine) {
		text = text.replace(/([^\r])\n/g, '$1' + endOfLine);
	}
	return text;
}

describe('Testing Markdown rendering', () => {

	test('Parses correctly with default settings', () => {
		const md = new markdownIt();
		md.use(markdownItTOC);
		assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML);
	});

	test('Parses correctly with includeLevel set', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			'includeLevel': [2]
		});
		assert.equal(adjustEOL(md.render(simpleMarkdown)), simple1LevelHTML);
	});

	test('Parses correctly with containerClass set', () => {
		const md = new markdownIt();
		const customContainerClass = 'custom-container-class';
		md.use(markdownItTOC, {
			'containerClass': customContainerClass
		});
		assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML.replace(defaultContainerClass, customContainerClass));
	});

	test('Parses correctly with markerPattern set', () => {
		const md = new markdownIt();
		const customMarker = '[[custom-marker]]';
		md.use(markdownItTOC, {
			'markerPattern': /^\[\[custom-marker\]\]/im
		});
		assert.equal(adjustEOL(md.render(simpleMarkdown.replace(defaultMarker, customMarker))), simpleDefaultHTML);
	});

	test('Parses correctly with listType set', () => {
		const md = new markdownIt();
		const customListType = 'ol';
		md.use(markdownItTOC, {
			'listType': customListType
		});
		assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleDefaultHTML.replace(new RegExp(defaultListType, 'g'), customListType));
	});

	test('Formats markdown by default', () => {
		const md = new markdownIt();
		md.use(markdownItTOC);
		assert.equal(adjustEOL(md.render(simpleWithFormatting)), simpleWithFormattingHTML);
	});

	test('Parses correctly with custom formatting', () => {
		const md = new markdownIt();
		const customHeading = 'Heading with custom formatting 123abc';
		md.use(markdownItTOC, {
			format: function (str) {
				return customHeading;
			}
		});
		assert.equal(md.render(simpleMarkdown).includes(customHeading), true);
	});

	test('Custom formatting includes markdown and link', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			format: function (str, md, link) {
				assert.ok(markdownIt.prototype.isPrototypeOf(md));
				assert.notEqual(link, null);
				return 'customHeading';
			}
		});
		assert.equal(md.render(simpleMarkdown).includes('customHeading'), true);
	});

	test('Slugs match markdown-it-anchor', () => {
		const md = new markdownIt();
		md.use(markdownItAnchor, markdownItAnchorOpts);
		md.use(markdownItTOC);
		assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithAnchorsHTML);
	});

	test('Slugs match markdown-it-anchor with special chars', () => {
		const md = new markdownIt();
		md.use(markdownItAnchor, markdownItAnchorOpts);
		md.use(markdownItTOC);
		assert.equal(adjustEOL(md.render(anchorsSpecialCharsMarkdown)), anchorsSpecialCharsHTML);
	});

	test('Generates empty TOC', () => {
		const md = new markdownIt();
		md.use(markdownItAnchor, markdownItAnchorOpts);
		md.use(markdownItTOC);
		assert.equal(adjustEOL(md.render(emptyMarkdown)), emptyMarkdownHtml);
	});

	test('Parses correctly with container header and footer html set', () => {
		const md = new markdownIt();
		md.use(markdownItAnchor, markdownItAnchorOpts);
		md.use(markdownItTOC,
			{
				slugify,
				containerHeaderHtml: '<div class="header">Contents</div>',
				containerFooterHtml: '<div class="footer">Footer</div>',
			});
		assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithHeaderFooterHTML);
	});

	test('Generates TOC, with custom transformed link', () => {
		const md = new markdownIt();
		md.use(markdownItAnchor, markdownItAnchorOpts);
		md.use(markdownItTOC,
			{
				slugify,
				transformLink: (href) => {
					return href + '&type=test';
				},
			});
		assert.equal(adjustEOL(md.render(simpleMarkdown)), simpleWithTransformLink);
	});

	test('Parses correctly when headers are links', () => {
		const md = new markdownIt();
		md.use(markdownItTOC);
		md.use(markdownItAnchor, markdownItAnchorOpts);
		assert.equal(adjustEOL(md.render(simpleWithHeadingLink)), simpleWithHeadingLinkHTML);
	});

	test('Parses correctly with duplicate headers', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			'includeLevel': [1, 2, 3, 4]
		});
		md.use(markdownItAnchor, markdownItAnchorOpts);
		assert.equal(adjustEOL(md.render(simpleWithDuplicateHeadings)), simpleWithDuplicateHeadingsHTML);
	});

	test('Parses correctly with multiple levels', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			'includeLevel': [1, 2, 3, 4]
		});
		assert.equal(adjustEOL(md.render(multiLevelMarkdown)), multiLevel1234HTML);
	});

	test('Parses correctly with subset of multiple levels', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			'includeLevel': [2, 3]
		});
		assert.equal(adjustEOL(md.render(multiLevelMarkdown)), multiLevel23HTML);
	});

	test('Can manage headlines in a strange order', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			'includeLevel': [1, 2, 3]
		});
		assert.equal(adjustEOL(md.render(strangeOrderMarkdown)), strangeOrderHTML);
	});

	test('Parses correctly with custom heading id attrs', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			'includeLevel': [1, 2, 3, 4]
		});
		md.use(markdownItAttrs);
		assert.equal(adjustEOL(md.render(customAttrsMarkdown)), customAttrsHTML);
	});

	test('Parses correctly when combining markdown-it-attrs and markdown-it-anchor', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			'includeLevel': [1, 2, 3, 4]
		});
		md.use(markdownItAttrs);
		assert.equal(adjustEOL(md.render(customAttrsMarkdown)), customAttrsWithAnchorsHTML);
	});

	test('Full example', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			'includeLevel': [2, 3, 4]
		});
		md.use(markdownItAttrs);
		md.use(markdownItAnchor, markdownItAnchorOpts);
		assert.equal(adjustEOL(md.render(fullExampleMarkdown)), fullExampleHTML);
	});

	test('Full example with a custom container', () => {
		const md = new markdownIt();
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
	});

	test('Lets you emulate the old behavior', () => {
		const md = new markdownIt();
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
	});

	test('lets you emulate old behavior', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			transformContainerOpen: () => {
				return '<p><div class="table-of-contents">';
			},
			transformContainerClose: () => {
				return '</div></p>';
			}
		});
		assert.equal(adjustEOL(md.render(basicMarkdown)), basicHTML);
	});

	test('getTokensText', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			getTokensText: tokens => tokens.filter(t => ['text', 'image'].includes(t.type)).map(t => t.content).join('')
		});
		assert.equal(
			md.render('# H1 ![image](link) `code` _em_' + '\n' + '[[toc]]'),
			'<h1>H1 <img src="link" alt="image"> <code>code</code> <em>em</em></h1>\n' +
			'<div class="table-of-contents"><ul><li><a href="#h1-image-em">H1 image  em</a></li></ul></div>\n'
		);
	});

	test('Omits headlines', () => {
		const md = new markdownIt({ html: true });
		md.use(markdownItTOC, { omitTag: '<!-- omit from toc -->' });
		assert.equal(adjustEOL(md.render(omitMarkdown)), omitHTML);
	});

	test('Whitespace is maintained in custom format param', () => {
		const md = new markdownIt();
		md.use(markdownItAttrs);
		md.use(markdownItAnchor);
		md.use(markdownItTOC, {
			format: (str, md) => {
				const hasSpaces = /\s{5,}/.test(str);
				assert.equal(hasSpaces, true, `String passed to format function contains multiple spaces: '${str}'`);
				return md.renderInline(str);
			}
		});
		md.render('# Heading with     5 spaces\n\n[[toc]]');
	});

	test('No whitespace at end of headline when using custom attributes, fixes #67 part 2', () => {
		const md = new markdownIt();
		md.use(markdownItAttrs);
		md.use(markdownItAnchor);
		md.use(markdownItTOC, {
			format: (str, md) => {
				const hasSpaces = /\s{1,}$/.test(str);
				assert.equal(hasSpaces, false, `String passed to format function has unexpected space at end: '${str}'`);
				return md.renderInline(str);
			}
		});
		md.render('# Heading with spaces at end  \n\n[[toc]]');
		md.render('# Another heading with custom attrs and tabs\t{#custom-id}\n[[toc]]');
		md.render('# A third heading with custom attrs and spaces    {#custom-id}\n[[toc]]');
	});

	test('Keep formatting in headlines, fixes #67 part 1', () => {
		const md = new markdownIt();
		md.use(markdownItTOC, {
			getTokensText: (tokens, rawToken) => {
				assert.equal(rawToken.content, 'Heading with *emphasis* and **bold** and `code` and ![img](test.png)');
				return rawToken.content;
			},
			slugify: (text, rawToken) => {
				assert.equal(text, 'Heading with *emphasis* and **bold** and `code` and ![img](test.png)');
				const s = rawToken.children.map(t => t.content).join('').trim();
				return encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'));
			},
			format: (str, md) => {
				assert.equal(str, 'Heading with *emphasis* and **bold** and `code` and ![img](test.png)');
				return md.renderInline(str);
			}
		});
		const result = md.render('# Heading with *emphasis* and **bold** and `code` and ![img](test.png)\n[[toc]]');
		assert.equal(adjustEOL(result), headingWithFormattingHTML);
	});

	test('Default: drop formatting in headlines', () => {
		const md = new markdownIt();
		md.use(markdownItTOC);
		const result = md.render('# Heading with *emphasis* and **bold** and `code` and ![img](test.png)\n[[toc]]');
		console.log(result);
		const html = `<h1>Heading with <em>emphasis</em> and <strong>bold</strong> and <code>code</code> and <img src="test.png" alt="img"></h1>
<div class="table-of-contents"><ul><li><a href="#heading-with-emphasis-and-bold-and-code-and">Heading with emphasis and bold and code and</a></li></ul></div>\n`;
		assert.equal(adjustEOL(result), adjustEOL(html));
	});
});
