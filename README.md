# Flashcards App

An AI-powered study app that lets you paste or upload notes, add a topic, and generate flashcards for review.

## Features

- Paste notes directly into the page
- Upload `.txt`, `.md`, `.csv`, or `.docx` notes
- Generate flashcards with OpenAI
- Click cards to reveal and hide answers

## Setup

1. Install dependencies:

   ```powershell
   npm.cmd install
   ```

2. Create a `.env` file from `.env.example` and add your OpenAI API key:

   ```powershell
   copy .env.example .env
   ```

3. Start the app:

   ```powershell
   npm.cmd run dev
   ```

4. Open `http://localhost:3000`

## Notes

- Keep your API key in the server `.env` file, not in browser JavaScript.
- `.docx` files are parsed on the server before flashcard generation.
