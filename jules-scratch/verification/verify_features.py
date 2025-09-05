import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Get the absolute path to index.html
        import os
        absolute_path = os.path.abspath('index.html')

        await page.goto(f'file://{absolute_path}')

        # The app uses showOpenFilePicker if it exists, which Playwright can't
        # handle in a straightforward way. We force it to use the input element.
        await page.evaluate('window.showOpenFilePicker = undefined;')

        # Wait for the app to initialize by waiting for the main menu button to be ready
        await expect(page.locator('#main-menu-button')).to_be_visible()
        await expect(page.locator('#main-menu-button')).to_be_enabled()

        # Click the main menu button to open the menu
        await page.locator('#main-menu-button').click()

        # Wait for the menu to be in the DOM
        await page.wait_for_function("document.querySelector('#mainMenuItems')")

        # Click the "Open" menu item to reveal the submenu
        await page.locator('#menu-open').click()

        # Wait for the submenu to be in the DOM
        await page.wait_for_function("document.querySelector('#openMenuItems')")

        # Start waiting for the file chooser before clicking the button
        async with page.expect_file_chooser() as fc_info:
            # Click the "Open Files" button
            await page.locator('#menu-open-local-files').click()

        file_chooser = await fc_info.value

        files_to_upload = [
            'jules-scratch/verification/test-comics/series-A/book1.cbz',
            'jules-scratch/verification/test-comics/series-B/book2.cbz',
            'jules-scratch/verification/test-comics/root-book.cbz'
        ]
        await file_chooser.set_files(files_to_upload)

        # Open the reading stack to see the books
        await page.locator('#readingStackButton').click()

        # Wait for the reading stack to be populated
        await expect(page.locator('#readingStackContents .readingStackBook')).to_have_count(3)

        # Verify the book titles are displayed
        await expect(page.get_by_text('book1.cbz')).to_be_visible()
        await expect(page.get_by_text('book2.cbz')).to_be_visible()
        await expect(page.get_by_text('root-book.cbz')).to_be_visible()

        await page.screenshot(path='jules-scratch/verification/verification.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
