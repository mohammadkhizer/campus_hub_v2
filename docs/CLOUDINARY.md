# Connecting Cloudinary to Campus Hub

This guide walks you through setting up a free Cloudinary account and connecting it to the Campus Hub platform. This is required for teachers and administrators to upload Documents (PDFs, DOCX) and Images (JPG, PNG) for courses, assignments, announcements, and quizzes.

## Step 1: Create a Free Cloudinary Account

1. Go to [Cloudinary's Registration Page](https://cloudinary.com/users/register/free).
2. Fill out the registration form.
3. Verify your email address by clicking the link Cloudinary sends you.

## Step 2: Get Your API Keys

1. Log in to your Cloudinary account.
2. Once logged in, go to the **Dashboard** (usually the home screen after logging in).
3. Look for the **"Product Environment Credentials"** section at the top of the dashboard.
4. You will need three pieces of information from this section:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

## Step 3: Add Credentials to the Website

1. Open your Campus Hub project codebase in your code editor.
2. Locate the `.env` file in the root directory.
3. Find the Cloudinary section at the bottom of the `.env` file. It will look like this:

   ```env
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Replace `your_cloud_name`, `your_api_key`, and `your_api_secret` with the exact values from your Cloudinary dashboard.
   
   **Example:**
   ```env
   CLOUDINARY_CLOUD_NAME=dxa9xyz12
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
   ```

5. Save the `.env` file.

## Step 4: Configure Security Settings (Important for PDFs)

By default, Cloudinary might restrict the delivery of PDF and ZIP files for security reasons. To ensure students can download documents:

1. In your Cloudinary Dashboard, click the **Settings** (gear icon) in the bottom-left corner.
2. Go to the **Security** tab.
3. Scroll down to the **"Restricted media types"** or **"PDF and ZIP delivery"** section.
4. Ensure that the option to **"Allow delivery of PDF and ZIP files"** is **enabled** or unchecked if it says "Restrict delivery". 
5. Scroll down and click **Save**.

## Step 5: Restart Your Server

If your Next.js development server is currently running, you must stop it and restart it for the environment variables to take effect.

1. In your terminal where the server is running, press `Ctrl + C` to stop the server.
2. Run `npm run dev` to restart it.

## Step 6: Test File Uploads

You can now test the file uploads on the platform:
1. Log in as an Administrator or Teacher.
2. Navigate to a course's **Management** page.
3. Try uploading a PDF to the **Study Materials** tab or attaching a file to an **Assignment**.
4. The file should upload successfully and generate a permanent, secure link hosted on Cloudinary!

---
*Note: Any files uploaded to Cloudinary will automatically be organized into a folder named `campus_hub_uploads` in your Cloudinary Media Library.*
