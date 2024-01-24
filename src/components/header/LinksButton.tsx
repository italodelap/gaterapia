import { Button, Link } from "@nextui-org/react";

import { LinkIcon } from "./icons/LinkIcon";

export function LinksButton({ className }: { className?: string }) {
	return (
		<Button
			as={Link}
			size="md"
			radius="lg"
			href="/links"
			variant="ghost"
			color="primary"
			startContent={<LinkIcon className="size-5" />}
			className={`
				${className ?? ""}
        border-white text-white
				font-semibold uppercase hover:!opacity-100
        hover:border-cerise-red-600 hover:!bg-cerise-red-600
			`}
		>
			Links
		</Button>
	);
}
