import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const onset = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onset",
});

export const metadata: Metadata = {
  title: "Kenya TNT System",
  description: "Kenya National Track & Trace System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={onset.variable}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            // All toasts are dismissible with close button
            duration: 4000,
            error: {
              duration: 8000, // Errors auto-dismiss after 8 seconds
              style: {
                background: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FCA5A5',
              },
            },
            success: {
              duration: 4000,
              style: {
                background: '#D1FAE5',
                color: '#065F46',
                border: '1px solid #6EE7B7',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
