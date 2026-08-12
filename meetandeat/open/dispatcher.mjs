const APP_STORE_URL = "https://apps.apple.com/us/app/meet-and-eat-campus-dining/id6446225508";

const PROVIDERS = Object.freeze({
    psu: Object.freeze({
        name: "Penn State",
        diningURL: "https://liveon.psu.edu/university-park/dining",
        halls: Object.freeze({
            north: Object.freeze({
                name: "North",
                officialURL: "https://liveon.psu.edu/university-park/dining/northside-warnock-commons"
            }),
            east: Object.freeze({
                name: "East",
                officialURL: "https://liveon.psu.edu/university-park/dining/east-food-district-buffet"
            }),
            south: Object.freeze({
                name: "South",
                officialURL: "https://liveon.psu.edu/university-park/dining/southside-buffet-south-food-district"
            }),
            west: Object.freeze({
                name: "West",
                officialURL: "https://liveon.psu.edu/university-park/dining/waring-square-buffet-west"
            }),
            pollock: Object.freeze({
                name: "Pollock",
                officialURL: "https://liveon.psu.edu/university-park/dining/pollock"
            })
        }),
        dishPrefixes: Object.freeze(["mid", "name"])
    }),
    "barnard-columbia": Object.freeze({
        name: "Barnard and Columbia",
        diningURL: "https://barnard.edu/restaurants",
        halls: Object.freeze({
            hewitt: Object.freeze({ name: "Hewitt Dining Hall", officialURL: "https://barnard.edu/restaurants" }),
            liz: Object.freeze({ name: "Liz’s Place", officialURL: "https://barnard.edu/restaurants" })
        }),
        dishPrefixes: Object.freeze(["native", "name"])
    }),
    uga: Object.freeze({
        name: "UGA",
        diningURL: "https://dining.uga.edu/locations/dining-commons/",
        halls: Object.freeze({
            bolton: Object.freeze({ name: "Bolton", officialURL: "https://dining.uga.edu/locations/dining-commons/" }),
            oglethorpe: Object.freeze({ name: "Oglethorpe", officialURL: "https://dining.uga.edu/locations/dining-commons/" }),
            snelling: Object.freeze({ name: "Snelling", officialURL: "https://dining.uga.edu/locations/dining-commons/" }),
            niche: Object.freeze({ name: "The Niche", officialURL: "https://dining.uga.edu/locations/dining-commons/" }),
            village: Object.freeze({ name: "Village Summit", officialURL: "https://dining.uga.edu/locations/dining-commons/" })
        }),
        dishPrefixes: Object.freeze(["native", "name"])
    })
});

const CATA_OFFICIAL_URL = "https://catabus.com/";
const ALLOWED_KINDS = new Set(["hall", "dish", "cata-route", "cata-stop"]);
const SCHEMA_KEYS = Object.freeze(["kind", "id", "date", "meal"]);
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f-\u009f]/u;
const MEAL_SLUG = /^[a-z0-9-]{1,32}$/u;
const POSITIVE_DECIMAL = /^[0-9]+$/u;

function invalid(reason = "unsupported") {
    return Object.freeze({ valid: false, reason });
}

function unicodeScalarCount(value) {
    return Array.from(value).length;
}

function isBoundedPublicValue(value) {
    return typeof value === "string"
        && value.length > 0
        && value === value.trim()
        && unicodeScalarCount(value) <= 128
        && !CONTROL_CHARACTER.test(value);
}

function hasWellFormedEncoding(search) {
    const query = search.startsWith("?") ? search.slice(1) : search;
    if (query.length === 0) return true;
    return query.split("&").every((pair) => pair.split("=", 2).every((part) => {
        try {
            decodeURIComponent(part.replaceAll("+", " "));
            return true;
        } catch {
            return false;
        }
    }));
}

function strictGregorianDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1 || month < 1 || month > 12) return false;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day >= 1 && day <= days[month - 1];
}

function splitAtFirstColon(value) {
    const separator = value.indexOf(":");
    if (separator <= 0 || separator === value.length - 1) return null;
    return [value.slice(0, separator), value.slice(separator + 1)];
}

function buildHallRequest(id, date, meal) {
    const scoped = splitAtFirstColon(id);
    if (!scoped) return invalid("invalid-id");
    const [providerID, hallID] = scoped;
    const provider = PROVIDERS[providerID];
    const hall = provider?.halls[hallID];
    if (!provider || !hall) return invalid("unsupported-hall");
    if (date !== null && !strictGregorianDate(date)) return invalid("invalid-date");
    if (meal !== null && !MEAL_SLUG.test(meal)) return invalid("invalid-meal");

    const target = new URL("meetandeat://view-hall");
    target.searchParams.set("provider", providerID);
    target.searchParams.set("hall", hallID);
    if (date !== null) target.searchParams.set("date", date);
    if (meal !== null) target.searchParams.set("meal", meal);

    const context = [date, meal].filter(Boolean).join(" · ");
    return Object.freeze({
        valid: true,
        kind: "hall",
        targetURL: target.href,
        officialURL: hall.officialURL,
        officialLabel: `View official ${hall.name} information`,
        title: `${hall.name} dining`,
        detail: context
            ? `Open the shared ${context} selection in Meet and Eat. Official dining details remain available from ${provider.name}.`
            : `Open this dining hall in Meet and Eat, or use ${provider.name} for official dining details.`
    });
}

