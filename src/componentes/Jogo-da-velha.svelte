<script>
  import Botao from "./Botao.svelte";

  let ganhou = null;
  let jogador = true;
  $: status = "Proximo jogador: " + (jogador ? " X " : " O ");

  // array para usar como botao
  let botoes = Array(16).fill(null)
   
  // Função para selecionar o proximo jogador
  function handleClick(i) {
    if (!botoes [i]) {
      botoes[i] = jogador ? "X" : "O"; // comeca o jogador true = "X"
      jogador = !jogador; // Depois o jogador vira false = "O"
      ganhou = calcularGanhador(botoes);
    }
  }

  // function para resetar o jogo e suas variaveis
  function resetar() {
    botoes = Array(16).fill(null)
    ganhou = null;
    jogador = true;
  }

  // function para verificar ganhador
  function calcularGanhador(botoes) {
    const verificarCasas = [
      // Codigos para verificaçao para os lados
      [0, 1, 2],[1, 2, 3],[4, 5, 6],
      [5, 6, 7],[8, 9, 10],[9, 10, 11],
      [12, 13, 14],[13, 14, 15],
      // Codigos para verificaçao para cima e para baixo
      [0, 4, 8],[4, 8, 12],[1, 5, 9],
      [5, 9, 13],[2, 6, 10],[6, 10, 14],
      [3, 7, 11],[7, 11, 15],
      //Codigos para verificaçao na horizontal
      [0, 5, 10],[1, 6, 11], [5, 10, 15],
      [4, 9, 14],[2, 5, 8],[3, 6, 9],
      [6, 9, 12],[7, 10, 13],
    ];

    // Codigo para verificar o array
    for (let i = 0; i < verificarCasas.length; i++) {
      const [a, b, c] = verificarCasas[i];
      if (botoes[a] && botoes[a] === botoes[b] && botoes[a] === botoes[c]) {
        return `Ganhou: ${botoes[a]}`;
      }
    }
    const empate = botoes.every((botao) => botao !== null);
    return empate ? "O jogo foi empade" : null;
  }
</script>

<main>
  {#if ganhou}
    <h3>{ganhou}</h3>
  {:else}
    <h3 class="status">{status}</h3>
  {/if}
  <div class="jogodavelha">
    {#each botoes as botao, i}
      <Botao value={botao} handleClick={() => handleClick(i)} />
    {/each}
    <div >
      {#if ganhou}
        <button class="botaoreiniciar" on:click={resetar}> Reiniciar Jogo </button>
      {/if}
    </div>
  </div>
</main>
<style>

.botaoreiniciar{
  margin: 3px;
  margin-top: 15px;
  
}
  
  h3 {
    text-align: center;
    color: white;
  }

  .jogodavelha {
    
    display: flexbox;
    width: 250px;
    text-align: center;
    border-radius: 0%;  
    margin: 0px; 
    color: white;
  }
  button {
    color: white;
    text-align: center;
    background: linear-gradient(90deg, rgba(6,0,96,1) 22%, rgba(26,49,103,1) 43%, rgba(9,12,24,1) 100%);
    color: white;
    margin: 2px;
    font-family: 'Roboto', sans-serif;
  }
  .status {
    text-align: center;
    color: white;
  }
 
</style>
