# Dream Data — proposta

Versão web do deck "Dream Data · o histórico completo de cada pessoa".
Página única, sem build, no design system da Dream Factory.

| arquivo | o que é |
|---|---|
| `index.html` | conteúdo, uma `<section>` por capítulo |
| `tokens.css` | cores, fontes e espaçamentos |
| `proposta.css` | estilos dos componentes |
| `proposta.js` | animações (GSAP + ScrollTrigger + Lenis) |
| `vendor/` | GSAP 3.12.5, ScrollTrigger 3.12.5, Lenis 1.0.42 e a fonte Outfit, servidos localmente |
| `img/` | marca Dream Data e imagens conceituais do deck |

Abre direto no navegador (duplo clique no `index.html`) ou por qualquer servidor estático.
Os componentes reutilizáveis (`data-count`, `data-graph`, `data-steps`…) estão descritos no comentário do topo do `index.html`.
