# How to Create a New Page in the Help Section

To create a new page within the help section of the app, follow the steps below. This guide assumes you already have access to the app's backend and the necessary markdown folder structure.

## Folder Structure

The folder structure for the help section is based on markdown files. These markdown files are placed within the `public/markdown_files/help` directory, which contains both root folders and subfolders. Each folder represents a category or section of your help content.

### Step 1: Add a New Folder (Optional)

If you want to categorize your new page under a new section, you need to create a new folder within the `help` directory.

1. Navigate to the `public/markdown_files/help` folder in your project directory.
2. Create a new folder for your category (e.g., `new-feature` or `getting-started`).
   ```bash
   mkdir public/markdown_files/help/new-feature
   ```
3. Create a new md file for your category (e.g., `new-feature.md` or `getting-started.md`)

### Step 2: Add a File in existing section

If you want to categorize your new page under a new section, you need to create a new folder within the `help/section/` directory.

1. Navigate to the `public/markdown_files/help/[section]` folder in your project directory.
2. Create a new folder for your category (e.g., `new-article`).
   ```bash
   mkdir public/markdown_files/help/[section]/new-article
   ```
3. Create a new md file for your category (e.g., `new-feature.md` or `getting-started.md`) in that folder you just created

### other functionality

if you want to add a image, add the image to the `public/image/` directory.

reference the image in the markdown like this ![home_hero](/images/home_hero.jpg)
