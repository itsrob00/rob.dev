import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rob | Front-end Engineer & Tech Lead",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
