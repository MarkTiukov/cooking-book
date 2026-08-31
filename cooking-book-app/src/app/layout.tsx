import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "Моя книга рецептов",
  description: "Домашний каталог рецептов и идей для меню.",
  openGraph: {
    title: "Моя книга рецептов",
    description: "Домашний каталог рецептов и идей для меню.",
    type: "website",
    locale: "ru_RU",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Моя книга рецептов",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Моя книга рецептов",
    description: "Домашний каталог рецептов и идей для меню.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
