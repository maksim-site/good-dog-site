import type { Metadata } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://good-dog.site"),
  title: "GOOD DOG — Built Different",
  description:
    "A playful hot dog builder and demo ordering experience. Pick a link, add the sauce, choose the crunch.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "GOOD DOG",
    title: "GOOD DOG — Built Different",
    description:
      "Hot dogs, reprogrammed. Build your link, choose the sauce, add the crunch.",
    images: [
      {
        url: "/icon.png",
        width: 256,
        height: 256,
        type: "image/png",
        alt: "GOOD DOG logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "GOOD DOG — Built Different",
    description:
      "Hot dogs, reprogrammed. Build your link, choose the sauce, add the crunch.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
