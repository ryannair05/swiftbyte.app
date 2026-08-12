import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
    APP_STORE_URL,
    applyDispatcher,
    parseDispatcherRequest
} from "../meetandeat/open/dispatcher.mjs";

const root = process.cwd();

async function source(relativePath) {
    return readFile(path.join(root, relativePath), "utf8");
}

function fakeDocument() {
    const elements = new Map();
    for (const id of ["requestTitle", "requestState", "openAction", "officialAction"]) {
        elements.set(id, {
            attributes: new Map(),
            textContent: "",
            href: "",
            setAttribute(name, value) { this.attributes.set(name, value); },
            removeAttribute(name) {
                this.attributes.delete(name);
                if (name === "href") this.href = "";
            }
        });
    }
    return {
        elements,
        getElementById(id) { return elements.get(id); }
    };
}

test("valid dispatcher requests map to exact app routes and site-owned official sources", () => {
    const hall = parseDispatcherRequest("?kind=hall&id=psu%3Apollock&date=2026-08-11&meal=lunch");
    assert.equal(hall.valid, true);
    assert.equal(hall.targetURL, "meetandeat://view-hall?provider=psu&hall=pollock&date=2026-08-11&meal=lunch");
    assert.equal(hall.officialURL, "https://liveon.psu.edu/university-park/dining/pollock");

    const dish = parseDispatcherRequest("?kind=dish&id=psu%3Amid%3A12345&date=2024-02-29");
    assert.equal(dish.valid, true);
    assert.equal(dish.targetURL, "meetandeat://dish?provider=psu&id=mid%3A12345&date=2024-02-29");
    assert.equal(dish.officialURL, "https://liveon.psu.edu/university-park/dining");

    const nestedDishID = parseDispatcherRequest("?kind=dish&id=uga%3Anative%3Astation%3A42");
    assert.equal(nestedDishID.valid, true);
    assert.equal(nestedDishID.targetURL, "meetandeat://dish?provider=uga&id=native%3Astation%3A42");

    const route = parseDispatcherRequest("?kind=cata-route&id=51");
    assert.equal(route.valid, true);
    assert.equal(route.targetURL, "meetandeat://cata/route?id=51");
    assert.equal(route.officialURL, "https://catabus.com/");

    const stop = parseDispatcherRequest("?kind=cata-stop&id=123");
    assert.equal(stop.valid, true);
    assert.equal(stop.targetURL, "meetandeat://cata/stop?id=123");
});

test("validation rejects malformed, ambiguous, unsupported, and privacy-sensitive input", () => {
    const invalidQueries = [
        "",
        "?kind=hall",
        "?id=psu%3Apollock",
        "?kind=saved-commute&id=private",
        "?kind=hall&kind=dish&id=psu%3Apollock",
        "?kind=hall&id=psu%3Apollock&id=psu%3Anorth",
        "?kind=hall&id=psu%3Apollock&date=2026-08-11&date=2026-08-12",
        "?kind=hall&id=psu%3Aunknown",
        "?kind=hall&id=barnard%3Ahewitt",
        "?kind=hall&id=psu%3A",
        "?kind=hall&id=%3Apollock",
        "?kind=hall&id=psu%3Apollock&date=2026-02-29",
        "?kind=hall&id=psu%3Apollock&date=2026-2-09",
        "?kind=hall&id=psu%3Apollock&meal=Lunch",
        "?kind=hall&id=psu%3Apollock&meal=lunch_special",
        `?kind=hall&id=psu%3Apollock&meal=${"a".repeat(33)}`,
        "?kind=dish&id=psu%3Anative%3A1",
        "?kind=dish&id=uga%3Amid%3A1",
        "?kind=dish&id=psu%3Amid%3A",
        "?kind=dish&id=psu%3Amid%3A1&meal=lunch",
        "?kind=cata-route&id=0",
        "?kind=cata-route&id=%2B51",
        "?kind=cata-stop&id=12.3",
        "?kind=cata-route&id=51&date=2026-08-11",
        "?kind=cata-stop&id=51&meal=lunch",
        "?kind=hall&id=%20psu%3Apollock",
        "?kind=hall&id=psu%3Apollock%0A",
        "?kind=hall&id=%E0%A4%A"
    ];
    for (const query of invalidQueries) {
        assert.equal(parseDispatcherRequest(query).valid, false, query);
    }

    const overlongID = `psu:name:${"😀".repeat(129)}`;
    assert.equal(parseDispatcherRequest(`?kind=dish&id=${encodeURIComponent(overlongID)}`).valid, false);
});

