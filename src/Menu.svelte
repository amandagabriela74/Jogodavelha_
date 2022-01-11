<svelte:head>
	<link rel="stylesheet" href="/styles/menu.css">
</svelte:head>

<script>
	import { estado } from './Estado.js'
	import { trocarEstadoDoJogo } from './Estado.js'
</script>

<h1>
	Jogo da Velha
</h1>

<img class="imagem" src="jogodavelha.png" alt="logo"/> 

<br><br>

<div class='menu' on:click={() => trocarEstadoDoJogo('jogar')}>
	Jogar
</div>

<div class='menu' on:click={() => trocarEstadoDoJogo('sobre')}>
	Sobre
</div>

<div class='menu' on:click={() => trocarEstadoDoJogo('ajuda')}>
	Ajuda
</div>
