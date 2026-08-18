import { LINK_REGEXP } from "../../commons";

// Taken from Vue.js
var regexEscape = /["&'<>`]/g;
var escapeMap = {
    '"': '&quot;',
    '&': '&amp;',
    '\'': '&#x27;',
    '<': '&lt;',
    // See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
    // following is not strictly necessary unless it’s part of a tag or an
    // unquoted attribute value. We’re only escaping it to support those
    // situations, and for XML support.
    '>': '&gt;',
    // In Internet Explorer ≤ 8, the backtick character can be used
    // to break out of (un)quoted attribute values or HTML comments.
    // See http://html5sec.org/#102, http://html5sec.org/#108, and
    // http://html5sec.org/#133.
    '`': '&#x60;'
};

export default class Utils {

    static escape(string) {
        return string.replace(regexEscape, $0 => escapeMap[$0]);
    }

    static parseLink(text) {
        let matches = text.match(LINK_REGEXP);
        if (matches) {
            return Utils.escape(matches[1]) + '<a href="' + Utils.escape(matches[3]) + '" target="_blank">' + Utils.escape(matches[2]) + '</a>' + Utils.escape(matches[4]);
        }
        else {
            return Utils.escape(text);
        }
    }

}