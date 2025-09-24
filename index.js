//@ts-check
'use strict';

// --- Default helpers and options ---

/**
 * Slugify a string to be used as anchor
 * @param {string} text Text to slugify
 * @param {string} rawToken Raw token to extract text from
 * @returns {string} Slugified anchor string
 */
function slugify(text, rawToken) {
	return encodeURIComponent(String(text).trim().toLowerCase().replace(/\s+/g, '-'));
};

/**
 * Default formatter for headline text
 * @param {string} content Text content of the headline
 * @param {*} md Markdown-it instance
 * @returns {string} Formatted content
 */
function format(content, md) {
	return md.renderInline(content);
}

/**
 * Generates the opening HTML for a container with a specified class and optional header HTML.
 * @param {string} containerClass The CSS class to apply to the container div
 * @param {string} containerHeaderHtml Optional HTML to include as the container's header
 * @returns {string} HTML string
 */
function transformContainerOpen(containerClass, containerHeaderHtml) {
	let tocOpenHtml = '<div class="' + containerClass + '">';
	if (containerHeaderHtml) {
		tocOpenHtml += containerHeaderHtml;
	}
	return tocOpenHtml;
};

/**
 * Generates the closing HTML / footer for a container
 * @param {string} containerFooterHtml The HTML string to be used for closing the container
 * @returns {string} HTML string
 */
function transformContainerClose(/** @type {string} */ containerFooterHtml) {
	let tocFooterHtml = '';
	if (containerFooterHtml) {
		tocFooterHtml = containerFooterHtml;
	}
	return tocFooterHtml + '</div>';
};

/**
 * Helper to extract text from tokens, same function as in markdown-it-anchor
 * @param {Array<any>} tokens Tokens
 * @param {string} rawToken Raw token to extract text from
 * @returns {string}
 */
function getTokensText(tokens, rawToken) {
	return tokens
		.filter(t => ['text', 'code_inline'].includes(t.type))
		.map(t => t.content)
		.join('')
		.trim();
}

const defaultOptions = {
	includeLevel: [1, 2],
	containerClass: 'table-of-contents',
	slugify,
	markerPattern: /^\[\[toc\]\]/im,
	omitTag: '<!-- omit from toc -->',
	listType: 'ul',
	format,
	containerHeaderHtml: undefined,
	containerFooterHtml: undefined,
	transformLink: undefined,
	transformContainerOpen,
	transformContainerClose,
	getTokensText
};

// --- Types ---

/**
* @typedef {Object} HeadlineItem
* @property {number} level Headline level
* @property {string | null} anchor Anchor target
* @property {string} text Text of headline
* @property {any | null} token Raw token of headline
*/

/**
* @typedef {Object} TocItem
* @property {number} level Item level
* @property {string} text Text of link
* @property {string | null} anchor Target of link
* @property {Array<TocItem>} children Sub-items for this list item
* @property {TocItem | null} parent Parent this item belongs to
*/

// --- TOC builder ---

/**
* Finds all headline items for the defined levels in a Markdown document.
* @param {Array<number>} levels includeLevels like `[1, 2, 3]`
* @param {*} tokens Tokens gathered by the plugin
* @param {*} options Plugin options
* @returns {Array<HeadlineItem>}
*/
function findHeadlineElements(levels, tokens, options) {
	/** @type {HeadlineItem[]} */
	const headings = [];

	/** @type {HeadlineItem | null} */
	let currentHeading = null;

	tokens.forEach((/** @type {*} */ token, /** @type {number} */ index) => {
		if (token.type === 'heading_open') {
			const prev = index > 0 ? tokens[index - 1] : null;
			if (prev && prev.type === 'html_block' && prev.content.trim().toLowerCase().replace('\n', '') === options.omitTag) {
				return;
			}
			const id = findExistingIdAttr(token);
			const level = parseInt(token.tag.toLowerCase().replace('h', ''), 10);
			if (levels.indexOf(level) >= 0) {
				currentHeading = {
					level: level,
					text: '',
					anchor: id || null,
					token: null
				};
			}
		}
		else if (currentHeading && token.type === 'inline') {
			const textContent = options.getTokensText(token.children, token);
			currentHeading.text = textContent;
			currentHeading.token = token;
			if (!currentHeading.anchor) {
				currentHeading.anchor = options.slugify(textContent, token);
			}
		}
		else if (token.type === 'heading_close') {
			if (currentHeading) {
				headings.push(currentHeading);
			}
			currentHeading = null;
		}
	});

	return headings;
}

/**
* Helper to find an existing id attr on a token. Should be a heading_open token, but could be anything really
* Provided by markdown-it-anchor or markdown-it-attrs
* @param {any} token Token
* @returns {string | null} Id attribute to use as anchor
*/
function findExistingIdAttr(token) {
	if (token && token.attrs && token.attrs.length > 0) {
		const idAttr = token.attrs.find((/** @type {string | any[]} */ attr) => {
			if (Array.isArray(attr) && attr.length >= 2) {
				return attr[0] === 'id';
			}
			return false;
		});
		if (idAttr && Array.isArray(idAttr) && idAttr.length >= 2) {
			const [_, val] = idAttr;
			return val;
		}
	}
	return null;
}