function buildDishRequest(id, date, meal) {
    if (meal !== null) return invalid("unsupported-meal");
    const scoped = splitAtFirstColon(id);
    if (!scoped) return invalid("invalid-id");
    const [providerID, component] = scoped;
    const provider = PROVIDERS[providerID];
    const canonical = splitAtFirstColon(component);
    if (!provider || !canonical || !provider.dishPrefixes.includes(canonical[0])) {
        return invalid("unsupported-dish");
    }
    if (!isBoundedPublicValue(canonical[1])) return invalid("invalid-id");
    if (date !== null && !strictGregorianDate(date)) return invalid("invalid-date");

    const target = new URL("meetandeat://dish");
    target.searchParams.set("provider", providerID);
    target.searchParams.set("id", component);
    if (date !== null) target.searchParams.set("date", date);

    return Object.freeze({
        valid: true,
        kind: "dish",
        targetURL: target.href,
        officialURL: provider.diningURL,
        officialLabel: `View official ${provider.name} dining information`,
        title: "Shared dining item",
        detail: date
            ? `Open this item for ${date} in Meet and Eat. The static page does not claim that it is currently served.`
            : "Open this item in Meet and Eat. The static page does not claim that it is currently served."
    });
}

function buildCATARequest(kind, id, date, meal) {
    if (date !== null || meal !== null) return invalid("unsupported-fields");
    if (!POSITIVE_DECIMAL.test(id) || BigInt(id) <= 0n) return invalid("invalid-id");
    const segment = kind === "cata-route" ? "route" : "stop";
    const target = new URL(`meetandeat://cata/${segment}`);
    target.searchParams.set("id", id);
    return Object.freeze({
        valid: true,
        kind,
        targetURL: target.href,
        officialURL: CATA_OFFICIAL_URL,
        officialLabel: "View official CATA service information",
        title: kind === "cata-route" ? "CATA route" : "CATA stop",
        detail: "Open this selection in Meet and Eat. Use CATA’s official site for current service information."
    });
}

export function parseDispatcherRequest(search) {
    if (typeof search !== "string" || !hasWellFormedEncoding(search)) {
        return invalid("malformed-encoding");
    }
    const parameters = new URLSearchParams(search);
    for (const key of SCHEMA_KEYS) {
        if (parameters.getAll(key).length > 1) return invalid("duplicate-key");
    }

    const kind = parameters.get("kind");
    const id = parameters.get("id");
    const date = parameters.has("date") ? parameters.get("date") : null;
    const meal = parameters.has("meal") ? parameters.get("meal") : null;
    if (!kind || !ALLOWED_KINDS.has(kind)) return invalid("unsupported-kind");
    if (!id || !isBoundedPublicValue(id)) return invalid("invalid-id");
    if (date !== null && !isBoundedPublicValue(date)) return invalid("invalid-date");
    if (meal !== null && !isBoundedPublicValue(meal)) return invalid("invalid-meal");

    switch (kind) {
    case "hall":
        return buildHallRequest(id, date, meal);
    case "dish":
        return buildDishRequest(id, date, meal);
    case "cata-route":
    case "cata-stop":
        return buildCATARequest(kind, id, date, meal);
    default:
        return invalid("unsupported-kind");
    }
}

export function applyDispatcher(documentObject, search) {
    const result = parseDispatcherRequest(search);
    const title = documentObject.getElementById("requestTitle");
    const detail = documentObject.getElementById("requestState");
    const openAction = documentObject.getElementById("openAction");
    const officialAction = documentObject.getElementById("officialAction");

    if (!result.valid) {
        title.textContent = "Meet and Eat";
        detail.textContent = "This link is incomplete or unsupported. You can still download Meet and Eat or visit its product page.";
        openAction.removeAttribute("href");
        openAction.setAttribute("aria-disabled", "true");
        officialAction.href = "/meetandeat/";
        officialAction.textContent = "Visit Meet and Eat";
        return result;
    }

    title.textContent = result.title;
    detail.textContent = result.detail;
    openAction.href = result.targetURL;
    openAction.setAttribute("aria-disabled", "false");
    officialAction.href = result.officialURL;
    officialAction.textContent = result.officialLabel;
    return result;
}

export { APP_STORE_URL };

if (typeof document !== "undefined" && typeof window !== "undefined") {
    applyDispatcher(document, window.location.search);
}
