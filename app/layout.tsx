import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Provider from "./provider";
import { Toaster } from "@/components/ui/sonner";

function getMetadataBase(): URL {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "");
  if (raw) {
    try {
      return new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    } catch {
      // Fall back to localhost
    }
  }
  return new URL("http://localhost:3000");
}

const SITE_TITLE = "ArchFlow | Visual SQL & NoSQL Schema Studio with AI Auto-Connect";
const SITE_DESCRIPTION =
  "Design PostgreSQL, MySQL, and NoSQL schemas visually, auto-connect ER relationships and cardinalities with Gemini + LangGraph AI, and export production-ready DDL.";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: "ArchFlow",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
        <body className="font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <Provider>
                <Toaster />
                {children}
              </Provider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
