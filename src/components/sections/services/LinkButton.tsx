import { Button, Link } from "@nextui-org/react";
import type { ReactNode } from "react";

export function LinkButton({
	className,
	children,
	href,
}: {
	className?: string;
	children: ReactNode;
	href: string;
}) {
	return (
		<Button
			as={Link}
			href={href}
			size={"md"}
			radius="lg"
			variant="ghost"
			color="default"
			className={`
				${className ?? ""}
				font-semibold
				md:h-12 md:px-6 md:text-base
				border-white text-white uppercase
				lg:opacity-0 lg:group-hover:opacity-100
				hover:!opacity-100 hover:border-cerise-red-600 hover:!bg-cerise-red-600
			`}
		>
			{children}
		</Button>
	);
}
