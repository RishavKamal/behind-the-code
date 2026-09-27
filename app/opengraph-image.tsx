import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Behind the Code";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#171717",
          color: "#ffffff",
          padding: "70px 80px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "12px",
              background: "#ffffff",
              color: "#171717",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            BT
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Behind the Code
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: "22px",
              color: "#9ca3af",
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Developer publishing platform
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "68px",
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: "-0.055em",
            }}
          >
            Build. Learn. Share.
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "24px",
              maxWidth: "760px",
              color: "#b5b5b5",
              fontSize: "26px",
              lineHeight: 1.4,
            }}
          >
            A place for developers to document what they build, learn, and
            discover.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#8f8f8f",
            fontSize: "18px",
          }}
        >
          <div style={{ display: "flex" }}>blog.rishavkamal.com</div>

          <div
            style={{
              display: "flex",
              width: "80px",
              height: "2px",
              background: "#555555",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}