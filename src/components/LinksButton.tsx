import { Button, Link } from "@nextui-org/react";

export function LinksButton() {
	return (
		<Button
			as={Link}
			radius="full"
			href="/links"
			showAnchorIcon
			className="text-white border-white border-1 bg-transparent hover:bg-none hover:scale-105"
		>
			Mis links
		</Button>
	);
}
