import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

describe("Navigation launcher characterization", () => {
  let html: string;

  beforeAll(() => {
    const filePath = path.resolve(process.cwd(), "src/index.html");
    html = fs.readFileSync(filePath, "utf-8");
  });

  it("happy path: exposes live navigation cards for F1, F2, and F3", () => {
    expect(html).toContain('<h2>F1: Patient Profile Management</h2>');
    expect(html).toContain('<a class="launch-btn" href="./f1/index.html">Launch F1 Feature</a>');

    expect(html).toContain('<h2>F2: Appointment Scheduling</h2>');
    expect(html).toContain('<a class="launch-btn" href="./f2/index.html">Launch F2 Feature</a>');

    expect(html).toContain('<h2>F3: Consultation Record Capture</h2>');
    expect(html).toContain('<a class="launch-btn" href="./f3/index.html">Launch F3 Feature</a>');
  });

  it("error-path characterization: planned module card is non-navigable and disabled", () => {
    expect(html).toContain('<article class="feature-card feature-card-soon" aria-disabled="true">');
    expect(html).toContain('<h2>F4-F7 Modules</h2>');
    expect(html).toContain('<button class="launch-btn" type="button" disabled>Coming Soon</button>');
    expect(html).not.toContain('href="./f4/index.html"');
  });

  it("error-path characterization: launcher has no user-input form controls to validate", () => {
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<select");
    expect(html).not.toContain("<textarea");
  });

  it("side-effect characterization: no scripts or inline handlers are present on page", () => {
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it("edge cases: keeps one planned card and exactly three live launch links", () => {
    const plannedCards = (html.match(/feature-card-soon/g) || []).length;
    const launchLinks = html.match(/<a class="launch-btn" href="\.\/f\d\/index\.html">/g) || [];

    expect(plannedCards).toBe(1);
    expect(launchLinks).toHaveLength(3);
  });
});