/**
* Helper to get minimum headline level so that the TOC is nested correctly
* @param {Array<HeadlineItem>} headlineItems Search these
* @returns {number} Minimum level
*/
function getMinLevel(headlineItems) {
	return Math.min(...headlineItems.map(item => item.level));
}

/**
* Helper that creates a TOCItem
* @param {number} level
* @param {string} text
* @param {string | null} anchor
* @param {TocItem} rootNode
* @returns {TocItem}
*/
function addListItem(level, text, anchor, rootNode) {
	const listItem = { level, text, anchor, children: [], parent: rootNode };
	rootNode.children.push(listItem);
	return listItem;
}

/**
* Turns a list of flat headline items into a nested tree object representing the TOC
* @param {Array<HeadlineItem>} headlineItems
* @returns {TocItem} Tree of TOC items
*/
function flatHeadlineItemsToNestedTree(headlineItems) {
	// create a root node with no text that holds the entire TOC. this won't be rendered, but only its children
	/** @type {TocItem} */
	const toc = { level: getMinLevel(headlineItems) - 1, anchor: null, text: '', children: [], parent: null };
	// pointer that tracks the last root item of the current list
	let currentRootNode = toc;
	// pointer that tracks the last item (to turn it into a new root node if necessary)
	let prevListItem = currentRootNode;

	headlineItems.forEach(headlineItem => {
		// if level is bigger, take the previous node, add a child list, set current list to this new child list
		if (headlineItem.level > prevListItem.level) {
			// eslint-disable-next-line no-unused-vars
			Array.from({ length: headlineItem.level - prevListItem.level }).forEach(_ => {
				currentRootNode = prevListItem;
				prevListItem = addListItem(headlineItem.level, '', null, currentRootNode);
			});
			prevListItem.text = headlineItem.text;
			prevListItem.anchor = headlineItem.anchor;
		}
		// if level is same, add to the current list
		else if (headlineItem.level === prevListItem.level) {
			prevListItem = addListItem(headlineItem.level, headlineItem.text, headlineItem.anchor, currentRootNode);
		}
		// if level is smaller, set current list to currentlist.parent
		else if (headlineItem.level < prevListItem.level) {
			for (let i = 0; i < prevListItem.level - headlineItem.level; i++) {
				if (currentRootNode.parent) {
					currentRootNode = currentRootNode.parent;
				}
			}
			prevListItem = addListItem(headlineItem.level, headlineItem.text, headlineItem.anchor, currentRootNode);
		}
	});

	return toc;
}

/**
 * Recursively turns a nested tree of tocItems to HTML
 * @param {TocItem} tocItem
 * @param {any} options
 * @param {any} md
 * @returns {string}
 */
function tocItemToHtml(tocItem, options, md) {
	return '<' + options.listType + '>' + tocItem.children.map(childItem => {
		let li = '<li>';
		let anchor = childItem.anchor;
		if (options && options.transformLink) {
			anchor = options.transformLink(anchor);
		}

		let text = childItem.text ? options.format(childItem.text, md, anchor) : null;

		li += anchor ? `<a href="#${anchor}">${text}</a>` : (text || '');

		return li + (childItem.children.length > 0 ? tocItemToHtml(childItem, options, md) : '') + '</li>';
	}).join('') + '</' + options.listType + '>';
}

const markdownItTableOfContents = function (/** @type {any} */ md, /** @type {any} */ opts) {
	const options = Object.assign({}, defaultOptions, opts);
	const tocRegexp = options.markerPattern;

	/**
	 * Markdown-it block rule to find [[toc]] markers
	 * @param {*} state
	 * @param {*} startLine
	 * @param {*} endLine
	 * @param {*} silent
	 * @returns {boolean}
	 */
	function toc(state, startLine, endLine, silent) {
		let token;
		let match;
		const start = state.bMarks[startLine] + state.tShift[startLine];
		const max = state.eMarks[startLine];

		// Reject if the token does not start with [
		if (state.src.charCodeAt(start) !== 0x5B /* [ */) {
			return false;
		}

		// Detect [[toc]] markup
		match = tocRegexp.exec(state.src.substring(start, max));
		match = !match ? [] : match.filter(function (/** @type {any} */ m) { return m; });
		if (match.length < 1) {
			return false;
		}

		if (silent) {
			return true;
		}

		state.line = startLine + 1

		// Build content
		token = state.push('toc_open', 'toc', 1);
		token.markup = '[[toc]]';
		token.map = [startLine, state.line];

		token = state.push('toc_body', '', 0);
		token.markup = ''
		token.map = [startLine, state.line];
		token.children = [];

		token = state.push('toc_close', 'toc', -1);
		token.markup = '';

		return true;
	}

	md.renderer.rules.toc_open = function () {
		return options.transformContainerOpen(options.containerClass, options.containerHeaderHtml);
	};

	md.renderer.rules.toc_close = function () {
		return options.transformContainerClose(options.containerFooterHtml) + '\n';
	};

	md.renderer.rules.toc_body = function (/** @type {any} */ tokens) {
		const headlineItems = findHeadlineElements(options.includeLevel, tokens, options);
		const tocTree = flatHeadlineItemsToNestedTree(headlineItems);
		const html = tocItemToHtml(tocTree, options, md);
		return html;
	};

	md.block.ruler.before('heading', 'toc', toc, {
		alt: ['paragraph', 'reference', 'blockquote']
	});
};

module.exports = markdownItTableOfContents;
