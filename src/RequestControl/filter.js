/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ControlRule, FILTER_ACTION } from "./base.js";
import { createRegexpPattern } from "./api.js";
import { processRedirectRules } from "./redirect.js";
import { DomainMatcher } from "./matchers.js";
import { parseInlineUrl, trimQueryParameters, UrlParser } from "./url.js";

export class FilterRule extends ControlRule {
    constructor(uuid, paramsFilter, removeQueryString, skipInlineUrlParsing, skipOnSameDomain, matcher) {
        super(uuid, matcher);
        this.queryParamsPattern = (paramsFilter) ? createRegexpPattern(paramsFilter.values) : "";
        this.invertQueryTrimming = (paramsFilter) ? paramsFilter.invert : false;
        this.removeQueryString = removeQueryString;
        this.skipInlineUrlParsing = skipInlineUrlParsing;
        this.skipOnSameDomain = skipOnSameDomain;
    }

    apply(url) {
        // Trim unwanted query parameters before parsing inline url
        let trimmedUrl = this.filterQueryParameters(url);
        trimmedUrl = this.filterInlineUrl(trimmedUrl);
        return this.filterQueryParameters(trimmedUrl);
    }

    filterQueryParameters(url) {
        if (this.removeQueryString) {
            let parser = new UrlParser(url);
            parser.search = "";
            return parser.href;
        }
        return trimQueryParameters(url, this.queryParamsPattern, this.invertQueryTrimming);
    }

    filterInlineUrl(url) {
        if (this.skipInlineUrlParsing) {
            return url;
        }
        let inlineUrl = parseInlineUrl(url);
        if (inlineUrl == null 
            || this.skipOnSameDomain && DomainMatcher.testUrls(url, inlineUrl)) {
            return url;
        }
        return inlineUrl;
    }

}

FilterRule.prototype.priority = -2;
FilterRule.prototype.action = FILTER_ACTION;
FilterRule.prototype.resolve = processRedirectRules;
