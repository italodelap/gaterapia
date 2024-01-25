import { Button, Link } from "@nextui-org/react";

export function LinkButton({ className }: { className?: string }) {
	return (
		<Button
			as={Link}
			isExternal
			radius="lg"
			variant="ghost"
			className={`
        ${className ?? ""}
        hover:!opacity-100
        md:h-12 md:px-6 md:text-base
        font-semibold text-white uppercase border-white
        hover:border-cerise-red-600 hover:!bg-cerise-red-600
      `}
			href="https://elplanteo.com/hablar-con-animales-telepatia/"
		>
			Leer artículo
		</Button>
	);
}
