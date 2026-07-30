import type { Metadata } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "GOOD DOG — Built Different",
  description:
    "A playful hot dog builder and demo ordering experience. Pick a link, add the sauce, choose the crunch.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
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
