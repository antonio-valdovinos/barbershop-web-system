/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fondo: "#2B2523",
        "panel-oscuro": "#3A3331",
        "panel-medio": "#4A423F",
        "panel-claro": "#5C524F",
        "texto-secundario": "#C1AE9F",
        crema: "#E5D4C3",
        "blanco-suave": "#F8F3ED",
        "estado-ok": "#0E8A47",
        "estado-cancelada": "#C3362A",
        "negro-suave": "#1A1A1A",
      },
    },
  },
  plugins: [],
};
