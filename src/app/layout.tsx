import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GSAPProvider from "@/components/GSAPProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Smart Scale - Enterprise Software & AI Development",
  description: "Custom-built solutions for businesses requiring precision and performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Script
          id="unicorn-studio"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(){
                if(!window.UnicornStudio){
                  window.UnicornStudio={isInitialized:!1};
                  
                  // Wait for DOM to be fully loaded
                  const initUnicorn = () => {
                    // Check if WebGL is supported
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    
                    if (!gl) {
                      console.warn('WebGL not supported, skipping UnicornStudio');
                      return;
                    }
                    
                    var i=document.createElement("script");
                    i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
                    i.onload=function(){
                      try {
                        if (!window.UnicornStudio.isInitialized) {
                          UnicornStudio.init();
                          window.UnicornStudio.isInitialized=!0;
                        }
                      } catch (e) {
                        console.warn('UnicornStudio initialization failed:', e);
                      }
                    };
                    i.onerror=function(){
                      console.warn('Failed to load UnicornStudio script');
                    };
                    (document.head || document.body).appendChild(i);
                  };
                  
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initUnicorn);
                  } else {
                    setTimeout(initUnicorn, 100);
                  }
                }
              }();
            `,
          }}
        />
        <GSAPProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </GSAPProvider>
      </body>
    </html>
  );
}

