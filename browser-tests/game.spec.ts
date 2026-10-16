import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const paths = JSON.parse(
  readFileSync("docs/campaign-simulation.json", "utf8"),
) as { path: [number, number][]; status: string }[];
async function closeMap(page: Page) {
  const close = page.getByRole("button", { name: "Close dialog" });
  if (await close.count()) await close.click();
}
async function stable(page: Page) {
  await expect(page.getByRole("grid")).toHaveAttribute("aria-busy", "false");
}
async function swap(page: Page, a: number, b: number) {
  await page.locator(`[data-cell="${a}"]`).click();
  await page.locator(`[data-cell="${b}"]`).click();
  await stable(page);
}
test("real click campaign, invalid reversal, progression, persistence and retry", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await closeMap(page);
  await expect(page.locator("[data-cell]")).toHaveCount(64);
  await page.screenshot({ path: ".local/desktop.png", fullPage: true });
  const before = await page
    .locator("[data-cell]")
    .evaluateAll((c) => c.map((e) => e.getAttribute("aria-label")));
  await swap(page, 0, 1);
  await expect(page.locator("#moves")).toHaveText("16");
  await expect(page.getByRole("status")).toContainText("No match");
  expect(
    await page
      .locator("[data-cell]")
      .evaluateAll((c) => c.map((e) => e.getAttribute("aria-label"))),
  ).toEqual(before);
  for (const [a, b] of paths[0].path) await swap(page, a, b);
  await expect(
    page.getByRole("heading", { name: "Beautifully done." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "On to stage 2" }).click();
  await expect(page.locator(".game-top h2")).toHaveText("Glaze Gardens");
  await swap(page, ...paths[1].path[0]);
  const saved = await page.evaluate(() =>
    localStorage.getItem("bonbon-borough:campaign:v1"),
  );
  await page.reload();
  await closeMap(page);
  await expect(page.locator(".game-top h2")).toHaveText("Glaze Gardens");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("bonbon-borough:campaign:v1"),
    ),
  ).toBe(saved);
  await page.getByRole("button", { name: "Restart stage" }).click();
  await expect(page.locator("#moves")).toHaveText("23");
  await page.getByRole("button", { name: "How to play" }).click();
  await expect(
    page.getByRole("heading", { name: "A little know-how." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});
test("normal keyboard and drag controls, hints, mobile fit", async ({
  page,
}) => {
  await page.goto("/");
  await closeMap(page);
  await page.getByRole("button", { name: "A little hint" }).click();
  await expect(page.locator(".hint")).toHaveCount(2);
  // First seeded valid move, through keyboard selection and focus movement.
  const [a, b] = paths[0].path[0];
  await page.locator(`[data-cell="${a}"]`).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press(
    b - a === 8
      ? "ArrowDown"
      : b - a === -8
        ? "ArrowUp"
        : b - a === 1
          ? "ArrowRight"
          : "ArrowLeft",
  );
  await page.keyboard.press("Space");
  await stable(page);
  await expect(page.locator("#moves")).toHaveText("15");
  await expect(page.locator(`[data-cell="${b}"]`)).toBeFocused();
  const [c, d] = paths[0].path[1];
  const box = await page.locator(`[data-cell="${c}"]`).boundingBox(),
    end = await page.locator(`[data-cell="${d}"]`).boundingBox();
  if (!box || !end) throw Error("Missing cell");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await stable(page);
  await expect(page.locator("#moves")).toHaveText("14");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".local/mobile.png", fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
test("campaign loss and retry through normal moves", async ({ page }) => {
  await page.goto("/");
  await closeMap(page);
  // The free hint chooses a legal move, without manipulating the game state.
  for (let turn = 0; turn < 16; turn++) {
    if (
      await page.getByRole("button", { name: "Try this stage again" }).count()
    )
      break;
    if (await page.getByRole("button", { name: "On to stage 2" }).count())
      break;
    await page.getByRole("button", { name: "A little hint" }).click();
    const cells = await page
      .locator(".hint")
      .evaluateAll((els) =>
        els.map((e) => Number((e as HTMLElement).dataset.cell)),
      );
    await swap(page, cells[0], cells[1]);
  }
  await expect(
    page.getByRole("heading", { name: "One more batch." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try this stage again" }).click();
  await expect(page.locator("#moves")).toHaveText("16");
});

test("all six stages complete through visible controls without state injection", async ({
  page,
}) => {
  await page.goto("/");
  await closeMap(page);
  await page.evaluate(() =>
    localStorage.setItem("other-game:save", "leave-me-alone"),
  );
  for (let level = 0; level < paths.length; level++) {
    for (const [a, b] of paths[level].path) await swap(page, a, b);
    await expect(
      page.getByRole("button", {
        name:
          level === 5 ? "Back to the borough" : "On to stage " + (level + 2),
      }),
    ).toBeVisible();
    if (level === 5) {
      await page.screenshot({
        path: ".local/campaign-complete.png",
        fullPage: true,
      });
      break;
    }
    await page
      .getByRole("button", { name: "On to stage " + (level + 2) })
      .click();
  }
  expect(
    await page.evaluate(() => localStorage.getItem("other-game:save")),
  ).toBe("leave-me-alone");
  await page.getByRole("button", { name: "How to play" }).click();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Back to the borough" }),
  ).toBeFocused();
  await page.reload();
  await closeMap(page);
  await expect(
    page.getByRole("heading", { name: "Borough brilliant!" }),
  ).toBeVisible();
});

test("help keeps focus through active animation and map starts focused", async ({
  page,
}) => {
  await page.goto("/");
  await closeMap(page);
  const [a, b] = paths[0].path[0];
  await page.locator(`[data-cell="${a}"]`).click();
  await page.locator(`[data-cell="${b}"]`).click();
  await page.getByRole("button", { name: "How to play" }).click();
  await stable(page);
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Bonbon Borough home" }).click();
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
});
