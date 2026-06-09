/** @type {import('tailwindcss').Config} */
// Configuração do Tailwind. `content` define onde o Tailwind procura classes
// para gerar o CSS final. Cores das faixas usadas em badges no app.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cores semânticas das faixas de score
        quente: '#dc2626', // vermelho — lead quente 🔥
        morno: '#d97706',  // âmbar — lead morno 🟡
        frio: '#2563eb',   // azul — lead frio 🔵
        inter: '#0a1a4f',  // azul Inter de Milão (identidade)
      },
    },
  },
  plugins: [],
}