test("unknown parameters are ignored and never become navigation or fallback destinations", () => {
    const result = parseDispatcherRequest(
        "?kind=hall&id=psu%3Apollock&campaign=friend&redirect=https%3A%2F%2Fevil.example%2F"
    );
    assert.equal(result.valid, true);
    assert.equal(result.targetURL.includes("evil.example"), false);
    assert.equal(result.officialURL.includes("evil.example"), false);

    const validDocument = fakeDocument();
    applyDispatcher(validDocument, "?kind=cata-route&id=51");
    assert.equal(validDocument.elements.get("openAction").href, "meetandeat://cata/route?id=51");
    assert.equal(validDocument.elements.get("officialAction").href, "https://catabus.com/");

    const invalidDocument = fakeDocument();
    applyDispatcher(invalidDocument, "?kind=cata-route&id=-51&redirect=meetandeat%3A%2F%2Fcata%2Froute%3Fid%3D51");
    assert.equal(invalidDocument.elements.get("openAction").href, "");
    assert.equal(invalidDocument.elements.get("openAction").attributes.get("aria-disabled"), "true");
    assert.equal(invalidDocument.elements.get("officialAction").href, "/meetandeat/");
});

test("all stable pages expose crawler metadata, explicit actions, and JavaScript-free fallbacks", async () => {
    const stablePages = [
        "meetandeat/index.html",
        "meetandeat/open/index.html",
        "meetandeat/cata/index.html",
        "meetandeat/hall/north/index.html",
        "meetandeat/hall/east/index.html",
        "meetandeat/hall/south/index.html",
        "meetandeat/hall/west/index.html",
        "meetandeat/hall/pollock/index.html"
    ];
    for (const page of stablePages) {
        const html = await source(page);
        assert.match(html, /<link rel="canonical" href="https:\/\/swiftbyte\.app\/meetandeat\//u, page);
        assert.match(html, /<meta property="og:title"/u, page);
        assert.match(html, /<meta property="og:description"/u, page);
        assert.match(html, /<meta property="og:image" content="https:\/\/swiftbyte\.app\/AppIcon\.png">/u, page);
        assert.match(html, /Open in Meet and Eat/u, page);
        assert.match(html, new RegExp(APP_STORE_URL.replaceAll("/", "\\/"), "u"), page);
        assert.doesNotMatch(html, /<APP_STORE_ID>/u, page);
    }

    const openHTML = await source("meetandeat/open/index.html");
    assert.match(openHTML, /id="openAction"[^>]*aria-disabled="true"/u);
    assert.match(openHTML, /id="officialAction"[^>]*href="\/meetandeat\/"/u);
    assert.match(openHTML, /<noscript>/u);
    assert.match(openHTML, /connect-src 'none'/u);
    assert.doesNotMatch(openHTML, /og:[^>]+(?:date|meal|route|stop|dish)/iu);

    const dispatcher = await source("meetandeat/open/dispatcher.mjs");
    for (const forbidden of [
        "fetch(",
        "XMLHttpRequest",
        "localStorage",
        "sessionStorage",
        ".innerHTML",
        "document.write",
        "location.replace",
        "location.assign",
        "setTimeout("
    ]) {
        assert.equal(dispatcher.includes(forbidden), false, forbidden);
    }
});
