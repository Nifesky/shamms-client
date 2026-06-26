import React from "react";

function Logo({ size = 32, showText = true, textColor = "#38BDF8", fontSize = "22px" }) {
  return (
    <div style={styles.container}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L3 7V12C3 16.5 7.5 20.5 12 22C16.5 20.5 21 16.5 21 12V7L12 2Z"
          fill="url(#logo-gradient)"
          stroke="#0EA5E9"
          strokeWidth="1.5"
        />
        <path
          d="M8 11V16H16V11H8Z"
          fill="#0F172A"
          opacity="0.65"
        />
        <path
          d="M12 8.5L7 11.5H17L12 8.5Z"
          fill="#38BDF8"
        />
        <path
          d="M11 13H13V16H11V13Z"
          fill="#F4B400"
        />
        <defs>
          <linearGradient id="logo-gradient" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="0.5" stopColor="#0EA5E9" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
      {showText && <span style={{ ...styles.text, color: textColor, fontSize }}>SHAMMS</span>}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  text: {
    fontWeight: "bold",
    letterSpacing: "2.5px",
    fontFamily: "'Outfit', 'Poppins', sans-serif",
  },
};

export default Logo;
