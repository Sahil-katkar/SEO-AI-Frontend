import './globals.css';
import { AppProvider } from '@/context/AppContext'; // Ensure path is correct

export const metadata = {
  title: 'SEO AI Article Drafter',
  description: 'Generate SEO-optimized articles with AI assistance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}