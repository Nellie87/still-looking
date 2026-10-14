import { test, expect } from "@playwright/test";

test("unlock request → admin approve → contact unlocked", async ({ page }) => {
  await page.goto("/browse");
  await expect(page.getByRole("button", { name: /Read Sunbird's profile/i }).first()).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: /Read Sunbird's profile/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /I'm interested/i }).click();

  await page.getByPlaceholder("@yourhandle").fill("@demo_e2e");
  await page.getByPlaceholder("07XX XXX XXX").first().fill("0711223344");
  await page.getByRole("button", { name: /Continue to pay/i }).click();

  const code = `E2E${Date.now().toString(36).toUpperCase()}`.slice(0, 10);
  await page.getByPlaceholder("8–12 letters or numbers").fill(code);
  // PayBox also has phone field — ensure code field is filled
  await page.getByRole("button", { name: /I've paid/i }).click();
  await expect(page.getByText("Payment details sent")).toBeVisible();
  await page.getByRole("button", { name: /Back to browsing/i }).click();

  await page.goto("/admin/queue");
  await expect(page.getByText(code)).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Payment received, approve/i }).first().click();

  await page.goto("/browse");
  await page.getByRole("button", { name: /Read Sunbird's profile/i }).first().click();
  await expect(page.getByText("Contact unlocked")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("@demo_contact_101")).toBeVisible();
});
