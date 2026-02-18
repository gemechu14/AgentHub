import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatbot Widget",
  description: "Embeddable chatbot widget",
};

export default function EmbedWidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        html, body, #__next {
          margin: 0 !important;
          padding: 0 !important;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent !important;
          background-color: transparent !important;
        }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}} />
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        margin: 0,
        padding: 0
      }}>
        {children}
      </div>
    </>
  );
}
