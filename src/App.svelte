<script lang="ts">
	import "./style/app.css";
	import { onMount } from 'svelte';
	import { createScene } from "./script/scene";
	let el;
	onMount(() => {
	  createScene(el)
	});
  </script>

<canvas bind:this={el}></canvas>

<style lang="postcss" global>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>