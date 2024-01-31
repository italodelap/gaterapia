import { Button, Link } from "@nextui-org/react";

import { HomeIcon } from "./HomeIcon";

export function GoToHomeButton({ className }: { className?: string }) {
	return (
		<Button
			href="/"
			as={Link}
			radius="sm"
			variant="ghost"
			startContent={<HomeIcon className="size-5" />}
			className={`
				${className ?? ""}
        border-white text-white
				font-semibold uppercase hover:!opacity-100
        hover:border-cerise-red-600 hover:!bg-cerise-red-600
			`}
		>
			Ir al Inicio
		</Button>
	);
}
