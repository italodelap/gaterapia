export function HomeIcon({ className }: { className?: string }) {
	return (
		<svg
			width="128"
			height="128"
			viewBox="0 0 256 256"
			className={className ?? ""}
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill="currentColor"
				d="m221.56 100.85l-79.95-75.47l-.16-.15a19.93 19.93 0 0 0-26.91 0l-.17.15l-79.93 75.47a20.07 20.07 0 0 0-6.44 14.7V208a20 20 0 0 0 20 20h48a20 20 0 0 0 20-20v-44h24v44a20 20 0 0 0 20 20h48a20 20 0 0 0 20-20v-92.45a20.07 20.07 0 0 0-6.44-14.7M204 204h-40v-44a20 20 0 0 0-20-20h-32a20 20 0 0 0-20 20v44H52v-86.72l76-71.75l76 71.75Z"
			/>
		</svg>
	);
}
