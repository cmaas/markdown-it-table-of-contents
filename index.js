"use strict";
var string = require("string");
var assign = require("lodash.assign");
var defaults = {
  includeLevel: [ 1, 2 ],
  containerClass: "table-of-contents",
  slugify: function(str) {
    return string(str).slugify().toString();
  },
  markerPattern: /^\[\[toc\]\]/im,
  listType: "ul",
  format: undefined
};

module.exports = function(md, options) {
  var options = assign({}, defaults, options);
  var tocRegexp = options.markerPattern;
  var gstate;

  function toc(state, silent) {
    var token;
    var match;

    // Reject if the token does not start with [
    if (state.src.charCodeAt(state.pos) !== 0x5B /* [ */ ) {
      return false;
    }
    // Don't run any pairs in validation mode
    if (silent) {
      return false;
    }

    // Detect TOC markdown
    match = tocRegexp.exec(state.src);
    match = !match ? [] : match.filter(function(m) { return m; });
    if (match.length < 1) {
      return false;
    }

    // Build content
    token = state.push("toc_open", "toc", 1);
    token.markup = "[[toc]]";
    token = state.push("toc_body", "", 0);
    token = state.push("toc_close", "toc", -1);

    // Update pos so the parser can continue
    var newline = state.src.indexOf("\n");
    if (newline !== -1) {
      state.pos = state.pos + newline;
    } else {
      state.pos = state.pos + state.posMax + 1;
    }

    return true;
  }

  md.renderer.rules.toc_open = function(tokens, index) {
    return '<div class="' + options.containerClass + '">';
  };

  md.renderer.rules.toc_close = function(tokens, index) {
    return "</div>";
  };

  md.renderer.rules.toc_body = function(tokens, index) {
    return renderChildsTokens(0, gstate.tokens)[1];
  };

  function renderChildsTokens(pos, tokens) {
    var headings = [],
        buffer = '',
        currentLevel,
        subHeadings,
        size = tokens.length,
        i = pos;
    while(i < size) {
      var token = tokens[i];
      var heading = tokens[i - 1];
      var level = token.tag && parseInt(token.tag.substr(1, 1));
      if (token.type !== "heading_close" || options.includeLevel.indexOf(level) == -1 || heading.type !== "inline") {
        i++; continue; // Skip if not matching criteria
      }
      if (!currentLevel) {
        currentLevel = level;// We init with the first found level
      } else {
        if (level > currentLevel) {
          subHeadings = renderChildsTokens(i, tokens);
          buffer += subHeadings[1];
          i = subHeadings[0];
          continue;
        }
        if (level < currentLevel) {
          // Finishing the sub headings
          buffer += "</li>";
          headings.push(buffer);
          return [i, "<" + options.listType + ">" + headings.join("") + "</" + options.listType + ">"];
        }
        if (level == currentLevel) {
          // Finishing the sub headings
          buffer += "</li>";
          headings.push(buffer);
        }
      }
      buffer = "<li><a href=\"#" + options.slugify(heading.content) + "\">";
      buffer += typeof options.format === "function" ? options.format(heading.content) : heading.content;
      buffer += "</a>";
      i++;
    }
    buffer += buffer === "" ? "" : "</li>";
    headings.push(buffer);
    return [i, "<" + options.listType + ">" + headings.join("") + "</" + options.listType + ">"];
  }

  // Catch all the tokens for iteration later
  md.core.ruler.push("grab_state", function(state) {
    gstate = state;
  });

  // Insert TOC
  md.inline.ruler.after("emphasis", "toc", toc);
};
