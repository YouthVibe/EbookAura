/**
 * Copyright (c) 2025 UltronTheAI/Swaraj Puppalwar
 * https://github.com/UltronTheAI
 * All rights reserved.
 */
import { mainPageMetadata } from './page-metadata';
import HomePage from './components/HomePage';

// Define metadata for the main page
export const metadata = mainPageMetadata;

// Server Component that provides metadata
export default function Home() {
  return <HomePage />;
}
