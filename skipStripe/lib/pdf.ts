import chromium from "@sparticuz/chromium";

export async function htmlToPdfBuffer(html: string) {
  const isVercel = Boolean(process.env.VERCEL);

  if (isVercel) {
    const puppeteer = await import("puppeteer-core");
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      return Buffer.from(await page.pdf({ format: "A4", printBackground: true }));
    } finally {
      await browser.close();
    }
  }

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    return Buffer.from(await page.pdf({ format: "A4", printBackground: true }));
  } finally {
    await browser.close();
  }
}
