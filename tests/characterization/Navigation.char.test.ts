import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

describe("Navigation launcher characterization", () => {
  let homeHtml: string;
  let f1Html: string;
  let f2Html: string;
  let f3Html: string;
  let f4Html: string;

  beforeAll(() => {
    const homePath = path.resolve(process.cwd(), "src/index.html");
    const f1Path = path.resolve(process.cwd(), "src/f1/index.html");
    const f2Path = path.resolve(process.cwd(), "src/f2/index.html");
    const f3Path = path.resolve(process.cwd(), "src/f3/index.html");
    const f4Path = path.resolve(process.cwd(), "src/f4/index.html");

    homeHtml = fs.readFileSync(homePath, "utf-8");
    f1Html = fs.readFileSync(f1Path, "utf-8");
    f2Html = fs.readFileSync(f2Path, "utf-8");
    f3Html = fs.readFileSync(f3Path, "utf-8");
    f4Html = fs.readFileSync(f4Path, "utf-8");
  });

  it("happy path: home page exposes top nav links for Home and F1-F4", () => {
    expect(homeHtml).toContain('<nav class="top-nav" aria-label="Primary">');
    expect(homeHtml).toContain('<a class="top-nav-link is-active" href="./index.html" aria-current="page">Home</a>');
    expect(homeHtml).toContain('<a class="top-nav-link" href="./f1/index.html">F1</a>');
    expect(homeHtml).toContain('<a class="top-nav-link" href="./f2/index.html">F2</a>');
    expect(homeHtml).toContain('<a class="top-nav-link" href="./f3/index.html">F3</a>');
    expect(homeHtml).toContain('<a class="top-nav-link" href="./f4/index.html">F4</a>');
  });

  it("happy path: home launcher cards include F1-F4 live modules", () => {
    expect(homeHtml).toContain('<h2>F1: Patient Profile Management</h2>');
    expect(homeHtml).toContain('<a class="launch-btn" href="./f1/index.html">Launch F1 Feature</a>');
    expect(homeHtml).toContain('<h2>F2: Appointment Scheduling</h2>');
    expect(homeHtml).toContain('<a class="launch-btn" href="./f2/index.html">Launch F2 Feature</a>');
    expect(homeHtml).toContain('<h2>F3: Consultation Record Capture</h2>');
    expect(homeHtml).toContain('<a class="launch-btn" href="./f3/index.html">Launch F3 Feature</a>');
    expect(homeHtml).toContain('<h2>F4: Prescription Generation</h2>');
    expect(homeHtml).toContain('<a class="launch-btn" href="./f4/index.html">Launch F4 Feature</a>');
  });

  it("happy path: each feature page has top nav and current section active", () => {
    expect(f1Html).toContain('<a class="top-nav-link is-active" href="../f1/index.html" aria-current="page">F1</a>');
    expect(f2Html).toContain('<a class="top-nav-link is-active" href="../f2/index.html" aria-current="page">F2</a>');
    expect(f3Html).toContain('<a class="top-nav-link is-active" href="../f3/index.html" aria-current="page">F3</a>');
    expect(f4Html).toContain('<a class="top-nav-link is-active" href="../f4/index.html" aria-current="page">F4</a>');
  });

  it("error-path characterization: planned modules remain non-navigable and disabled", () => {
    expect(homeHtml).toContain('<article class="feature-card feature-card-soon" aria-disabled="true">');
    expect(homeHtml).toContain('<h2>F5-F7 Modules</h2>');
    expect(homeHtml).toContain('<button class="launch-btn" type="button" disabled>Coming Soon</button>');
    expect(homeHtml).toContain('<span class="top-nav-link top-nav-link-disabled" aria-disabled="true">F5-F7 Planned</span>');
  });

  it("error-path characterization: launcher has no user-input form controls to validate", () => {
    expect(homeHtml).not.toContain("<form");
    expect(homeHtml).not.toContain("<input");
    expect(homeHtml).not.toContain("<select");
    expect(homeHtml).not.toContain("<textarea");
  });

  it("side-effect characterization: no scripts or inline handlers are present on page", () => {
    expect(homeHtml).not.toMatch(/<script\b/i);
    expect(homeHtml).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it("edge cases: keeps one planned card and exactly four live launch links", () => {
    const plannedCards = (homeHtml.match(/feature-card-soon/g) || []).length;
    const launchLinks = homeHtml.match(/<a class="launch-btn" href="\.\/f\d\/index\.html">/g) || [];

    expect(plannedCards).toBe(1);
    expect(launchLinks).toHaveLength(4);
  });
});
