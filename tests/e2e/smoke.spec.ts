import { test, expect } from "@playwright/test";

test("create universe -> create world -> activate -> generate step -> mark complete", async ({ page }) => {
  await page.goto("/universes");
  await page.getByPlaceholder("Name").fill("Creative Systems");
  await page.getByPlaceholder("Mission").fill("Ship meaningful experiments.");
  await page.getByRole("button", { name: "Create Universe" }).click();

  await page.goto("/worlds/new");
  await page.getByPlaceholder("World title").fill("One Focus MVP");
  await page.getByPlaceholder("Seed sentence").fill("Build the MVP with one step today.");
  await page.getByRole("button", { name: "Create" }).click();

  await page.goto("/worlds");
  await page.getByRole("button", { name: "Activate" }).first().click();
  await page.goto("/");
  await page.getByRole("button", { name: /Generate/ }).click();
  await expect(page.getByText("One step only")).toBeVisible();
  await page.getByRole("button", { name: "Mark Complete" }).click();
  await expect(page.getByText("Done.")).toBeVisible();
});
