import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF7F2",
          borderRadius: "36px",
          border: "4px solid #FAD4DA",
        }}
      >
        <svg
          width="130"
          height="130"
          viewBox="-100 -80 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M -16 -32 C -42 -60, -84 -30, -84 10 C -84 45, -48 76, 0 102 C -24 72, -48 44, -48 12 C -48 -16, -30 -36, -8 -24 Z"
            fill="#E06D75"
          />
          <path
            d="M 16 -32 C 42 -60, 84 -30, 84 10 C 84 45, 48 76, 0 102 C 24 72, 48 44, 48 12 C 48 -16, 30 -36, 8 -24 Z"
            fill="#C85A63"
          />
          <path
            d="M 0 -10 C 13 -30, 36 -24, 36 -4 C 36 15, 12 37, 0 54 C -12 37, -36 15, -36 -4 C -36 -24, -13 -30, 0 -10 Z"
            fill="#FAF7F2"
          />
          <circle cx="0" cy="14" r="8" fill="#E06D75" />
          <circle cx="0" cy="14" r="3.5" fill="#FAF7F2" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
