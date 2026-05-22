const config = {
  challenge: false, // Set to true if you want to enable password protection.
  users: {
    // You can add multiple users by doing username: 'password'.
    interstellar: "password",
  },
  adminPassword: process.env.ADMIN_PASSWORD || "d3ltahub-admin-2025",
};

export default config;
